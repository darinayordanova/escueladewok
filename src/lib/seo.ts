import type { Metadata } from 'next';

/**
 * Shared SEO helpers.
 * NEXT_PUBLIC_SITE_URL must be set in your environment (e.g. https://www.woklab.es).
 * This is also used as `metadataBase` (see src/app/layout.tsx) — every other
 * URL-based metadata field (canonical, og:url, hreflang) should be built as a
 * path relative to it rather than concatenating SITE_URL again, so the host
 * can never drift out of sync.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.woklab.es';

export const SITE_NAME = 'Wok Lab';

/** Absolute URL to the default OG/social share image. */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/hero.webp`;

/** Map Next.js locale codes to BCP-47 / Open Graph locale strings. */
export const OG_LOCALE: Record<string, string> = {
  en: 'en_US',
  es: 'es_ES',
};

/**
 * Build the canonical + hreflang alternates for a page that lives at the same
 * path in every locale. URLs are returned relative to `metadataBase` so Next.js
 * resolves them against SITE_URL — never build these by hand with SITE_URL.
 *
 * @param locale - Current locale, e.g. 'en' or 'es'
 * @param path - Path without locale prefix, e.g. '/courses' or '/courses/wok-basics'
 */
export function buildAlternates(locale: string, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      en: `/en${path}`,
      es: `/es${path}`,
      'x-default': `/en${path}`,
    } as Record<string, string>,
  };
}

/** Build a relative OG/canonical-style path for a locale, e.g. '/en/courses'. */
export function localePath(locale: string, path: string) {
  return `/${locale}${path}`;
}

/** The studio's physical address — shared across LocalBusiness, Course and Event JSON-LD. */
export const STUDIO_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: 'C. del Conde Duque, 10',
  addressLocality: 'Madrid',
  postalCode: '28015',
  addressCountry: 'ES',
} as const;

export const STUDIO_GEO = {
  '@type': 'GeoCoordinates',
  latitude: 40.4241,
  longitude: -3.7137,
} as const;

/** Social profile URLs for the LocalBusiness `sameAs` property. */
export const SOCIAL_LINKS = [
  'https://www.instagram.com/woklab.es',
  'https://www.facebook.com/profile.php?id=61573209041792',
];

interface PageMetadataOptions {
  /** Current locale, e.g. 'en' or 'es'. */
  locale: string;
  /** Path without locale prefix, e.g. '/courses' or '/courses/wok-basics'. Use '' for the homepage. */
  path: string;
  title?: string;
  description?: string;
  /** Absolute image URL. Defaults to the site's generic OG image. */
  image?: string;
  /** Alt text for the OG image. Defaults to `title`. */
  imageAlt?: string;
  type?: 'website' | 'article';
}

/**
 * Build the full page Metadata (title, canonical/hreflang alternates, OG, Twitter)
 * shared by every route. Covers the common case; pages with extra needs (JSON-LD,
 * per-instance overrides) can still spread/extend the result.
 *
 * `title` always gets " | Wok Lab" appended — for both the <title> tag and
 * og:title/twitter:title, so they stay identical — and bypasses the root layout's
 * title template (via `title.absolute`) so the brand is never appended twice.
 * Pass a bare page title (no brand name baked in) as `title`.
 */
export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  imageAlt = title,
  type = 'website',
}: PageMetadataOptions): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: buildAlternates(locale, path),
    openGraph: {
      title: fullTitle,
      description,
      url: localePath(locale, path),
      locale: OG_LOCALE[locale] ?? 'en_US',
      type,
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt ?? SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [image],
    },
  };
}
