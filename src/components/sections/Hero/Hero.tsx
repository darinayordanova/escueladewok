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
      <div className={`container grid pt-10 pt-md-no`}>
        <div className={`col-12 col-lg-7 col-md-6 text-center text-md-left pr-no pr-md-10`}>

          <h1 className={`h2 h1-md mt-no ${styles.title}`}>{heroTitle[locale]}</h1>

          {heroSubtitle?.[locale] && (
            <p className={`text-md text-md-lg mb-6 mb-10-md ${styles.subtitle}`}>{heroSubtitle[locale]}</p>
          )}

          <div className={`mb-16 mb-20-md flex flex-align-center gap-5 ${styles.cta}`}>
            
            <Button  href="/courses">{heroCtaLabel?.[locale] ?? t('viewAllCourses')}</Button>
            <Link href="/about" hasArrow>
              {t('heroAboutLink')}
            </Link>
          </div>
        </div>
        <div className={`col-12 col-lg-5 col-md-6 relative`}>
      <div className={`mt-16 mx-auto m-md-no bg-pattern bg-primary ${styles.redBox}`} />

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
