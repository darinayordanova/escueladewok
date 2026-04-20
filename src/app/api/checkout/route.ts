import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

import { addMinutesToTime } from '@/lib/courses/timeslots';
import { sanityWriteClient } from '@/lib/sanity/writeClient';
import { getStripe } from '@/lib/stripe/client';

interface CheckoutItem {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  currency: string;
  maxParticipants: number;
  quantity: number;
}

interface CheckoutBody {
  items: CheckoutItem[];
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

  const { items, locale, cancelPath } = body;

  if (!items?.length || !locale) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (items.length > 8) {
    return NextResponse.json({ error: 'Cart too large' }, { status: 400 });
  }

  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // ── Check capacity for each item ─────────────────────────────────────────
    for (const item of items) {
      const existing = await sanityWriteClient.fetch<{
        confirmedCount: number;
        recentPendingCount: number;
      } | null>(
        `*[_type == "courseSession" && courseSlug == $courseSlug && date == $date && startTime == $startTime][0] {
          "confirmedCount": count(attendees[status == "confirmed"]),
          "recentPendingCount": count(attendees[status == "pending" && bookedAt > $since])
        }`,
        { courseSlug: item.courseSlug, date: item.date, startTime: item.startTime, since: thirtyMinutesAgo },
      );

      const taken = (existing?.confirmedCount ?? 0) + (existing?.recentPendingCount ?? 0);
      if (taken + item.quantity > item.maxParticipants) {
        return NextResponse.json(
          { error: `Not enough spots available for ${item.courseTitle}` },
          { status: 409 },
        );
      }
    }

    // ── Build Stripe line items ───────────────────────────────────────────────
    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const lineItems = items.map((item) => {
      const endTime = item.endTime || addMinutesToTime(item.startTime, item.duration);
      return {
        price_data: {
          currency: item.currency.toLowerCase(),
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.courseTitle,
            description: `${item.date} · ${item.startTime} – ${endTime}`,
          },
        },
        quantity: item.quantity,
      };
    });

    // ── Build metadata (max 50 keys: 2 common + 6 per item) ──────────────────
    const metadata: Record<string, string> = { locale, item_count: String(items.length) };
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const endTime = item.endTime || addMinutesToTime(item.startTime, item.duration);
      metadata[`item_${i}_slug`]  = item.courseSlug;
      metadata[`item_${i}_id`]    = item.courseId;
      metadata[`item_${i}_date`]  = item.date;
      metadata[`item_${i}_time`]  = item.startTime;
      metadata[`item_${i}_end`]   = endTime;
      metadata[`item_${i}_qty`]   = String(item.quantity);
    }

    // ── Create Stripe session ─────────────────────────────────────────────────
    const stripeSession = await getStripe().checkout.sessions.create({
      mode: 'payment',
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
      custom_fields: [
        {
          key: 'dietary',
          label: { type: 'custom', custom: 'Dietary restrictions / allergies' },
          type: 'text',
          optional: true,
        },
      ],
      line_items: lineItems,
      metadata,
      success_url: `${origin}/${locale}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    // ── Create pending attendees in Sanity ────────────────────────────────────
    for (const item of items) {
      const endTime = item.endTime || addMinutesToTime(item.startTime, item.duration);
      const bookedAt = new Date().toISOString();
      const attendees = Array.from({ length: item.quantity }, () => ({
        _key: randomUUID(),
        status: 'pending',
        stripeSessionId: stripeSession.id,
        amount: item.price,
        currency: item.currency,
        bookedAt,
      }));

      const existing = await sanityWriteClient.fetch<{ _id: string } | null>(
        `*[_type == "courseSession" && courseSlug == $courseSlug && date == $date && startTime == $startTime][0] { _id }`,
        { courseSlug: item.courseSlug, date: item.date, startTime: item.startTime },
      );

      if (existing) {
        await sanityWriteClient.patch(existing._id).setIfMissing({ attendees: [] }).append('attendees', attendees).commit();
      } else {
        await sanityWriteClient.create({
          _type: 'courseSession',
          course: { _type: 'reference', _ref: item.courseId },
          courseTitle: item.courseTitle,
          courseSlug: item.courseSlug,
          date: item.date,
          startTime: item.startTime,
          endTime,
          attendees,
        });
      }
    }

    return NextResponse.json({ url: stripeSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/checkout]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
