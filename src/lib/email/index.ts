import { Resend } from 'resend';

import { formatPrice } from '@/lib/format';
import type { ConfirmationEmailData, Locale } from '@/types';

import {
  button,
  codeBox,
  detailsTable,
  DIRECTIONS_URL,
  emailLayout,
  escapeHtml,
  eyebrow,
  heading,
  note,
  paragraph,
  quote,
  signOff,
  siteLink,
  steps,
  STUDIO_LINE,
  subheading,
} from './layout';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@woklab.es';
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'info@woklab.es';
// Customer emails come from a no-reply address, so replies go to the studio
const REPLY_TO = OWNER_EMAIL;

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';
const money = (amount: number, currency: string, locale: Locale) => formatPrice(amount, currency.toUpperCase(), locale === 'es' ? 'es-ES' : 'en-GB');

/** "2026-12-04" → "Friday, 4 December 2026" / "viernes, 4 de diciembre de 2026" */
function longDate(iso: string, locale: Locale) {
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

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
  /** Printed cards are posted; digital ones go to the recipient's email when there is one. */
  format?: 'digital' | 'physical';
  /** Scheduled send time for the recipient's email (ISO), and the same date for display. */
  sendAt?: string;
  sendOn?: string;
  /** The buyer's note to the recipient. */
  recipientMessage?: string;
}

const VOUCHER_BUYER_TEXT: Record<Locale, {
  subject: (recipient: string) => string;
  preheader: string;
  eyebrow: string;
  heading: (name: string) => string;
  intro: (recipient: string, recipientEmail: string, format: 'digital' | 'physical', sendOn?: string) => string;
  details: string;
  voucher: string;
  forLabel: string;
  code: string;
  validUntil: string;
  paid: string;
  attached: string;
  signOff: string;
}> = {
  en: {
    subject: (recipient) => `Your Wok Lab gift voucher for ${recipient}`,
    preheader: 'Your gift voucher is confirmed. Here are the details.',
    eyebrow: 'Gift voucher',
    heading: (name) => (name ? `Thank you, ${name}!` : 'Thank you!'),
    intro: (recipient, recipientEmail, format, sendOn) =>
      format === 'physical'
        ? `Your gift for <strong>${recipient}</strong> is confirmed. We'll print the card and post it to the address you gave us, and email you the tracking number as soon as it's on its way.`
        : recipientEmail && sendOn
          ? `Your gift for <strong>${recipient}</strong> is confirmed. We'll email it to ${recipientEmail} on <strong>${sendOn}</strong> at 9:00 (Madrid time).`
          : recipientEmail
            ? `Your gift for <strong>${recipient}</strong> is confirmed, and we've just emailed it to ${recipientEmail}.`
            : `Your gift for <strong>${recipient}</strong> is confirmed. The voucher is attached as a PDF, ready to print or forward.`,
    details: 'Your voucher',
    voucher: 'Voucher',
    forLabel: 'For',
    code: 'Code',
    validUntil: 'Valid until',
    paid: 'Value',
    attached: 'A copy of the voucher is attached as a PDF.',
    signOff: 'Thank you for sharing a class with us,<br />The Wok Lab team',
  },
  es: {
    subject: (recipient) => `Tu vale regalo de Wok Lab para ${recipient}`,
    preheader: 'Tu vale regalo está confirmado. Aquí tienes los detalles.',
    eyebrow: 'Vale regalo',
    heading: (name) => (name ? `¡Gracias, ${name}!` : '¡Gracias!'),
    intro: (recipient, recipientEmail, format, sendOn) =>
      format === 'physical'
        ? `Tu regalo para <strong>${recipient}</strong> está confirmado. Imprimiremos la tarjeta, la enviaremos a la dirección que nos indicaste y te mandaremos el número de seguimiento en cuanto salga.`
        : recipientEmail && sendOn
          ? `Tu regalo para <strong>${recipient}</strong> está confirmado. Se lo enviaremos a ${recipientEmail} el <strong>${sendOn}</strong> a las 9:00 (hora de Madrid).`
          : recipientEmail
            ? `Tu regalo para <strong>${recipient}</strong> está confirmado y ya se lo hemos enviado a ${recipientEmail}.`
            : `Tu regalo para <strong>${recipient}</strong> está confirmado. Tienes el vale adjunto en PDF, listo para imprimir o reenviar.`,
    details: 'Tu vale',
    voucher: 'Vale',
    forLabel: 'Para',
    code: 'Código',
    validUntil: 'Válido hasta',
    paid: 'Valor',
    attached: 'Adjuntamos una copia del vale en PDF.',
    signOff: 'Gracias por regalar una clase con nosotros,<br />El equipo de Wok Lab',
  },
};

