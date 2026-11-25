import { notFound } from 'next/navigation';

import BookingConfirmation, { type BookedClass } from '@/components/sections/BookingConfirmation/BookingConfirmation';
import VoucherConfirmation from '@/components/sections/VoucherConfirmation/VoucherConfirmation';
import { sanityClient } from '@/lib/sanity/client';
import { addDaysISO, madridToday } from '@/lib/vouchers';

// Dev-only preview of the thank-you pages — blocked in production
// Bookings: http://localhost:3000/en/dev/confirmation?case=booking  (or booking2 for two classes)
// Vouchers: http://localhost:3000/en/dev/confirmation?case=printed|scheduled|sent|self&theme=christmas
const VOUCHER_CASES: Record<string, Record<string, string>> = {
  printed: { voucher_format: 'physical' },
  scheduled: { voucher_format: 'digital', recipient_email: 'ana@example.com', send_date: addDaysISO(madridToday(), 12) },
  sent: { voucher_format: 'digital', recipient_email: 'ana@example.com' },
  self: { voucher_format: 'digital' },
};

export default async function ConfirmationPreview({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ case?: string; theme?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { locale } = await params;
  const { case: sample = 'printed', theme = 'classic' } = await searchParams;

  if (sample.startsWith('booking')) {
    const count = sample === 'booking2' ? 2 : 1;
    const courses = await sanityClient.fetch<Pick<BookedClass, 'title' | 'image'>[]>(
      `*[_type == "course" && defined(image) && corporateEvent != true][0...${count}] { title, image }`,
    );
    return (
      <BookingConfirmation
        locale={locale}
        customerName="Jane Smith"
        customerEmail="jane@example.com"
        amountPaid={count * 89}
        currency="EUR"
        classes={courses.map((course, i) => ({
          ...course,
          date: addDaysISO(madridToday(), 9 + i * 7),
          startTime: '18:30',
          endTime: '21:30',
          quantity: i + 1,
        }))}
      />
    );
  }

  const isPrinted = sample === 'printed';
  return (
    <VoucherConfirmation
      locale={locale}
      order={{
        meta: {
          purchase_type: 'voucher',
          voucher_key: 'classVoucher',
          voucher_theme: theme,
          recipient_name: 'Ana García',
          sender_name: 'Jane Smith',
          message: 'Hope you enjoy the class!',
          ...(VOUCHER_CASES[sample] ?? VOUCHER_CASES.printed),
        },
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        amountPaid: isPrinted ? 94 : 89,
        currency: 'EUR',
        postTo: isPrinted ? 'Calle de Ejemplo, 28013 Madrid' : undefined,
      }}
    />
  );
}
