'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import { markPromptDone } from '@/components/layout/NewsletterPrompt/promptStorage';
import Button from '@/components/ui/Button/Button';
import Checkbox from '@/components/ui/Checkbox/Checkbox';
import Input from '@/components/ui/Input/Input';
import { Link } from '@/i18n/navigation';

import styles from './NewsletterForm.module.scss';

export interface NewsletterFormProps {
  /** Where the form sits; stored with the consent record. */
  source: 'footer' | 'popup';
  /** `dark` for the footer's dark ground. */
  tone?: 'light' | 'dark';
  /** Called once the confirmation email is on its way. */
  onSent?: () => void;
  /** Put the cursor in the email field on mount (the prompt opening on request). */
  focusOnMount?: boolean;
  /** Button text in place of the default "Subscribe". */
  submitLabel?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email + RGPD consent (an unticked box) + the short legal notice.
 * Checked on submit, never while typing; each error sits under its own field.
 */
export default function NewsletterForm({ source, tone = 'light', onSent, focusOnMount, submitLabel }: NewsletterFormProps) {
  const t = useTranslations('newsletter');
  const locale = useLocale();
  const uid = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot
  const [errors, setErrors] = useState<{ email?: string; consent?: string }>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const consentErrorId = `${uid}-consent-error`;

  useEffect(() => {
    if (focusOnMount) emailRef.current?.focus();
  }, [focusOnMount]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = t('invalidEmail');
    if (!consent) next.consent = t('consentRequired');
    setErrors(next);
    if (next.email) return emailRef.current?.focus();
    if (next.consent) return consentRef.current?.focus();

    setStatus('sending');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent, locale, source, website }),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('sent');
      markPromptDone(source); // subscribed anywhere: the first-visit prompt never shows again
      onSent?.();
    } catch {
      setStatus('error'); // everything typed stays
    }
  }

  const toneClass = tone === 'dark' ? styles.dark : '';

  if (status === 'sent') {
    return (
      <p className={`${styles.sent} ${toneClass}`} role="status">
        {t('success')}
      </p>
    );
  }

  return (
    <form className={`${styles.form} ${toneClass}`} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <Input
          ref={emailRef}
          id={`${uid}-email`}
          label={t('emailLabel')}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          fieldClassName={styles.email}
        />
        <Button type="submit" className={styles.submit} isLoading={status === 'sending'} disabled={status === 'sending'}>
          {status === 'sending' ? t('sending') : (submitLabel ?? t('submit'))}
        </Button>
      </div>

      <div className={styles.consentField}>
        <Checkbox
          ref={consentRef}
          name="consent"
          label={t('consent')}
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-invalid={errors.consent ? true : undefined}
          aria-describedby={errors.consent ? consentErrorId : undefined}
          className={styles.consent}
          labelClassName={styles.consentLabel}
        />
        {errors.consent && (
          <p id={consentErrorId} className={styles.error}>
            {errors.consent}
          </p>
        )}
      </div>

      <p className={styles.notice}>
        {t.rich('notice', {
          link: (chunks) => (
            <Link href="/privacy" className={styles.noticeLink}>
              {chunks}
            </Link>
          ),
        })}
      </p>

      {/* Hidden from people; bots fill it in */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor={`${uid}-website`}>Website</label>
        <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <p className={styles.status} role="status">
        {status === 'error' ? t('error') : ''}
      </p>
    </form>
  );
}
