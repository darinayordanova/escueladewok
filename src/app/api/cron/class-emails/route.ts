import { NextResponse } from 'next/server';

import { schedulePostClassEmails } from '@/lib/bookings/postClassEmails';
import { cancelStalePreClassEmails, schedulePreClassEmails } from '@/lib/bookings/preClassEmails';

// Run daily by Vercel Cron (vercel.json), before 10:00 Madrid time. Vercel sends "Authorization: Bearer $CRON_SECRET".
// - Pre-class emails: 24 hours before each class
// - Post-class emails: thank you, recipes and review link at 10:00 the morning after
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not set' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Catch anything the Sanity webhook missed first, so a cancelled booking isn't rescheduled
  const { cancelled } = await cancelStalePreClassEmails();
  const pre = await schedulePreClassEmails();
  const post = await schedulePostClassEmails();
  if (pre.failed || post.failed) console.error(`[cron/class-emails] failed: ${pre.failed} pre-class, ${post.failed} post-class`);
  return NextResponse.json({ preClass: { cancelled, ...pre }, postClass: post });
}
