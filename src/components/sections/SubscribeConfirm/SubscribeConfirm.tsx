'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import PageHeader from '@/components/sections/PageHeader/PageHeader';
import Button from '@/components/ui/Button/Button';

import styles from './SubscribeConfirm.module.scss';

interface SubscribeConfirmProps {
  token: string;
  email: string;
}

export default function SubscribeConfirm({ token, email }: SubscribeConfirmProps) {
  const t = useTranslations('newsletter');
  const locale = useLocale();
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'invalid' | 'error'>('idle');
  const [welcomeCode, setWelcomeCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function confirm() {
    setStatus('sending');
    try {
      const res = await fetch('/api/subscribe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        const data = (await res.json()) as { welcomeCode: { code: string; expiresAt: string } | null };
        setWelcomeCode(data.welcomeCode);
      }
      setStatus(res.ok ? 'done' : res.status === 400 ? 'invalid' : 'error');
    } catch {
      setStatus('error');
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the code is on screen and selectable */
    }
  }

  if (status === 'done' && welcomeCode) {
    const until = new Date(welcomeCode.expiresAt).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Madrid',
    });
    return (
      <>
        <PageHeader locale={locale} title={t('confirmedTitle')} description={t('confirmedCodeSub')} />
        <div className={`container ${styles.actions}`}>
          <div className={styles.code}>
            <p className={styles.codeLabel}>{t('codeLabel')}</p>
            <p className={styles.codeValue}>{welcomeCode.code}</p>
            <p className={styles.codeNote}>{t('codeValidUntil', { date: until })}</p>
          </div>
          <div className={styles.codeActions}>
            <Button variant="outline" onClick={() => copy(welcomeCode.code)} aria-live="polite">
              {copied ? t('copied') : t('copyCode')}
            </Button>
            <Button href="/courses">{t('seeClasses')}</Button>
          </div>
        </div>
      </>
    );
  }

  if (status === 'done') return <PageHeader locale={locale} title={t('confirmedTitle')} description={t('confirmedSub')} />;
  if (status === 'invalid') return <PageHeader locale={locale} title={t('invalidTitle')} description={t('invalidSub')} />;

  return (
    <>
      <PageHeader locale={locale} title={t('confirmTitle')} description={t('confirmSub', { email })} />
      <div className={`container ${styles.actions}`}>
        <Button size="lg" onClick={confirm} isLoading={status === 'sending'} disabled={status === 'sending'}>
          {status === 'sending' ? t('confirming') : t('confirmButton')}
        </Button>
        {status === 'error' && <p className={styles.error}>{t('error')}</p>}
      </div>
    </>
  );
}
