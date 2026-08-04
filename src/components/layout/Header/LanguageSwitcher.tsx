'use client';

import { useLocale } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';

import styles from './Header.module.scss';

const LOCALES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className={styles.languageSwitcher} aria-label="Language switcher">
      {LOCALES.map(({ code, label }) => (
        <Link
          key={code}
          href={pathname}
          locale={code}
          className={[styles.langButton, locale === code ? styles.langButtonActive : '']
            .filter(Boolean)
            .join(' ')}
          aria-current={locale === code ? 'true' : undefined}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
