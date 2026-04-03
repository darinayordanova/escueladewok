'use client';

import { useLocale } from 'next-intl';

import { usePathname, useRouter } from '@/i18n/navigation';

import styles from './Header.module.scss';

const LOCALES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleSwitch(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className={styles.languageSwitcher} aria-label="Language switcher">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => handleSwitch(code)}
          className={[styles.langButton, locale === code ? styles.langButtonActive : '']
            .filter(Boolean)
            .join(' ')}
          aria-current={locale === code ? 'true' : undefined}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
