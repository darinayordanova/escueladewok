import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import ContactForm from '@/components/sections/ContactForm/ContactForm';
import Map from '@/components/ui/Map/Map';
import { sanityClient } from '@/lib/sanity/client';
import { contactPageQuery } from '@/lib/sanity/queries';
import { buildAlternates, DEFAULT_OG_IMAGE, OG_LOCALE, SITE_URL } from '@/lib/seo';
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
  const title = page?.title?.[l] ?? t('pageTitle');
  const description = page?.subtitle?.[l] ?? t('pageDescription');

  return {
    title,
    description,
    alternates: buildAlternates('/contact'),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/contact`,
      locale: OG_LOCALE[locale] ?? 'en_US',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function ContactPageRoute({ params }: ContactPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  const l = locale as Locale;

  const page = await sanityClient.fetch<ContactPage>(contactPageQuery);

  const hasContactInfo = page?.email || page?.phone || page?.address?.[l];

  return (
    <div>
      <div className="container pb-16 flex flex-wrap-wrap flex-justify-center">
        {/* ── Header ── */}
        <header className={"  text-center mb-12 col-12 col-md-8"}>
          <h1 className={"h3"}>{page?.title?.[l] ?? t('pageTitle')}</h1>
          {page?.subtitle?.[l] && (
            <p className={"text-lg color-text-light"}>{page.subtitle[l]}</p>
          )}
        </header>

        <div className={`${hasContactInfo ? styles.layout : styles.layoutCentered} col-12`}>
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
    </div>
  );
}
