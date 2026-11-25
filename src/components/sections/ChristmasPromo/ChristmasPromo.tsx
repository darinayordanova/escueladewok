import { getTranslations } from 'next-intl/server';

import VoucherPreview from '@/components/sections/VoucherBuilder/VoucherPreview';
import Button from '@/components/ui/Button/Button';
import { formatPrice } from '@/lib/format';
import { christmasDates, VOUCHER_OPTIONS } from '@/lib/vouchers';

import styles from './ChristmasPromo.module.scss';

/** Homepage block pointing to the Christmas voucher page — shown 1 November to 25 December only. */
export default async function ChristmasPromo({ locale }: { locale: string }) {
  if (!christmasDates().isSeason) return null;
  const t = await getTranslations({ locale, namespace: 'christmas.promo' });
  const lowest = Math.min(...VOUCHER_OPTIONS.map((option) => option.amount));

  return (
    <section className={styles.section}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.voucher}>
          <VoucherPreview voucherKey="classVoucher" amount={89} format="digital" theme="christmas" to="" from="" message="" locale={locale} bare />
        </div>
        <div>
          <h2 className={styles.title}>{t('title')}</h2>
          <p className={styles.sub}>{t('sub', { price: formatPrice(lowest, 'EUR', locale) })}</p>
          <Button href="/christmas">{t('cta')}</Button>
        </div>
      </div>
    </section>
  );
}
