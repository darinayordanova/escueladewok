import { after, NextResponse } from 'next/server';
import { Resend } from 'resend';

import en from '@/i18n/messages/en.json';
import { checkAvailability } from '@/lib/corporate/availability';
import { draftEnquiryReply } from '@/lib/corporate/draftReply';
import { escapeHtml } from '@/lib/email/layout';
import { postCorporateEnquiryToSlack } from '@/lib/slack/corporateEnquiry';

// Room for Claude's draft and the Slack post, which run after the visitor gets their answer
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@woklab.es';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? process.env.EMAIL_FROM ?? 'info@woklab.es';

/** What the corporate page's form sends; the course page's older form sends courseName and participants. */
interface EnquiryBody {
  format?: string;
  groupSize?: number | string;
  date?: string;
  altDate?: string;
  timeOfDay?: string;
  flexibleDates?: boolean;
  menu?: string;
  dietary?: string;
  language?: string;
  budget?: string;
  extras?: unknown;
  /** Older form: Cook for Others as its own flag */
  impact?: boolean;
  /** Older course-page form only */
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  message?: string;
  marketing?: boolean;
  locale?: string;
  courseName?: string;
  participants?: string;
  /** Honeypot: people never see it, bots fill it in */
  website?: string;
}

// The email to the team is in English: it uses the page's English words for each choice
const form = en.corporatePage.enquiry.form;
const MENUS: Record<string, string> = {
  foldFryFeast: en.corporatePage.menus.foldFryFeast.name,
  spicePullSlurp: en.corporatePage.menus.spicePullSlurp.name,
  help: 'Wants help choosing',
};

const clean = (value: unknown, max = 500) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const isoDate = (value: unknown) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '');
/** One choice, as its English label; unknown keys are dropped */
const label = (labels: Record<string, string>, key: unknown) => (typeof key === 'string' && Object.hasOwn(labels, key) ? labels[key] : '');
/** Several choices, as English labels joined with commas */
const labels = (all: Record<string, string>, keys: unknown) =>
  Array.isArray(keys) ? [...new Set(keys)].map((key) => label(all, key)).filter(Boolean).join(', ') : '';

export async function POST(request: Request) {
  let body: EnquiryBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (body.website) return NextResponse.json({ success: true });

  const name = clean(body.name, 120);
  const company = clean(body.company, 160);
  const email = clean(body.email, 254);
  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const groupSize = clean(String(body.groupSize ?? ''), 4) || clean(body.participants, 4);
  const extras = labels(form.extraOptions, body.extras) || (body.impact ? form.extraOptions.impact : '');
  const rows: [string, string][] = [
    ['Format', label(form.formats, body.format)],
    ['Course', clean(body.courseName, 160)],
    ['Group size', groupSize],
    ['Preferred date', isoDate(body.date)],
    ['Alternative date', isoDate(body.altDate)],
    ['Time of day', label(form.times, body.timeOfDay)],
    ['Flexible dates', body.flexibleDates ? 'Yes' : ''],
    ['Menu', label(MENUS, body.menu)],
    ['Allergies, diets, notes', clean(body.dietary)],
    ['Class language', label(form.languages, body.language)],
    ['Budget per person', clean(body.budget, 60)],
    ['Extras', extras],
    ['Company', company],
    ['Name', name],
    ['Email', email],
    ['Phone', clean(body.phone, 40)],
    ['Heard about us', label(form.sources, body.source)],
    ['Newsletter', body.marketing ? 'Asked to subscribe (sent a confirmation email)' : ''],
    ['Page language', body.locale === 'es' ? 'Spanish' : body.locale === 'en' ? 'English' : ''],
  ];

  const filled = rows.filter(([, value]) => value);
  const message = clean(body.message, 3000);
  const subject = `Corporate enquiry: ${company || name}${groupSize ? ` (${groupSize} people)` : ''}`;

  // After the response: Claude drafts a reply and the team gets both in Slack. A failure here never
  // reaches the visitor; the email below is the team's copy either way.
  after(async () => {
    let draft = null;
    try {
      const calendar = await checkAvailability([isoDate(body.date), isoDate(body.altDate)]);
      draft = await draftEnquiryReply({ rows: filled, message, language: body.locale === 'es' ? 'es' : 'en', calendar });
    } catch (err) {
      console.error('[/api/corporate-enquiry] draft failed', err);
    }
    try {
      await postCorporateEnquiryToSlack({ title: subject, rows: filled, message, email, draft });
    } catch (err) {
      console.error('[/api/corporate-enquiry] Slack post failed', err);
    }
  });

  const rowsHtml = filled
    .map(([label, value]) => {
      const cell = label === 'Email' ? `<a href="mailto:${escapeHtml(value)}">${escapeHtml(value)}</a>` : escapeHtml(value);
      return `<tr><td style="padding:8px 0;font-weight:600;width:170px;vertical-align:top">${label}</td><td style="padding:8px 0">${cell}</td></tr>`;
    })
    .join('');

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: CONTACT_EMAIL,
    replyTo: email,
    subject,
    html: `<!DOCTYPE html>
<html>
  <body style="font-family:sans-serif;color:#1a1a1a;padding:24px;">
    <h2 style="color:#860A15;">Corporate event enquiry</h2>
    <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
    ${message ? `<hr style="margin:16px 0;border:none;border-top:1px solid #e0e0e0"/><p style="white-space:pre-wrap;line-height:1.6">${escapeHtml(message)}</p>` : ''}
    <p style="color:#7A5C5C;font-size:13px">Reply to this email to answer ${escapeHtml(name)} directly.</p>
  </body>
</html>`,
  });

  if (error) {
    console.error('[/api/corporate-enquiry]', error.message);
    return NextResponse.json({ error: 'Failed to send enquiry' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
