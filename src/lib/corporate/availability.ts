import { sanityWriteClient } from '@/lib/sanity/writeClient';

/** Team events run on Tuesdays only (0 = Sunday … 2 = Tuesday) */
const EVENT_WEEKDAY = 2;
/** On a Tuesday with a booked public class, the team event starts no later than this */
export const LATEST_START_WITH_CLASS = '14:30';
/** How many upcoming Tuesdays to offer as alternatives */
const SUGGESTIONS = 4;

const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const weekday = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();
const weekdayName = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });

/** Today in Madrid, as YYYY-MM-DD */
const madridToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());

/** The next `count` Tuesdays on or after `from` */
function tuesdaysFrom(from: string, count: number) {
  const day = new Date(`${from}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + ((EVENT_WEEKDAY - day.getUTCDay() + 7) % 7));
  return Array.from({ length: count }, (_, i) => {
    const next = new Date(day);
    next.setUTCDate(day.getUTCDate() + i * 7);
    return isoDay(next);
  });
}

/** Public classes with at least one confirmed booking on the given dates: date → start times */
async function bookedClasses(dates: string[]): Promise<Map<string, string[]>> {
  const rows = await sanityWriteClient.fetch<{ date: string; startTime: string }[]>(
    `*[_type == "courseSession" && date in $dates && count(attendees[status == "confirmed"]) > 0]{ date, startTime }`,
    { dates },
  );
  const byDate = new Map<string, string[]>();
  for (const { date, startTime } of rows) byDate.set(date, [...(byDate.get(date) ?? []), startTime].sort());
  return byDate;
}

function describe(date: string, classes: string[] | undefined) {
  if (weekday(date) !== EVENT_WEEKDAY) return `${date} (${weekdayName(date)}): not possible, team events run on Tuesdays only.`;
  if (classes?.length) {
    return `${date} (Tuesday): possible, but a public class with bookings runs that day (at ${classes.join(', ')}), so the team event must start no later than ${LATEST_START_WITH_CLASS}.`;
  }
  return `${date} (Tuesday): free, any time of day works. Still say the team confirms it with the quote.`;
}

/**
 * A short calendar note for Claude: whether each requested date works, and the next Tuesdays.
 * Read-only; returns null when Sanity is unreachable, so the draft goes on without it.
 */
export async function checkAvailability(requested: string[]): Promise<string | null> {
  const today = madridToday();
  const asked = [...new Set(requested.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))];
  // Alternatives start from the first requested date, or today when there is none (or it has passed)
  const start = asked.length && asked[0] > today ? asked[0] : today;
  const nextTuesdays = tuesdaysFrom(start, SUGGESTIONS).filter((d) => d > today);

  let booked: Map<string, string[]>;
  try {
    booked = await bookedClasses([...asked, ...nextTuesdays]);
  } catch (err) {
    console.error('[corporate-enquiry] availability check failed', err);
    return null;
  }

  const lines = [`Today is ${today}.`];
  for (const date of asked) lines.push(date < today ? `${date}: already passed.` : describe(date, booked.get(date)));
  lines.push('Next Tuesdays:');
  for (const date of nextTuesdays) {
    const classes = booked.get(date);
    lines.push(`- ${date}: ${classes?.length ? `class booked at ${classes.join(', ')}, team event must start by ${LATEST_START_WITH_CLASS}` : 'free all day'}`);
  }
  return lines.join('\n');
}
