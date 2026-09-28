import { Resend } from 'resend';

import type { ConfirmationEmailData } from '@/types';
import type { Locale } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@woklab.es';
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'info@woklab.es';

// ─── Voucher emails ───────────────────────────────────────────────────────────

export interface VoucherEmailData {
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  recipientEmail: string;
  voucherTypeName: string;
  code: string;
  amount: number;
  currency: string;
  validUntil: string;
  pdfBuffer: Buffer;
  locale: Locale;
}

const VOUCHER_BUYER_EMAIL_TEXT: Record<Locale, {
  subject: (voucherTypeName: string) => string;
  tagline: string;
  greeting: (buyerName: string) => string;
  intro: (recipientName: string, recipientEmail: string) => string;
  voucher: string;
  code: string;
  amount: string;
  validUntil: string;
  recipient: string;
  questions: string;
}> = {
  en: {
    subject: (voucherTypeName) => `Your gift voucher — ${voucherTypeName}`,
    tagline: 'Chinese Cooking Classes · Madrid',
    greeting: (buyerName) => `Hi ${buyerName},`,
    intro: (recipientName, recipientEmail) =>
      `Your gift voucher purchase is confirmed! We've sent it to <strong>${recipientName}</strong> (${recipientEmail}). A PDF copy is attached for your records.`,
    voucher: 'Voucher',
    code: 'Code',
    amount: 'Amount',
    validUntil: 'Valid until',
    recipient: 'Recipient',
    questions: 'If you have any questions, reply to this email.',
  },
  es: {
    subject: (voucherTypeName) => `Tu vale regalo — ${voucherTypeName}`,
    tagline: 'Clases de Cocina China · Madrid',
    greeting: (buyerName) => `Hola ${buyerName},`,
    intro: (recipientName, recipientEmail) =>
      `¡Tu compra del vale regalo está confirmada! Lo hemos enviado a <strong>${recipientName}</strong> (${recipientEmail}). Adjuntamos una copia en PDF para tus archivos.`,
    voucher: 'Vale',
    code: 'Código',
    amount: 'Importe',
    validUntil: 'Válido hasta',
    recipient: 'Destinatario',
    questions: 'Si tienes alguna pregunta, responde a este correo.',
  },
};

export async function sendVoucherBuyerEmail(data: VoucherEmailData) {
  const { buyerName, buyerEmail, recipientName, recipientEmail, voucherTypeName, code, amount, currency, validUntil, pdfBuffer, locale } = data;
  const currencySymbol = currency.toUpperCase() === 'EUR' ? '€' : currency.toUpperCase();
  const t = VOUCHER_BUYER_EMAIL_TEXT[locale] ?? VOUCHER_BUYER_EMAIL_TEXT.en;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: buyerEmail,
    subject: t.subject(voucherTypeName),
    attachments: [{ filename: 'woklab-voucher.pdf', content: pdfBuffer }],
    html: `
      <!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8" />
      <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;margin:0;padding:0;background:#f9f5f0}
        .wrapper{max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
        .header{background:#860A15;padding:32px;text-align:center}
        .header h1{color:#fff;margin:0;font-size:22px;letter-spacing:2px}
        .header p{color:#f5c6ca;margin:6px 0 0;font-size:12px;letter-spacing:1px}
        .body{padding:32px}
        .body p{margin:0 0 16px;line-height:1.6}
        .detail-box{background:#f9f5f0;border-radius:8px;padding:20px 24px;margin:20px 0;border-left:4px solid #860A15}
        .detail-box table{width:100%;border-collapse:collapse}
        .detail-box td{padding:6px 0;vertical-align:top;font-size:14px}
        .detail-box td:first-child{font-weight:600;width:40%;color:#7a5c5c}
        .footer{padding:20px 32px;text-align:center;color:#999;font-size:13px;border-top:1px solid #e0e0e0}
      </style></head>
      <body><div class="wrapper">
        <div class="header"><h1>WOK LAB</h1><p>${t.tagline}</p></div>
        <div class="body">
          <p>${t.greeting(buyerName)}</p>
          <p>${t.intro(recipientName, recipientEmail)}</p>
          <div class="detail-box"><table>
            <tr><td>${t.voucher}</td><td>${voucherTypeName}</td></tr>
            <tr><td>${t.code}</td><td><strong>${code}</strong></td></tr>
            <tr><td>${t.amount}</td><td>${amount} ${currencySymbol}</td></tr>
            <tr><td>${t.validUntil}</td><td>${validUntil}</td></tr>
            <tr><td>${t.recipient}</td><td>${recipientName}</td></tr>
          </table></div>
          <p>${t.questions}</p>
        </div>
        <div class="footer"><p>Wok Lab &mdash; ${t.tagline}</p></div>
      </div></body></html>`,
  });

  if (error) throw new Error(`Failed to send voucher buyer email: ${error.message}`);
}

