/**
 * Shared SEO helpers.
 * NEXT_PUBLIC_SITE_URL must be set in your environment (e.g. https://woklab.es).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://woklab.es';

export const SITE_NAME = 'Wok Lab';

/** Absolute URL to the default OG/social share image. */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/hero.webp`;

/** Map Next.js locale codes to BCP-47 / Open Graph locale strings. */
export const OG_LOCALE: Record<string, string> = {
  en: 'en_US',
  es: 'es_ES',
};

/**
 * Build hreflang alternates for a page that lives at the same path in every locale.
 *
 * @param path - Path without locale prefix, e.g. '/courses' or '/courses/wok-basics'
 */
export function buildAlternates(path: string) {
  return {
    languages: {
      en: `${SITE_URL}/en${path}`,
      es: `${SITE_URL}/es${path}`,
      'x-default': `${SITE_URL}/en${path}`,
    } as Record<string, string>,
  };
}
