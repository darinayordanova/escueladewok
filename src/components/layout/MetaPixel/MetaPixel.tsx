'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { loadPixel, trackPixel } from '@/lib/analytics/metaPixel';
import { useConsent } from '@/lib/analytics/useConsent';

/** Clears the pixel's own cookies when consent is withdrawn. */
function clearMetaCookies() {
  const host = window.location.hostname;
  const domains = ['', host, `.${host.replace(/^www\./, '')}`];
  for (const name of ['_fbp', '_fbc']) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}

/**
 * Starts the Meta Pixel once the visitor allows advertisement cookies (LSSI art. 22.2), and
 * stops it if they withdraw. Without NEXT_PUBLIC_META_PIXEL_ID it does nothing.
 */
export default function MetaPixel() {
  const consent = useConsent();
  // The pixel is advertising: it runs only with the "Advertisement cookies" category on
  const granted = consent !== 'unknown' && consent?.ads === true;
  const pathname = usePathname();

  const wasGranted = useRef(false);
  useEffect(() => {
    if (consent === 'unknown') return;
    if (granted) {
      if (window.fbq) window.fbq('consent', 'grant');
      else loadPixel();
    } else if (wasGranted.current) {
      window.fbq?.('consent', 'revoke');
      clearMetaCookies();
    }
    wasGranted.current = granted;
  }, [consent, granted]);

  // Client-side navigations don't reload the page: count each as a page view.
  // The first is counted by loadPixel itself.
  const lastPath = useRef<string | null>(null);
  useEffect(() => {
    if (!granted) return;
    if (lastPath.current !== null && lastPath.current !== pathname) trackPixel('PageView');
    lastPath.current = pathname;
  }, [pathname, granted]);

  return null;
}