export function buildVoucherBuyerEmail(data: Omit<VoucherEmailData, 'pdfBuffer'>) {
  const { voucherTypeName, code, amount, currency, validUntil, locale } = data;
  const t = VOUCHER_BUYER_TEXT[locale] ?? VOUCHER_BUYER_TEXT.en;
  const recipient = escapeHtml(data.recipientName);

  const body = [
    eyebrow(t.eyebrow),
    heading(t.heading(escapeHtml(firstName(data.buyerName)))),
    paragraph(t.intro(recipient, escapeHtml(data.recipientEmail), data.format ?? 'digital', data.sendOn)),
    detailsTable(
      [
        [t.voucher, voucherTypeName],
        [t.forLabel, recipient],
        [t.code, `<span style="font-family:'Courier New',Courier,monospace;letter-spacing:2px;">${code}</span>`],
        [t.validUntil, validUntil],
        [t.paid, money(amount, currency, locale)],
      ],
      t.details,
    ),
    note(t.attached),
    signOff(t.signOff),
  ].join('');

  return { subject: t.subject(data.recipientName), html: emailLayout({ locale, preheader: t.preheader, body }) };
}

export async function sendVoucherBuyerEmail(data: VoucherEmailData) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.buyerEmail,
    replyTo: REPLY_TO,
    attachments: [{ filename: 'woklab-voucher.pdf', content: data.pdfBuffer }],
    ...buildVoucherBuyerEmail(data),
  });

  if (error) throw new Error(`Failed to send voucher buyer email: ${error.message}`);
}

const VOUCHER_RECIPIENT_TEXT: Record<Locale, {
  subject: (sender: string) => string;
  preheader: string;
  eyebrow: string;
  heading: (sender: string) => string;
  intro: (recipient: string, voucherTypeName: string) => string;
  codeLabel: string;
  validUntil: (date: string) => string;
  howTo: string;
  steps: string[];
  cta: string;
  attached: string;
  signOff: string;
}> = {
  en: {
    subject: (sender) => `${sender} has given you a cooking class at Wok Lab`,
    preheader: 'Your gift voucher code is inside.',
    eyebrow: 'A gift for you',
    heading: (sender) => `${sender} has given you a gift!`,
    intro: (recipient, voucherTypeName) =>
      `Hi ${recipient}, you've received a <strong>${voucherTypeName}</strong> at Wok Lab, our Asian cooking school in the heart of Madrid. From the wok to the table.`,
    codeLabel: 'Your voucher code',
    validUntil: (date) => `Valid until ${date}`,
    howTo: 'How to use it',
    steps: [
      'Choose a class and a date on woklab.es.',
      'Enter your code at checkout.',
      'Come hungry, and cook with us.',
    ],
    cta: 'Choose your class',
    attached: 'Your voucher is also attached as a PDF, to print or keep on your phone.',
    signOff: 'See you in the kitchen,<br />The Wok Lab team',
  },
  es: {
    subject: (sender) => `${sender} te ha regalado una clase de cocina en Wok Lab`,
    preheader: 'Dentro tienes el código de tu vale regalo.',
    eyebrow: 'Un regalo para ti',
    heading: (sender) => `¡${sender} te ha hecho un regalo!`,
    intro: (recipient, voucherTypeName) =>
      `Hola ${recipient}, has recibido un <strong>${voucherTypeName}</strong> en Wok Lab, nuestra escuela de cocina asiática en el centro de Madrid. Del wok a la mesa.`,
    codeLabel: 'Tu código',
    validUntil: (date) => `Válido hasta el ${date}`,
    howTo: 'Cómo usarlo',
    steps: [
      'Elige una clase y una fecha en woklab.es.',
      'Introduce tu código al pagar.',
      'Ven con hambre y cocina con nosotros.',
    ],
    cta: 'Elige tu clase',
    attached: 'También tienes el vale adjunto en PDF, para imprimirlo o guardarlo en el móvil.',
    signOff: 'Nos vemos en la cocina,<br />El equipo de Wok Lab',
  },
};

