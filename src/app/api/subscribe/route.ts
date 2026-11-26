import { NextResponse } from 'next/server';

import { routing } from '@/i18n/routing';
import { requestSubscription } from '@/lib/subscribers';
import type { Locale } from '@/types';

const SOURCES = new Set(['footer', 'popup', 'checkout']);

export async function POST(request: Request) {
  let body: { email?: unknown; consent?: unknown; locale?: unknown; source?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Honeypot: a hidden field people never see. Bots fill it; pretend it worked.
  if (typeof body.website === 'string' && body.website.length > 0) {
    return NextResponse.json({ success: true });
  }

  // RGPD: no subscription without the box ticked.
  if (body.consent !== true) {
    return NextResponse.json({ error: 'Consent is required' }, { status: 400 });
  }

  if (typeof body.email !== 'string') {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const locale: Locale = routing.locales.includes(body.locale as Locale) ? (body.locale as Locale) : routing.defaultLocale;
  const source = typeof body.source === 'string' && SOURCES.has(body.source) ? body.source : 'footer';

  try {
    const result = await requestSubscription({ email: body.email, locale, source });
    if (result === 'invalid') {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    // "throttled" looks the same as "sent", so the form never reveals who is already on the list.
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/subscribe]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
