import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@escueladewok.com';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? process.env.EMAIL_FROM ?? 'hello@escueladewok.com';

export async function POST(request: Request) {
  let body: {
    courseName?: string;
    company?: string;
    name?: string;
    email?: string;
    phone?: string;
    participants?: string;
    message?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { courseName, company, name, email, phone, participants, message } = body;

  if (!name?.trim() || !email?.trim() || !company?.trim()) {
    return NextResponse.json({ error: 'Name, email and company are required' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const rows: [string, string][] = [
    ['Course', courseName ?? ''],
    ['Company', company ?? ''],
    ['Contact name', name ?? ''],
    ['Email', `<a href="mailto:${email}">${email}</a>`],
    ...(phone ? [['Phone', phone] as [string, string]] : []),
    ...(participants ? [['Participants', participants] as [string, string]] : []),
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;font-weight:600;width:140px;vertical-align:top">${label}</td><td style="padding:8px 0">${value}</td></tr>`,
    )
    .join('');

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `Corporate enquiry: ${courseName} — ${company}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family:sans-serif;color:#1a1a1a;padding:24px;">
            <h2 style="color:#c0392b;">Corporate event enquiry</h2>
            <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
            ${
              message?.trim()
                ? `<hr style="margin:16px 0;border:none;border-top:1px solid #e0e0e0"/>
                   <p style="white-space:pre-wrap;line-height:1.6">${message}</p>`
                : ''
            }
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/corporate-enquiry]', msg);
    return NextResponse.json({ error: 'Failed to send enquiry' }, { status: 500 });
  }
}
