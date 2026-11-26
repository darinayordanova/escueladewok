'use client';

import { useTranslations } from 'next-intl';

import Checkbox from '@/components/ui/Checkbox/Checkbox';

import styles from './CheckoutOptIn.module.scss';

interface CheckoutOptInProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/**
 * The newsletter box beside a "pay" button. Unticked by default (RGPD: consent is an
 * active choice, never a condition of buying). The email address only exists on Stripe's
 * page, so the choice travels in the session metadata and the Stripe webhook sends the
 * usual confirmation email once the payment succeeds.
 */
export default function CheckoutOptIn({ checked, onChange, className }: CheckoutOptInProps) {
  const t = useTranslations('newsletter');
  return (
    <Checkbox
      className={[styles.optIn, className ?? ''].filter(Boolean).join(' ')}
      labelClassName={styles.label}
      label={t('consent')}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}
