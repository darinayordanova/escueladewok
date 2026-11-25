import { NextResponse } from 'next/server';

import { getStripe } from '@/lib/stripe/client';
import {
  PHYSICAL_FEE,
  VOUCHER_CURRENCY,
  VOUCHER_MESSAGE_MAX,
  VOUCHER_NAME_MAX,
  formatVoucherDate,
  isEmail,
  madridToday,
  voucherAmount,
  voucherSendMaxDate,
  type VoucherFormat,
  type VoucherKey,
} from '@/lib/vouchers';
import { isVoucherTheme, type VoucherTheme } from '@/lib/voucherThemes';

interface VoucherCheckoutBody {
  voucherKey: VoucherKey;
  format: VoucherFormat;
  theme: VoucherTheme;
  /** Names and message printed on the voucher. */
  to: string;
  from: string;
  message?: string;
  /** Digital only: where and when to email the voucher (YYYY-MM-DD; empty = straight away). */
  recipientEmail?: string;
  sendDate?: string;
  /** Digital only: the buyer passes the voucher on themselves, so no recipient email. */
  sendMyself?: boolean;
  locale: string;
  cancelPath: string;
}

const PRODUCT_NAMES: Record<VoucherKey, string> = {
  giftCard25: 'Gift Voucher — 25 €',
  giftCard50: 'Gift Voucher — 50 €',
  classVoucher: 'Cooking Class Gift Voucher',
  classVoucherForTwo: 'Cooking Class Gift Voucher for 2',
};

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** Shown above Stripe's Pay button: which email is the buyer's, and where the voucher goes. */
function checkoutNote({ format, to, recipientEmail, sendDate, locale }: {
  format: VoucherFormat;
  to: string;
  recipientEmail: string;
  sendDate: string;
  locale: 'en' | 'es';
}) {
  // Noon UTC is the same calendar day in Madrid
  const on = sendDate ? formatVoucherDate(new Date(`${sendDate}T12:00:00Z`), locale) : '';
  if (locale === 'es') {
    const receipt = 'Te enviaremos el recibo y una copia del vale a tu email.';
    if (format === 'physical') return `${receipt} La tarjeta impresa para ${to} se enviará a la dirección de envío.`;
    if (!recipientEmail) return `Te enviaremos el recibo y el vale en PDF a tu email, listo para dárselo a ${to}.`;
    return `${receipt} Enviaremos el vale por email a ${to} ${on ? `el ${on}` : 'en cuanto completes el pago'}.`;
  }
  const receipt = 'Your receipt and a copy of the voucher will be sent to your email.';
  if (format === 'physical') return `${receipt} The printed card for ${to} will be posted to the shipping address.`;
  if (!recipientEmail) return `Your receipt and the voucher PDF will be sent to your email, ready to give to ${to}.`;
  return `${receipt} We'll email the voucher to ${to} ${on ? `on ${on}` : 'as soon as you pay'}.`;
}

export async function POST(request: Request) {
  let body: VoucherCheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const amount = voucherAmount(body.voucherKey);
  if (!amount) return NextResponse.json({ error: 'Invalid voucher type' }, { status: 400 });

  const format: VoucherFormat = body.format === 'physical' ? 'physical' : 'digital';
  const theme: VoucherTheme = isVoucherTheme(body.theme) ? body.theme : 'classic';
  const to = clean(body.to, VOUCHER_NAME_MAX);
  const from = clean(body.from, VOUCHER_NAME_MAX);
  const message = clean(body.message, VOUCHER_MESSAGE_MAX);
  if (!to || !from) return NextResponse.json({ error: 'Recipient and sender names are required' }, { status: 400 });

  const weSend = format === 'digital' && body.sendMyself !== true;
  const recipientEmail = weSend ? clean(body.recipientEmail, 254) : '';
  const sendDate = weSend ? clean(body.sendDate, 10) : '';
  if (weSend && !isEmail(recipientEmail)) {
    return NextResponse.json({ error: 'A valid recipient email is required' }, { status: 400 });
  }
  if (sendDate && (!/^\d{4}-\d{2}-\d{2}$/.test(sendDate) || sendDate < madridToday() || sendDate > voucherSendMaxDate())) {
    return NextResponse.json({ error: 'Send date must be within the next 30 days' }, { status: 400 });
  }

  const locale = body.locale === 'es' ? 'es' : 'en';
  const cancelPath = typeof body.cancelPath === 'string' && body.cancelPath.startsWith('/') ? body.cancelPath : `/${locale}/vouchers`;
  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      billing_address_collection: 'required',
      // A printed card is posted, so ask where to and a phone for the courier; a digital one is emailed to the address from the form
      ...(format === 'physical'
        ? { shipping_address_collection: { allowed_countries: ['ES'] }, phone_number_collection: { enabled: true } }
        : {}),
      line_items: [
        {
          price_data: {
            currency: VOUCHER_CURRENCY,
            unit_amount: amount * 100,
            product_data: { name: PRODUCT_NAMES[body.voucherKey] },
          },
          quantity: 1,
        },
        ...(format === 'physical'
          ? [{
              price_data: {
                currency: VOUCHER_CURRENCY,
                unit_amount: PHYSICAL_FEE * 100,
                product_data: { name: 'Printed card & postage' },
              },
              quantity: 1,
            }]
          : []),
      ],
      custom_text: { submit: { message: checkoutNote({ format, to, recipientEmail, sendDate, locale }) } },
      metadata: {
        purchase_type: 'voucher',
        voucher_key: body.voucherKey,
        voucher_format: format,
        voucher_theme: theme,
        recipient_name: to,
        sender_name: from,
        message,
        recipient_email: recipientEmail,
        send_date: sendDate,
        locale,
      },
      success_url: `${origin}/${locale}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/checkout/voucher]', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
