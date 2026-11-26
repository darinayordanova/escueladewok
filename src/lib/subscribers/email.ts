/**
 * One spelling per address, everywhere: signups, Sanity subscribers and the
 * attendee emails on course sessions are all compared through this.
 */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isValidEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
