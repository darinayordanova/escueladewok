import { getTranslations } from 'next-intl/server';

import { Check } from '@/components/ui/icons';
import SectionHeading from '@/components/ui/SectionHeading/SectionHeading';
import type { Locale } from '@/types';

import styles from './CourseIncluded.module.scss';

/** What every class includes — the same for all courses. */
export default async function CourseIncluded({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'courseDetail.included' });
  const items = t.raw('items') as string[];

  return (
    <section className={styles.section}>
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} tone="light" className={styles.heading} />
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item} className={styles.item}>
            <span className={styles.check} aria-hidden="true">
              <Check size={17} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
