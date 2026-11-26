import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';

import { Heart } from '@/components/sections/ValentinesLanding/art';
import ExampleVoucher from '@/components/sections/ValentinesLanding/ExampleVoucher';
import Button from '@/components/ui/Button/Button';
import { formatPrice } from '@/lib/format';
import { valentinesDates, VOUCHER_OPTIONS } from '@/lib/vouchers';

import styles from './ValentinesPromo.module.scss';

/** Hearts on the blush, as on the Valentine's page: [left %, top %, width px]. */
const HEARTS = [[3, 18, 16], [44, 10, 12], [48, 78, 18], [96, 22, 14], [92, 84, 12]];

/** Homepage block pointing to the Valentine's voucher page — shown 15 January to 14 February only. */
export default async function ValentinesPromo({ locale }: { locale: string }) {
  const dates = valentinesDates();
  if (!dates.isSeason) return null;
  const t = await getTranslations({ locale, namespace: 'valentines.promo' });
  const lowest = Math.min(...VOUCHER_OPTIONS.map((option) => option.amount));

  return (
    <section className={styles.section}>
      {HEARTS.map(([left, top, size], i) => (
        <Heart
          key={i}
          className={styles.heart}
          style={{ left: `${left}%`, top: `${top}%`, width: size, '--t': `${2.2 + i * 0.35}s`, '--d': `${-i * 0.6}s` } as CSSProperties}
        />
      ))}
      <div className={`container ${styles.inner}`}>
        <div className={styles.voucher}>
          <ExampleVoucher locale={locale} />
        </div>
        <div>
          <h2 className={styles.title}>{t('title')}</h2>
          <p className={styles.sub}>{t(dates.isValentinesDay ? 'subToday' : 'sub', { price: formatPrice(lowest, 'EUR', locale) })}</p>
          <Button href="/valentines">{t('cta')}</Button>
        </div>
      </div>
    </section>
  );
}
