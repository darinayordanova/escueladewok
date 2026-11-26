import { createHash } from 'node:crypto';

import { getTranslations } from 'next-intl/server';
import { Resend } from 'resend';

import { sendSubscribeConfirmationEmail, sendWelcomeCodeEmail } from '@/lib/email/subscribe';
import { sanityWriteClient } from '@/lib/sanity/writeClient';
import { SITE_URL } from '@/lib/seo';
import type { Locale } from '@/types';

import { isValidEmail, normalizeEmail } from './email';
import { createConfirmToken, verifyConfirmToken } from './token';
import { ALL_TOPICS, TOPICS } from './topics';
import { createWelcomeCode, isExistingCustomer } from './welcomeCode';

export { isValidEmail, normalizeEmail } from './email';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Bump this whenever the consent wording in messages/*.json (newsletter.consent)
 * changes, so each subscriber's record shows which text they agreed to.
 */
export const CONSENT_VERSION = '2026-11-26c';

/** Don't send another confirmation email to the same address within this window. */
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

/**
 * One document per address. The dot makes it a private document in Sanity:
 * it can only be read with a token, even if the dataset is public.
 */
const subscriberId = (email: string) => `subscriber.${createHash('sha256').update(email).digest('hex').slice(0, 32)}`;

interface SubscriberDoc {
  email: string;
  status: 'pending' | 'confirmed';
  locale: Locale;
  confirmationSentAt?: string;
  welcomeCode?: string;
  welcomeCodeExpiresAt?: string;
}

export type SubscribeResult = 'sent' | 'throttled' | 'invalid';

/**
 * Step 1 of double opt-in: record the consent and send the confirmation email.
 * Nobody is added to Resend until they click the link.
 * Also used to re-subscribe someone who unsubscribed: they confirm again.
 */
export async function requestSubscription({ email: rawEmail, locale, source }: { email: string; locale: Locale; source: string }): Promise<SubscribeResult> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) return 'invalid';

  const _id = subscriberId(email);
  const existing = await sanityWriteClient.getDocument<SubscriberDoc>(_id);

  if (existing?.confirmationSentAt && Date.now() - new Date(existing.confirmationSentAt).getTime() < RESEND_COOLDOWN_MS) {
    return 'throttled';
  }

  const t = await getTranslations({ locale, namespace: 'newsletter' });
  const now = new Date().toISOString();

  await sanityWriteClient.createIfNotExists({ _id, _type: 'subscriber', email, status: 'pending' });
  await sanityWriteClient
    .patch(_id)
    .set({
      locale,
      source,
      consentVersion: CONSENT_VERSION,
      consentText: t('consent'),
      consentedAt: now,
      confirmationSentAt: now,
    })
    .commit();

  const confirmUrl = `${SITE_URL}/${locale}/subscribe/confirm?token=${createConfirmToken(email)}`;
  await sendSubscribeConfirmationEmail({ to: email, locale, confirmUrl });

  return 'sent';
}

/** Who a confirmation link belongs to, without confirming anything. */
export async function getPendingSubscriber(token: string) {
  const email = verifyConfirmToken(token);
  if (!email) return null;
  const doc = await sanityWriteClient.getDocument<SubscriberDoc>(subscriberId(email));
  return doc ? { email: doc.email, locale: doc.locale } : null;
}

/**
 * Step 2 of double opt-in: the person clicked "Confirm".
 * Creates (or re-activates) the Resend contact, opts them in to every Topic and,
 * for someone who has never bought from us, issues the 10% welcome code.
 */
export interface ConfirmResult {
  email: string;
  /** The welcome code, when this person has one (new now or issued on an earlier confirm). */
  welcomeCode?: { code: string; expiresAt: string };
}

export async function confirmSubscription(token: string): Promise<ConfirmResult | null> {
  const email = verifyConfirmToken(token);
  if (!email) return null;
  const _id = subscriberId(email);
  const subscriber = await sanityWriteClient.getDocument<SubscriberDoc>(_id);
  if (!subscriber) return null;

  const topics = ALL_TOPICS.map((key) => ({ id: TOPICS[key], subscription: 'opt_in' as const }));

  const found = await resend.contacts.get({ email });
  let contactId: string;

  if (found.data) {
    contactId = found.data.id;
    const updated = await resend.contacts.update({ id: contactId, unsubscribed: false });
    if (updated.error) throw new Error(`Resend contact update failed: ${updated.error.message}`);
    const topicsUpdated = await resend.contacts.topics.update({ id: contactId, topics });
    if (topicsUpdated.error) throw new Error(`Resend topics update failed: ${topicsUpdated.error.message}`);
  } else if (found.error?.name === 'not_found') {
    const created = await resend.contacts.create({ email, unsubscribed: false, topics });
    if (created.error) throw new Error(`Resend contact create failed: ${created.error.message}`);
    contactId = created.data.id;
  } else {
    throw new Error(`Resend contact lookup failed: ${found.error?.message}`);
  }

  await sanityWriteClient
    .patch(_id)
    .set({ status: 'confirmed', confirmedAt: new Date().toISOString(), resendContactId: contactId })
    .commit();

  return { email, welcomeCode: await welcomeCodeFor(_id, subscriber) };
}

/**
 * One code per address, ever: re-subscribing shows the same one. Never for an existing
 * customer. A failure here must not undo the subscription, so it is logged, not thrown.
 */
async function welcomeCodeFor(_id: string, subscriber: SubscriberDoc): Promise<ConfirmResult['welcomeCode']> {
  if (subscriber.welcomeCode && subscriber.welcomeCodeExpiresAt) {
    return { code: subscriber.welcomeCode, expiresAt: subscriber.welcomeCodeExpiresAt };
  }
  try {
    if (await isExistingCustomer(subscriber.email)) return undefined;
    const issued = await createWelcomeCode(_id);
    await sanityWriteClient.patch(_id).set({ welcomeCode: issued.code, welcomeCodeExpiresAt: issued.expiresAt }).commit();
    await sendWelcomeCodeEmail({ to: subscriber.email, locale: subscriber.locale, ...issued }).catch((err) =>
      console.error('[subscribe] welcome email failed:', err instanceof Error ? err.message : err),
    );
    return issued;
  } catch (err) {
    console.error('[subscribe] welcome code failed:', err instanceof Error ? err.message : err);
    return undefined;
  }
}
