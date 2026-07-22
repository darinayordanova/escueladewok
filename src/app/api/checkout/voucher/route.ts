import { NextResponse } from 'next/server';

import { getStripe } from '@/lib/stripe/client';

interface VoucherCheckoutBody {
  voucherKey: 'classVoucher' | 'classVoucherForTwo' | 'giftCard25' | 'giftCard50';
  locale: string;
  cancelPath: string;
}

const VOUCHER_PRODUCTS = {
  classVoucher:       { name: 'Cooking Class Gift Voucher',       amount: 69,  currency: 'eur' },
  classVoucherForTwo: { name: 'Cooking Class Gift Voucher for 2', amount: 138, currency: 'eur' },
  giftCard25:         { name: 'Gift Card — 25 €',                 amount: 25,  currency: 'eur' },
  giftCard50:         { name: 'Gift Card — 50 €',                 amount: 50,  currency: 'eur' },
} as const;

export async function POST(request: Request) {
  let body: VoucherCheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { voucherKey, locale, cancelPath } = body;
  const product = VOUCHER_PRODUCTS[voucherKey];
  if (!product) return NextResponse.json({ error: 'Invalid voucher type' }, { status: 400 });

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      billing_address_collection: 'required',
      custom_fields: [
        {
          key: 'recipient_name',
          label: { type: 'custom', custom: "Recipient's name" },
          type: 'text',
        },
        {
          key: 'recipient_email',
          label: { type: 'custom', custom: "Recipient's email" },
          type: 'text',
        },
        {
          key: 'message',
          label: { type: 'custom', custom: 'Personal message (optional)' },
          type: 'text',
          optional: true,
          text: { maximum_length: 200 },
        },
      ],
      line_items: [{
        price_data: {
          currency: product.currency,
          unit_amount: product.amount * 100,
          product_data: { name: product.name },
        },
        quantity: 1,
      }],
      metadata: {
        purchase_type: 'voucher',
        voucher_key: voucherKey,
        locale,
      },
      success_url: `${origin}/${locale}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/checkout/voucher]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
