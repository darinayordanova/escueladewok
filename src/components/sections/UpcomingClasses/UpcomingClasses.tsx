'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import Carousel from '@/components/ui/Carousel/Carousel';
import InlineCalendar from '@/components/ui/InlineCalendar/InlineCalendar';
import Link from '@/components/ui/Link/Link';
import { ArrowRight } from '@/components/ui/icons';
import { expandOccurrences } from '@/lib/courses/timeslots';
import { urlFor } from '@/lib/sanity/image';
import { portableTextToString } from '@/lib/portableTextToString';
import type { Course, CourseOccurrence, Locale } from '@/types';

import styles from './UpcomingClasses.module.scss';

interface UpcomingClassesProps {
  courses: Course[];
  locale: Locale;
}

export default function UpcomingClasses({ courses, locale }: UpcomingClassesProps) {
  const t = useTranslations('upcomingClasses');

  const { byDate, availableDates, firstDate } = useMemo(() => {
    const occurrences = expandOccurrences(courses);
    const byDate: Record<string, CourseOccurrence[]> = {};
    for (const occ of occurrences) {
      (byDate[occ.date] ??= []).push(occ);
    }
    const sorted = Object.keys(byDate).sort();
    return { byDate, availableDates: new Set(sorted), firstDate: sorted[0] ?? '' };
  }, [courses]);

  const [selectedDate, setSelectedDate] = useState(firstDate);

  const occurrences: CourseOccurrence[] = selectedDate ? (byDate[selectedDate] ?? []) : [];

  if (!firstDate) return null;

  return (
    <section className="bg-alt py-10 py-md-16">
      <div className="container">
        <p className="overline text-center color-primary mb-4">{t('label')}</p>
        <h2 className="h3 text-center mt-no mb-10">{t('title')}</h2>

        <div className="grid gap-4">
          <div className="col-12 col-md-4">
            <InlineCalendar
              value={selectedDate}
              onChange={setSelectedDate}
              availableDates={availableDates}
              locale={locale}
            />
          </div>

          <div className="col-12 col-md-8">
            {occurrences.length === 0 ? (
              <p className="text-sm color-text-muted">{t('noClasses')}</p>
            ) : (
              <Carousel
                key={selectedDate}
                items={occurrences}
                itemsPerPage={2}
                renderItem={(occ) => <CourseRow key={`${occ.course}-${occ.date}-${occ.startTime}`} occ={occ} locale={locale} />}
                showControls={false}
                showDots={occurrences.length > 2}
                align="end"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CourseRow({ occ, locale }: { occ: CourseOccurrence; locale: Locale }) {
  const t = useTranslations('courses');
  const { course, date, startTime, endTime } = occ;
  const { title, slug, description, image } = course;

  const descriptionText = description?.[locale]
    ? portableTextToString(description[locale])
    : undefined;

  const href = `/courses/${slug.current}?date=${date}&time=${startTime}`;

  return (
    <Link href={href}>
      <div className={`grid gap-4 p-4 bg-bg mb-4 ${styles.row}`}>
        <div className="col-4 col-md-2 relative">
          {image ? (
            <Image
              src={urlFor(image).width(160).height(160).url()}
              alt={image.alt?.[locale] ?? title[locale]}
              className={styles.rowImg}
             fill
              sizes="(max-width: 768px) 100vw, 160px"
            />
          ) : (
            <div className={styles.rowImgPlaceholder} aria-hidden="true" />
          )}
        </div>

        <div className={`col-8 col-md-7 ${styles.rowContent}`}>
          <p className={`h6 m-no color-text ${styles.rowTitle}`}>{title[locale]}</p>
          <p className="text-xs color-text-muted m-no">
            {startTime} – {endTime}
          </p>
          {descriptionText && (
            <p className={`text-sm m-no color-text-muted ${styles.rowDesc}`}>{descriptionText}</p>
          )}
        </div>

        <span className={`col-12 col-md-3 ${styles.rowCta}`}>
          {t('bookNow')}
          <ArrowRight className={styles.linkArrow} size={15} />
        </span>
      </div>
    </Link>
  );
}
