import { escapeSlack, postSlackFile } from '@/lib/slack';

export interface PrintedVoucherOrder {
  code: string;
  voucherTypeName: string;
  amount: number;
  theme: string;
  recipientName: string;
  senderName: string;
  message?: string;
  buyerName: string;
  buyerEmail: string;
  /** Postal address, one line per entry (name first). */
  shippingLines: string[];
  shippingPhone?: string;
  pdfBuffer: Buffer;
}

/**
 * Posts a paid printed-card order to the team's Slack channel: the print-ready PDF and where to post it.
 * Skipped (with a warning) until SLACK_BOT_TOKEN and SLACK_PRINTED_VOUCHERS_CHANNEL_ID are set.
 */
export async function postPrintedVoucherToSlack(order: PrintedVoucherOrder) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channelId = process.env.SLACK_PRINTED_VOUCHERS_CHANNEL_ID;
  if (!token || !channelId) {
    console.warn('[voucher] Slack not configured — printed voucher not posted');
    return;
  }

  const e = escapeSlack;
  const message = [
    `:envelope_with_arrow: *New printed voucher to post* — ${e(order.voucherTypeName)} (${order.amount} €)`,
    '',
    '*Post to*',
    ...order.shippingLines.map((line) => `> ${e(line)}`),
    ...(order.shippingPhone ? [`> ${e(order.shippingPhone)}`] : []),
    '',
    `*For* ${e(order.recipientName)}  ·  *From* ${e(order.senderName)}`,
    ...(order.message ? [`*Message* _“${e(order.message)}”_`] : []),
    `*Code* \`${e(order.code)}\`  ·  *Design* ${e(order.theme)}`,
    `*Bought by* ${e(order.buyerName)} (${e(order.buyerEmail)})`,
  ].join('\n');

  await postSlackFile({
    token,
    channelId,
    filename: `woklab-voucher-${order.code}.pdf`,
    title: `Voucher ${order.code} — for ${order.recipientName}`,
    content: order.pdfBuffer,
    message,
  });
}
