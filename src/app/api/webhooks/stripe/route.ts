import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { sendConfirmationEmail, sendOwnerNotificationEmail } from '@/lib/email';
import { sanityWriteClient } from '@/lib/sanity/writeClient';
import { getStripe } from '@/lib/stripe/client';

export async function POST(request: Request) {
  console.log('[stripe webhook] POST received');
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

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('[stripe] checkout.session.completed', JSON.stringify(session, null, 2));
  // Find the courseSession document and the specific attendee key
  const result = await sanityWriteClient.fetch<{
    _id: string;
    attendeeKey: string;
  } | null>(
    `*[_type == "courseSession" && defined(attendees[stripeSessionId == $sessionId])][0] {
      _id,
      "attendeeKey": attendees[stripeSessionId == $sessionId][0]._key
    }`,
    { sessionId: session.id },
  );

  if (!result) {
    console.error(`No courseSession found for Stripe session ${session.id}`);
    return;
  }

  const { _id, attendeeKey } = result;

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? '';

  const meta = session.metadata ?? {};
  const customerName = session.customer_details?.name ?? '';
  const customerEmail = session.customer_details?.email ?? '';
  const customerPhone = session.customer_details?.phone ?? '';
  const dietaryRestrictions =
    session.custom_fields?.find((f) => f.key === 'dietary')?.text?.value ?? '';

  // Update the specific attendee in the array using its _key
  await sanityWriteClient
    .patch(_id)
    .set({
      [`attendees[_key == "${attendeeKey}"].status`]: 'confirmed',
      [`attendees[_key == "${attendeeKey}"].stripePaymentIntentId`]: paymentIntentId,
      [`attendees[_key == "${attendeeKey}"].customerName`]: customerName,
      [`attendees[_key == "${attendeeKey}"].customerEmail`]: customerEmail,
      [`attendees[_key == "${attendeeKey}"].customerPhone`]: customerPhone,
      [`attendees[_key == "${attendeeKey}"].dietaryRestrictions`]: dietaryRestrictions,
    })
    .commit();

  const emailData = {
    courseName: meta.courseTitle ?? '',
    courseDate: meta.date ?? '',
    timeRange: meta.timeRange ?? `${meta.startTime} – ${meta.endTime}`,
    customerName,
    customerEmail,
    customerPhone,
    dietaryRestrictions,
  };

  await Promise.allSettled([
    sendConfirmationEmail({
      to: customerEmail,
      recipientName: customerName,
      ...emailData,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency?.toUpperCase() ?? '',
    }).catch((err) => console.error('Failed to send confirmation email:', err)),
    sendOwnerNotificationEmail(emailData)
      .catch((err) => console.error('Failed to send owner notification email:', err)),
  ]);
}

async function handleSessionExpired(session: Stripe.Checkout.Session) {
  const result = await sanityWriteClient.fetch<{
    _id: string;
    attendeeKey: string;
  } | null>(
    `*[_type == "courseSession" && defined(attendees[stripeSessionId == $sessionId])][0] {
      _id,
      "attendeeKey": attendees[stripeSessionId == $sessionId][0]._key
    }`,
    { sessionId: session.id },
  );

  if (!result) return;

  await sanityWriteClient
    .patch(result._id)
    .set({
      [`attendees[_key == "${result.attendeeKey}"].status`]: 'cancelled',
    })
    .commit();
}
