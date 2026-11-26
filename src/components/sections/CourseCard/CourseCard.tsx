import { useTranslations } from 'next-intl';

import StatusDot from '@/components/ui/StatusDot/StatusDot';
import { availabilityLevel, formatDate } from '@/lib/courses/timeslots';
import { formatPrice } from '@/lib/format';
import { portableTextToString } from '@/lib/portableTextToString';
import type { Course, Locale } from '@/types';

import CourseCardLayout, {
  CourseCardEyebrow,
  CourseCardFacts,
  CourseCardMetaRow,
  CourseCardPrice,
} from './CourseCardLayout';

export interface CourseCardSession {
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  spotsLeft: number;
  bookingOpen: boolean;
}

interface CourseCardProps {
  course: Course;
  locale: Locale;
  /** A specific class date. Without it the card shows the course's general facts. */
  session?: CourseCardSession;
  /** Sends straight to the course's booking form, with a "Book now" button. */
  book?: boolean;
}

/** Public course card — a scheduled class (courses page) or a course overview (homepage). */
export default function CourseCard({ course, locale, session, book = false }: CourseCardProps) {
  const t = useTranslations('courses');
  const tDetail = useTranslations('courseDetail');
  const { title, slug, description, image, price, currency, duration, maxParticipants, cuisine } = course;

  const facts = [
    t('duration', { duration }),
    ...(maxParticipants > 0 ? [t('groupSize', { count: maxParticipants })] : []),
  ];

  let meta = <CourseCardFacts items={facts} />;
  let ctaLabel = book ? t('bookNow') : t('viewCourse');
  let unavailable = false;

  if (session) {
    const { date, startTime, endTime, spotsLeft, bookingOpen } = session;
    unavailable = !bookingOpen || spotsLeft === 0;
    if (bookingOpen && spotsLeft === 0) ctaLabel = t('joinWaitlist');

    const status = !bookingOpen
      ? tDetail('bookingClosedTitle')
      : spotsLeft === 0
        ? tDetail('soldOut')
        : spotsLeft === 1
          ? tDetail('spotsLeft', { count: spotsLeft })
          : tDetail('spotsLeftPlural', { count: spotsLeft });

    meta = (
      <>
        <CourseCardEyebrow dateTime={date}>{formatDate(date, locale)}</CourseCardEyebrow>
        <CourseCardMetaRow>
          <span>{startTime} – {endTime}</span>
          <StatusDot level={bookingOpen ? availabilityLevel(spotsLeft, maxParticipants) : 'none'}>
            {status}
          </StatusDot>
        </CourseCardMetaRow>
      </>
    );
  }

  return (
    <CourseCardLayout
      href={
        session
          ? `/courses/${slug.current}?date=${session.date}&time=${session.startTime}`
          : `/courses/${slug.current}${book ? '#book' : ''}`
      }
      title={title[locale]}
      description={description?.[locale] ? portableTextToString(description[locale]) : undefined}
      image={image}
      imageAlt={image?.alt?.[locale] ?? title[locale]}
      cuisine={cuisine ? { value: cuisine, label: t(`cuisine.${cuisine}`) } : undefined}
      meta={meta}
      footerStart={<CourseCardPrice>{formatPrice(price, currency, locale)}</CourseCardPrice>}
      ctaLabel={ctaLabel}
      muted={unavailable}
    />
  );
}
