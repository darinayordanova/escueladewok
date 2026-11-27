import { NextResponse } from 'next/server';

import { buildConfirmationEmail, buildPostClassEmail, buildPreClassEmail, buildVoucherBuyerEmail, buildVoucherRecipientEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/seo';
import { formatVoucherTypeName } from '@/lib/vouchers';
import type { Locale } from '@/types';

// Dev-only route — blocked in production. Shows a customer email without sending it.
// http://localhost:3000/api/dev/email?type=booking|booking2|preclass|preclass2|postclass|postclass2|buyer|recipient&locale=en|es
// In the inbox, images load from the live site; here they load from this dev server.
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const locale: Locale = searchParams.get('locale') === 'es' ? 'es' : 'en';
  const type = searchParams.get('type') ?? 'booking';

  const voucher = {
    buyerName: 'Jane Smith',
    recipientName: 'Ana García',
    recipientEmail: 'ana@example.com',
    voucherTypeName: formatVoucherTypeName('classVoucher', locale),
    code: 'WOK-AB12',
    amount: 89,
    currency: 'eur',
    validUntil: locale === 'es' ? '25 de noviembre de 2027' : '25 November 2027',
    locale,
    format: 'digital' as const,
    recipientMessage: 'Happy birthday! Save me a dumpling.',
  };
  const classes = [
    { courseName: 'The Soul of Hanoi: Traditional Vietnamese Flavors', courseDate: '2026-12-04', timeRange: '18:30 – 21:30', quantity: 2 },
    { courseName: 'Japanese Home Cooking: Gyoza & Katsu', courseDate: '2026-12-11', timeRange: '18:30 – 21:30', quantity: 1 },
  ];

  const email =
    type === 'postclass' || type === 'postclass2'
      ? buildPostClassEmail({
          recipientName: 'Jane Smith',
          courseName: classes[0].courseName,
          // postclass2: a course without a recipe book, and no upcoming classes
          recipes: type === 'postclass' ? { url: 'https://cdn.sanity.io/files/example.pdf', filename: 'WokLab_El-Alma-de-Hanoi_The-Soul-of-Hanoi.pdf' } : undefined,
          reviewUrl: 'https://g.page/r/example/review',
          nextClasses:
            type === 'postclass'
              ? [
                  { courseName: 'Soul of Seoul: Bold Korean Flavors', date: '2026-12-09', startTime: '19:30', url: '#' },
                  { courseName: 'The Art of the Steamer: Mastering Bao & Dim Sum', date: '2026-12-12', startTime: '11:00', url: '#' },
                ]
              : [],
          locale,
        })
      : type === 'preclass' || type === 'preclass2'
      ? buildPreClassEmail({
          recipientName: 'Jane Smith',
          ...classes[0],
          // preclass2: with what they wrote in the allergies box at checkout
          dietaryRestrictions: type === 'preclass2' ? 'Vegetarian, allergic to peanuts' : '',
          when: 'tomorrow',
          locale,
        })
      : type === 'buyer'
      ? buildVoucherBuyerEmail({ ...voucher, buyerEmail: 'jane@example.com' })
      : type === 'recipient'
        ? buildVoucherRecipientEmail(voucher)
        : buildConfirmationEmail({
            recipientName: 'Jane Smith',
            items: type === 'booking2' ? classes : classes.slice(0, 1),
            amount: type === 'booking2' ? 267 : 178,
            currency: 'EUR',
            locale,
          });

  const html = email.html.replaceAll(`${SITE_URL}/images/`, `${new URL(request.url).origin}/images/`);
  return new NextResponse(`<!-- Subject: ${email.subject} -->\n${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
