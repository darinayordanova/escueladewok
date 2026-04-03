import Image from 'next/image';
import { useTranslations } from 'next-intl';

import Button from '@/components/ui/Button/Button';
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
  const { heroTitle, heroSubtitle, heroCtaLabel, heroImage } = data;

  return (
    <section className={styles.hero}>
      {heroImage && (
        <div className={styles.imageWrapper}>
          <Image
            src={urlFor(heroImage).width(1400).height(700).url()}
            alt={heroImage.alt?.[locale] ?? 'Hero image'}
            fill
            priority
            className={styles.image}
            sizes="100vw"
          />
          <div className={styles.overlay} aria-hidden="true" />
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>{heroTitle[locale]}</h1>
          {heroSubtitle?.[locale] && (
            <p className={styles.subtitle}>{heroSubtitle[locale]}</p>
          )}
          <div className={styles.cta}>
            <Link href="/courses">
              <Button size="lg">{heroCtaLabel?.[locale] ?? t('viewAllCourses')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
