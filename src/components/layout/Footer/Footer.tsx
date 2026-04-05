import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

import styles from './Footer.module.scss';

export default function Footer() {
  const t = useTranslations('navigation');
  const tLegal = useTranslations('legal');
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <Link href="/" className={styles.brand}>
          <Image src="/logo-footer.svg" alt="Escuela de Wok" width={100} height={60} />
        </Link>
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
            <li>
              <Link href="/terms" className={styles.link}>
                {tLegal('terms')}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className={styles.link}>
                {tLegal('privacy')}
              </Link>
            </li>
          </ul>
        </nav>
        <p className={styles.copy}>&copy; {year} Escuela de Wok. All rights reserved.</p>
      </div>
    </footer>
  );
}
