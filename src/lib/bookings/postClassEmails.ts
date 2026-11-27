import { expandOccurrences, toMadridISOString, withAvailability } from '@/lib/courses/timeslots';
import { type NextClass, sendPostClassEmail } from '@/lib/email';
import { sanityWriteClient } from '@/lib/sanity/writeClient';
import { GOOGLE_REVIEW_URL, SITE_URL } from '@/lib/seo';
import { getStripe } from '@/lib/stripe/client';
import type { Course, Locale } from '@/types';

/**
 * The thank-you email (recipes, Google review, next classes) goes out at 10:00 Madrid time
 * the morning after the class. The daily cron (/api/cron/class-emails, before 10:00) hands
 * each one to Resend to hold until then. If a run was missed, it catches up on classes
 * from the last CATCH_UP_DAYS and sends those straight away.
 */
const SEND_AT = '10:00';
const CATCH_UP_DAYS = 2;
const NEXT_CLASSES = 2;

interface PastAttendee {
  _key: string;
  customerName?: string;
  customerEmail?: string;
  stripeSessionId?: string;
  locale?: Locale;
}

interface PastSession {
  _id: string;
  date: string;
  courseSlug?: string;
  courseTitle?: string;
  title?: { en?: string; es?: string };
  recipes?: { url: string; filename?: string };
  attendees: PastAttendee[];
}

const DAY = 24 * 60 * 60 * 1000;
const madridDate = (ms: number) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
/** "YYYY-MM-DD" + days */
const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T12:00:00Z`) + days * DAY).toISOString().slice(0, 10);

async function localeFromStripe(stripeSessionId?: string): Promise<Locale> {
  if (!stripeSessionId) return 'en';
  try {
    const session = await getStripe().checkout.sessions.retrieve(stripeSessionId);
    return session.metadata?.locale === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

/** The soonest bookable classes of other courses, one date per course */
async function upcomingClasses() {
  const [courses, counts] = await Promise.all([
    sanityWriteClient.fetch<Course[]>(
      `*[_type == "course" && corporateEvent != true] { _id, title, slug, duration, maxParticipants, "timeSlots": timeSlots[] { _key, startTime, "dates": dates[] | order(@) } }`,
    ),
    sanityWriteClient.fetch<{ courseSlug: string; date: string; startTime: string; confirmedCount: number }[]>(
      `*[_type == "courseSession"] { courseSlug, date, startTime, "confirmedCount": count(attendees[status == "confirmed"]) }`,
    ),
  ]);
  const bookingCounts = Object.fromEntries(counts.map((r) => [`${r.courseSlug}|${r.date}|${r.startTime}`, r.confirmedCount]));
  return withAvailability(expandOccurrences(courses), bookingCounts).filter((o) => o.bookingOpen && o.spotsLeft > 0);
}

function nextClassesFor(courseSlug: string | undefined, upcoming: Awaited<ReturnType<typeof upcomingClasses>>, locale: Locale): NextClass[] {
  const picked: NextClass[] = [];
  const seen = new Set([courseSlug]);
  for (const o of upcoming) {
    const slug = o.course.slug.current;
    if (seen.has(slug)) continue;
    seen.add(slug);
    picked.push({
      courseName: o.course.title[locale] || o.course.title.en,
      date: o.date,
      startTime: o.startTime,
      url: `${SITE_URL}/${locale}/courses/${slug}`,
    });
    if (picked.length === NEXT_CLASSES) break;
  }
  return picked;
}

/**
 * Schedule the thank-you email for every confirmed booking of a class held in the last few
 * days that hasn't had one. One email per booking (Stripe checkout), however many guests.
 */
export async function schedulePostClassEmails() {
  const now = Date.now();
  const today = madridDate(now);
  const sessions = await sanityWriteClient.fetch<PastSession[]>(
    `*[_type == "courseSession" && date >= $from && date < $today
        && count(attendees[status == "confirmed" && !defined(postClassEmailAt)]) > 0] {
      _id, date, courseSlug, courseTitle,
      "title": course->title,
      "recipes": course->recipes { "url": asset->url, "filename": asset->originalFilename },
      "attendees": attendees[status == "confirmed" && !defined(postClassEmailAt)] {
        _key, customerName, customerEmail, stripeSessionId, locale
      }
    }`,
    { from: addDays(today, -CATCH_UP_DAYS), today },
  );
  if (!sessions.length) return { scheduled: 0, failed: 0 };

  const upcoming = await upcomingClasses();
  let scheduled = 0;
  let failed = 0;

  for (const s of sessions) {
    const sendAtMs = Date.parse(toMadridISOString(addDays(s.date, 1), SEND_AT));
    // Running late (a missed cron run): send now rather than in the past
    const sendAt = sendAtMs > now + 60_000 ? new Date(sendAtMs).toISOString() : undefined;

    const bookings = new Map<string, PastAttendee[]>();
    for (const a of s.attendees) {
      const id = a.stripeSessionId || a.customerEmail || a._key;
      bookings.set(id, [...(bookings.get(id) ?? []), a]);
    }

    for (const guests of bookings.values()) {
      const lead = guests.find((g) => g.customerEmail) ?? guests[0];
      if (!lead.customerEmail) continue;
      const locale = lead.locale ?? (await localeFromStripe(lead.stripeSessionId));

      try {
        const result = await sendPostClassEmail({
          to: lead.customerEmail,
          recipientName: lead.customerName ?? '',
          courseName: s.title?.[locale] || s.title?.en || s.courseTitle || '',
          recipes: s.recipes?.url ? { url: s.recipes.url, filename: s.recipes.filename || 'WokLab_Recetas_Recipes.pdf' } : undefined,
          reviewUrl: GOOGLE_REVIEW_URL,
          nextClasses: nextClassesFor(s.courseSlug, upcoming, locale),
          locale,
          sendAt,
        });

        const patch: Record<string, string> = {};
        for (const g of guests) {
          patch[`attendees[_key == "${g._key}"].postClassEmailAt`] = sendAt ?? new Date().toISOString();
          if (result?.id) patch[`attendees[_key == "${g._key}"].postClassEmailId`] = result.id;
        }
        await sanityWriteClient.patch(s._id).set(patch).commit();
        scheduled++;
      } catch (err) {
        failed++;
        console.error(`[post-class email] ${s._id} ${lead.stripeSessionId ?? ''}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  return { scheduled, failed };
}
