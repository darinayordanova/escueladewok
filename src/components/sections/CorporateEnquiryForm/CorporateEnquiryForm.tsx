'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

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

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="ceq-company" className={styles.label}>{t('company')} *</label>
          <input
            id="ceq-company"
            name="company"
            type="text"
            className={styles.input}
            placeholder={t('companyPlaceholder')}
            value={fields.company}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="ceq-name" className={styles.label}>{t('name')} *</label>
          <input
            id="ceq-name"
            name="name"
            type="text"
            className={styles.input}
            placeholder={t('namePlaceholder')}
            value={fields.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="ceq-email" className={styles.label}>{t('email')} *</label>
          <input
            id="ceq-email"
            name="email"
            type="email"
            className={styles.input}
            placeholder={t('emailPlaceholder')}
            value={fields.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="ceq-phone" className={styles.label}>{t('phone')}</label>
            <input
              id="ceq-phone"
              name="phone"
              type="tel"
              className={styles.input}
              placeholder={t('phonePlaceholder')}
              value={fields.phone}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="ceq-participants" className={styles.label}>{t('participants')}</label>
            <input
              id="ceq-participants"
              name="participants"
              type="number"
              min="1"
              className={styles.input}
              placeholder="20"
              value={fields.participants}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="ceq-message" className={styles.label}>{t('message')}</label>
          <textarea
            id="ceq-message"
            name="message"
            className={styles.textarea}
            placeholder={t('messagePlaceholder')}
            rows={4}
            value={fields.message}
            onChange={handleChange}
          />
        </div>

        {status === 'error' && (
          <p className={styles.error}>{t('error')}</p>
        )}

        <button type="submit" className={styles.submit} disabled={status === 'sending'}>
          {status === 'sending' ? t('sending') : t('submit')}
        </button>
      </form>
    </div>
  );
}
