import { NextResponse } from 'next/server';

import { cancelStalePreClassEmails, schedulePreClassEmails } from '@/lib/bookings/preClassEmails';

/**
 * Sanity webhook: a course session was changed or deleted in the Studio.
 * Cancels pre-class emails that no longer fit (attendee cancelled or removed, class moved or
 * deleted), then schedules any that are now due, e.g. for a class moved to tomorrow.
 *
 * Set up in sanity.io/manage → API → Webhooks:
 *   URL:        https://woklab.es/api/webhooks/sanity/course-session
 *   Dataset:    production · Trigger on: Update, Delete · Filter: _type == "courseSession"
 *   Projection: { "id": coalesce(after()._id, before()._id), "before": before().attendees[defined(preClassEmailId)]{ _key, preClassEmailId }, "after": after().attendees[]._key }
 *   HTTP header: x-webhook-secret = the value of SANITY_REVALIDATE_SECRET
 */
interface Payload {
  id?: string;
  before?: { _key: string; preClassEmailId: string }[] | null;
  /** Attendee keys still in the session; null when it was deleted */
  after?: string[] | null;
}

export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ error: 'SANITY_REVALIDATE_SECRET is not set' }, { status: 500 });
  if (request.headers.get('x-webhook-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const stillThere = new Set(body.after ?? []);
  const removedEmailIds = (body.before ?? []).filter((a) => !stillThere.has(a._key)).map((a) => a.preClassEmailId);

  const { cancelled } = await cancelStalePreClassEmails({ sessionId: body.id, removedEmailIds });
  const { scheduled } = body.after ? await schedulePreClassEmails() : { scheduled: 0 };
  return NextResponse.json({ cancelled, scheduled });
}
