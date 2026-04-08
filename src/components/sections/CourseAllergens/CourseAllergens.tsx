import { PortableText } from '@portabletext/react';
import { getTranslations } from 'next-intl/server';

import type { LocaleBlockContent, Locale } from '@/types';

import styles from './CourseAllergens.module.scss';

interface CourseAllergensProps {
  allergens: LocaleBlockContent;
  locale: Locale;
}

export default async function CourseAllergens({ allergens, locale }: CourseAllergensProps) {
  const t = await getTranslations({ locale, namespace: 'courseDetail' });
  const content = allergens[locale];

  if (!content || content.length === 0) return null;

  return (
    <section className="my-8" aria-label={t('allergensTitle')}>
      <h2 className={`h5 pb-3 ${styles.title}`}>{t('allergensTitle')}</h2>
      <div className={`bg-alt p-4 color-primary-dark ${styles.body}`}>
        <PortableText value={content} />
      </div>
      <p className={styles.disclaimer}>* {t('allergensDisclaimer')}</p>
    </section>
  );
}
