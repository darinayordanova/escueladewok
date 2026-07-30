import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { sendConfirmationEmail, sendOwnerNotificationEmail, sendVoucherBuyerEmail, sendVoucherRecipientEmail } from '@/lib/email';
import { generateVoucherPdf, formatVoucherTypeName } from '@/lib/pdf/voucherPdf';
import { sanityWriteClient } from '@/lib/sanity/writeClient';
import { getStripe } from '@/lib/stripe/client';
import type { Locale } from '@/types';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'checkout.session.expired':
      await handleSessionExpired(event.data.object as Stripe.Checkout.Session);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseItems(meta: Record<string, string>) {
  const count = parseInt(meta.item_count ?? '1', 10);
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      courseSlug: meta[`item_${i}_slug`] ?? '',
      courseId:   meta[`item_${i}_id`]   ?? '',
      date:       meta[`item_${i}_date`] ?? '',
      startTime:  meta[`item_${i}_time`] ?? '',
      endTime:    meta[`item_${i}_end`]  ?? '',
      quantity:   parseInt(meta[`item_${i}_qty`] ?? '1', 10),
    });
  }
  return items;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleSessionCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};

  if (meta.purchase_type === 'voucher') {
    await handleVoucherSessionCompleted(session);
    return;
  }
  const items = parseItems(meta);

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? '';

  const customerName  = session.customer_details?.name  ?? '';
  const customerEmail = session.customer_details?.email ?? '';
  const customerPhone = session.customer_details?.phone ?? '';
  const dietaryRestrictions =
    session.custom_fields?.find((f) => f.key === 'dietary')?.text?.value ?? '';

  // Find all courseSession docs with pending attendees for this Stripe session
  const sessions = await sanityWriteClient.fetch<{ _id: string; attendeeKeys: string[] }[]>(
    `*[_type == "courseSession" && defined(attendees[stripeSessionId == $sessionId])] {
      _id,
      "attendeeKeys": attendees[stripeSessionId == $sessionId][]._key
    }`,
    { sessionId: session.id },
  );

  if (!sessions.length) {
    console.error(`No courseSession found for Stripe session ${session.id}`);
    return;
  }

  // Confirm all matching attendees across all sessions
  await Promise.all(
    sessions.flatMap(({ _id, attendeeKeys }) =>
      attendeeKeys.map((key) =>
        sanityWriteClient.patch(_id).set({
          [`attendees[_key == "${key}"].status`]:                 'confirmed',
          [`attendees[_key == "${key}"].stripePaymentIntentId`]:  paymentIntentId,
          [`attendees[_key == "${key}"].customerName`]:           customerName,
          [`attendees[_key == "${key}"].customerEmail`]:          customerEmail,
          [`attendees[_key == "${key}"].customerPhone`]:          customerPhone,
          [`attendees[_key == "${key}"].dietaryRestrictions`]:    dietaryRestrictions,
        }).commit(),
      ),
    ),
  );

  // Build course list for emails
  const courseLines = items.map((item) => ({
    courseName: item.courseSlug, // will be enriched from Sanity if needed
    courseDate: item.date,
    timeRange: `${item.startTime} – ${item.endTime}`,
  }));

  const firstItem = items[0];

  await Promise.allSettled([
    sendConfirmationEmail({
      to: customerEmail,
      recipientName: customerName,
      courseName: courseLines.map((c) => c.courseName).join(', '),
      courseDate: firstItem?.date ?? '',
      timeRange: courseLines.map((c) => c.timeRange).join(' / '),
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency?.toUpperCase() ?? '',
    }).catch((err) => console.error('Failed to send confirmation email:', err)),
    sendOwnerNotificationEmail({
      courseName: courseLines.map((c) => c.courseName).join(', '),
      courseDate: firstItem?.date ?? '',
      timeRange: courseLines.map((c) => `${c.courseDate} ${c.timeRange}`).join(' | '),
      customerName,
      customerEmail,
      customerPhone,
      dietaryRestrictions,
    }).catch((err) => console.error('Failed to send owner notification email:', err)),
  ]);
}

