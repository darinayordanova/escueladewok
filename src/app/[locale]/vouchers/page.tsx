import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import PageHeader from '@/components/sections/PageHeader/PageHeader';
import { buildPageMetadata } from '@/lib/seo';

import styles from './page.module.scss';
import VoucherBuyButton from './VoucherBuyButton';


interface VouchersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: VouchersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'vouchers' });

  return buildPageMetadata({
    locale,
    path: '/vouchers',
    title: t('pageTitle'),
    description: t('pageDescription'),
  });
}

const VOUCHERS = [
  { key: 'classVoucher',       price: '89 €'  },
  { key: 'classVoucherForTwo', price: '178 €' },
  { key: 'giftCard25',         price: '25 €'  },
  { key: 'giftCard50',         price: '50 €'  },
] as const;

export default async function VouchersPage({ params }: VouchersPageProps) {
  const { locale } = await params;
  const [t, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'vouchers' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);

  return (
    <>
      <PageHeader
        locale={locale}
        title={t('pageTitle')}
        description={t('pageDescription')}
        breadcrumbs={[
          { name: tNav('home'), path: '/' },
          { name: tNav('vouchers'), path: '/vouchers' },
        ]}
        breadcrumbsLabel={tNav('breadcrumb')}
      />
      <div className="container pt-10 pb-16">
        <div className={`grid gap-6 ${styles.cardGrid}`}>
        {VOUCHERS.map(({ key, price }) => (
          <div key={key} className={`col-12 col-md-6 ${styles.card}`}>
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
    </>
  );
}
