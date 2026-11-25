import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import {
  sendConfirmationEmail,
  sendOwnerNotificationEmail,
  sendVoucherBuyerEmail,
  sendVoucherOwnerNotificationEmail,
  sendVoucherRecipientEmail,
} from '@/lib/email';
import { generateVoucherPdf } from '@/lib/pdf/voucherPdf';
import { sanityWriteClient } from '@/lib/sanity/writeClient';
import { postPrintedVoucherToSlack } from '@/lib/slack/printedVoucher';
import { getStripe } from '@/lib/stripe/client';
import { formatVoucherDate, formatVoucherTypeName, voucherAmount, voucherExpiry, voucherSendAt, type VoucherFormat, type VoucherKey } from '@/lib/vouchers';
import { isVoucherTheme, type VoucherTheme } from '@/lib/voucherThemes';
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
  const locale: Locale = meta.locale === 'es' ? 'es' : 'en';

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? '';

  const customerName  = session.customer_details?.name  ?? '';
  const customerEmail = session.customer_details?.email ?? '';
  const customerPhone = session.customer_details?.phone ?? '';
  const dietaryRestrictions =
    session.custom_fields?.find((f) => f.key === 'dietary')?.text?.value ?? '';

  const addr = session.customer_details?.address;
  const billingAddress = addr
    ? [addr.line1, addr.line2, addr.postal_code, addr.city, addr.state, addr.country].filter(Boolean).join(', ')
    : undefined;

  // Voucher/promo code usage
  const discountAmountCents = session.total_details?.amount_discount ?? 0;
  const voucherUsed = discountAmountCents > 0;
  let voucherCode: string | undefined;
  if (voucherUsed) {
    const promo = session.discounts?.[0]?.promotion_code;
    const promoId = typeof promo === 'string' ? promo : promo?.id;
    if (promoId) {
      try {
        const promotionCode = await getStripe().promotionCodes.retrieve(promoId);
        voucherCode = promotionCode.code;
      } catch (err) {
        console.error('Failed to resolve promotion code for owner notification:', err);
      }
    }
  }

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

  // Enrich course names from Sanity (metadata only carries the slug)
  const courseIds = [...new Set(items.map((item) => item.courseId).filter(Boolean))];
  const courses = courseIds.length
    ? await sanityWriteClient.fetch<{ _id: string; title: { en: string; es: string } }[]>(
        `*[_type == "course" && _id in $ids] { _id, title }`,
        { ids: courseIds },
      )
    : [];
  const titleById = new Map(courses.map((c) => [c._id, c.title]));

  // Build course list for emails
  const courseLines = items.map((item) => ({
    courseName: titleById.get(item.courseId)?.[locale] ?? titleById.get(item.courseId)?.en ?? item.courseSlug,
    courseDate: item.date,
    timeRange: `${item.startTime} – ${item.endTime}`,
    quantity: item.quantity,
  }));

  const totalGuests = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
  const currency = session.currency?.toUpperCase() ?? '';

  await Promise.allSettled([
    sendConfirmationEmail({
      to: customerEmail,
      recipientName: customerName,
      items: courseLines,
      amount: totalAmount,
      currency,
      locale,
    }).catch((err) => console.error('Failed to send confirmation email:', err)),
    sendOwnerNotificationEmail({
      items: courseLines,
      totalGuests,
      totalAmount,
      currency,
      customerName,
      customerEmail,
      customerPhone,
      dietaryRestrictions,
      billingAddress,
      voucherUsed,
      voucherCode,
      discountAmount: voucherUsed ? discountAmountCents / 100 : undefined,
      locale,
    }).catch((err) => console.error('Failed to send owner notification email:', err)),
  ]);
}

