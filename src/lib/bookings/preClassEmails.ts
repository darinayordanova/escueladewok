import { toMadridISOString } from '@/lib/courses/timeslots';
import { cancelScheduledEmail, sendPreClassEmail } from '@/lib/email';
import { sanityWriteClient } from '@/lib/sanity/writeClient';
import { getStripe } from '@/lib/stripe/client';
import type { Locale } from '@/types';

/**
 * The pre-class email goes out 24 hours before the class starts.
 *
 * Resend holds each email until its send time, so we only need to hand it over in time:
 * the daily cron (/api/cron/class-emails) schedules every class starting in the next
 * WINDOW_HOURS, and the Stripe webhook schedules a new booking straight away if its class
 * is already that close. Scheduling only ~2 days ahead keeps a booking moved or cancelled
 * in the Studio before then from getting an email.
 */
const HOUR = 60 * 60 * 1000;
const SEND_BEFORE_HOURS = 24;
// Longer than a day plus the cron's 24-hour gap, so no class falls between two runs
const WINDOW_HOURS = 50;

interface PendingAttendee {
  _key: string;
  customerName?: string;
  customerEmail?: string;
  dietaryRestrictions?: string;
  stripeSessionId?: string;
  locale?: Locale;
}

interface UpcomingSession {
  _id: string;
  date: string;
  startTime: string;
  endTime?: string;
  courseTitle?: string;
  title?: { en?: string; es?: string };
  attendees: PendingAttendee[];
}

/** "YYYY-MM-DD" in Madrid for a timestamp */
const madridDate = (ms: number) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });

