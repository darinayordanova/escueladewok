import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/lib/sanity/image';
import type { Course, Locale } from '@/types';

import styles from './CourseCard.module.scss';

interface CourseCardProps {
  course: Course;
  locale: Locale;
}

export default function CourseCard({ course, locale }: CourseCardProps) {
  const t = useTranslations('courses');
  const { title, slug, description, image, price, currency, duration, difficulty } = course;

  return (
    <article className={styles.card}>
      <Link href={`/courses/${slug.current}`} className={styles.imageLink}>
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
          <span className={styles.difficulty}>{t(`difficulty.${difficulty}`)}</span>
        </div>
      </Link>

      <div className={styles.body}>
        <Link href={`/courses/${slug.current}`} className={styles.titleLink}>
          <h3 className={styles.title}>{title[locale]}</h3>
        </Link>

        {description?.[locale] && (
          <p className={styles.description}>{description[locale]}</p>
        )}

        <div className={styles.meta}>
          <span className={styles.duration}>{t('duration', { duration })}</span>
        </div>

        <div className={styles.footer}>
          <p className={styles.price}>
            <span className={styles.priceFrom}>{t('from')}</span>
            <strong>
              {price} {currency}
            </strong>
          </p>
          <Link href={`/courses/${slug.current}`}>
            <span className={styles.bookLink}>{t('bookNow')} &rarr;</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