async function handleVoucherSessionCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const voucherKey = meta.voucher_key as 'classVoucher' | 'classVoucherForTwo' | 'giftCard25' | 'giftCard50';
  const locale: Locale = meta.locale === 'es' ? 'es' : 'en';

  // Idempotency guard — skip if already processed
  const existing = await sanityWriteClient.fetch<string | null>(
    `*[_type == "giftVoucher" && stripeSessionId == $sid][0]._id`,
    { sid: session.id },
  );
  if (existing) return;

  const customerName  = session.customer_details?.name  ?? '';
  const customerEmail = session.customer_details?.email ?? '';
  const amount        = session.amount_total ? session.amount_total / 100 : 0;
  const currency      = session.currency ?? 'eur';

  const recipientName    = session.custom_fields?.find((f) => f.key === 'recipient_name')?.text?.value  ?? customerName;
  const recipientEmail   = session.custom_fields?.find((f) => f.key === 'recipient_email')?.text?.value ?? customerEmail;
  const recipientMessage = session.custom_fields?.find((f) => f.key === 'message')?.text?.value         ?? '';

  // 1. Expiry date (12 months)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  const expiresAtUnix     = Math.floor(expiresAt.getTime() / 1000);
  const expiresAtISO      = expiresAt.toISOString().split('T')[0];
  const expiresAtDisplay  = expiresAt.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

  // 2. Create Stripe coupon + promo code
  const coupon = await getStripe().coupons.create({
    amount_off: session.amount_total!,
    currency,
    duration: 'once',
    max_redemptions: 1,
    redeem_by: expiresAtUnix,
    name: formatVoucherTypeName(voucherKey),
    metadata: { stripe_session_id: session.id, voucher_key: voucherKey },
  });

  const promoCode = await getStripe().promotionCodes.create({
    promotion: { type: 'coupon', coupon: coupon.id },
    max_redemptions: 1,
    expires_at: expiresAtUnix,
    metadata: { stripe_session_id: session.id },
  });

  // 3. Generate PDF
  const voucherTypeName = formatVoucherTypeName(voucherKey, locale);
  const pdfBuffer = await generateVoucherPdf({
    code: promoCode.code,
    voucherTypeName,
    amount,
    currency,
    buyerName: customerName,
    recipientName,
    recipientMessage: recipientMessage || undefined,
    validUntil: expiresAtDisplay,
    locale,
  });

  // 4. Save to Sanity
  const sanityDoc = await sanityWriteClient.create({
    _type: 'giftVoucher',
    code: promoCode.code,
    voucherType: voucherKey,
    amount,
    currency,
    buyerName: customerName,
    buyerEmail: customerEmail,
    recipientName,
    recipientEmail,
    ...(recipientMessage ? { recipientMessage } : {}),
    stripeSessionId: session.id,
    stripeCouponId: coupon.id,
    stripePromotionCodeId: promoCode.id,
    issuedAt: new Date().toISOString(),
    expiresAt: expiresAtISO,
    status: 'active',
  });

  // 5. Send emails
  const sharedData = { buyerName: customerName, buyerEmail: customerEmail, recipientName, recipientEmail, voucherTypeName, code: promoCode.code, amount, currency, validUntil: expiresAtDisplay, pdfBuffer, locale };

  await Promise.allSettled([
    sendVoucherBuyerEmail(sharedData).catch((err) => console.error('[voucher] buyer email failed:', err)),
    sendVoucherRecipientEmail(sharedData).catch((err) => console.error('[voucher] recipient email failed:', err)),
  ]);

  await sanityWriteClient.patch(sanityDoc._id).set({ sentAt: new Date().toISOString() }).commit();
}

async function handleSessionExpired(session: Stripe.Checkout.Session) {
  const sessions = await sanityWriteClient.fetch<{ _id: string; attendeeKeys: string[] }[]>(
    `*[_type == "courseSession" && defined(attendees[stripeSessionId == $sessionId])] {
      _id,
      "attendeeKeys": attendees[stripeSessionId == $sessionId][]._key
    }`,
    { sessionId: session.id },
  );

  await Promise.all(
    sessions.flatMap(({ _id, attendeeKeys }) =>
      attendeeKeys.map((key) =>
        sanityWriteClient.patch(_id).set({
          [`attendees[_key == "${key}"].status`]: 'cancelled',
        }).commit(),
      ),
    ),
  );
}
