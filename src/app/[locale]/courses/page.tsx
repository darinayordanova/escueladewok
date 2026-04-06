import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import CourseGrid from '@/components/sections/CourseGrid/CourseGrid';
import { expandOccurrences } from '@/lib/courses/timeslots';
import { sanityClient } from '@/lib/sanity/client';
import { allCoursesQuery } from '@/lib/sanity/queries';
import type { Course, Locale } from '@/types';

import styles from './page.module.scss';

interface CoursesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CoursesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });
  return { title: t('pageTitle'), description: t('pageDescription') };
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });

  const courses = await sanityClient.fetch<Course[]>(allCoursesQuery);
  const occurrences = expandOccurrences(courses ?? []);

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.title}>{t('pageTitle')}</h1>
          <p className={styles.description}>{t('pageDescription')}</p>
        </header>

        {occurrences.length > 0 ? (
          <CourseGrid occurrences={occurrences} locale={locale as Locale} />
        ) : (
          <p className={styles.empty}>{t('noCourses')}</p>
        )}
      </div>
    </div>
  );
}
