import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { formatDate } from '@/lib/courses/timeslots';
import { urlFor } from '@/lib/sanity/image';
import { portableTextToString } from '@/lib/portableTextToString';
import CuisinePill from '@/components/ui/CuisinePill/CuisinePill';
import Link from '@/components/ui/Link/Link';
import type { Course, Locale } from '@/types';

import styles from './CourseCard.module.scss';
import { ArrowRight } from "@/components/ui/icons";
;

interface Occurrence {
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

interface CourseCardProps {
  course: Course;
  locale: Locale;
  occurrence?: Occurrence;
  spotsLeft?: number;
  showPrice?: boolean;
}

export default function CourseCard({ course, locale, occurrence, spotsLeft, showPrice = true }: CourseCardProps) {
  const t = useTranslations('courses');
  const tDetail = useTranslations('courseDetail');
  const { title, slug, description, image, price, currency, duration, cuisine, brochure } = course;
  const brochureUrl = brochure?.asset?.url;
  const descriptionText = description?.[locale]
    ? portableTextToString(description[locale])
    : undefined;

  const href = occurrence
    ? `/courses/${slug.current}?date=${occurrence.date}&time=${occurrence.startTime}`
    : `/courses/${slug.current}`;

  return (
    <Link href={href}>
      <article className={`bg-bg flex flex-column ${styles.card}`}>
        <div className={styles.imageLink}>
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
</div>
      <div className="flex flex-column flex-justify-between p-4 full-height">
        <div className='flex flex-column'>
        {occurrence && (
          <div className={styles.dateLabel}>
            <time dateTime={`${occurrence.date}T${occurrence.startTime}`}>
              {formatDate(occurrence.date, locale)}
            </time>
            <div className='flex flex-justify-between'>
            <span className={styles.timeRange}>
              {occurrence.startTime} – {occurrence.endTime}
            </span>
            {spotsLeft !== undefined && (
              <span className={`${styles.spots} ${spotsLeft === 0 ? styles.spotsSoldOut : ''}`}>
                {spotsLeft === 0
                  ? tDetail('soldOut')
                  : spotsLeft === 1
                    ? tDetail('spotsLeft', { count: spotsLeft })
                    : tDetail('spotsLeftPlural', { count: spotsLeft })}
              </span>
            )}
            </div>
          </div>
        )}

          <h3 className={`h4 text-xl font-bold mt-no mb-2 ${styles.title}`}>{title[locale]}</h3>

        {descriptionText && (
          <p className={`text-sm text-text-light line-height-base ${styles.description}`}>{descriptionText}</p>
        )}

        {!occurrence && (
          <div className={styles.meta}>
            <span className={styles.duration}>{t('duration', { duration })}</span>
          </div>
        )}
</div>
        <div className={styles.footer}>
          {showPrice && (
            <p className={styles.price}>
              <strong>{price} {currency}</strong>
            </p>
          )}
          <span className={ `inline-flex flex-align-center gap-1 font-medium color-primary font-semibold`}>
            {t('bookNow')}
            <ArrowRight size={16} className={styles.linkArrow} />
          </span>
          {brochureUrl && (
            <a
              href={brochureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.brochureLink}
              aria-label={`${tDetail('downloadBrochure')}: ${title[locale]}`}
            >
              {tDetail('downloadBrochure')}
            </a>
          )}
        </div>
      </div>
    </article>
      </Link>

  );
}