/** Bookings made before the language was saved: read it from the Stripe session */
async function localeFromStripe(stripeSessionId?: string): Promise<Locale> {
  if (!stripeSessionId) return 'en';
  try {
    const session = await getStripe().checkout.sessions.retrieve(stripeSessionId);
    return session.metadata?.locale === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Schedule the pre-class email for every confirmed booking of a class starting within the
 * window that hasn't had one yet. One email per booking (Stripe checkout), however many guests.
 * Pass a Stripe session ID to look only at that booking.
 */
export async function schedulePreClassEmails({ stripeSessionId }: { stripeSessionId?: string } = {}) {
  const now = Date.now();
  const sessions = await sanityWriteClient.fetch<UpcomingSession[]>(
    `*[_type == "courseSession" && date >= $from && date <= $until
        && count(attendees[status == "confirmed" && !defined(preClassEmailAt) && ($sid == null || stripeSessionId == $sid)]) > 0] {
      _id, date, startTime, endTime, courseTitle,
      "title": course->title,
      "attendees": attendees[status == "confirmed" && !defined(preClassEmailAt) && ($sid == null || stripeSessionId == $sid)] {
        _key, customerName, customerEmail, dietaryRestrictions, stripeSessionId, locale
      }
    }`,
    { from: madridDate(now), until: madridDate(now + WINDOW_HOURS * HOUR), sid: stripeSessionId ?? null },
  );

  let scheduled = 0;
  let failed = 0;

  for (const s of sessions) {
    const start = Date.parse(toMadridISOString(s.date, s.startTime));
    if (start <= now || start - now > WINDOW_HOURS * HOUR) continue;

    const sendAtMs = start - SEND_BEFORE_HOURS * HOUR;
    // Booked less than a day before: send now rather than in the past
    const sendAt = sendAtMs > now + 60_000 ? new Date(sendAtMs).toISOString() : undefined;
    const when = madridDate(Math.max(sendAtMs, now)) === s.date ? 'today' : 'tomorrow';

    // Group a booking's guests together: they share one Stripe checkout and one email address
    const bookings = new Map<string, PendingAttendee[]>();
    for (const a of s.attendees) {
      const id = a.stripeSessionId || a.customerEmail || a._key;
      bookings.set(id, [...(bookings.get(id) ?? []), a]);
    }

    for (const guests of bookings.values()) {
      const lead = guests.find((g) => g.customerEmail) ?? guests[0];
      if (!lead.customerEmail) continue;
      const locale = lead.locale ?? (await localeFromStripe(lead.stripeSessionId));

      try {
        const result = await sendPreClassEmail({
          to: lead.customerEmail,
          recipientName: lead.customerName ?? '',
          courseName: s.title?.[locale] || s.title?.en || s.courseTitle || '',
          courseDate: s.date,
          timeRange: s.endTime ? `${s.startTime} – ${s.endTime}` : s.startTime,
          quantity: guests.length,
          dietaryRestrictions: guests.map((g) => g.dietaryRestrictions?.trim()).filter(Boolean).join('; '),
          when,
          locale,
          sendAt,
        });

        const patch: Record<string, string> = {};
        for (const g of guests) {
          patch[`attendees[_key == "${g._key}"].preClassEmailAt`] = sendAt ?? new Date().toISOString();
          // The class it was scheduled for, so a later change of date or time can be spotted
          patch[`attendees[_key == "${g._key}"].preClassEmailFor`] = `${s.date} ${s.startTime}`;
          if (result?.id) patch[`attendees[_key == "${g._key}"].preClassEmailId`] = result.id;
        }
        await sanityWriteClient.patch(s._id).set(patch).commit();
        scheduled++;
      } catch (err) {
        failed++;
        console.error(`[pre-class email] ${s._id} ${lead.stripeSessionId ?? ''}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  return { scheduled, failed };
}

// ─── Cancelling ───────────────────────────────────────────────────────────────

interface ScheduledAttendee {
  _key: string;
  status?: string;
  preClassEmailId: string;
  preClassEmailFor?: string;
}

/**
 * Cancel queued pre-class emails that no longer fit their booking:
 * - the attendee is no longer confirmed (cancelled in the Studio)
 * - the class's date or start time changed (the email is cleared, so it's rescheduled for the new time)
 * - `removedEmailIds`: emails of attendees removed from a session, or of a deleted session
 *   (the Sanity webhook passes these, as they're no longer in the dataset to find)
 * Pass `sessionId` to check only that session.
 */
export async function cancelStalePreClassEmails({ sessionId, removedEmailIds = [] }: { sessionId?: string; removedEmailIds?: string[] } = {}) {
  const now = new Date().toISOString();
  const sessions = await sanityWriteClient.fetch<{ _id: string; slot: string; attendees: ScheduledAttendee[] }[]>(
    `*[_type == "courseSession" && ($id == null || _id == $id) && count(attendees[defined(preClassEmailId) && preClassEmailAt > $now]) > 0] {
      _id,
      "slot": date + " " + startTime,
      "attendees": attendees[defined(preClassEmailId) && preClassEmailAt > $now] { _key, status, preClassEmailId, preClassEmailFor }
    }`,
    { id: sessionId ?? null, now },
  );

  const removed = new Set(removedEmailIds);
  let cancelled = 0;
  for (const s of sessions) {
    const stale = s.attendees.filter(
      (a) => a.status !== 'confirmed' || (a.preClassEmailFor !== undefined && a.preClassEmailFor !== s.slot),
    );
    // A removed guest's booking-mates still hold the email too: it's stale for them as well
    const ids = new Set([...stale.map((a) => a.preClassEmailId), ...s.attendees.map((a) => a.preClassEmailId).filter((id) => removed.has(id))]);
    if (!ids.size) continue;

    // Guests of one booking share an email: cancel it once, and clear it from all of them, so
    // the guests still coming get a new one (with the right number of guests) on the next run
    for (const id of ids) {
      removed.delete(id);
      const result = await cancelScheduledEmail(id);
      if (result.ok) cancelled++;
      else console.warn(`[pre-class email] could not cancel ${id}: ${result.message}`);
    }
    const sharing = s.attendees.filter((a) => ids.has(a.preClassEmailId));
    await sanityWriteClient
      .patch(s._id)
      .unset(sharing.flatMap((a) => ['preClassEmailAt', 'preClassEmailFor', 'preClassEmailId'].map((f) => `attendees[_key == "${a._key}"].${f}`)))
      .commit();
  }

  // The rest belonged to a deleted session, or to a booking removed whole
  for (const id of removed) {
    const result = await cancelScheduledEmail(id);
    if (result.ok) cancelled++;
  }

  return { cancelled };
}
