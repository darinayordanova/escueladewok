'use client';

import { useTranslations } from 'next-intl';

import Button from '@/components/ui/Button/Button';

import styles from './CtaBanner.module.scss';

export default function CtaBanner() {
  const t = useTranslations('cta');

  return (
    <section className='bg-alt'>
      <div className={`color-white bg-gradient-pattern ${styles.section}`}>
      <div className={`container relative py-16 text-center text-md-left flex flex-justify-center`}>
        <div className={`col-12 col-md-8 ${styles.content}`}>
          <h2 className='h4 h3-md mt-no leading-snug'>
            {t('headingLine1')}<br />
            {t('headingLine2')}<br />
            {t('headingLine3')}
          </h2>
          <p className='text-lg'>{t('sub')}</p>
          <Button href="/courses" color="white" className='mt-6'>{t('cta')}</Button>
         </div>
         <div className={`absolute top-0 left-0 w-full h-full bg-pattern bg-primary opacity-20 ${styles.bgPattern}`} />
        </div>
      </div>

    </section>
  );
}
