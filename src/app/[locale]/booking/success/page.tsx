import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import PurchasePixel from '@/components/layout/MetaPixel/PurchasePixel';
import BookingConfirmation, {
  type BookedClass,
} from '@/components/sections/BookingConfirmation/BookingConfirmation';
import VoucherConfirmation from '@/components/sections/VoucherConfirmation/VoucherConfirmation';
import { sanityClient } from '@/lib/sanity/client';
import { bookedCoursesQuery } from '@/lib/sanity/queries';
import { buildPageMetadata } from '@/lib/seo';
import { getStripe } from '@/lib/stripe/client';
import type { LocaleString } from '@/types';

interface SuccessPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: SuccessPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { session_id } = await searchParams;
  let isVoucher = false;
  if (session_id) {
    try {
      const s = await getStripe().checkout.sessions.retrieve(session_id, { expand: [] });
      isVoucher = s.metadata?.purchase_type === 'voucher';
    } catch {
      /* ignore */
    }
  }
  const ns = isVoucher ? 'voucherSuccess' : 'bookingSuccess';
  const t = await getTranslations({ locale, namespace: ns });
  return {
    ...buildPageMetadata({ locale, path: '/booking/success', title: t('title') }),
    robots: { index: false, follow: false },
  };
}

export default async function BookingSuccessPage({ params, searchParams }: SuccessPageProps) {
  const { locale } = await params;
  const { session_id } = await searchParams;

  if (!session_id) notFound();

  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(session_id);
  } catch {
    notFound();
  }

  if (session.status !== 'complete' && session.status !== ('paid' as string)) notFound();

  const meta = session.metadata ?? {};
  const amount = session.amount_total ? session.amount_total / 100 : 0;
  const currency = session.currency?.toUpperCase() ?? '';
  const customerName = session.customer_details?.name ?? '';
  const customerEmail = session.customer_details?.email ?? '';

  // ── Voucher success ──────────────────────────────────────────────────────────
  if (meta.purchase_type === 'voucher') {
    const shipping = session.collected_information?.shipping_details;
    return (
      <>
        <PurchasePixel
          sessionId={session.id}
          value={amount}
          currency={currency}
          contentIds={[meta.voucher_key ?? 'voucher']}
          numItems={1}
        />
        <VoucherConfirmation
          locale={locale}
          order={{
            meta,
            customerName,
            customerEmail,
            amountPaid: amount,
            currency,
            postTo: shipping
              ? [
                  shipping.address.line1,
                  `${shipping.address.postal_code ?? ''} ${shipping.address.city ?? ''}`.trim(),
                ]
                  .filter(Boolean)
                  .join(', ')
              : undefined,
          }}
        />
      </>
    );
  }

  // ── Booking success ──────────────────────────────────────────────────────────
  const itemCount = parseInt(meta.item_count ?? '1', 10);
  const slugs = Array.from({ length: itemCount }, (_, i) => meta[`item_${i}_slug`]).filter(Boolean);
  const courses = slugs.length
    ? await sanityClient
        .fetch<
          { slug: string; title: LocaleString; image?: BookedClass['image'] }[]
        >(bookedCoursesQuery, { slugs })
        .catch(() => [])
    : [];

  return (
    <>
      <PurchasePixel
        sessionId={session.id}
        value={amount}
        currency={currency}
        contentIds={slugs}
        numItems={Array.from({ length: itemCount }, (_, i) =>
          parseInt(meta[`item_${i}_qty`] ?? '1', 10)
        ).reduce((a, b) => a + b, 0)}
      />
      <BookingConfirmation
        locale={locale}
        customerName={customerName}
        customerEmail={customerEmail}
        amountPaid={amount}
        currency={currency}
        classes={Array.from({ length: itemCount }, (_, i) => {
          const course = courses.find((c) => c.slug === meta[`item_${i}_slug`]);
          return {
            title: course?.title,
            image: course?.image,
            date: meta[`item_${i}_date`] ?? meta.date ?? '',
            startTime: meta[`item_${i}_time`] ?? meta.startTime ?? '',
            endTime: meta[`item_${i}_end`] ?? meta.endTime ?? '',
            quantity: parseInt(meta[`item_${i}_qty`] ?? '1', 10),
          };
        })}
      />
    </>
  );
}
