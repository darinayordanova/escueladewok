import { getTranslations } from 'next-intl/server';

import VoucherPreview from '@/components/sections/VoucherBuilder/VoucherPreview';

/** The Valentine's voucher filled in with sample names and a message, so pictures of it aren't blank. */
export default async function ExampleVoucher({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'valentines.formats.example' });

  return (
    <VoucherPreview
      voucherKey="classVoucher"
      amount={89}
      format="digital"
      theme="valentines"
      to={t('to')}
      from={t('from')}
      message={t('message')}
      locale={locale}
      bare
    />
  );
}
