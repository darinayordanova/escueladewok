import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@escueladewok.com';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? process.env.EMAIL_FROM ?? 'hello@escueladewok.com';

export async function POST(request: Request) {
  let body: { name?: string; email?: string; message?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, email, message } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `New message from ${name} — Escuela de Wok`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; color: #1a1a1a; padding: 24px;">
            <h2 style="color: #c0392b;">New contact message</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; width: 100px;">Name</td>
                <td style="padding: 8px 0;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Email</td>
                <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
              </tr>
            </table>
            <hr style="margin: 16px 0; border: none; border-top: 1px solid #e0e0e0;" />
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/contact]', msg);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
