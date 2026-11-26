import { NextResponse } from 'next/server';

import { confirmSubscription } from '@/lib/subscribers';

/**
 * Called by the "Confirm subscription" button on /[locale]/subscribe/confirm.
 * A POST, not the email link itself: mail scanners open links in emails
 * automatically, and that must not count as someone's consent.
 */
export async function POST(request: Request) {
  let token: unknown;
  try {
    ({ token } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof token !== 'string' || !token) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  }

  try {
    const result = await confirmSubscription(token);
    if (!result) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/subscribe/confirm]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to confirm' }, { status: 500 });
  }
}
