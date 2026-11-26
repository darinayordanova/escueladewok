import { randomInt } from 'node:crypto';

import { sanityWriteClient } from '@/lib/sanity/writeClient';
import { getStripe } from '@/lib/stripe/client';

// The newsletter sign-up incentive: 10% off the first class booking.
// One shared Stripe coupon; each new subscriber gets their own single-use code for it.
// Codes only work at course checkout: gift-voucher checkout doesn't accept promotion codes.

const COUPON_ID = 'newsletter-welcome-10';
export const WELCOME_PERCENT_OFF = 10;
const VALID_DAYS = 60;

// No 0/O or 1/I, so a code read off a phone can't be mistyped
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode = () => `WOK10-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')}`;

async function ensureCoupon() {
  const stripe = getStripe();
  try {
    await stripe.coupons.retrieve(COUPON_ID);
  } catch (err) {
    if ((err as { code?: string }).code !== 'resource_missing') throw err;
    await stripe.coupons.create({
      id: COUPON_ID,
      name: `Newsletter welcome ${WELCOME_PERCENT_OFF}%`,
      percent_off: WELCOME_PERCENT_OFF,
      duration: 'once',
      metadata: { purpose: 'newsletter-welcome' },
    });
  }
}

/** Anyone who has already booked a class or bought a voucher: the code is for a first purchase. */
export async function isExistingCustomer(email: string) {
  return sanityWriteClient.fetch<boolean>(
    `count(*[_type == "courseSession" && count(attendees[status == "confirmed" && lower(customerEmail) == $email]) > 0]) > 0
      || count(*[_type == "giftVoucher" && lower(buyerEmail) == $email]) > 0`,
    { email },
  );
}

/** Creates a single-use promotion code. `ref` goes into Stripe metadata instead of the email. */
export async function createWelcomeCode(ref: string): Promise<{ code: string; expiresAt: string }> {
  await ensureCoupon();
  const expires = new Date(Date.now() + VALID_DAYS * 24 * 60 * 60 * 1000);

  // A clash with an existing code is very unlikely; try a couple of times anyway
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const promo = await getStripe().promotionCodes.create({
        promotion: { type: 'coupon', coupon: COUPON_ID },
        code: randomCode(),
        max_redemptions: 1,
        expires_at: Math.floor(expires.getTime() / 1000),
        metadata: { purpose: 'newsletter-welcome', subscriber: ref },
      });
      return { code: promo.code, expiresAt: expires.toISOString() };
    } catch (err) {
      if (attempt === 2 || (err as { code?: string }).code !== 'resource_already_exists') throw err;
    }
  }
  throw new Error('unreachable');
}
