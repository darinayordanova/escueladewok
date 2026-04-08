import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import CourseAbout from '@/components/sections/CourseAbout/CourseAbout';
import TeamGrid from '@/components/sections/TeamGrid/TeamGrid';
import { sanityClient } from '@/lib/sanity/client';
import { aboutPageQuery } from '@/lib/sanity/queries';
import { buildAlternates, DEFAULT_OG_IMAGE, OG_LOCALE, SITE_URL } from '@/lib/seo';
import type { AboutPage, Locale } from '@/types';

import styles from './page.module.scss';

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await sanityClient.fetch<AboutPage>(aboutPageQuery);
  const l = locale as Locale;
  const title = page?.title?.[l];
  const description = page?.subtitle?.[l];

  return {
    title,
    description,
    alternates: buildAlternates('/about'),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/about`,
      locale: OG_LOCALE[locale] ?? 'en_US',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function AboutPageRoute({ params }: AboutPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  const l = locale as Locale;

  const page = await sanityClient.fetch<AboutPage>(aboutPageQuery);

  return (
    <div className={styles.page}>
      <div className="container">
        {/* ── Page header ── */}
        <header className={styles.header}>
          {page?.title?.[l] && <h1 className='h3'>{page.title[l]}</h1>}
          {page?.subtitle?.[l] && <p className={styles.subtitle}>{page.subtitle[l]}</p>}
        </header>

        {/* ── Page builder content ── */}
        {page?.content && page.content.length > 0 && (
          <section className={styles.content}>
            <CourseAbout sections={page.content} locale={l} />
          </section>
        )}

        {/* ── Team ── */}
        {page?.team && page.team.length > 0 && (
          <section className={styles.team}>
            <h2 className={styles.teamTitle}>
              {page.teamTitle?.[l] ?? t('team')}
            </h2>
            <TeamGrid members={page.team} locale={l} />
          </section>
        )}
      </div>
    </div>
  );
}
