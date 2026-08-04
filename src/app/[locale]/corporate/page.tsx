import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import FilteredCourseGrid from '@/components/sections/FilteredCourseGrid/FilteredCourseGrid';
import { sanityClient } from '@/lib/sanity/client';
import { corporateCoursesQuery } from '@/lib/sanity/queries';
import { buildPageMetadata } from '@/lib/seo';
import type { Course, Locale } from '@/types';

import styles from './page.module.scss';

interface CorporatePageProps {
  params: Promise<{ locale: string }>;
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

export default async function CorporatePage({ params }: CorporatePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'corporate' });

  const courses = await sanityClient.fetch<Course[]>(corporateCoursesQuery);

  return (
    <div className={styles.page}>
      <div className="container mb-16">
        <header className="container--narrow text-center mb-12">
          <h1 className="h3">{t('pageTitle')}</h1>
          <p className="text-lg color-text-light">{t('pageDescription')}</p>
        </header>
        {courses && courses.length > 0 ? (
          <FilteredCourseGrid mode="courses" courses={courses} locale={locale as Locale} showPrice={false} />
        ) : (
          <p className="text-lg color-text-muted py-16 text-center">{t('noCourses')}</p>
        )}
      </div>
    </div>
  );
}
