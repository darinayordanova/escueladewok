import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { Check } from '@/components/ui/icons';
import Link from '@/components/ui/Link/Link';
import { formatDate } from '@/lib/courses/timeslots';
import { getStripe } from '@/lib/stripe/client';
import { formatVoucherTypeName } from '@/lib/pdf/voucherPdf';
import type { Locale } from '@/types';

import styles from './page.module.scss';

interface SuccessPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export async function generateMetadata({ params, searchParams }: SuccessPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { session_id } = await searchParams;
  let isVoucher = false;
  if (session_id) {
    try {
      const s = await getStripe().checkout.sessions.retrieve(session_id, { expand: [] });
      isVoucher = s.metadata?.purchase_type === 'voucher';
    } catch { /* ignore */ }
  }
  const ns = isVoucher ? 'voucherSuccess' : 'bookingSuccess';
  const t = await getTranslations({ locale, namespace: ns });
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function BookingSuccessPage({ params, searchParams }: SuccessPageProps) {
  const { locale } = await params;
  const { session_id } = await searchParams;
  const l = locale as Locale;

  if (!session_id) notFound();

  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(session_id);
  } catch {
    notFound();
  }

  if (session.status !== 'complete' && session.status !== ('paid' as string)) notFound();

  const meta     = session.metadata ?? {};
  const amount   = session.amount_total ? session.amount_total / 100 : 0;
  const currency = session.currency?.toUpperCase() ?? '';
  const customerName  = session.customer_details?.name  ?? '';
  const customerEmail = session.customer_details?.email ?? '';

  // ── Voucher success ──────────────────────────────────────────────────────────
  if (meta.purchase_type === 'voucher') {
    const t = await getTranslations({ locale, namespace: 'voucherSuccess' });
    const recipientName  = session.custom_fields?.find((f) => f.key === 'recipient_name')?.text?.value  ?? customerName;
    const recipientEmail = session.custom_fields?.find((f) => f.key === 'recipient_email')?.text?.value ?? customerEmail;
    const sendDate       = session.custom_fields?.find((f) => f.key === 'send_date')?.text?.value       ?? '';
    const voucherKey     = meta.voucher_key ?? '';
    const isSent         = !sendDate || sendDate <= new Date().toISOString().split('T')[0];

    return (
      <div className="bg-alt">
        <div className="container flex flex-justify-center py-16">
          <div className={styles.card}>
            <div className={`bg-success color-white p-2 inline-flex flex-align-center ${styles.icon}`}>
              <Check size={28} />
            </div>
            <h1 className="h4">{t('title')}</h1>
            <p className="text-lg color-text-light">{t('subtitle')}</p>

            <dl className={styles.details}>
              {voucherKey && (
                <div className={styles.row}>
                  <dt>{t('voucher')}</dt>
                  <dd>{formatVoucherTypeName(voucherKey, l)}</dd>
                </div>
              )}
              <div className={styles.row}>
                <dt>{isSent ? t('recipient') : t('scheduledFor')}</dt>
                <dd>
                  {recipientName}{recipientEmail !== recipientName ? ` — ${recipientEmail}` : ''}
                  {!isSent && sendDate ? ` · ${sendDate}` : ''}
                </dd>
              </div>
              {customerName && (
                <div className={styles.row}>
                  <dt>{t('amountPaid')}</dt>
                  <dd>{amount} {currency}</dd>
                </div>
              )}
            </dl>

            <p className={styles.emailNote}>
              {isSent
                ? t('emailNoteSent', { email: recipientEmail })
                : t('emailNoteScheduled', { email: recipientEmail, date: sendDate })}
            </p>
            <p className={styles.emailNote}>{t('emailNoteBuyer')}</p>

            <Link href="/vouchers" hasArrow>{t('browseVouchers')}</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking success ──────────────────────────────────────────────────────────
  const t = await getTranslations({ locale, namespace: 'bookingSuccess' });

  const itemCount = parseInt(meta.item_count ?? '1', 10);
  const items = Array.from({ length: itemCount }, (_, i) => ({
    date:      meta[`item_${i}_date`] ?? meta.date ?? '',
    startTime: meta[`item_${i}_time`] ?? meta.startTime ?? '',
    endTime:   meta[`item_${i}_end`]  ?? meta.endTime ?? '',
    quantity:  parseInt(meta[`item_${i}_qty`] ?? '1', 10),
  }));

  return (
    <div className="bg-alt">
      <div className="container flex flex-justify-center py-16">
        <div className={styles.card}>
          <div className={`bg-success color-white p-2 inline-flex flex-align-center ${styles.icon}`}>
            <Check size={28} />
          </div>
          <h1 className="h4">{t('title')}</h1>
          <p className="text-lg color-text-light">{t('subtitle')}</p>

          <dl className={styles.details}>
            {items.map((item, i) => (
              <div key={i} className={styles.row}>
                <dt>{t('date')}</dt>
                <dd>
                  {formatDate(item.date, l, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  {' · '}{item.startTime} – {item.endTime}
                  {item.quantity > 1 && ` · ×${item.quantity}`}
                </dd>
              </div>
            ))}
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
          <Link href="/courses" hasArrow>{t('backToCourses')}</Link>
        </div>
      </div>
    </div>
  );
}
