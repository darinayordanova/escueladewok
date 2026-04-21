import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import FilteredCourseGrid from '@/components/sections/FilteredCourseGrid/FilteredCourseGrid';
import { expandOccurrences } from '@/lib/courses/timeslots';
import { sanityClient } from '@/lib/sanity/client';
import { allBookingCountsQuery, allCoursesQuery } from '@/lib/sanity/queries';
import { buildAlternates, DEFAULT_OG_IMAGE, OG_LOCALE, SITE_URL } from '@/lib/seo';
import type { BookingCountMap, Course, Locale } from '@/types';

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

  const [courses, rawCounts] = await Promise.all([
    sanityClient.fetch<Course[]>(allCoursesQuery),
    sanityClient.fetch<{ courseSlug: string; date: string; startTime: string; confirmedCount: number }[]>(allBookingCountsQuery),
  ]);

  const bookingCounts: BookingCountMap = {};
  for (const row of rawCounts ?? []) {
    bookingCounts[`${row.courseSlug}|${row.date}|${row.startTime}`] = row.confirmedCount;
  }

  const occurrences = expandOccurrences(courses ?? []);

  return (
    <div className={styles.page}>
      <div className="container mb-16 flex flex-wrap-wrap flex-justify-center">
        <header className="text-center mb-12 col-12 col-md-8">
          <h1 className="h3">{t('pageTitle')}</h1>
          <p className="text-lg color-text-light">{t('pageDescription')}</p>
        </header>

        <div className="col-12">
        {occurrences.length > 0 ? (
          <FilteredCourseGrid mode="occurrences" occurrences={occurrences} locale={locale as Locale} bookingCounts={bookingCounts} />
        ) : (
          <p className="text-lg color-text-muted text-center py-16">{t('noCourses')}</p>
        )}
        </div>
      </div>
    </div>
  );
}
