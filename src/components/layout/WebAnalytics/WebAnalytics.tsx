'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';

import { publicUrl } from '@/lib/analytics/publicUrl';

/**
 * Vercel Web Analytics: page views counted without cookies or personal data, so it
 * runs for every visitor, before and regardless of the cookie choice.
 * Private query values (Stripe session id, newsletter token) are stripped first.
 */
function stripPrivateParams(event: BeforeSendEvent): BeforeSendEvent {
  return { ...event, url: publicUrl(event.url) };
}

export default function WebAnalytics() {
  return <Analytics beforeSend={stripPrivateParams} />;
}
