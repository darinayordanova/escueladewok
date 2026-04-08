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
    <section className="flex  flex-justify-center" aria-label={t('menuTitle')}>
      <div className={`pt-6 pb-2 px-6 pt-md-10 pb-md-6 px-md-8 ${styles.paper}`}>

        {/* Watermark */}
        <div className={styles.watermark} aria-hidden="true" />

        {/* Header */}
        <header className="relative flex gap-4 mb-4 text-center flex-column">
          <p className="h6 color-text text-center m-no text-uppercase">— {t('menuTitle')} —</p>
          <div className={`flex flex-justify-center flex-align-items`} aria-hidden="true">
            <Image
              src="/images/pattern2.svg"
              alt=""
              width={64}
              height={64}
              className={styles.ornamentImg}
            />
          </div>
        </header>

        <div className={styles.divider} aria-hidden="true" />

        {/* Dish list */}
        <ul className={`flex flex-column ${styles.list}`} role="list">
          {items.map((item, i) => (
            <li key={item._key} className={`flex flex-align-start py-4 gap-4 ${styles.item}`}>
              <span className={`flex flex-align-center ${styles.number}`} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className={`flex gap-3 flex-align-start`}>
                
                <div className={styles.text}>
                  <p className={`text-lg font-heading mt-no mb-2`}>{item.name[locale]}</p>
                  {item.description?.[locale] && (
                    <p className={`text-sm color-text-muted leading-base text-italic m-no`}>{item.description[locale]}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        

      </div>
    </section>
  );
}
