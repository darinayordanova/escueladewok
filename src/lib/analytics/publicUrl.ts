/** Query parameters worth keeping: where a visit came from. */
const KEEP = /^(utm_|gclid$|gbraid$|wbraid$|fbclid$)/;

/**
 * The URL without private values: some carry a Stripe session id (the success page) or
 * a confirmation token (a newsletter link), so only the campaign tags are kept.
 */
export function publicUrl(href: string): string {
  const url = new URL(href);
  for (const key of [...url.searchParams.keys()]) {
    if (!KEEP.test(key)) url.searchParams.delete(key);
  }
  url.hash = '';
  return url.toString();
}
