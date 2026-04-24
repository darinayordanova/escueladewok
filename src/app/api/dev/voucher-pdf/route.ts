import { NextResponse } from 'next/server';

import { generateVoucherPdf, formatVoucherTypeName } from '@/lib/pdf/voucherPdf';

// Dev-only route — blocked in production
// Preview: http://localhost:3000/api/dev/voucher-pdf
// Options: ?type=classVoucher|giftCard25|giftCard50 &recipient=Name &message=Text
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const voucherKey = (searchParams.get('type') ?? 'classVoucher') as Parameters<typeof formatVoucherTypeName>[0];

  const pdf = await generateVoucherPdf({
    code: 'DEMO-1234',
    voucherTypeName: formatVoucherTypeName(voucherKey),
    amount: 69,
    currency: 'eur',
    buyerName: 'Jane Smith',
    recipientName: searchParams.get('recipient') ?? 'Ana García',
    recipientMessage: searchParams.get('message') ?? 'Hope you enjoy the class! 🍜',
    validUntil: '30 April 2027',
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="voucher-preview.pdf"',
    },
  });
}
