import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import Breadcrumbs from '@/components/ui/Breadcrumbs/Breadcrumbs';
import Button from '@/components/ui/Button/Button';
import CuisinePill from '@/components/ui/CuisinePill/CuisinePill';
import { ChevronRight } from '@/components/ui/icons';
import { urlFor } from '@/lib/sanity/image';
import type { BreadcrumbEntry } from '@/lib/seo';
import type { CuisineType, Locale, SanityImage } from '@/types';
import instructorImage from '@public/images/instructor.webp';

import styles from './CourseHero.module.scss';

interface CourseHeroProps {
  locale: Locale;
  title: string;
  image?: SanityImage;
  cuisine?: CuisineType;
  instructor: string;
  duration: number;
  maxParticipants: number;
  breadcrumbs: BreadcrumbEntry[];
  cta: { label: string; href: string };
  /** Lets the mobile booking bar know when the hero's own button is on screen. */
  id?: string;
}

export default async function CourseHero({
  locale,
  title,
  image,
  cuisine,
  instructor,
  duration,
  maxParticipants,
  breadcrumbs,
  cta,
  id,
}: CourseHeroProps) {
  const [t, tCourses, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'courseDetail' }),
    getTranslations({ locale, namespace: 'courses' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);

  return (
    <section id={id} className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <Breadcrumbs trail={breadcrumbs} locale={locale} ariaLabel={tNav('breadcrumb')} align="responsive" className={styles.breadcrumbs} />

          {cuisine && (
            <CuisinePill cuisine={cuisine} label={tCourses(`cuisine.${cuisine}`)} className={styles.pill} />
          )}

          <h1 className={styles.title}>{title}</h1>

          <div className={styles.instructor}>
            <Image src={instructorImage} alt="" width={48} height={48} className={styles.avatar} />
            <p className={styles.instructorText}>
              <span className={styles.instructorLabel}>{t('ledBy')}</span>
              <span className={styles.instructorName}>{instructor}</span>
            </p>
          </div>

          <ul className={styles.facts}>
            <li>{t('facts.duration', { count: duration / 60 })}</li>
            <li>{t('facts.guests', { count: maxParticipants })}</li>
            <li>{t('facts.languages')}</li>
          </ul>

          <Button href={cta.href} className={styles.cta}>
            {cta.label}
            <ChevronRight size={20} />
          </Button>
        </div>

        {image && (
          <div className={styles.media}>
            <div className={styles.imageFrame}>
              <Image
                src={urlFor(image).width(1240).height(1088).url()}
                alt={image.alt?.[locale] ?? ''}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={styles.image}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
