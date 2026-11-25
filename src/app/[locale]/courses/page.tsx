import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import CtaBanner from '@/components/sections/CtaBanner/CtaBanner';
import { parseCourseFilters } from '@/components/sections/FilteredCourseGrid/courseFilters';
import FilteredCourseGrid from '@/components/sections/FilteredCourseGrid/FilteredCourseGrid';
import PageHeader from '@/components/sections/PageHeader/PageHeader';
import { expandOccurrences, withAvailability } from '@/lib/courses/timeslots';
import { sanityClient } from '@/lib/sanity/client';
import { allBookingCountsQuery, allCoursesQuery } from '@/lib/sanity/queries';
import { buildPageMetadata } from '@/lib/seo';
import type { BookingCountMap, Course, Locale } from '@/types';

import styles from './page.module.scss';

interface CoursesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: CoursesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });

  return buildPageMetadata({
    locale,
    path: '/courses',
    title: t('pageTitle'),
    description: t('pageDescription'),
  });
}

export default async function CoursesPage({ params, searchParams }: CoursesPageProps) {
  const { locale } = await params;
  const [t, tNav, tCta] = await Promise.all([
    getTranslations({ locale, namespace: 'courses' }),
    getTranslations({ locale, namespace: 'navigation' }),
    getTranslations({ locale, namespace: 'coursesCta' }),
  ]);

  const [courses, rawCounts, rawSearchParams] = await Promise.all([
    sanityClient.fetch<Course[]>(allCoursesQuery),
    sanityClient.fetch<{ courseSlug: string; date: string; startTime: string; confirmedCount: number }[]>(allBookingCountsQuery),
    searchParams,
  ]);

  const bookingCounts: BookingCountMap = {};
  for (const row of rawCounts ?? []) {
    bookingCounts[`${row.courseSlug}|${row.date}|${row.startTime}`] = row.confirmedCount;
  }

  const occurrences = withAvailability(expandOccurrences(courses ?? []), bookingCounts);

  return (
    <>
      <PageHeader
        locale={locale}
        title={t('pageTitle')}
        description={t('pageDescription')}
        breadcrumbs={[
          { name: tNav('home'), path: '/' },
          { name: tNav('courses'), path: '/courses' },
        ]}
        breadcrumbsLabel={tNav('breadcrumb')}
      />

      <section className={`container ${styles.listing}`} aria-label={t('pageTitle')}>
        {occurrences.length > 0 ? (
          <FilteredCourseGrid
            variant="schedule"
            occurrences={occurrences}
            locale={locale as Locale}
            initialFilters={parseCourseFilters(rawSearchParams)}
          />
        ) : (
          <p className="text-lg color-text-muted text-center py-16">{t('noCourses')}</p>
        )}
      </section>

      <CtaBanner
        eyebrow={tCta('eyebrow')}
        headingLines={[tCta('headingLine1'), tCta('headingLine2')]}
        sub={tCta('sub')}
        cta={{ label: tCta('cta'), href: '/contact' }}
        layout="split"
      />
    </>
  );
}
