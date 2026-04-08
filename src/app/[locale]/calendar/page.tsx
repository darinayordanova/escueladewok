import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import CalendarView from '@/components/sections/CalendarView/CalendarView';
import { expandOccurrences } from '@/lib/courses/timeslots';
import { sanityClient } from '@/lib/sanity/client';
import { allCoursesQuery } from '@/lib/sanity/queries';
import { buildAlternates, DEFAULT_OG_IMAGE, OG_LOCALE, SITE_URL } from '@/lib/seo';
import type { Course, Locale } from '@/types';

import styles from './page.module.scss';

interface CalendarPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CalendarPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'calendar' });
  const title = t('pageTitle');
  const description = t('pageDescription');

  return {
    title,
    description,
    alternates: buildAlternates('/calendar'),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/calendar`,
      locale: OG_LOCALE[locale] ?? 'en_US',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
  };
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
