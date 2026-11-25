'use client';


import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { ShoppingCart } from '@/components/ui/icons';
import { useCart } from '@/context/CartContext';
import { Link, usePathname } from '@/i18n/navigation';

import styles from './Header.module.scss';
import { isActivePath } from './isActivePath';
import LanguageSwitcher from './LanguageSwitcher';
import MobileMenu from './MobileMenu';

const DESKTOP_NAV = [
  { href: '/', key: 'home' },
  { href: '/courses', key: 'courses' },
  { href: '/calendar', key: 'calendar' },
  { href: '/corporate', key: 'corporate' },
  { href: '/vouchers', key: 'vouchers' },
  { href: '/contact', key: 'contact' },
] as const;

export default function Header() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
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
      <div className={`container ${styles.container}`}>

        {/* Mobile burger + drawer — first in DOM = left on mobile */}
        <MobileMenu />

        {/* Logo — centred on mobile, left on desktop */}
        <Link href="/" className={styles.logoLink}>
          <Image src="/logo.svg" className={styles.logo} alt="Wok Lab" width={100} height={60} priority />
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <nav className={styles.nav} aria-label={t('mainNavigation')}>
          <ul className={styles.navList}>
            {DESKTOP_NAV.map(({ href, key }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={styles.navLink}
                  aria-current={isActivePath(pathname, href) ? 'page' : undefined}
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Language switcher — desktop only */}
        <div className={styles.desktopLang}>
          <LanguageSwitcher />
        </div>

        {/* Cart — always visible; right on mobile, after lang on desktop */}
        <button type="button" className={styles.cartBtn} onClick={openCart} aria-label="Open cart">
          <ShoppingCart size={22} />
          {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
        </button>

      </div>
    </header>
  );
}
