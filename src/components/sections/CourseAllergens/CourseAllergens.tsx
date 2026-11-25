import { PortableText } from '@portabletext/react';
import { getTranslations } from 'next-intl/server';

import SectionHeading from '@/components/ui/SectionHeading/SectionHeading';
import { Link } from '@/i18n/navigation';
import type { AllergenKey, Locale, PortableTextBlock } from '@/types';

import styles from './CourseAllergens.module.scss';

interface CourseAllergensProps {
  allergens: AllergenKey[];
  notes?: PortableTextBlock[];
  locale: Locale;
}

export default async function CourseAllergens({ allergens, notes, locale }: CourseAllergensProps) {
  if (allergens.length === 0 && !notes?.length) return null;

  const [t, tNames] = await Promise.all([
    getTranslations({ locale, namespace: 'courseDetail.allergenSection' }),
    getTranslations({ locale, namespace: 'allergens' }),
  ]);

  return (
    <section className={styles.section}>
      <div className={styles.intro}>
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
        {allergens.length > 0 && <p className={styles.lead}>{t('lead')}</p>}
      </div>

      <div>
        {allergens.length > 0 && (
          <ul className={styles.list}>
            {allergens.map((key) => (
              <li key={key} className={styles.allergen}>{tNames(key)}</li>
            ))}
          </ul>
        )}
        {notes && notes.length > 0 && (
          <div className={styles.notes}>
            <PortableText value={notes} />
          </div>
        )}
      </div>

      <aside className={styles.callout}>
        <p className={styles.calloutTitle}>{t('calloutTitle')}</p>
        <div>
          <p className={styles.calloutText}>{t('calloutText')}</p>
          <Link href="/contact" className={styles.calloutLink}>
            {t('calloutLink')} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </aside>
    </section>
  );
}
