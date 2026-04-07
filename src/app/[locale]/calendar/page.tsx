import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import CalendarView from '@/components/sections/CalendarView/CalendarView';
import { expandOccurrences } from '@/lib/courses/timeslots';
import { sanityClient } from '@/lib/sanity/client';
import { allCoursesQuery } from '@/lib/sanity/queries';
import type { Course, Locale } from '@/types';

import styles from './page.module.scss';

interface CalendarPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CalendarPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'calendar' });
  return { title: t('pageTitle'), description: t('pageDescription') };
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'calendar' });

  const courses = await sanityClient.fetch<Course[]>(allCoursesQuery);
  const occurrences = expandOccurrences(courses ?? []);

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.title}>{t('pageTitle')}</h1>
          <p className={styles.description}>{t('pageDescription')}</p>
        </header>

        <CalendarView occurrences={occurrences} locale={locale as Locale} />
      </div>
    </div>
  );
}
