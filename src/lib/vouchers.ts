// Gift voucher options — shared by the vouchers page, the checkout route and the Stripe webhook.

// TEMP — live test at Stripe's €0.50 minimum. Restore: 25, 50, 89, 178 and PHYSICAL_FEE = 5.
export const VOUCHER_OPTIONS = [
  { key: 'giftCard25', amount: 0.5 },
  { key: 'giftCard50', amount: 0.5 },
  { key: 'classVoucher', amount: 0.5 },
  { key: 'classVoucherForTwo', amount: 0.5 },
] as const;

export type VoucherKey = (typeof VOUCHER_OPTIONS)[number]['key'];
export type VoucherFormat = 'digital' | 'physical';

/** Printing and posting a physical card, in euros. Not part of the voucher's value. */
export const PHYSICAL_FEE = 0.5;

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
