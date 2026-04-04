'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';

import styles from './Header.module.scss';

const NAV_LINKS = [
  { href: '/' as const, key: 'home' },
  { href: '/courses' as const, key: 'courses' },
  { href: '/about' as const, key: 'about' },
  { href: '/contact' as const, key: 'contact' },
] as const;

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button
        className={styles.burgerButton}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={[styles.burgerBar, open ? styles.burgerBarTop : ''].filter(Boolean).join(' ')} />
        <span className={[styles.burgerBar, open ? styles.burgerBarMid : ''].filter(Boolean).join(' ')} />
        <span className={[styles.burgerBar, open ? styles.burgerBarBot : ''].filter(Boolean).join(' ')} />
      </button>

      {open && (
        <div
          className={styles.mobileOverlay}
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        id="mobile-menu"
        ref={menuRef}
        className={[styles.mobileMenu, open ? styles.mobileMenuOpen : ''].filter(Boolean).join(' ')}
        aria-hidden={!open}
      >
        <nav aria-label="Mobile navigation">
          <ul className={styles.mobileNavList}>
            {NAV_LINKS.map(({ href, key }) => (
              <li key={key}>
                <Link
                  href={href}
                  className={styles.mobileNavLink}
                  onClick={() => setOpen(false)}
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.mobileLang}>
          <LanguageSwitcher />
        </div>
      </div>
    </>
  );
}