const VOUCHER_RECIPIENT_EMAIL_TEXT: Record<Locale, {
  subject: (buyerName: string) => string;
  tagline: string;
  greeting: (recipientName: string) => string;
  intro: (buyerName: string) => string;
  yourCode: string;
  validUntil: string;
  voucher: string;
  value: string;
  redeem: string;
  seeYou: string;
}> = {
  en: {
    subject: (buyerName) => `You've received a gift from ${buyerName}!`,
    tagline: 'Chinese Cooking Classes · Madrid',
    greeting: (recipientName) => `Hi ${recipientName},`,
    intro: (buyerName) => `<strong>${buyerName}</strong> has sent you a cooking experience as a gift!`,
    yourCode: 'Your voucher code',
    validUntil: 'Valid until',
    voucher: 'Voucher',
    value: 'Value',
    redeem: 'Enter the code at checkout on <a href="https://woklab.es">woklab.es</a> to redeem your voucher. The PDF attached can be printed or kept digitally.',
    seeYou: 'See you in the kitchen!',
  },
  es: {
    subject: (buyerName) => `¡Has recibido un regalo de ${buyerName}!`,
    tagline: 'Clases de Cocina China · Madrid',
    greeting: (recipientName) => `Hola ${recipientName},`,
    intro: (buyerName) => `¡<strong>${buyerName}</strong> te ha regalado una experiencia culinaria!`,
    yourCode: 'Tu código de vale',
    validUntil: 'Válido hasta',
    voucher: 'Vale',
    value: 'Valor',
    redeem: 'Introduce el código al finalizar tu compra en <a href="https://woklab.es">woklab.es</a> para canjear tu vale. El PDF adjunto se puede imprimir o guardar digitalmente.',
    seeYou: '¡Nos vemos en la cocina!',
  },
};

export async function sendVoucherRecipientEmail(data: Omit<VoucherEmailData, 'buyerEmail' | 'sendDate'>) {
  const { buyerName, recipientName, recipientEmail, voucherTypeName, code, amount, currency, validUntil, pdfBuffer, locale } = data;
  const currencySymbol = currency.toUpperCase() === 'EUR' ? '€' : currency.toUpperCase();
  const t = VOUCHER_RECIPIENT_EMAIL_TEXT[locale] ?? VOUCHER_RECIPIENT_EMAIL_TEXT.en;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: recipientEmail,
    subject: t.subject(buyerName),
    attachments: [{ filename: 'woklab-voucher.pdf', content: pdfBuffer }],
    html: `
      <!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8" />
      <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;margin:0;padding:0;background:#f9f5f0}
        .wrapper{max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
        .header{background:#860A15;padding:32px;text-align:center}
        .header h1{color:#fff;margin:0;font-size:22px;letter-spacing:2px}
        .header p{color:#f5c6ca;margin:6px 0 0;font-size:12px;letter-spacing:1px}
        .body{padding:32px}
        .body p{margin:0 0 16px;line-height:1.6}
        .code-box{background:#f5e6e8;border-radius:8px;padding:24px;margin:20px 0;text-align:center;border-left:4px solid #860A15}
        .code-label{font-size:11px;color:#7a5c5c;letter-spacing:2px;font-weight:600;text-transform:uppercase;margin-bottom:8px}
        .code{font-size:28px;font-weight:700;color:#860A15;letter-spacing:4px}
        .valid{font-size:12px;color:#7a5c5c;margin-top:8px}
        .detail-box{background:#f9f5f0;border-radius:8px;padding:20px 24px;margin:20px 0}
        .detail-box table{width:100%;border-collapse:collapse}
        .detail-box td{padding:6px 0;vertical-align:top;font-size:14px}
        .detail-box td:first-child{font-weight:600;width:40%;color:#7a5c5c}
        .footer{padding:20px 32px;text-align:center;color:#999;font-size:13px;border-top:1px solid #e0e0e0}
      </style></head>
      <body><div class="wrapper">
        <div class="header"><h1>WOK LAB</h1><p>${t.tagline}</p></div>
        <div class="body">
          <p>${t.greeting(recipientName)}</p>
          <p>${t.intro(buyerName)}</p>
          <div class="code-box">
            <p class="code-label">${t.yourCode}</p>
            <p class="code">${code}</p>
            <p class="valid">${t.validUntil} ${validUntil}</p>
          </div>
          <div class="detail-box"><table>
            <tr><td>${t.voucher}</td><td>${voucherTypeName}</td></tr>
            <tr><td>${t.value}</td><td>${amount} ${currencySymbol}</td></tr>
          </table></div>
          <p>${t.redeem}</p>
          <p>${t.seeYou}</p>
        </div>
        <div class="footer"><p>Wok Lab &mdash; ${t.tagline} &mdash; info@woklab.es</p></div>
      </div></body></html>`,
  });

  if (error) throw new Error(`Failed to send voucher recipient email: ${error.message}`);
}

