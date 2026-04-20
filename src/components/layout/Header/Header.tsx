'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { ShoppingCart } from '@/components/ui/icons';
import { useCart } from '@/context/CartContext';
import { Link } from '@/i18n/navigation';

import styles from './Header.module.scss';
import LanguageSwitcher from './LanguageSwitcher';
import MobileMenu from './MobileMenu';

export default function Header() {
  const t = useTranslations('navigation');
  const { totalItems, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container flex flex-justify-between flex-align-center ${styles.container} py-1 py-md-2`}>
        <Link href="/" >
          <Image src="/logo.svg" className={styles.logo} alt="Escuela de Wok" width={100} height={60} priority />
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
              <Link href="/calendar" className={styles.navLink}>
                {t('calendar')}
              </Link>
            </li>
            <li>
              <Link href="/corporate" className={styles.navLink}>
                {t('corporate')}
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
           {/* Cart button */}
        <button type="button" className={styles.cartBtn} onClick={openCart} aria-label="Open cart">
          <ShoppingCart size={22} />
          {totalItems > 0 && (
            <span className={styles.cartBadge}>{totalItems}</span>
          )}
        </button>
        </div>

       

        {/* Mobile burger + drawer */}
        <MobileMenu />
      </div>
    </header>
  );
}
