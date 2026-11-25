import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import CalendarView from '@/components/sections/CalendarView/CalendarView';
import PageHeader from '@/components/sections/PageHeader/PageHeader';
import { expandOccurrences, toMadridISOString } from '@/lib/courses/timeslots';
import { sanityClient } from '@/lib/sanity/client';
import { urlFor } from '@/lib/sanity/image';
import { allBookingCountsQuery, allCoursesQuery } from '@/lib/sanity/queries';
import { buildPageMetadata, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, STUDIO_ADDRESS } from '@/lib/seo';
import type { Course, Locale } from '@/types';


interface CalendarPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CalendarPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'calendar' });

  return buildPageMetadata({
    locale,
    path: '/calendar',
    title: t('pageTitle'),
    description: t('pageDescription'),
  });
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { locale } = await params;
  const l = locale as Locale;
  const [t, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'calendar' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);

  const [courses, rawCounts] = await Promise.all([
    sanityClient.fetch<Course[]>(allCoursesQuery),
    sanityClient.fetch<{ courseSlug: string; date: string; startTime: string; confirmedCount: number }[]>(allBookingCountsQuery),
  ]);
  const occurrences = expandOccurrences(courses ?? []);

  const bookingCounts: Record<string, number> = {};
  for (const row of rawCounts ?? []) {
    bookingCounts[`${row.courseSlug}|${row.date}|${row.startTime}`] = row.confirmedCount;
  }

  const eventsJsonLd = occurrences.map((occ) => {
    const confirmedCount = bookingCounts[`${occ.course.slug.current}|${occ.date}|${occ.startTime}`] ?? 0;
    const spotsLeft = Math.max(0, occ.course.maxParticipants - confirmedCount);

    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: occ.course.title[l],
      startDate: toMadridISOString(occ.date, occ.startTime),
      endDate: toMadridISOString(occ.date, occ.endTime),
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: {
        '@type': 'Place',
        name: SITE_NAME,
        address: STUDIO_ADDRESS,
      },
      image: occ.course.image ? urlFor(occ.course.image).width(1200).height(630).url() : DEFAULT_OG_IMAGE,
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/${locale}/courses/${occ.course.slug.current}?date=${occ.date}&time=${occ.startTime}`,
        price: occ.course.price,
        priceCurrency: occ.course.currency,
        availability: spotsLeft > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      },
    };
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd) }}
      />
      <PageHeader
        locale={locale}
        title={t('pageTitle')}
        description={t('pageDescription')}
        breadcrumbs={[
          { name: tNav('home'), path: '/' },
          { name: tNav('calendar'), path: '/calendar' },
        ]}
        breadcrumbsLabel={tNav('breadcrumb')}
      />
      <div className="container pt-10 pb-16">
        <CalendarView occurrences={occurrences} locale={l} />
      </div>
    </>
  );
}
