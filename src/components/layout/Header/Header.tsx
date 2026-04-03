import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

import styles from './Header.module.scss';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const t = useTranslations('navigation');

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Escuela de Wok
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          <ul className={styles.navList}>
            <li>
              <Link href="/" className={styles.navLink}>
                {t('home')}
              </Link>
            </li>
            <li>
              <Link href="/courses" className={styles.navLink}>
                {t('courses')}
              </Link>
            </li>
          </ul>
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
