import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import ValentinesLanding from '@/components/sections/ValentinesLanding/ValentinesLanding';
import { sanityClient } from '@/lib/sanity/client';
import { allCoursesQuery } from '@/lib/sanity/queries';
import { buildPageMetadata, SITE_URL } from '@/lib/seo';
import { isVoucherKey, sendDateFromLink } from '@/lib/vouchers';
import type { Course, Locale } from '@/types';

// Valentine's gift vouchers — linked from the homepage in season and shared in ads (/es/san-valentin redirects here)

interface ValentinesPageProps {
  params: Promise<{ locale: string }>;
  /** Set by the cards in the envelope (?amount=) and by ads that link a send date (?send=). */
  searchParams: Promise<{ amount?: string; send?: string }>;
}

export async function generateMetadata({ params }: ValentinesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'valentines' });
  return buildPageMetadata({
    locale,
    path: '/valentines',
    title: t('meta.title'),
    description: t('meta.description'),
    image: `${SITE_URL}/images/instructor.webp`,
  });
}

export default async function ValentinesPage({ params, searchParams }: ValentinesPageProps) {
  const { locale } = await params;
  const { amount, send } = await searchParams;
  const courses = await sanityClient.fetch<Course[]>(allCoursesQuery).catch(() => []);
  const initial = {
    voucherKey: isVoucherKey(amount) ? amount : undefined,
    sendDate: sendDateFromLink(send),
  };
  return <ValentinesLanding courses={courses} locale={locale as Locale} initial={initial} />;
}
