import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import CorporateLanding from '@/components/sections/CorporateLanding/CorporateLanding';
import { EXTRAS, isFormat } from '@/components/sections/CorporateLanding/options';
import { buildPageMetadata } from '@/lib/seo';
import type { Locale } from '@/types';

interface CorporatePageProps {
  params: Promise<{ locale: string }>;
  /** A format card links here with ?format=office, "Add it to your request" with ?extra=impact: the form opens with them */
  searchParams: Promise<{ format?: string; extra?: string }>;
}

export async function generateMetadata({ params }: CorporatePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'corporatePage' });

  return buildPageMetadata({
    locale,
    path: '/corporate',
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

export default async function CorporatePage({ params, searchParams }: CorporatePageProps) {
  const { locale } = await params;
  const { format, extra } = await searchParams;
  return (
    <CorporateLanding
      locale={locale as Locale}
      initialFormat={isFormat(format) ? format : undefined}
      initialExtras={extra && (EXTRAS as readonly string[]).includes(extra) ? [extra] : undefined}
    />
  );
}
