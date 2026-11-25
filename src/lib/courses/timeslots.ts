import type { BookingCountMap, Course, CourseOccurrence, DateEntry, ListedOccurrence, TimeSlot } from '@/types';

// ─── Spots ────────────────────────────────────────────────────────────────────

/**
 * Returns the number of spots left for a given date + startTime.
 * bookingCounts key format: `${date}|${startTime}`
 */
export function slotSpots(
  maxParticipants: number,
  bookingCounts: BookingCountMap,
  date: string,
  startTime: string,
): number {
  return Math.max(0, maxParticipants - (bookingCounts[`${date}|${startTime}`] ?? 0));
}

export type AvailabilityLevel = 'high' | 'medium' | 'low' | 'none';

/**
 * Bucket remaining capacity into a colour level.
 * More than half free → high, more than a fifth → medium, otherwise low; nothing left → none.
 */
export function availabilityLevel(left: number, total: number): AvailabilityLevel {
  if (left <= 0 || total <= 0) return 'none';
  const pct = (left / total) * 100;
  if (pct > 50) return 'high';
  if (pct > 20) return 'medium';
  return 'low';
}

// ─── Time of day ──────────────────────────────────────────────────────────────

export type DayPart = 'morning' | 'afternoon' | 'evening';

/** Morning before 12:00, afternoon before 17:00, evening after. */
export function dayPart(startTime: string): DayPart {
  const hour = Number(startTime.split(':')[0]);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

// ─── Booking window ───────────────────────────────────────────────────────────

/**
 * A class with no confirmed bookings closes this many hours before it starts.
 * Once at least one person has booked, it stays open until the start time.
 */
export const EMPTY_CLASS_CUTOFF_HOURS = 48;

/** Whether a class (by Madrid-local date + start time) can still be booked. */
export function isBookingOpen(
  date: string,
  startTime: string,
  confirmedCount: number,
  now: number = Date.now(),
): boolean {
  const start = Date.parse(toMadridISOString(date, startTime));
  if (now >= start) return false;
  if (confirmedCount > 0) return true;
  return start - now > EMPTY_CLASS_CUTOFF_HOURS * 60 * 60 * 1000;
}

// ─── Time arithmetic ──────────────────────────────────────────────────────────

/** Add minutes to a "HH:MM" string and return the resulting "HH:MM" string. */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

/** "from 18:30 to 21:30" — purely a formatting helper, no i18n required here. */
export function formatTimeRange(startTime: string, duration: number): string {
  return `${startTime} – ${addMinutesToTime(startTime, duration)}`;
}

// ─── Date formatting ──────────────────────────────────────────────────────────

/**
 * Format a "YYYY-MM-DD" string as a localised date label.
 * Constructs a local-time Date to avoid UTC-offset day-shift bugs.
 */
export function formatDate(
  dateStr: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, options);
}

// ─── Date utilities ───────────────────────────────────────────────────────────

/** UTC offset (e.g. "+02:00") in effect in Madrid on the given date, accounting for DST. */
function madridOffset(dateStr: string): string {
  const probe = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    timeZoneName: 'shortOffset',
  }).formatToParts(probe);
  const tzName = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+1';
  const hours = parseInt(tzName.replace('GMT', ''), 10) || 1;
  const sign = hours >= 0 ? '+' : '-';
  return `${sign}${String(Math.abs(hours)).padStart(2, '0')}:00`;
}

/** Combine a "YYYY-MM-DD" date and "HH:MM" time into an ISO 8601 datetime with the Europe/Madrid UTC offset. */
export function toMadridISOString(date: string, time: string): string {
  return `${date}T${time}:00${madridOffset(date)}`;
}

/** Today's date as "YYYY-MM-DD" in local time. */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Occurrence expansion ─────────────────────────────────────────────────────

/**
 * Expand an array of courses into individual occurrences, keeping only future
 * dates and sorting soonest-first, then by start time.
 */
export function expandOccurrences(courses: Course[]): CourseOccurrence[] {
  const today = todayISO();
  const occurrences: CourseOccurrence[] = [];

  for (const course of courses) {
    for (const slot of course.timeSlots ?? []) {
      for (const date of slot.dates ?? []) {
        if (date >= today) {
          occurrences.push({
            course,
            date,
            startTime: slot.startTime,
            endTime: addMinutesToTime(slot.startTime, course.duration),
          });
        }
      }
    }
  }

  return occurrences.sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  );
}

/**
 * Attach spots left and booking-window state to each occurrence.
 * bookingCounts key format: `${courseSlug}|${date}|${startTime}`
 */
export function withAvailability(
  occurrences: CourseOccurrence[],
  bookingCounts: BookingCountMap,
  now: number = Date.now(),
): ListedOccurrence[] {
  return occurrences.map((occ) => {
    const confirmed = bookingCounts[`${occ.course.slug.current}|${occ.date}|${occ.startTime}`] ?? 0;
    return {
      ...occ,
      spotsLeft: Math.max(0, occ.course.maxParticipants - confirmed),
      bookingOpen: isBookingOpen(occ.date, occ.startTime, confirmed, now),
    };
  });
}

/**
 * Flatten all timeSlots of a single course into future DateEntries,
 * sorted soonest-first, then by start time.
 */
export function getFutureDateEntries(timeSlots: TimeSlot[], duration: number): DateEntry[] {
  const today = todayISO();
  const entries: DateEntry[] = [];

  for (const slot of timeSlots) {
    for (const date of slot.dates ?? []) {
      if (date >= today) {
        entries.push({
          date,
          startTime: slot.startTime,
          endTime: addMinutesToTime(slot.startTime, duration),
        });
      }
    }
  }

  return entries.sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  );
}
