'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import Textarea from '@/components/ui/Textarea/Textarea';

import styles from './CorporateEnquiryForm.module.scss';

interface CorporateEnquiryFormProps {
  courseName: string;
}

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function CorporateEnquiryForm({ courseName }: CorporateEnquiryFormProps) {
  const t = useTranslations('corporateEnquiry');

  const [status, setStatus] = useState<Status>('idle');
  const [fields, setFields] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    participants: '',
    message: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/corporate-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseName, ...fields }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.card}>
        <div className={styles.success}>
          <p className={styles.successTitle}>{t('successTitle')}</p>
          <p className={styles.successSub}>{t('successSub')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>{t('heading')}</h2>
      <p className={styles.sub}>{t('sub')}</p>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <Input
          id="ceq-company"
          label={`${t('company')} *`}
          name="company"
          type="text"
          placeholder={t('companyPlaceholder')}
          value={fields.company}
          onChange={handleChange}
          required
        />

        <Input
          id="ceq-name"
          label={`${t('name')} *`}
          name="name"
          type="text"
          placeholder={t('namePlaceholder')}
          value={fields.name}
          onChange={handleChange}
          required
        />

        <Input
          id="ceq-email"
          label={`${t('email')} *`}
          name="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          value={fields.email}
          onChange={handleChange}
          required
        />

        <div className={styles.row}>
          <Input
            id="ceq-phone"
            label={t('phone')}
            name="phone"
            type="tel"
            placeholder={t('phonePlaceholder')}
            value={fields.phone}
            onChange={handleChange}
          />
          <Input
            id="ceq-participants"
            label={t('participants')}
            name="participants"
            type="number"
            min="1"
            placeholder="20"
            value={fields.participants}
            onChange={handleChange}
          />
        </div>

        <Textarea
          id="ceq-message"
          label={t('message')}
          name="message"
          placeholder={t('messagePlaceholder')}
          rows={4}
          value={fields.message}
          onChange={handleChange}
        />

        {status === 'error' && <p className={styles.error}>{t('error')}</p>}

        <Button type="submit" fullWidth isLoading={status === 'sending'} disabled={status === 'sending'}>
          {status === 'sending' ? t('sending') : t('submit')}
        </Button>
      </form>
    </div>
  );
}
