import type { MetadataRoute } from 'next';

import { sanityClient } from '@/lib/sanity/client';
import { courseSlugParams } from '@/lib/sanity/queries';
import { SITE_URL } from '@/lib/seo';

const LOCALES = ['en', 'es'] as const;

/** Static pages (path without locale prefix). */
const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '',            priority: 1.0, changeFrequency: 'weekly'  },
  { path: '/courses',    priority: 0.9, changeFrequency: 'daily'   },
  { path: '/calendar',   priority: 0.8, changeFrequency: 'daily'   },
  { path: '/corporate',  priority: 0.8, changeFrequency: 'weekly'  },
  { path: '/about',      priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact',    priority: 0.6, changeFrequency: 'monthly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await sanityClient.fetch<{ slug: string }[]>(courseSlugParams);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.flatMap(({ path, priority, changeFrequency }) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      priority,
      changeFrequency,
      lastModified: new Date(),
    })),
  );

  const courseEntries: MetadataRoute.Sitemap = (slugs ?? []).flatMap(({ slug }) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}/courses/${slug}`,
      priority: 0.9,
      changeFrequency: 'weekly' as const,
      lastModified: new Date(),
    })),
  );

  return [...staticEntries, ...courseEntries];
}