export function buildVoucherRecipientEmail(data: Omit<VoucherEmailData, 'buyerEmail' | 'pdfBuffer'>) {
  const { voucherTypeName, code, validUntil, locale } = data;
  const t = VOUCHER_RECIPIENT_TEXT[locale] ?? VOUCHER_RECIPIENT_TEXT.en;
  const sender = escapeHtml(data.buyerName);

  const body = [
    eyebrow(t.eyebrow),
    heading(t.heading(sender)),
    paragraph(t.intro(escapeHtml(firstName(data.recipientName)), voucherTypeName)),
    data.recipientMessage ? quote(escapeHtml(data.recipientMessage), sender) : '',
    codeBox(t.codeLabel, code, t.validUntil(validUntil)),
    subheading(t.howTo),
    steps(t.steps),
    button(t.cta, siteLink(locale, '/courses')),
    note(t.attached),
    signOff(t.signOff),
  ].join('');

  return { subject: t.subject(data.buyerName), html: emailLayout({ locale, preheader: t.preheader, body }) };
}

export async function sendVoucherRecipientEmail(data: Omit<VoucherEmailData, 'buyerEmail'>) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.recipientEmail,
    replyTo: REPLY_TO,
    attachments: [{ filename: 'woklab-voucher.pdf', content: data.pdfBuffer }],
    // Held by Resend until the buyer's chosen date
    ...(data.sendAt ? { scheduledAt: data.sendAt } : {}),
    ...buildVoucherRecipientEmail(data),
  });

  if (error) throw new Error(`Failed to send voucher recipient email: ${error.message}`);
}

// ─── Studio notifications ─────────────────────────────────────────────────────

