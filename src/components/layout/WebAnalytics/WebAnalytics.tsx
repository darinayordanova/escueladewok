'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';

/** Query parameters worth keeping: where a visit came from. */
const KEEP = /^utm_/;

/**
 * Vercel Web Analytics: page views counted without cookies or personal data, so it
 * runs for every visitor, before and regardless of the cookie choice.
 * Some URLs carry private values (a Stripe session id on the success page, a
 * confirmation token in a newsletter link), so only the utm_ campaign tags are sent.
 */
function stripPrivateParams(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  for (const key of [...url.searchParams.keys()]) {
    if (!KEEP.test(key)) url.searchParams.delete(key);
  }
  return { ...event, url: url.toString() };
}

export default function WebAnalytics() {
  return <Analytics beforeSend={stripPrivateParams} />;
}
