// Gift voucher options — shared by the vouchers page, the checkout route and the Stripe webhook.

export const VOUCHER_OPTIONS = [
  { key: 'giftCard25', amount: 25 },
  { key: 'giftCard50', amount: 50 },
  { key: 'classVoucher', amount: 89 },
  { key: 'classVoucherForTwo', amount: 178 },
] as const;

export type VoucherKey = (typeof VOUCHER_OPTIONS)[number]['key'];
export type VoucherFormat = 'digital' | 'physical';

/** Printing and posting a physical card, in euros. Not part of the voucher's value. */
export const PHYSICAL_FEE = 5;

export const VOUCHER_CURRENCY = 'eur';

/** Field limits — the form enforces them and the checkout route checks them again. */
export const VOUCHER_NAME_MAX = 60;
export const VOUCHER_MESSAGE_MAX = 200;

/** Digital vouchers can be emailed to the recipient on a later date — Resend schedules up to 30 days ahead. */
export const VOUCHER_SEND_MAX_DAYS = 30;
const VOUCHER_TIME_ZONE = 'Europe/Madrid';
const VOUCHER_SEND_HOUR = 9;

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** Today's date in Madrid, as YYYY-MM-DD. */
export function madridToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: VOUCHER_TIME_ZONE }).format(now);
}

export function addDaysISO(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Last date a voucher can be scheduled for. */
export function voucherSendMaxDate(now = new Date()): string {
  return addDaysISO(madridToday(now), VOUCHER_SEND_MAX_DAYS);
}

/**
 * When to email a voucher sent on `date` (YYYY-MM-DD): 9:00 Madrid time, as an ISO timestamp.
 * Undefined for today, a past date or no date — those go out straight away.
 */
export function voucherSendAt(date: string | undefined, now = new Date()): string | undefined {
  if (!date || date <= madridToday(now)) return undefined;
  // Madrid is UTC+1 or UTC+2: take the UTC hour that reads as 9:00 there
  const at = [VOUCHER_SEND_HOUR - 1, VOUCHER_SEND_HOUR - 2]
    .map((utcHour) => new Date(`${date}T${String(utcHour).padStart(2, '0')}:00:00Z`))
    .find((d) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: VOUCHER_TIME_ZONE, hour: 'numeric', hourCycle: 'h23' }).format(d)) === VOUCHER_SEND_HOUR)!;
  // Keep inside Resend's 30-day window on the last allowed day
  const latest = now.getTime() + VOUCHER_SEND_MAX_DAYS * 24 * 60 * 60 * 1000 - 10 * 60 * 1000;
  return new Date(Math.min(at.getTime(), latest)).toISOString();
}

export function voucherAmount(key: string): number | undefined {
  return VOUCHER_OPTIONS.find((option) => option.key === key)?.amount;
}

const VOUCHER_TYPE_NAMES: Record<string, Record<'en' | 'es', string>> = {
  classVoucher:       { en: 'Cooking Class Gift Voucher',       es: 'Vale Regalo — Clase de Cocina' },
  classVoucherForTwo: { en: 'Cooking Class Gift Voucher for 2', es: 'Vale Regalo — Clase de Cocina para 2' },
  giftCard25:         { en: 'Gift Card €25',                    es: 'Tarjeta Regalo €25' },
  giftCard50:         { en: 'Gift Card €50',                    es: 'Tarjeta Regalo €50' },
};

/** Voucher title as printed on the voucher. */
export function formatVoucherTypeName(voucherKey: string, locale: string = 'en'): string {
  const l = locale === 'es' ? 'es' : 'en';
  return VOUCHER_TYPE_NAMES[voucherKey]?.[l] ?? (l === 'es' ? 'Vale Regalo' : 'Gift Voucher');
}

/** Vouchers are valid for 12 months from purchase. */
export function voucherExpiry(from = new Date()): Date {
  const expiresAt = new Date(from);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  return expiresAt;
}

export function formatVoucherDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function voucherTotal(key: VoucherKey, format: VoucherFormat): number {
  return (voucherAmount(key) ?? 0) + (format === 'physical' ? PHYSICAL_FEE : 0);
}

// ─── Christmas ────────────────────────────────────────────────────────────────

/** The Christmas season's dates, worked out from today in Madrid. */
export function christmasDates(now = new Date()) {
  const today = madridToday(now);
  const year = Number(today.slice(0, 4));
  // The season runs into January (to Reyes), so early January still belongs to last year's Christmas
  const inNewYear = today <= `${year}-01-06`;
  const seasonYear = inNewYear ? year - 1 : year;
  const christmas = `${seasonYear}-12-25`;
  const postBy = `${seasonYear}-12-15`;
  const reyes = `${seasonYear + 1}-01-06`;
  return {
    christmas,
    postBy,
    reyes,
    /** 25 December to 6 January: Christmas can no longer be scheduled, so the gift is now for Reyes. */
    afterChristmas: today >= christmas,
    /** 6 January can still be picked as the send date (send dates start tomorrow). */
    canScheduleReyes: today < reyes && reyes <= voucherSendMaxDate(now),
    /** Printed cards ordered today still arrive before Christmas. */
    postInTime: today <= postBy,
    /** 25 December is inside the scheduling window (send dates start tomorrow), so it can be picked. */
    canScheduleChristmas: today < christmas && christmas <= voucherSendMaxDate(now),
    /** When the homepage shows the Christmas block: 1 November to 6 January. */
    isSeason: inNewYear || today >= `${year}-11-01`,
  };
}

// ─── Valentine's ──────────────────────────────────────────────────────────────

/** The Valentine's season's dates, worked out from today in Madrid. */
export function valentinesDates(now = new Date()) {
  const today = madridToday(now);
  const year = today.slice(0, 4);
  const valentines = `${year}-02-14`;
  const postBy = `${year}-02-07`;
  return {
    valentines,
    postBy,
    /** Printed cards ordered today still arrive before Valentine's Day. */
    postInTime: today <= postBy,
    /** 14 February is inside the scheduling window (send dates start tomorrow), so it can be picked. */
    canScheduleValentines: today < valentines && valentines <= voucherSendMaxDate(now),
    /** 14 February itself: too late to schedule, but an email sent now arrives in minutes. */
    isValentinesDay: today === valentines,
    /** When the homepage shows the Valentine's block: 15 January to 14 February. */
    isSeason: today >= `${year}-01-15` && today <= valentines,
  };
}

const VOUCHER_KEYS: readonly string[] = VOUCHER_OPTIONS.map((option) => option.key);
export const isVoucherKey = (value: unknown): value is VoucherKey => typeof value === 'string' && VOUCHER_KEYS.includes(value);

/** A send date from a link (?send=YYYY-MM-DD), kept only if it can still be scheduled. */
export function sendDateFromLink(value: string | undefined, now = new Date()): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && value > madridToday(now) && value <= voucherSendMaxDate(now) ? value : undefined;
}
