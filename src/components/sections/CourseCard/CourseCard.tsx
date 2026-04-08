import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { formatDate } from '@/lib/courses/timeslots';
import { urlFor } from '@/lib/sanity/image';
import CuisinePill from '@/components/ui/CuisinePill/CuisinePill';
import Link from '@/components/ui/Link/Link';
import type { Course, Locale } from '@/types';

import styles from './CourseCard.module.scss';

interface Occurrence {
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

interface CourseCardProps {
  course: Course;
  locale: Locale;
  occurrence?: Occurrence;
}

export default function CourseCard({ course, locale, occurrence }: CourseCardProps) {
  const t = useTranslations('courses');
  const { title, slug, description, image, price, currency, duration, cuisine } = course;

  const href = occurrence
    ? `/courses/${slug.current}?date=${occurrence.date}&time=${occurrence.startTime}`
    : `/courses/${slug.current}`;

  return (
    <article className={`bg-bg flex flex-column ${styles.card}`}>
      <Link href={href} className={styles.imageLink}>
        <div className={`bg-alt ${styles.imageWrapper}`}>
          {image ? (
            <Image
              src={urlFor(image).width(600).height(400).url()}
              alt={image.alt?.[locale] ?? title[locale]}
              fill
              className={styles.image}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className={styles.imagePlaceholder} aria-hidden="true" />
          )}
          {cuisine && <CuisinePill cuisine={cuisine} label={t(`cuisine.${cuisine}`)} className={styles.cuisine} />}
        </div>
      </Link>

      <div className="flex flex-column flex-justify-between p-4 full-height">
        <div className='flex flex-column'>
        {occurrence && (
          <div className={styles.dateLabel}>
            <time dateTime={`${occurrence.date}T${occurrence.startTime}`}>
              {formatDate(occurrence.date, locale)}
            </time>
            <span className={styles.timeRange}>
              {occurrence.startTime} – {occurrence.endTime}
            </span>
          </div>
        )}

        <Link href={href} >
          <h3 className={`text-xl font-bold mt-no mb-3 ${styles.title}`}>{title[locale]}</h3>
        </Link>

        {description?.[locale] && (
          <p className={`text-sm text-text-light line-height-base ${styles.description}`}>{description[locale]}</p>
        )}

        {!occurrence && (
          <div className={styles.meta}>
            <span className={styles.duration}>{t('duration', { duration })}</span>
          </div>
        )}
</div>
        <div className={styles.footer}>
          <p className={styles.price}>
            <span className={styles.priceFrom}>{t('from')}</span>
            <strong>
              {price} {currency}
            </strong>
          </p>
          <Link href={href} hasArrow className='color-primary font-semibold'>
            {t('bookNow')}
          </Link>
        </div>
      </div>
    </article>
  );
}
