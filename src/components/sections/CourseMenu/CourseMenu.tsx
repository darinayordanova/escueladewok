import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import SectionHeading from '@/components/ui/SectionHeading/SectionHeading';
import type { DayPart } from '@/lib/courses/timeslots';
import type { Locale, MenuItem } from '@/types';

import styles from './CourseMenu.module.scss';

interface CourseMenuProps {
  items: MenuItem[];
  locale: Locale;
  /** When the class runs, for "One unforgettable evening." */
  dayPart: DayPart;
}

/** The dishes, presented as a printed menu card. */
export default async function CourseMenu({ items, locale, dayPart }: CourseMenuProps) {
  if (items.length === 0) return null;

  const t = await getTranslations({ locale, namespace: 'courseDetail.menu' });

  return (
    <section className={styles.section}>
      <SectionHeading
        eyebrow={t('eyebrow')}
        title={t('title', { count: items.length })}
        accent={t(`accent.${dayPart}`)}
        accentOnNewLine
      />

      <div className={styles.paper}>
        <div className={styles.ornament} aria-hidden="true">
          <Image src="/images/pattern2.svg" alt="" width={64} height={64} />
        </div>

        <ol className={styles.list}>
          {items.map((item, i) => (
            <li key={item._key} className={styles.item}>
              <span className={styles.number} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className={styles.name}>{item.name[locale]}</h3>
                {item.description?.[locale] && <p className={styles.description}>{item.description[locale]}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
