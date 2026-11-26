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

  async function confirm() {
    setStatus('sending');
    try {
      const res = await fetch('/api/subscribe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      setStatus(res.ok ? 'done' : res.status === 400 ? 'invalid' : 'error');
    } catch {
      setStatus('error');
    }
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
