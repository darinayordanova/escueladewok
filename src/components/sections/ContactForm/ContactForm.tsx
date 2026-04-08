'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import Button from '@/components/ui/Button/Button';
import { Check } from '@/components/ui/icons';
import Input from '@/components/ui/Input/Input';
import Textarea from '@/components/ui/Textarea/Textarea';

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
      <div className={`${styles.success}`}>
        <div className={`flex flex-align-center flex-justify-center p-1 ${styles.successIcon}`}>
        <Check size={20} /></div>
        <p>{successMessage ?? t('success')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {title && <h2>{title}</h2>}

      <Input
        id="contact-name"
        label={t('name')}
        name="name"
        type="text"
        placeholder={t('namePlaceholder')}
        value={form.name}
        onChange={handleChange}
        required
        disabled={status === 'sending'}
        autoComplete="name"
      />

      <Input
        id="contact-email"
        label={t('email')}
        name="email"
        type="email"
        placeholder={t('emailPlaceholder')}
        value={form.email}
        onChange={handleChange}
        required
        disabled={status === 'sending'}
        autoComplete="email"
      />

      <Textarea
        id="contact-message"
        label={t('message')}
        name="message"
        placeholder={t('messagePlaceholder')}
        value={form.message}
        onChange={handleChange}
        required
        rows={5}
        disabled={status === 'sending'}
      />

      {status === 'error' && <p className={styles.error}>{t('error')}</p>}

      <Button type="submit" fullWidth size="lg" isLoading={status === 'sending'} disabled={status === 'sending'}>
        {status === 'sending' ? t('sending') : t('submit')}
      </Button>
    </form>
  );
}
