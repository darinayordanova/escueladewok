import { PortableText } from '@portabletext/react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import PageHeader from '@/components/sections/PageHeader/PageHeader';
import { sanityClient } from '@/lib/sanity/client';
import { termsPageQuery } from '@/lib/sanity/queries';
import { buildPageMetadata } from '@/lib/seo';
import type { LegalPage, Locale } from '@/types';

import styles from './page.module.scss';

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  const page = await sanityClient.fetch<LegalPage>(termsPageQuery);
  const l = locale as Locale;

  return {
    ...buildPageMetadata({
      locale,
      path: '/terms',
      title: page?.title?.[l] ?? t('terms'),
      description: t('termsDescription'),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const [t, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'legal' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);
  const l = locale as Locale;

  const page = await sanityClient.fetch<LegalPage>(termsPageQuery);
  const title = page?.title?.[l] ?? t('terms');

  return (
    <>
      <PageHeader
        locale={locale}
        title={title}
        description={page?.lastUpdated ? t('lastUpdated', { date: new Intl.DateTimeFormat(l, { dateStyle: 'long' }).format(new Date(page.lastUpdated)) }) : undefined}
        breadcrumbs={[
          { name: tNav('home'), path: '/' },
          { name: title, path: '/terms' },
        ]}
        breadcrumbsLabel={tNav('breadcrumb')}
      />
      <div className={`container ${styles.page}`}>

        {page?.content?.[l] && page.content[l].length > 0 && (
          <div className={styles.prose}>
            <PortableText value={page.content[l]} />
          </div>
        )}
      </div>
    </>
  );
}
