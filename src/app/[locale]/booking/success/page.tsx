import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/courses/timeslots';
import { stripe } from '@/lib/stripe/client';
import type { Locale } from '@/types';

import styles from './page.module.scss';

interface SuccessPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export async function generateMetadata({ params }: SuccessPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'bookingSuccess' });
  return { title: t('title') };
}

export default async function BookingSuccessPage({ params, searchParams }: SuccessPageProps) {
  const { locale } = await params;
  const { session_id } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'bookingSuccess' });
  const l = locale as Locale;

  if (!session_id) notFound();

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    notFound();
  }

  if (session.status !== 'complete' && session.status !== 'paid' as string) {
    notFound();
  }

  const meta = session.metadata ?? {};
  const amount = session.amount_total ? session.amount_total / 100 : 0;
  const currency = session.currency?.toUpperCase() ?? '';

  // Customer details are on the session itself (collected by Stripe Checkout)
  const customerName =
    session.custom_fields?.find((f) => f.key === 'customer_name')?.text?.value ?? '';
  const customerEmail = session.customer_details?.email ?? session.customer_email ?? '';

  const formattedDate = meta.date
    ? formatDate(meta.date, l, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : meta.date;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon} aria-hidden="true">✓</div>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>

          <dl className={styles.details}>
            <div className={styles.row}>
              <dt>{t('course')}</dt>
              <dd>{meta.courseTitle}</dd>
            </div>
            <div className={styles.row}>
              <dt>{t('date')}</dt>
              <dd>{formattedDate}</dd>
            </div>
            <div className={styles.row}>
              <dt>{t('time')}</dt>
              <dd>{meta.timeRange ?? `${meta.startTime} – ${meta.endTime}`}</dd>
            </div>
            {customerName && (
              <div className={styles.row}>
                <dt>{t('name')}</dt>
                <dd>{customerName}</dd>
              </div>
            )}
            {customerEmail && (
              <div className={styles.row}>
                <dt>{t('email')}</dt>
                <dd>{customerEmail}</dd>
              </div>
            )}
            <div className={styles.row}>
              <dt>{t('amountPaid')}</dt>
              <dd>{amount} {currency}</dd>
            </div>
          </dl>

          <p className={styles.emailNote}>{t('emailNote')}</p>

          <Link href="/courses" className={styles.backLink}>
            {t('backToCourses')} &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
