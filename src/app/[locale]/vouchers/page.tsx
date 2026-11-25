import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import PageHeader from '@/components/sections/PageHeader/PageHeader';
import VoucherBuilder from '@/components/sections/VoucherBuilder/VoucherBuilder';
import { buildPageMetadata } from '@/lib/seo';

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
        <VoucherBuilder locale={locale} />
      </div>
    </>
  );
}
