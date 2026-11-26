'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import Button from '@/components/ui/Button/Button';
import { Link } from '@/i18n/navigation';
import { ALL_ACCEPTED, ALL_REJECTED, CONSENT_OPEN_EVENT, saveConsent } from '@/lib/analytics/consent';
import { useConsent } from '@/lib/analytics/useConsent';

import styles from './CookieBanner.module.scss';
import CookiePreferences from './CookiePreferences';

/**
 * Asks before any tracking cookie is set. Accept and Reject look the same and sit side by
 * side (AEPD cookie guide: rejecting must be as easy as accepting); "Manage preferences"
 * opens the per-category choice. The footer's "Cookies" link opens the preferences again.
 */
export default function CookieBanner() {
  const t = useTranslations('cookies');
  const consent = useConsent();
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setPrefsOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

  // Development only: ?cookie-prefs opens the preferences at once, for checking the design
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (!new URLSearchParams(window.location.search).has('cookie-prefs')) return;
    const id = window.setTimeout(() => setPrefsOpen(true));
    return () => window.clearTimeout(id);
  }, []);

  if (consent === 'unknown') return null;

  const terms = (chunks: React.ReactNode) => (
    <Link href="/terms" className={styles.link}>
      {chunks}
    </Link>
  );
  const privacy = (chunks: React.ReactNode) => (
    <Link href="/privacy" className={styles.link}>
      {chunks}
    </Link>
  );

  return (
    <>
      {consent === null && !prefsOpen && (
        <section className={styles.banner} aria-label={t('bannerLabel')}>
          <p className={styles.text}>{t('text')}</p>
          <p className={styles.links}>
            {t.rich('links', { terms, privacy })}
          </p>
          <div className={styles.actions}>
            <Button fullWidth onClick={() => saveConsent(ALL_ACCEPTED)}>
              {t('accept')}
            </Button>
            <Button fullWidth onClick={() => saveConsent(ALL_REJECTED)}>
              {t('reject')}
            </Button>
            <Button variant="outline" fullWidth onClick={() => setPrefsOpen(true)} className={styles.manage}>
              {t('manage')}
            </Button>
          </div>
        </section>
      )}

      {prefsOpen && (
        <CookiePreferences
          initial={consent ?? ALL_REJECTED}
          onSave={(choice) => {
            saveConsent(choice);
            setPrefsOpen(false);
          }}
          onClose={() => setPrefsOpen(false)}
        />
      )}
    </>
  );
}
