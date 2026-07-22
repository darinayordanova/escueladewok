'use client';

import { useState } from 'react';

import Button from '@/components/ui/Button/Button';

interface Props {
  voucherKey: 'classVoucher' | 'classVoucherForTwo' | 'giftCard25' | 'giftCard50';
  locale: string;
  label: string;
}

export default function VoucherBuyButton({ voucherKey, locale, label }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherKey,
          locale,
          cancelPath: `/${locale}/vouchers`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('[VoucherBuyButton]', data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error('[VoucherBuyButton]', err);
      setLoading(false);
    }
  }

  return (
    <Button fullWidth onClick={handleBuy} isLoading={loading}>
      {label}
    </Button>
  );
}
