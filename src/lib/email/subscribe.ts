import { getTranslations } from 'next-intl/server';
import { Resend } from 'resend';

import type { Locale } from '@/types';

import { button, codeBox, emailLayout, eyebrow, heading, note, paragraph, siteLink, steps } from './layout';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@woklab.es';
const REPLY_TO = process.env.OWNER_EMAIL ?? 'info@woklab.es';

/** The double opt-in email: one button to the confirm page. */
export async function sendSubscribeConfirmationEmail({ to, locale, confirmUrl }: { to: string; locale: Locale; confirmUrl: string }) {
  const t = await getTranslations({ locale, namespace: 'newsletter' });

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    replyTo: REPLY_TO,
    subject: t('emailSubject'),
    html: emailLayout({
      locale,
      preheader: t('emailPreheader'),
      body: [
        eyebrow('Wok Lab'),
        heading(t('emailHeading')),
        paragraph(t('emailBody')),
        button(t('emailButton'), confirmUrl),
        note(t('emailIgnore')),
      ].join(''),
    }),
  });

  if (error) throw new Error(`Subscribe confirmation email failed: ${error.message}`);
}

/** "2027-01-25T…" → "25 de enero de 2027" / "25 January 2027" */
export const formatCodeExpiry = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' });

/** Sent once, right after someone confirms: their 10% code for a first class booking. */
export async function sendWelcomeCodeEmail({ to, locale, code, expiresAt }: { to: string; locale: Locale; code: string; expiresAt: string }) {
  const t = await getTranslations({ locale, namespace: 'newsletter' });
  const until = formatCodeExpiry(expiresAt, locale);

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    replyTo: REPLY_TO,
    subject: t('welcomeSubject'),
    html: emailLayout({
      locale,
      preheader: t('welcomePreheader', { code }),
      body: [
        eyebrow('Wok Lab'),
        heading(t('welcomeHeading')),
        paragraph(t('welcomeBody')),
        codeBox(t('codeLabel'), code, t('codeValidUntil', { date: until })),
        steps([t('welcomeStep1'), t('welcomeStep2'), t('welcomeStep3')]),
        button(t('welcomeButton'), siteLink(locale, '/courses')),
        note(t('welcomeNote')),
      ].join(''),
    }),
  });

  if (error) throw new Error(`Welcome code email failed: ${error.message}`);
}