export async function sendVoucherOwnerNotificationEmail(
  data: VoucherEmailData & { recipientMessage?: string; format?: 'digital' | 'physical'; theme?: string; shippingAddress?: string; shippingPhone?: string },
) {
  const { voucherTypeName, code, amount, currency, validUntil, pdfBuffer, locale, format, theme, shippingAddress, shippingPhone } = data;
  const buyerName = escapeHtml(data.buyerName);
  const buyerEmail = escapeHtml(data.buyerEmail);
  const recipientName = escapeHtml(data.recipientName);
  const recipientEmail = data.recipientEmail ? escapeHtml(data.recipientEmail) : '—';
  const recipientMessage = data.recipientMessage ? escapeHtml(data.recipientMessage) : '';
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
                  ${data.sendOn ? `<tr><td>Emailed to recipient on</td><td>${data.sendOn}</td></tr>` : ''}
                  <tr><td>Design</td><td>${theme ?? 'classic'}</td></tr>
                  <tr><td>Format</td><td>${format === 'physical' ? '<strong>Printed card — post it</strong>' : 'Digital (PDF)'}</td></tr>
                  ${shippingAddress ? `<tr><td>Post to</td><td>${escapeHtml(shippingAddress)}</td></tr>` : ''}
                  ${shippingPhone ? `<tr><td>Phone</td><td>${escapeHtml(shippingPhone)}</td></tr>` : ''}
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

// ─── Booking confirmation ─────────────────────────────────────────────────────

const BOOKING_TEXT: Record<Locale, {
  subject: (course: string, date: string, count: number) => string;
  preheader: string;
  eyebrow: string;
  heading: (name: string) => string;
  intro: string;
  date: string;
  time: string;
  guests: string;
  where: string;
  directions: string;
  paid: string;
  dietary: string;
  signOff: string;
}> = {
  en: {
    subject: (course, date, count) => (count > 1 ? `You're booked: ${count} cooking classes at Wok Lab` : `You're booked: ${course}, ${date}`),
    preheader: 'Everything you need for your class at Wok Lab.',
    eyebrow: 'Booking confirmed',
    heading: (name) => (name ? `See you in the kitchen, ${name}!` : 'See you in the kitchen!'),
    intro: "Thanks for booking with Wok Lab. Here's everything you need for your class.",
    date: 'Date',
    time: 'Time',
    guests: 'Guests',
    where: 'Where',
    directions: 'Get directions',
    paid: 'Total paid',
    dietary: "Allergies or dietary needs you didn't mention at checkout? Just reply to this email before the class.",
    signOff: 'See you soon,<br />The Wok Lab team',
  },
  es: {
    subject: (course, date, count) => (count > 1 ? `Reserva confirmada: ${count} clases de cocina en Wok Lab` : `Reserva confirmada: ${course}, ${date}`),
    preheader: 'Todo lo que necesitas para tu clase en Wok Lab.',
    eyebrow: 'Reserva confirmada',
    heading: (name) => (name ? `¡Nos vemos en la cocina, ${name}!` : '¡Nos vemos en la cocina!'),
    intro: 'Gracias por reservar con Wok Lab. Aquí tienes todo lo que necesitas para tu clase.',
    date: 'Fecha',
    time: 'Hora',
    guests: 'Personas',
    where: 'Dónde',
    directions: 'Cómo llegar',
    paid: 'Total pagado',
    dietary: '¿Alguna alergia o necesidad alimentaria que no indicaste al pagar? Responde a este email antes de la clase.',
    signOff: 'Hasta pronto,<br />El equipo de Wok Lab',
  },
};

export function buildConfirmationEmail(data: Omit<ConfirmationEmailData, 'to'>) {
  const locale: Locale = data.locale === 'es' ? 'es' : 'en';
  const t = BOOKING_TEXT[locale];
  const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

  const body = [
    eyebrow(t.eyebrow),
    heading(t.heading(escapeHtml(firstName(data.recipientName)))),
    paragraph(t.intro),
    ...data.items.map((item) =>
      detailsTable(
        [
          [t.date, capitalise(longDate(item.courseDate, locale))],
          [t.time, item.timeRange],
          [t.guests, String(item.quantity)],
        ],
        escapeHtml(item.courseName),
      ),
    ),
    subheading(t.where),
    paragraph(`<strong>Wok Lab</strong><br />${STUDIO_LINE}`),
    button(t.directions, DIRECTIONS_URL),
    detailsTable([[t.paid, money(data.amount, data.currency, locale)]]),
    note(t.dietary),
    signOff(t.signOff),
  ].join('');

  const first = data.items[0];
  return {
    subject: t.subject(first?.courseName ?? '', first ? longDate(first.courseDate, locale) : '', data.items.length),
    html: emailLayout({ locale, preheader: t.preheader, body }),
  };
}

export async function sendConfirmationEmail(data: ConfirmationEmailData) {
  const { data: result, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.to,
    replyTo: REPLY_TO,
    ...buildConfirmationEmail(data),
  });

  if (error) throw new Error(`Failed to send confirmation email: ${error.message}`);
  return result;
}
