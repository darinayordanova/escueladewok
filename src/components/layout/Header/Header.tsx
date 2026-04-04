import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

import styles from './Header.module.scss';
import LanguageSwitcher from './LanguageSwitcher';
import MobileMenu from './MobileMenu';

export default function Header() {
  const t = useTranslations('navigation');

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Escuela de Wok
        </Link>

        {/* Desktop nav — hidden on mobile */}
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
            <li>
              <Link href="/about" className={styles.navLink}>
                {t('about')}
              </Link>
            </li>
            <li>
              <Link href="/contact" className={styles.navLink}>
                {t('contact')}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Desktop language switcher */}
        <div className={styles.desktopLang}>
          <LanguageSwitcher />
        </div>

        {/* Mobile burger + drawer */}
        <MobileMenu />
      </div>
    </header>
  );
}
