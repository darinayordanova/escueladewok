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
      <div className={styles.container}>
        <div className={styles.content}>

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
         <Image
    src={heroImage}         
    alt="..."
    priority                
    placeholder="blur"      
    width={548}
    height={593}
    className={styles.image}
  />
      </div>

      <div className={styles.redBox} />
    </section>
  );
}
