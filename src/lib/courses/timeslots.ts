import type { Course, CourseOccurrence, DateEntry, TimeSlot } from '@/types';

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