async function handleVoucherSessionCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const voucherKey = meta.voucher_key as VoucherKey;
  const format: VoucherFormat = meta.voucher_format === 'physical' ? 'physical' : 'digital';
  const theme: VoucherTheme = isVoucherTheme(meta.voucher_theme) ? meta.voucher_theme : 'classic';
  const locale: Locale = meta.locale === 'es' ? 'es' : 'en';

  // Idempotency guard — skip if already processed
  const existing = await sanityWriteClient.fetch<string | null>(
    `*[_type == "giftVoucher" && stripeSessionId == $sid][0]._id`,
    { sid: session.id },
  );
  if (existing) return;

  const customerName  = session.customer_details?.name  ?? '';
  const customerEmail = session.customer_details?.email ?? '';
  // The voucher is worth the chosen amount; the total can also include printing and postage
  const amount        = voucherAmount(voucherKey) ?? (session.amount_total ? session.amount_total / 100 : 0);
  const currency      = session.currency ?? 'eur';

  // Names and message come from the vouchers page (metadata); older sessions used Stripe custom fields
  const customField = (key: string) => session.custom_fields?.find((f) => f.key === key)?.text?.value ?? '';
  const recipientName    = meta.recipient_name || customField('recipient_name') || customerName;
  const senderName       = meta.sender_name || customerName;
  const recipientEmail   = meta.recipient_email || customField('recipient_email');
  // Emailed to the recipient at 9:00 Madrid time on the chosen date, or straight away
  const sendAt           = recipientEmail ? voucherSendAt(meta.send_date) : undefined;
  const sendOn           = sendAt ? formatVoucherDate(new Date(sendAt), locale) : undefined;
  const recipientMessage = meta.message || customField('message');
  const shipping         = session.collected_information?.shipping_details;
  const shippingLines    = shipping
    ? [shipping.name, shipping.address.line1, shipping.address.line2, `${shipping.address.postal_code ?? ''} ${shipping.address.city ?? ''}`.trim(), shipping.address.state, shipping.address.country]
        .filter((line): line is string => !!line)
    : [];
  const shippingAddress  = shippingLines.length ? shippingLines.join(', ') : undefined;
  // Asked for on printed cards — some couriers need it
  const shippingPhone    = format === 'physical' ? session.customer_details?.phone ?? undefined : undefined;

  // 1. Expiry date (12 months)
  const expiresAt = voucherExpiry();
  const expiresAtUnix     = Math.floor(expiresAt.getTime() / 1000);
  const expiresAtISO      = expiresAt.toISOString().split('T')[0];
  const expiresAtDisplay  = formatVoucherDate(expiresAt, locale);

  // 2. Create Stripe coupon + promo code
  const coupon = await getStripe().coupons.create({
    amount_off: Math.round(amount * 100),
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
    buyerName: senderName,
    recipientName,
    recipientMessage: recipientMessage || undefined,
    theme,
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
    senderName,
    recipientName,
    ...(recipientEmail ? { recipientEmail } : {}),
    ...(sendAt ? { sendAt } : {}),
    ...(recipientMessage ? { recipientMessage } : {}),
    format,
    theme,
    ...(shippingAddress ? { shippingAddress } : {}),
    ...(shippingPhone ? { shippingPhone } : {}),
    stripeSessionId: session.id,
    stripeCouponId: coupon.id,
    stripePromotionCodeId: promoCode.id,
    issuedAt: new Date().toISOString(),
    expiresAt: expiresAtISO,
    status: 'active',
  });

  // 5. Send emails
  const sharedData = { buyerName: customerName, buyerEmail: customerEmail, recipientName, recipientEmail, voucherTypeName, code: promoCode.code, amount, currency, validUntil: expiresAtDisplay, pdfBuffer, locale, format, sendAt, sendOn };

  await Promise.allSettled([
    sendVoucherBuyerEmail(sharedData).catch((err) => console.error('[voucher] buyer email failed:', err)),
    // Only when the buyer gave the recipient's address; otherwise the buyer passes it on
    recipientEmail
      ? sendVoucherRecipientEmail({ ...sharedData, buyerName: senderName, recipientMessage: recipientMessage || undefined }).catch((err) => console.error('[voucher] recipient email failed:', err))
      : Promise.resolve(),
    sendVoucherOwnerNotificationEmail({ ...sharedData, recipientMessage: recipientMessage || undefined, format, theme, shippingAddress, shippingPhone }).catch((err) =>
      console.error('[voucher] owner notification email failed:', err),
    ),
    // Printed cards go to the team's Slack channel, ready to print and post
    format === 'physical'
      ? postPrintedVoucherToSlack({
          code: promoCode.code,
          voucherTypeName,
          amount,
          theme,
          recipientName,
          senderName,
          message: recipientMessage || undefined,
          buyerName: customerName,
          buyerEmail: customerEmail,
          shippingLines,
          shippingPhone,
          pdfBuffer,
        }).catch((err) => console.error('[voucher] Slack post failed:', err))
      : Promise.resolve(),
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
