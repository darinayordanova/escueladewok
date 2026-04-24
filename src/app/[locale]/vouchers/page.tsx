import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { buildAlternates, DEFAULT_OG_IMAGE, OG_LOCALE, SITE_URL } from '@/lib/seo';

import VoucherBuyButton from './VoucherBuyButton';

import styles from './page.module.scss';

interface VouchersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: VouchersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'vouchers' });
  const title = t('pageTitle');
  const description = t('pageDescription');

  return {
    title,
    description,
    alternates: buildAlternates('/vouchers'),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/vouchers`,
      locale: OG_LOCALE[locale] ?? 'en_US',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
  };
}

const VOUCHERS = [
  { key: 'classVoucher', price: '69 €' },
  { key: 'giftCard25', price: '25 €' },
  { key: 'giftCard50', price: '50 €' },
] as const;

export default async function VouchersPage({ params }: VouchersPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'vouchers' });

  return (
    <div className="container flex flex-wrap-wrap flex-justify-center">
      <div className="text-center mb-12 col-12 col-md-8">
        <h1 className='h3'>{t('pageTitle')}</h1>
        <p className={"text-lg color-text-light"}>{t('pageDescription')}</p>
      </div>

      <div className={"grid gap-6 pb-16 col-12"}>
        {VOUCHERS.map(({ key, price }) => (
          <div key={key} className={`col-12 col-md-4 ${styles.card}`}>
            <div className={styles.cardBanner}>
              <span className={styles.cardPrice}>{price}</span>
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>{t(key)}</h2>
              <p className={styles.cardDesc}>{t(`${key}Desc` as Parameters<typeof t>[0])}</p>
              <p className={styles.validity}>{t('validityNote')}</p>
              <VoucherBuyButton voucherKey={key} locale={locale} label={t('buyVoucher')} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
