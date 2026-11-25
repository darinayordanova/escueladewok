import { useTranslations } from 'next-intl';

import CourseCardLayout, {
  CourseCardEyebrow,
  CourseCardFacts,
  CourseCardNote,
} from '@/components/sections/CourseCard/CourseCardLayout';
import { portableTextToString } from '@/lib/portableTextToString';
import type { Course, Locale } from '@/types';

interface CorporateCourseCardProps {
  course: Course;
  locale: Locale;
}

/**
 * Corporate experience card — no dates or public price. Shows the format
 * (duration, group size) and leads to the enquiry form on the course page.
 */
export default function CorporateCourseCard({ course, locale }: CorporateCourseCardProps) {
  const t = useTranslations('courses');
  const tCorp = useTranslations('corporate');
  const { title, slug, description, image, duration, maxParticipants, cuisine } = course;

  const facts = [
    t('duration', { duration }),
    ...(maxParticipants > 0 ? [t('groupSize', { count: maxParticipants })] : []),
  ];

  return (
    <CourseCardLayout
      href={`/courses/${slug.current}`}
      title={title[locale]}
      description={description?.[locale] ? portableTextToString(description[locale]) : undefined}
      image={image}
      imageAlt={image?.alt?.[locale] ?? title[locale]}
      cuisine={cuisine ? { value: cuisine, label: t(`cuisine.${cuisine}`) } : undefined}
      meta={
        <>
          <CourseCardEyebrow>{tCorp('privateEvent')}</CourseCardEyebrow>
          <CourseCardFacts items={facts} />
        </>
      }
      footerStart={<CourseCardNote>{tCorp('priceOnRequest')}</CourseCardNote>}
      ctaLabel={tCorp('requestQuote')}
    />
  );
}
