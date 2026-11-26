import { createHmac, timingSafeEqual } from 'node:crypto';

// Signed, expiring links for the double opt-in email. No database lookup is needed
// to trust the email inside: only the server knows the secret.

const SECRET = process.env.SUBSCRIBE_TOKEN_SECRET;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // a week to click the link

interface TokenPayload {
  email: string;
  exp: number;
}

const sign = (data: string) => {
  if (!SECRET) throw new Error('SUBSCRIBE_TOKEN_SECRET is not set');
  return createHmac('sha256', SECRET).update(data).digest('base64url');
};

export function createConfirmToken(email: string) {
  const data = Buffer.from(JSON.stringify({ email, exp: Date.now() + TTL_MS } satisfies TokenPayload)).toString('base64url');
  return `${data}.${sign(data)}`;
}

/** The email the token was issued for, or null if it was tampered with or has expired. */
export function verifyConfirmToken(token: string): string | null {
  const [data, signature] = token.split('.');
  if (!data || !signature) return null;

  const expected = Buffer.from(sign(data));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const { email, exp } = JSON.parse(Buffer.from(data, 'base64url').toString()) as TokenPayload;
    if (typeof email !== 'string' || typeof exp !== 'number' || Date.now() > exp) return null;
    return email;
  } catch {
    return null;
  }
}
