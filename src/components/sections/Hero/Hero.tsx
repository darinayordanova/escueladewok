import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/lib/sanity/image';
import type { Homepage, Locale } from '@/types';

import styles from './Hero.module.scss';

interface HeroProps {
  data: Homepage;
  locale: Locale;
}

export default function Hero({ data, locale }: HeroProps) {
  const t = useTranslations('home');
  const { heroEyebrow, heroTitle, heroSubtitle, heroCtaLabel, heroImage } = data;

  return (
    <section className={styles.hero}>
      {/* Background image */}
      {heroImage && (
        <div className={styles.imageWrapper} aria-hidden="true">
          <Image
            src={urlFor(heroImage).width(1600).height(900).url()}
            alt={heroImage.alt?.[locale] ?? ''}
            fill
            priority
            className={styles.image}
            sizes="100vw"
          />
        </div>
      )}

      {/* Gradient overlay */}
      <div className={styles.overlay} aria-hidden="true" />

      {/* Content */}
      <div className={styles.container}>
        <div className={styles.content}>
          {heroEyebrow?.[locale] && (
            <p className={styles.eyebrow}>{heroEyebrow[locale]}</p>
          )}

          <h1 className={styles.title}>{heroTitle[locale]}</h1>

          {heroSubtitle?.[locale] && (
            <p className={styles.subtitle}>{heroSubtitle[locale]}</p>
          )}

          <div className={styles.cta}>
            <Link href="/courses" className={styles.ctaPrimary}>
              {heroCtaLabel?.[locale] ?? t('viewAllCourses')}
            </Link>
            <Link href="/about" className={styles.ctaSecondary}>
              {t('heroAboutLink')}
            </Link>
          </div>

          <ul className={styles.pills} aria-label="Key features">
            <li className={styles.pill}>{t('pill1')}</li>
            <li className={styles.pill}>{t('pill2')}</li>
            <li className={styles.pill}>{t('pill3')}</li>
          </ul>
        </div>
      </div>

      {/* Scroll cue */}
      <div className={styles.scrollCue} aria-hidden="true">
        <span className={styles.scrollChevron} />
      </div>
    </section>
  );
}
