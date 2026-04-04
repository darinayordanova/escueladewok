'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import Button from '@/components/ui/Button/Button';

import styles from './ContactForm.module.scss';

interface ContactFormProps {
  title?: string;
  successMessage?: string;
}

export default function ContactForm({ title, successMessage }: ContactFormProps) {
  const t = useTranslations('contact.form');

  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Request failed');

      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.success}>
        <span className={styles.successIcon} aria-hidden="true">✓</span>
        <p>{successMessage ?? t('success')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {title && <h2 className={styles.title}>{title}</h2>}

      <div className={styles.field}>
        <label htmlFor="contact-name" className={styles.label}>{t('name')}</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          className={styles.input}
          placeholder={t('namePlaceholder')}
          value={form.name}
          onChange={handleChange}
          required
          disabled={status === 'sending'}
          autoComplete="name"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-email" className={styles.label}>{t('email')}</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          className={styles.input}
          placeholder={t('emailPlaceholder')}
          value={form.email}
          onChange={handleChange}
          required
          disabled={status === 'sending'}
          autoComplete="email"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-message" className={styles.label}>{t('message')}</label>
        <textarea
          id="contact-message"
          name="message"
          className={styles.textarea}
          placeholder={t('messagePlaceholder')}
          value={form.message}
          onChange={handleChange}
          required
          rows={5}
          disabled={status === 'sending'}
        />
      </div>

      {status === 'error' && (
        <p className={styles.error}>{t('error')}</p>
      )}

      <Button type="submit" fullWidth size="lg" isLoading={status === 'sending'} disabled={status === 'sending'}>
        {status === 'sending' ? t('sending') : t('submit')}
      </Button>
    </form>
  );
}
