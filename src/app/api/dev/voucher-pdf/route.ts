import { NextResponse } from 'next/server';

import { generateVoucherPdf } from '@/lib/pdf/voucherPdf';
import { formatVoucherTypeName } from '@/lib/vouchers';
import { isVoucherTheme } from '@/lib/voucherThemes';
import type { Locale } from '@/types';

// Dev-only route — blocked in production
// Preview: http://localhost:3000/api/dev/voucher-pdf
// Options: ?type=classVoucher|giftCard25|giftCard50 &recipient=Name &message=Text &locale=en|es &theme=classic|christmas|birthday|celebration|valentines
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const voucherKey = searchParams.get('type') ?? 'classVoucher';
  const locale: Locale = searchParams.get('locale') === 'es' ? 'es' : 'en';
  const themeParam = searchParams.get('theme');

  const pdf = await generateVoucherPdf({
    code: 'DEMO-1234',
    voucherTypeName: formatVoucherTypeName(voucherKey, locale),
    amount: 89,
    currency: 'eur',
    buyerName: 'Jane Smith',
    recipientName: searchParams.get('recipient') ?? (locale === 'es' ? 'Ana García' : 'Ana García'),
    recipientMessage: searchParams.get('message') ?? (locale === 'es' ? '¡Espero que disfrutes la clase!' : 'Hope you enjoy the class!'),
    validUntil: locale === 'es' ? '30 de abril de 2027' : '30 April 2027',
    locale,
    theme: isVoucherTheme(themeParam) ? themeParam : 'classic',
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="voucher-preview.pdf"',
    },
  });
}
