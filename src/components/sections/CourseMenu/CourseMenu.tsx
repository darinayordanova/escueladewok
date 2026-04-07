import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { urlFor } from '@/lib/sanity/image';
import type { Locale, MenuItem } from '@/types';

import styles from './CourseMenu.module.scss';

interface CourseMenuProps {
  items: MenuItem[];
  locale: Locale;
}

export default async function CourseMenu({ items, locale }: CourseMenuProps) {
  if (items.length === 0) return null;

  const t = await getTranslations({ locale, namespace: 'courseDetail' });

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t('menuTitle')}</h2>
      <ul className={styles.grid} role="list">
        {items.map((item) => (
          <li key={item._key} className={styles.card}>
          
            <div className={styles.body}>
              <p className={styles.name}>{item.name[locale]}</p>
              {item.description?.[locale] && (
                <p className={styles.description}>{item.description[locale]}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
