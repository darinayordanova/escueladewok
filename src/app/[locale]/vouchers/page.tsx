import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import PageHeader from '@/components/sections/PageHeader/PageHeader';
import VoucherBuilder from '@/components/sections/VoucherBuilder/VoucherBuilder';
import { buildPageMetadata } from '@/lib/seo';
import { isVoucherKey, sendDateFromLink } from '@/lib/vouchers';
import { isVoucherTheme } from '@/lib/voucherThemes';

interface VouchersPageProps {
  params: Promise<{ locale: string }>;
  /** Links can preselect: ?amount=classVoucher&theme=christmas&send=2026-12-25 */
  searchParams: Promise<{ amount?: string; theme?: string; send?: string }>;
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

export default async function VouchersPage({ params, searchParams }: VouchersPageProps) {
  const { locale } = await params;
  const { amount, theme, send } = await searchParams;
  const sendDate = sendDateFromLink(send);
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
        <VoucherBuilder
          locale={locale}
          initial={{
            voucherKey: isVoucherKey(amount) ? amount : undefined,
            theme: isVoucherTheme(theme) ? theme : undefined,
            sendDate,
          }}
        />
      </div>
    </>
  );
}
