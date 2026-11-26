import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import PageHeader from '@/components/sections/PageHeader/PageHeader';
import SubscribeConfirm from '@/components/sections/SubscribeConfirm/SubscribeConfirm';
import { buildPageMetadata } from '@/lib/seo';
import { getPendingSubscriber } from '@/lib/subscribers';

interface ConfirmPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: ConfirmPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'newsletter' });
  return {
    ...buildPageMetadata({ locale, path: '/subscribe/confirm', title: t('confirmTitle') }),
    robots: { index: false, follow: false },
  };
}

/** Where the double opt-in email lands. Shows a button; only pressing it confirms. */
export default async function SubscribeConfirmPage({ params, searchParams }: ConfirmPageProps) {
  const { locale } = await params;
  const { token } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'newsletter' });

  const subscriber = token ? await getPendingSubscriber(token) : null;

  if (!token || !subscriber) {
    return <PageHeader locale={locale} title={t('invalidTitle')} description={t('invalidSub')} />;
  }

  return <SubscribeConfirm token={token} email={subscriber.email} />;
}
