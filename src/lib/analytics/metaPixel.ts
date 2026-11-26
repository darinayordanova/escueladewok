/**
 * Meta Pixel for Instagram/Facebook ads. Nothing is loaded or sent until the visitor
 * accepts advertising cookies (MetaPixel.tsx calls loadPixel then), so components can
 * call trackPixel freely.
 */
import { readConsent } from './consent';

type FbqArgs = unknown[];
interface Fbq {
  (...args: FbqArgs): void;
  callMethod?: (...args: FbqArgs) => void;
  queue: FbqArgs[];
  push: Fbq;
  loaded: boolean;
  version: string;
}

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';

type StandardEvent = 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'Lead';

export interface PixelParams {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: 'product';
  num_items?: number;
}

/** Events fired (with consent) before the pixel started, e.g. a course page's ViewContent. */
let pending: FbqArgs[] = [];

/** Meta's base code, as a function: defines fbq, loads fbevents.js, counts the page view. */
export function loadPixel() {
  if (!META_PIXEL_ID || window.fbq) return;

  const fbq = function (...args: FbqArgs) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');
  for (const args of pending) fbq(...args);
  pending = [];
}

/**
 * `eventId` lets Meta drop duplicates of the same event (one purchase seen twice);
 * pass something stable, like the Stripe session id.
 */
export function trackPixel(event: StandardEvent, params: PixelParams = {}, eventId?: string) {
  if (typeof window === 'undefined' || !META_PIXEL_ID) return;
  const args: FbqArgs = eventId ? ['track', event, params, { eventID: eventId }] : ['track', event, params];
  if (window.fbq) window.fbq(...args);
  else if (readConsent()?.ads) pending.push(args);
}
