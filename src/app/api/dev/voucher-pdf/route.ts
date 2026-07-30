import { NextResponse } from 'next/server';

import { generateVoucherPdf, formatVoucherTypeName } from '@/lib/pdf/voucherPdf';
import type { Locale } from '@/types';

// Dev-only route — blocked in production
// Preview: http://localhost:3000/api/dev/voucher-pdf
// Options: ?type=classVoucher|giftCard25|giftCard50 &recipient=Name &message=Text &locale=en|es
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const voucherKey = (searchParams.get('type') ?? 'classVoucher') as Parameters<typeof formatVoucherTypeName>[0];
  const locale: Locale = searchParams.get('locale') === 'es' ? 'es' : 'en';

  const pdf = await generateVoucherPdf({
    code: 'DEMO-1234',
    voucherTypeName: formatVoucherTypeName(voucherKey, locale),
    amount: 69,
    currency: 'eur',
    buyerName: 'Jane Smith',
    recipientName: searchParams.get('recipient') ?? (locale === 'es' ? 'Ana García' : 'Ana García'),
    recipientMessage: searchParams.get('message') ?? (locale === 'es' ? '¡Espero que disfrutes la clase!' : 'Hope you enjoy the class!'),
    validUntil: locale === 'es' ? '30 de abril de 2027' : '30 April 2027',
    locale,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="voucher-preview.pdf"',
    },
  });
}
