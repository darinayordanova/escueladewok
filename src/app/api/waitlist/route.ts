import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@escueladewok.com';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? process.env.EMAIL_FROM ?? 'hello@escueladewok.com';

export async function POST(request: Request) {
  let body: {
    email?: string;
    courseTitle?: string;
    courseSlug?: string;
    date?: string;
    startTime?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, courseTitle, courseSlug, date, startTime } = body;

  if (!email?.trim() || !courseSlug?.trim()) {
    return NextResponse.json({ error: 'Email and course are required' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_EMAIL,
      subject: `Waitlist request — ${courseTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family:sans-serif;color:#1a1a1a;padding:24px;">
            <h2 style="color:#860A15;">New waitlist request</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;font-weight:600;width:120px;">Course</td><td style="padding:8px 0;">${courseTitle}</td></tr>
              <tr><td style="padding:8px 0;font-weight:600;">Date</td><td style="padding:8px 0;">${date}</td></tr>
              <tr><td style="padding:8px 0;font-weight:600;">Time</td><td style="padding:8px 0;">${startTime}</td></tr>
              <tr><td style="padding:8px 0;font-weight:600;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
            </table>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/waitlist]', msg);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
