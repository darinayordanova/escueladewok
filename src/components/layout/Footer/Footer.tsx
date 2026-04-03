import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

import styles from './Footer.module.scss';

export default function Footer() {
  const t = useTranslations('navigation');
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.brand}>Escuela de Wok</p>
        <nav aria-label="Footer navigation">
          <ul className={styles.links}>
            <li>
              <Link href="/" className={styles.link}>
                {t('home')}
              </Link>
            </li>
            <li>
              <Link href="/courses" className={styles.link}>
                {t('courses')}
              </Link>
            </li>
          </ul>
        </nav>
        <p className={styles.copy}>&copy; {year} Escuela de Wok. All rights reserved.</p>
      </div>
    </footer>
  );
}
