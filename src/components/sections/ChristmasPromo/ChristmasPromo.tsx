import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';

import { Star } from '@/components/sections/ChristmasLanding/art';
import ExampleVoucher from '@/components/sections/ChristmasLanding/ExampleVoucher';
import Button from '@/components/ui/Button/Button';
import { formatPrice } from '@/lib/format';
import { christmasDates, VOUCHER_OPTIONS } from '@/lib/vouchers';

import styles from './ChristmasPromo.module.scss';

/** Gold stars on the red, as on the Christmas page: [left %, top %, width px]. */
const STARS = [[3, 18, 16], [44, 10, 12], [48, 78, 18], [96, 22, 14], [92, 84, 12]];

/** Homepage block pointing to the Christmas voucher page — shown 1 November to 6 January only. */
export default async function ChristmasPromo({ locale }: { locale: string }) {
  const dates = christmasDates();
  if (!dates.isSeason) return null;
  const t = await getTranslations({ locale, namespace: 'christmas.promo' });
  const lowest = Math.min(...VOUCHER_OPTIONS.map((option) => option.amount));

  return (
    <section className={styles.section}>
      {STARS.map(([left, top, size], i) => (
        <Star
          key={i}
          className={styles.star}
          style={{ left: `${left}%`, top: `${top}%`, width: size, '--t': `${2.4 + i * 0.4}s`, '--d': `${-i * 0.7}s` } as CSSProperties}
        />
      ))}
      <div className={`container ${styles.inner}`}>
        <div className={styles.voucher}>
          <ExampleVoucher locale={locale} />
        </div>
        <div>
          <h2 className={styles.title}>{t('title')}</h2>
          <p className={styles.sub}>{t(dates.afterChristmas ? 'subReyes' : 'sub', { price: formatPrice(lowest, 'EUR', locale) })}</p>
          <Button href="/christmas" color="white">{t('cta')}</Button>
        </div>
      </div>
    </section>
  );
}
