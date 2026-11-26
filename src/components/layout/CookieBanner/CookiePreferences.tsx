'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';

import Button from '@/components/ui/Button/Button';
import { Close } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import { ALL_ACCEPTED, ALL_REJECTED, type Consent } from '@/lib/analytics/consent';

import styles from './CookiePreferences.module.scss';

interface CookiePreferencesProps {
  /** Toggles start from the visitor's current choice (all off when not asked yet) */
  initial: Consent;
  onSave: (consent: Consent) => void;
  /** Closed without saving (× or Escape): nothing changes */
  onClose: () => void;
}

/** The per-category cookie choice, in a native modal dialog (focus and Escape built in). */
export default function CookiePreferences({ initial, onSave, onClose }: CookiePreferencesProps) {
  const t = useTranslations('cookies');
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [choice, setChoice] = useState<Consent>(initial);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  const contact = (chunks: React.ReactNode) => (
    <Link href="/contact" className={styles.link}>
      {chunks}
    </Link>
  );
  const privacy = (chunks: React.ReactNode) => (
    <Link href="/privacy" className={styles.link}>
      {chunks}
    </Link>
  );

  const category = (key: 'necessary' | keyof Consent) => {
    const fixed = key === 'necessary';
    const id = `${titleId}-${key}`;
    return (
      <section className={styles.category} aria-labelledby={`${id}-title`}>
        <div className={styles.categoryHead}>
          <h3 id={`${id}-title`} className={styles.categoryTitle}>
            {t(`${key}.title`)}
          </h3>
          <div className={styles.control}>
            {fixed && <span className={styles.always}>{t('alwaysEnabled')}</span>}
            <label className={`${styles.switch} ${fixed ? styles.switchLocked : ''}`}>
              <input
                type="checkbox"
                role="switch"
                className={styles.switchInput}
                // Strictly necessary: shown on, and can't be switched off
                checked={fixed ? true : choice[key]}
                disabled={fixed}
                onChange={fixed ? undefined : (e) => setChoice((c) => ({ ...c, [key]: e.target.checked }))}
                aria-labelledby={`${id}-title`}
                aria-describedby={`${id}-text`}
              />
              <span className={styles.track} aria-hidden="true">
                <span className={styles.thumb} />
              </span>
            </label>
          </div>
        </div>
        <p id={`${id}-text`} className={styles.categoryText}>
          {t(`${key}.text`)}
        </p>
      </section>
    );
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the backdrop (the dialog element itself, outside its box) closes it
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.box}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {t('prefsTitle')}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t('close')}>
            <Close size={18} />
          </button>
        </header>

        <div className={styles.body}>
          <p className={styles.intro}>{t.rich('prefsIntro', { privacy })}</p>
          {category('necessary')}
          {category('analytics')}
          {category('ads')}
          <section className={styles.more}>
            <h3 className={styles.categoryTitle}>{t('moreTitle')}</h3>
            <p className={styles.categoryText}>{t.rich('moreText', { contact })}</p>
          </section>
        </div>

        <footer className={styles.footer}>
          <Button onClick={() => onSave(ALL_ACCEPTED)}>
            {t('acceptAll')}
          </Button>
          <Button onClick={() => onSave(ALL_REJECTED)}>
            {t('rejectAll')}
          </Button>
          <Button variant="outline" onClick={() => onSave(choice)} className={styles.save}>
            {t('save')}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
