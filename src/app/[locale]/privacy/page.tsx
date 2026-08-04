import type { Metadata } from 'next';
import { PortableText } from '@portabletext/react';
import { getTranslations } from 'next-intl/server';

import { sanityClient } from '@/lib/sanity/client';
import { privacyPageQuery } from '@/lib/sanity/queries';
import { buildPageMetadata } from '@/lib/seo';
import type { LegalPage, Locale } from '@/types';

import styles from './page.module.scss';

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  const page = await sanityClient.fetch<LegalPage>(privacyPageQuery);
  const l = locale as Locale;

  return {
    ...buildPageMetadata({
      locale,
      path: '/privacy',
      title: page?.title?.[l] ?? t('privacy'),
      description: t('privacyDescription'),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  const l = locale as Locale;

  const page = await sanityClient.fetch<LegalPage>(privacyPageQuery);

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.title}>
            {page?.title?.[l] ?? t('privacy')}
          </h1>
          {page?.lastUpdated && (
            <p className={styles.lastUpdated}>
              {t('lastUpdated', { date: page.lastUpdated })}
            </p>
          )}
        </header>

        {page?.content?.[l] && page.content[l].length > 0 && (
          <div className={styles.prose}>
            <PortableText value={page.content[l]} />
          </div>
        )}
      </div>
    </div>
  );
}
