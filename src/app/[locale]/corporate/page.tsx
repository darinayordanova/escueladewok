import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { parseCourseFilters } from '@/components/sections/FilteredCourseGrid/courseFilters';
import FilteredCourseGrid from '@/components/sections/FilteredCourseGrid/FilteredCourseGrid';
import PageHeader from '@/components/sections/PageHeader/PageHeader';
import { sanityClient } from '@/lib/sanity/client';
import { corporateCoursesQuery } from '@/lib/sanity/queries';
import { buildPageMetadata } from '@/lib/seo';
import type { Course, Locale } from '@/types';

import styles from './page.module.scss';

interface CorporatePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: CorporatePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'corporate' });

  return buildPageMetadata({
    locale,
    path: '/corporate',
    title: t('pageTitle'),
    description: t('pageDescription'),
  });
}

export default async function CorporatePage({ params, searchParams }: CorporatePageProps) {
  const { locale } = await params;
  const [t, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'corporate' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);

  const [courses, rawSearchParams] = await Promise.all([
    sanityClient.fetch<Course[]>(corporateCoursesQuery),
    searchParams,
  ]);

  return (
    <>
      <PageHeader
        locale={locale}
        title={t('pageTitle')}
        description={t('pageDescription')}
        breadcrumbs={[
          { name: tNav('home'), path: '/' },
          { name: tNav('corporate'), path: '/corporate' },
        ]}
        breadcrumbsLabel={tNav('breadcrumb')}
      />

      <section className={`container ${styles.listing}`} aria-label={t('pageTitle')}>
        {courses && courses.length > 0 ? (
          <FilteredCourseGrid
            variant="corporate"
            courses={courses}
            locale={locale as Locale}
            initialFilters={parseCourseFilters(rawSearchParams)}
          />
        ) : (
          <p className="text-lg color-text-muted py-16 text-center">{t('noCourses')}</p>
        )}
      </section>
    </>
  );
}
