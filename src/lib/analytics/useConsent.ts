'use client';

import { useMemo, useSyncExternalStore } from 'react';

import { CONSENT_EVENT, parseConsent, readConsentRaw, type Consent } from './consent';

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener('storage', onChange); // another tab decided
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

const SERVER = '\u0000server';

/**
 * The visitor's cookie choice: per category, null (not asked yet), or 'unknown' while
 * rendering on the server, where the browser's storage can't be read.
 */
export function useConsent(): Consent | null | 'unknown' {
  const raw = useSyncExternalStore(subscribe, readConsentRaw, () => SERVER);
  return useMemo(() => (raw === SERVER ? 'unknown' : parseConsent(raw)), [raw]);
}
