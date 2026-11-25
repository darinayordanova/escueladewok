import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import ContactForm from '@/components/sections/ContactForm/ContactForm';
import PageHeader from '@/components/sections/PageHeader/PageHeader';
import Map from '@/components/ui/Map/Map';
import { sanityClient } from '@/lib/sanity/client';
import { contactPageQuery } from '@/lib/sanity/queries';
import { buildPageMetadata } from '@/lib/seo';
import type { ContactPage, Locale } from '@/types';

import styles from './page.module.scss';

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  const page = await sanityClient.fetch<ContactPage>(contactPageQuery);
  const l = locale as Locale;

  return buildPageMetadata({
    locale,
    path: '/contact',
    title: page?.title?.[l] ?? t('pageTitle'),
    description: page?.subtitle?.[l] ?? t('pageDescription'),
  });
}

export default async function ContactPageRoute({ params }: ContactPageProps) {
  const { locale } = await params;
  const [t, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'contact' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);
  const l = locale as Locale;

  const page = await sanityClient.fetch<ContactPage>(contactPageQuery);

  const hasContactInfo = page?.email || page?.phone || page?.address?.[l];

  return (
    <>
      <PageHeader
        locale={locale}
        title={page?.title?.[l] ?? t('pageTitle')}
        description={page?.subtitle?.[l]}
        breadcrumbs={[
          { name: tNav('home'), path: '/' },
          { name: tNav('contact'), path: '/contact' },
        ]}
        breadcrumbsLabel={tNav('breadcrumb')}
      />
      <div className="container pt-10 pb-16">

        <div className={hasContactInfo ? styles.layout : styles.layoutCentered}>
          {/* ── Contact info ── */}
          {hasContactInfo && (
            <aside className={styles.info}>
              {page?.email && (
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>{t('emailLabel')}</p>
                  <a href={`mailto:${page.email}`} className={styles.infoLink}>
                    {page.email}
                  </a>
                </div>
              )}
              {page?.phone && (
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>{t('phoneLabel')}</p>
                  <a href={`tel:${page.phone}`} className={styles.infoLink}>
                    {page.phone}
                  </a>
                </div>
              )}
              {page?.address?.[l] && (
                <div className={styles.infoItem}>
                  <p className={styles.infoLabel}>{t('addressLabel')}</p>
                  <p className={styles.infoText}>{page.address[l]}</p>
                  <Map lat={40.4241} lng={-3.7137} label="C. del Conde Duque, 10, Madrid" />
                </div>
              )}
            </aside>
          )}

          {/* ── Contact form ── */}
          <div className={styles.formWrapper}>
            <ContactForm
              title={page?.formTitle?.[l]}
              successMessage={page?.successMessage?.[l]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
