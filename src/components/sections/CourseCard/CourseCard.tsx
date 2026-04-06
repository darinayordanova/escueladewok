import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/courses/timeslots';
import { urlFor } from '@/lib/sanity/image';
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
    <article className={styles.card}>
      <Link href={href} className={styles.imageLink}>
        <div className={styles.imageWrapper}>
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
          {cuisine && <span className={styles.cuisine}>{t(`cuisine.${cuisine}`)}</span>}
        </div>
      </Link>

      <div className={styles.body}>
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

        <Link href={href} className={styles.titleLink}>
          <h3 className={styles.title}>{title[locale]}</h3>
        </Link>

        {description?.[locale] && (
          <p className={styles.description}>{description[locale]}</p>
        )}

        {!occurrence && (
          <div className={styles.meta}>
            <span className={styles.duration}>{t('duration', { duration })}</span>
          </div>
        )}

        <div className={styles.footer}>
          <p className={styles.price}>
            <span className={styles.priceFrom}>{t('from')}</span>
            <strong>
              {price} {currency}
            </strong>
          </p>
          <Link href={href}>
            <span className={styles.bookLink}>{t('bookNow')} &rarr;</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
