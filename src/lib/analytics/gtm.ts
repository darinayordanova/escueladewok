/**
 * Google Tag Manager. Nothing is loaded until the visitor allows analytics or
 * advertisement cookies (GoogleTagManager.tsx calls loadGtm then), and Google's
 * Consent Mode tells every tag in the container which of the two they allowed.
 */
import type { Consent } from './consent';
import { publicUrl } from './publicUrl';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? 'GTM-KWJBCT44';

/** The visitor's choice in Consent Mode v2 terms. */
function consentState({ analytics, ads }: Consent) {
  const ad = ads ? 'granted' : 'denied';
  return {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: ad,
    ad_user_data: ad,
    ad_personalization: ad,
  };
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  // gtag pushes its `arguments` object as is: Consent Mode reads it in that form
  window.gtag =
    window.gtag ||
    function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  return window.gtag;
}

/** Starts the container with the visitor's choice already set, so no tag fires before it. */
export function loadGtm(consent: Consent) {
  if (!GTM_ID || document.getElementById('gtm-script')) return;
  const gtag = ensureGtag();
  gtag('consent', 'default', { ...consentState({ analytics: false, ads: false }), wait_for_update: 500 });
  gtag('consent', 'update', consentState(consent));
  gtag('js', new Date());
  window.dataLayer!.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.id = 'gtm-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(script);
}

/**
 * Tells the container a page was shown. Next.js swaps pages without reloading, so
 * GoogleTagManager.tsx calls this on the first load and on every navigation; in GTM,
 * a "Custom Event: page_view" trigger fires the GA4 page view from it.
 */
export function trackGtmPageView() {
  if (!document.getElementById('gtm-script')) return;
  const location = publicUrl(window.location.href);
  if (location === lastLocation) return;
  // After a client-side navigation document.referrer still names the first page's source
  const referrer = lastLocation ?? (document.referrer ? publicUrl(document.referrer) : undefined);
  lastLocation = location;
  window.dataLayer!.push({
    event: 'page_view',
    page_location: location,
    page_path: new URL(location).pathname,
    page_title: document.title,
    page_referrer: referrer,
  });
}

let lastLocation: string | undefined;

/** Passes a changed choice to the tags already running. */
export function updateGtmConsent(consent: Consent) {
  window.gtag?.('consent', 'update', consentState(consent));
}
