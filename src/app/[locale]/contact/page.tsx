import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import ContactForm from '@/components/sections/ContactForm/ContactForm';
import { sanityClient } from '@/lib/sanity/client';
import { contactPageQuery } from '@/lib/sanity/queries';
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
  return {
    title: page?.title?.[l] ?? t('pageTitle'),
    description: page?.subtitle?.[l] ?? t('pageDescription'),
  };
}

export default async function ContactPageRoute({ params }: ContactPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  const l = locale as Locale;

  const page = await sanityClient.fetch<ContactPage>(contactPageQuery);

  const hasContactInfo = page?.email || page?.phone || page?.address?.[l];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <h1 className={styles.title}>{page?.title?.[l] ?? t('pageTitle')}</h1>
          {page?.subtitle?.[l] && (
            <p className={styles.subtitle}>{page.subtitle[l]}</p>
          )}
        </header>

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
