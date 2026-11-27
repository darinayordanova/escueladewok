'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { loadGtm, trackGtmPageView, updateGtmConsent } from '@/lib/analytics/gtm';
import { useConsent } from '@/lib/analytics/useConsent';

/** Google's own cookies, cleared when the visitor withdraws that category. */
const ANALYTICS_COOKIE = /^(_ga|_gid|_gat)/;
const ADS_COOKIE = /^_gcl_/;

function clearGoogleCookies(pattern: RegExp) {
  const host = window.location.hostname;
  const domains = ['', host, `.${host.replace(/^www\./, '')}`];
  for (const name of document.cookie.split(';').map((c) => c.split('=')[0].trim())) {
    if (!pattern.test(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}

/**
 * Loads Google Tag Manager once the visitor allows analytics or advertisement cookies
 * (LSSI art. 22.2), and keeps Consent Mode in step with later changes of mind.
 */
export default function GoogleTagManager() {
  const consent = useConsent();
  const wasLoaded = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    if (consent === 'unknown' || consent === null) return;
    const anyGranted = consent.analytics || consent.ads;

    if (!wasLoaded.current) {
      if (!anyGranted) return;
      loadGtm(consent);
      wasLoaded.current = true;
      trackGtmPageView(); // the page they were on when they accepted
      return;
    }

    updateGtmConsent(consent);
    if (!consent.analytics) clearGoogleCookies(ANALYTICS_COOKIE);
    if (!consent.ads) clearGoogleCookies(ADS_COOKIE);
  }, [consent]);

  // Client-side navigations don't reload the page: count each one. The short wait
  // lets Next.js set the new page's <title> first.
  useEffect(() => {
    if (!wasLoaded.current) return;
    const timer = window.setTimeout(trackGtmPageView, 100);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
