import { getTranslations } from 'next-intl/server';

import Button from '@/components/ui/Button/Button';

import styles from '../not-found.module.scss';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <section className={styles.section}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.code} aria-hidden="true">
          404
        </p>

        <h1 className={`h2 ${styles.title}`}>{t('title')}</h1>

        <p className={`lead ${styles.subtitle}`}>{t('subtitle')}</p>

        <div className={styles.actions}>
          <Button href="/" size="lg">
            {t('backToHome')}
          </Button>
          <Button href="/courses" variant="outline" size="lg">
            {t('browseCourses')}
          </Button>
        </div>
      </div>
    </section>
  );
}
