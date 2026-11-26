/**
 * The visitor's cookie choice, per category, kept in their browser. Strictly necessary
 * storage needs no consent; analytics and advertising (the Meta Pixel) do.
 * Bump CONSENT_VERSION when the categories or the cookies in them change, so everyone
 * is asked again.
 */
const STORAGE_KEY = 'woklab:cookie-consent';
const CONSENT_VERSION = 2;

/** Fired on window whenever the choice is made or changed. */
export const CONSENT_EVENT = 'woklab:consent';
/** Fired by the footer's "Cookies" link to open the preferences. */
export const CONSENT_OPEN_EVENT = 'woklab:consent-open';

export interface Consent {
  analytics: boolean;
  ads: boolean;
}

export const ALL_ACCEPTED: Consent = { analytics: true, ads: true };
export const ALL_REJECTED: Consent = { analytics: false, ads: false };

/** The stored value as-is: a string, so React can compare snapshots cheaply. */
export function readConsentRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseConsent(raw: string | null): Consent | null {
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw) as { v?: number; analytics?: unknown; ads?: unknown };
    if (saved.v !== CONSENT_VERSION) return null;
    return { analytics: saved.analytics === true, ads: saved.ads === true };
  } catch {
    return null;
  }
}

export function readConsent(): Consent | null {
  return parseConsent(readConsentRaw());
}

export function saveConsent(consent: Consent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: CONSENT_VERSION, ...consent, at: new Date().toISOString() }));
  } catch {
    // Storage blocked: the choice holds for this page view only
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
}

export function openConsentSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
