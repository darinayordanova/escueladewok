import { useTranslations } from 'next-intl';

import type { HowItWorksStep, Locale } from '@/types';

import styles from './HowItWorks.module.scss';

interface HowItWorksProps {
  title?: { en: string; es: string };
  steps?: HowItWorksStep[];
  locale: Locale;
}

export default function HowItWorks({ title, steps, locale }: HowItWorksProps) {
  const t = useTranslations('howItWorks');

  if (!steps?.length) return null;

  return (
    <section className="py-10 py-md-16">
      <div className="container">
        <p className="overline text-center color-primary mb-4">{t('label')}</p>
        <h2 className="h3 text-center mt-no mb-10">
          {title?.[locale] ?? t('fallbackTitle')}
        </h2>
        <ol className={styles.steps} data-count={steps.length}>
          {steps.map((step, i) => (
            <li key={step._key} className={styles.step}>
              <span className={styles.number} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="h6 mt-no mb-3">{step.title[locale]}</h3>
              {step.description?.[locale] && (
                <p className="text-sm color-text-muted leading-base mt-no">
                  {step.description[locale]}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