export async function sendVoucherOwnerNotificationEmail(data: VoucherEmailData & { recipientMessage?: string }) {
  const { buyerName, buyerEmail, recipientName, recipientEmail, voucherTypeName, code, amount, currency, validUntil, pdfBuffer, locale, recipientMessage } = data;
  const currencySymbol = currency.toUpperCase() === 'EUR' ? '€' : currency.toUpperCase();

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: OWNER_EMAIL,
    subject: `New voucher purchase: ${voucherTypeName} — ${buyerName}`,
    attachments: [{ filename: 'woklab-voucher.pdf', content: pdfBuffer }],
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head><meta charset="UTF-8" /><style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; margin: 0; padding: 0; background: #f9f5f0; }
          .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: #c0392b; padding: 32px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; }
          .body { padding: 32px; }
          .body p { margin: 0 0 16px; line-height: 1.6; }
          .details { background: #f9f5f0; border-radius: 8px; padding: 24px; margin: 16px 0; }
          .details table { width: 100%; border-collapse: collapse; }
          .details td { padding: 8px 0; vertical-align: top; }
          .details td:first-child { font-weight: 600; width: 40%; }
          .note { font-size: 13px; color: #7a5c5c; }
        </style></head>
        <body>
          <div class="wrapper">
            <div class="header"><h1>New Voucher Purchase</h1></div>
            <div class="body">
              <p class="note">A PDF copy of this voucher is attached — resend it if the customer loses theirs.</p>
              <div class="details">
                <table>
                  <tr><td>Voucher type</td><td>${voucherTypeName}</td></tr>
                  <tr><td>Code</td><td><strong>${code}</strong></td></tr>
                  <tr><td>Amount</td><td>${amount} ${currencySymbol}</td></tr>
                  <tr><td>Valid until</td><td>${validUntil}</td></tr>
                  <tr><td>Buyer name</td><td>${buyerName}</td></tr>
                  <tr><td>Buyer email</td><td>${buyerEmail}</td></tr>
                  <tr><td>Recipient name</td><td>${recipientName}</td></tr>
                  <tr><td>Recipient email</td><td>${recipientEmail}</td></tr>
                  ${recipientMessage ? `<tr><td>Personal message</td><td>${recipientMessage}</td></tr>` : ''}
                  <tr><td>Language</td><td>${locale === 'es' ? 'Spanish' : 'English'}</td></tr>
                </table>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) throw new Error(`Failed to send voucher owner notification email: ${error.message}`);
}

export interface OwnerBookingItem {
  courseName: string;
  courseDate: string;
  timeRange: string;
  quantity: number;
}

export interface OwnerBookingNotificationData {
  items: OwnerBookingItem[];
  totalGuests: number;
  totalAmount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  dietaryRestrictions?: string;
  billingAddress?: string;
  voucherUsed: boolean;
  voucherCode?: string;
  discountAmount?: number;
  locale: Locale;
}

export async function sendOwnerNotificationEmail(data: OwnerBookingNotificationData) {
  const {
    items,
    totalGuests,
    totalAmount,
    currency,
    customerName,
    customerEmail,
    customerPhone,
    dietaryRestrictions,
    billingAddress,
    voucherUsed,
    voucherCode,
    discountAmount,
    locale,
  } = data;

  const guestLabel = totalGuests === 1 ? 'guest' : 'guests';
  const voucherLabel = voucherUsed
    ? `Yes${voucherCode ? ` — ${voucherCode}` : ''}${discountAmount ? ` (-${discountAmount} ${currency})` : ''}`
    : 'No';

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: OWNER_EMAIL,
    subject: `New booking: ${items.map((i) => i.courseName).join(', ')} — ${customerName} (${totalGuests} ${guestLabel})`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head><meta charset="UTF-8" /><style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; margin: 0; padding: 0; background: #f9f5f0; }
          .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: #c0392b; padding: 32px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; }
          .body { padding: 32px; }
          .details { background: #f9f5f0; border-radius: 8px; padding: 24px; margin: 16px 0; }
          .details table { width: 100%; border-collapse: collapse; }
          .details td { padding: 8px 0; vertical-align: top; }
          .details td:first-child { font-weight: 600; width: 40%; }
          .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          .items-table th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #7a5c5c; padding: 6px 8px; border-bottom: 2px solid #e0d5d0; }
          .items-table td { padding: 8px; border-bottom: 1px solid #eee; font-size: 14px; }
        </style></head>
        <body>
          <div class="wrapper">
            <div class="header"><h1>New Booking</h1></div>
            <div class="body">
              <table class="items-table">
                <tr><th>Course</th><th>Date</th><th>Time</th><th>Guests</th></tr>
                ${items
                  .map(
                    (item) =>
                      `<tr><td>${item.courseName}</td><td>${item.courseDate}</td><td>${item.timeRange}</td><td>${item.quantity}</td></tr>`,
                  )
                  .join('')}
              </table>
              <div class="details">
                <table>
                  <tr><td>Total guests</td><td>${totalGuests}</td></tr>
                  <tr><td>Total paid</td><td>${totalAmount} ${currency}</td></tr>
                  <tr><td>Paid with voucher</td><td>${voucherLabel}</td></tr>
                  <tr><td>Name</td><td>${customerName}</td></tr>
                  <tr><td>Email</td><td>${customerEmail}</td></tr>
                  <tr><td>Phone</td><td>${customerPhone || '—'}</td></tr>
                  ${billingAddress ? `<tr><td>Billing address</td><td>${billingAddress}</td></tr>` : ''}
                  ${dietaryRestrictions ? `<tr><td>Dietary</td><td>${dietaryRestrictions}</td></tr>` : ''}
                  <tr><td>Language</td><td>${locale === 'es' ? 'Spanish' : 'English'}</td></tr>
                </table>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    throw new Error(`Failed to send owner notification email: ${error.message}`);
  }
}

export async function sendConfirmationEmail(data: ConfirmationEmailData) {
  const { to, recipientName, courseName, courseDate, timeRange, amount, currency } = data;

  const { data: result, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Booking confirmed: ${courseName}`,
    html: buildConfirmationHtml({ recipientName, courseName, courseDate, timeRange, amount, currency }),
  });

  if (error) {
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }

  return result;
}

function buildConfirmationHtml({
  recipientName,
  courseName,
  courseDate,
  timeRange,
  amount,
  currency,
}: Omit<ConfirmationEmailData, 'to'>) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Booking Confirmed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; margin: 0; padding: 0; background: #f9f5f0; }
          .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: #c0392b; padding: 32px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; }
          .body { padding: 32px; }
          .body p { margin: 0 0 16px; line-height: 1.6; }
          .details { background: #f9f5f0; border-radius: 8px; padding: 24px; margin: 24px 0; }
          .details table { width: 100%; border-collapse: collapse; }
          .details td { padding: 8px 0; vertical-align: top; }
          .details td:first-child { font-weight: 600; width: 40%; }
          .footer { padding: 24px 32px; text-align: center; color: #999; font-size: 14px; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>Wok Lab</h1>
          </div>
          <div class="body">
            <p>Hi ${recipientName},</p>
            <p>Your booking has been confirmed! We look forward to cooking with you.</p>
            <div class="details">
              <table>
                <tr><td>Course</td><td>${courseName}</td></tr>
                <tr><td>Date</td><td>${courseDate}</td></tr>
                <tr><td>Time</td><td>${timeRange}</td></tr>
                <tr><td>Amount paid</td><td>${amount} ${currency}</td></tr>
              </table>
            </div>
            <p>If you have any questions, please reply to this email.</p>
            <p>See you in the kitchen!</p>
          </div>
          <div class="footer">
            <p>Wok Lab &mdash; Chinese Cooking Classes</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
