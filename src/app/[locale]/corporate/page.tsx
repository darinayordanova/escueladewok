import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import FilteredCourseGrid from '@/components/sections/FilteredCourseGrid/FilteredCourseGrid';
import { sanityClient } from '@/lib/sanity/client';
import { corporateCoursesQuery } from '@/lib/sanity/queries';
import type { Course, Locale } from '@/types';

import styles from './page.module.scss';

interface CorporatePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CorporatePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'corporate' });
  return { title: t('pageTitle'), description: t('pageDescription') };
}

export default async function CorporatePage({ params }: CorporatePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'corporate' });

  const courses = await sanityClient.fetch<Course[]>(corporateCoursesQuery);

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.title}>{t('pageTitle')}</h1>
          <p className={styles.description}>{t('pageDescription')}</p>
        </header>

        {courses && courses.length > 0 ? (
          <FilteredCourseGrid mode="courses" courses={courses} locale={locale as Locale} />
        ) : (
          <p className={styles.empty}>{t('noCourses')}</p>
        )}
      </div>
    </div>
  );
}
