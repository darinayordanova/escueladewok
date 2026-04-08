import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import FilteredCourseGrid from '@/components/sections/FilteredCourseGrid/FilteredCourseGrid';
import { expandOccurrences } from '@/lib/courses/timeslots';
import { sanityClient } from '@/lib/sanity/client';
import { allCoursesQuery } from '@/lib/sanity/queries';
import { buildAlternates, DEFAULT_OG_IMAGE, OG_LOCALE, SITE_URL } from '@/lib/seo';
import type { Course, Locale } from '@/types';

import styles from './page.module.scss';

interface CoursesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CoursesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });
  const title = t('pageTitle');
  const description = t('pageDescription');

  return {
    title,
    description,
    alternates: buildAlternates('/courses'),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/courses`,
      locale: OG_LOCALE[locale] ?? 'en_US',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });

  const courses = await sanityClient.fetch<Course[]>(allCoursesQuery);
  const occurrences = expandOccurrences(courses ?? []);

  return (
    <div className={styles.page}>
      <div className="container mb-16">
        <header className={styles.header}>
          <h1 className={styles.title}>{t('pageTitle')}</h1>
          <p className={styles.description}>{t('pageDescription')}</p>
        </header>

        {occurrences.length > 0 ? (
          <FilteredCourseGrid mode="occurrences" occurrences={occurrences} locale={locale as Locale} />
        ) : (
          <p className={styles.empty}>{t('noCourses')}</p>
        )}
      </div>
    </div>
  );
}
