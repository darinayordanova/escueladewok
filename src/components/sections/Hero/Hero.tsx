import Image from 'next/image';
import { useTranslations } from 'next-intl';

import type { Homepage, Locale } from '@/types';

import styles from './Hero.module.scss';
import Button from '@/components/ui/Button/Button';
import Link from '@/components/ui/Link/Link';
import heroImage from '@public/images/hero.webp';

interface HeroProps {
  data: Homepage;
  locale: Locale;
}

export default function Hero({ data, locale }: HeroProps) {
  const t = useTranslations('home');
  const { heroTitle, heroSubtitle, heroCtaLabel } = data;

  return (
    <section className={styles.hero}>
      {/* Content */}
      <div className={`container grid py-20 pb-md-20 pb-no`}>
        <div className={`col-12 col-lg-7 col-md-6 text-center text-md-left`}>

          <h1 className={styles.title}>{heroTitle[locale]}</h1>

          {heroSubtitle?.[locale] && (
            <p className={styles.subtitle}>{heroSubtitle[locale]}</p>
          )}

          <div className={styles.cta}>
            
            <Button  href="/courses">{heroCtaLabel?.[locale] ?? t('viewAllCourses')}</Button>
            <Link href="/about" hasArrow>
              {t('heroAboutLink')}
            </Link>
          </div>
        </div>
        <div className={`col-12 col-lg-5 col-md-6 relative`}>
      <div className={styles.redBox} />

         <Image
    src={heroImage}         
    alt="..."
    priority                
    width={548}
    height={593}
    className={styles.image}
  />
  </div>

      </div>

    </section>
  );
}
