import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';

import Footer from '@/components/layout/Footer/Footer';
import Header from '@/components/layout/Header/Header';
import { routing } from '@/i18n/routing';
import { DEFAULT_OG_IMAGE, OG_LOCALE, SITE_NAME, SITE_URL } from '@/lib/seo';
import type { Locale } from '@/types';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: {
      template: `%s | ${SITE_NAME}`,
      default: SITE_NAME,
    },
    description: t('description'),
    openGraph: {
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale] ?? 'en_US',
      alternateLocale: locale === 'en' ? ['es_ES'] : ['en_US'],
      type: 'website',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: {
      languages: {
        en: `${SITE_URL}/en`,
        es: `${SITE_URL}/es`,
        'x-default': `${SITE_URL}/en`,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale as Locale} messages={messages}>
      <Header />
      <main>{children}</main>
      <Footer />
    </NextIntlClientProvider>
  );
}
