import { NextResponse } from 'next/server';

import { generateVoucherPdf } from '@/lib/pdf/voucherPdf';
import { postPrintedVoucherToSlack } from '@/lib/slack/printedVoucher';
import { formatVoucherTypeName } from '@/lib/vouchers';
import { isVoucherTheme } from '@/lib/voucherThemes';

// Dev-only route — blocked in production
// Posts a sample printed-voucher order to the Slack channel: http://localhost:3000/api/dev/slack-voucher
// Options: ?theme=classic|christmas|birthday|celebration|valentines
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }
  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_PRINTED_VOUCHERS_CHANNEL_ID) {
    return NextResponse.json({ error: 'Set SLACK_BOT_TOKEN and SLACK_PRINTED_VOUCHERS_CHANNEL_ID' }, { status: 500 });
  }

  const themeParam = new URL(request.url).searchParams.get('theme');
  const theme = isVoucherTheme(themeParam) ? themeParam : 'classic';
  const voucherTypeName = formatVoucherTypeName('classVoucher', 'en');
  const sample = { code: 'TEST-1234', recipientName: 'Ana García', senderName: 'Jane Smith', message: 'Hope you enjoy the class!' };

  const pdfBuffer = await generateVoucherPdf({
    code: sample.code,
    voucherTypeName,
    amount: 89,
    currency: 'eur',
    buyerName: sample.senderName,
    recipientName: sample.recipientName,
    recipientMessage: sample.message,
    validUntil: '30 April 2027',
    locale: 'en',
    theme,
  });

  try {
    await postPrintedVoucherToSlack({
      ...sample,
      voucherTypeName: `[TEST] ${voucherTypeName}`,
      amount: 89,
      theme,
      buyerName: sample.senderName,
      buyerEmail: 'jane@example.com',
      shippingLines: ['Ana García', 'Calle de Ejemplo', '28013 Madrid', 'ES'],
      shippingPhone: '+34 600 000 000',
      pdfBuffer,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
