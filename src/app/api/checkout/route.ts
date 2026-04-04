import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

import { addMinutesToTime } from '@/lib/courses/timeslots';
import { sanityWriteClient } from '@/lib/sanity/writeClient';
import { stripe } from '@/lib/stripe/client';

interface CheckoutBody {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  date: string;
  startTime: string;
  duration: number;
  price: number;
  currency: string;
  maxParticipants: number;
  locale: string;
  cancelPath: string;
}

export async function POST(request: Request) {
  let body: CheckoutBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    courseId, courseSlug, courseTitle,
    date, startTime, duration,
    price, currency, maxParticipants,
    locale, cancelPath,
  } = body;

  if (!courseId || !courseSlug || !date || !startTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const endTime = addMinutesToTime(startTime, duration);
    const timeRange = `${startTime} – ${endTime}`;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // ── Find existing session for this course + date + time ──────────────────
    const existingSession = await sanityWriteClient.fetch<{
      _id: string;
      confirmedCount: number;
      recentPendingCount: number;
    } | null>(
      `*[_type == "courseSession" && courseSlug == $courseSlug && date == $date && startTime == $startTime][0] {
        _id,
        "confirmedCount": count(attendees[status == "confirmed"]),
        "recentPendingCount": count(attendees[status == "pending" && bookedAt > $since])
      }`,
      { courseSlug, date, startTime, since: thirtyMinutesAgo },
    );

    const takenSpots = (existingSession?.confirmedCount ?? 0) + (existingSession?.recentPendingCount ?? 0);
    if (takenSpots >= maxParticipants) {
      return NextResponse.json({ error: 'No spots available for this date and time' }, { status: 409 });
    }

    // ── Create Stripe Checkout Session ───────────────────────────────────────
    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(price * 100),
            product_data: {
              name: courseTitle,
              description: `${date} · ${timeRange}`,
            },
          },
          quantity: 1,
        },
      ],
      custom_fields: [
        {
          key: 'customer_name',
          label: { type: 'custom', custom: 'Full name' },
          type: 'text',
        },
      ],
      phone_number_collection: { enabled: true },
      metadata: {
        courseId,
        courseSlug,
        courseTitle,
        date,
        startTime,
        endTime,
        timeRange,
        locale,
      },
      success_url: `${origin}/${locale}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    // ── Pending attendee to append ────────────────────────────────────────────
    const attendee = {
      _key: randomUUID(),
      status: 'pending',
      stripeSessionId: stripeSession.id,
      amount: price,
      currency,
      bookedAt: new Date().toISOString(),
    };

    if (existingSession) {
      // Append attendee to existing session
      await sanityWriteClient
        .patch(existingSession._id)
        .setIfMissing({ attendees: [] })
        .append('attendees', [attendee])
        .commit();
    } else {
      // Create a new session document with this attendee
      await sanityWriteClient.create({
        _type: 'courseSession',
        course: { _type: 'reference', _ref: courseId },
        courseTitle,
        courseSlug,
        date,
        startTime,
        endTime,
        attendees: [attendee],
      });
    }

    return NextResponse.json({ url: stripeSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/checkout]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
