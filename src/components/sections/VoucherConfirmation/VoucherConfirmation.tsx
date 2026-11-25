import { getTranslations } from 'next-intl/server';

import Confirmation, { type ConfirmationStep } from '@/components/sections/Confirmation/Confirmation';
import VoucherPreview from '@/components/sections/VoucherBuilder/VoucherPreview';
import { formatPrice } from '@/lib/format';
import { formatVoucherDate, madridToday, voucherAmount, type VoucherKey } from '@/lib/vouchers';
import { isVoucherTheme } from '@/lib/voucherThemes';

/** A paid voucher order, as the checkout session holds it. */
export interface VoucherOrder {
  /** Checkout metadata written by /api/checkout/voucher. */
  meta: Record<string, string>;
  customerName: string;
  customerEmail: string;
  amountPaid: number;
  currency: string;
  /** Printed cards: street, postcode and city. */
  postTo?: string;
}

/** After a voucher purchase: the voucher itself and what happens next. */
export default async function VoucherConfirmation({ order, locale }: { order: VoucherOrder; locale: string }) {
  const t = await getTranslations({ locale, namespace: 'voucherSuccess' });
  const { meta, customerName, customerEmail, postTo } = order;

  const voucherKey     = (meta.voucher_key || 'classVoucher') as VoucherKey;
  const isPrinted      = meta.voucher_format === 'physical';
  const recipientName  = meta.recipient_name || customerName;
  const recipientEmail = meta.recipient_email ?? '';
  const sendDate       = meta.send_date ?? '';
  const isScheduled    = !!recipientEmail && !!sendDate && sendDate > madridToday();
  // Noon UTC is the same calendar day in Madrid
  const sendOn         = isScheduled ? formatVoucherDate(new Date(`${sendDate}T12:00:00Z`), locale) : '';

  // What happens next, by how the voucher reaches the recipient
  const paid: ConfirmationStep = { title: t('stepPaid'), detail: formatPrice(order.amountPaid, order.currency, locale), done: true };
  const copy: ConfirmationStep = { title: t('stepCopy'), detail: customerEmail, done: true };
  const steps: ConfirmationStep[] = isPrinted
    ? [paid, { title: t('stepPrint'), detail: postTo || undefined, done: false }, { title: t('stepTracking'), detail: t('stepTrackingDetail'), done: false }]
    : !recipientEmail
      ? [paid, copy, { title: t('stepGive', { name: recipientName }), detail: t('stepGiveDetail'), done: false }]
      : isScheduled
        ? [paid, copy, { title: t('stepScheduled', { name: recipientName, date: sendOn }), detail: t('stepScheduledDetail', { email: recipientEmail }), done: false }]
        : [paid, copy, { title: t('stepSent', { name: recipientName }), detail: recipientEmail, done: true }];

  return (
    <Confirmation
      title={t('title')}
      subtitle={isPrinted || recipientEmail ? t('subtitle', { name: recipientName }) : t('subtitleReady', { name: recipientName })}
      aside={
        <VoucherPreview
          voucherKey={voucherKey}
          amount={voucherAmount(voucherKey) ?? 0}
          format={isPrinted ? 'physical' : 'digital'}
          theme={isVoucherTheme(meta.voucher_theme) ? meta.voucher_theme : 'classic'}
          to={recipientName}
          from={meta.sender_name || customerName}
          message={meta.message ?? ''}
          locale={locale}
        />
      }
      stepsLabel={t('stepsLabel')}
      steps={steps}
      actions={{
        primary: { label: t('browseClasses'), href: '/courses' },
        secondary: { label: t('browseVouchers'), href: '/vouchers' },
      }}
    />
  );
}
