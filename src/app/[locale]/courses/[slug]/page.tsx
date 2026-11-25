import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import CorporateEnquiryForm from '@/components/sections/CorporateEnquiryForm/CorporateEnquiryForm';
import CourseAllergens from '@/components/sections/CourseAllergens/CourseAllergens';
import CourseBanner from '@/components/sections/CourseBanner/CourseBanner';
import BookingWidget from '@/components/sections/CourseBooking/BookingWidget';
import { CourseBookingProvider } from '@/components/sections/CourseBooking/CourseBookingContext';
import MobileBookingBar from '@/components/sections/CourseBooking/MobileBookingBar';
import CourseFAQ from '@/components/sections/CourseFAQ/CourseFAQ';
import CourseGallery from '@/components/sections/CourseGallery/CourseGallery';
import CourseHero from '@/components/sections/CourseHero/CourseHero';
import CourseIncluded from '@/components/sections/CourseIncluded/CourseIncluded';
import CourseIntro from '@/components/sections/CourseIntro/CourseIntro';
import CourseMenu from '@/components/sections/CourseMenu/CourseMenu';
import CourseReserve from '@/components/sections/CourseReserve/CourseReserve';
import Button from '@/components/ui/Button/Button';
import { dayPart, getFutureDateEntries, toMadridISOString } from '@/lib/courses/timeslots';
import { formatPrice } from '@/lib/format';
import { portableTextToString } from '@/lib/portableTextToString';
import { sanityClient } from '@/lib/sanity/client';
import { urlFor } from '@/lib/sanity/image';
import { confirmedBookingsForCourseQuery, courseBySlugQuery } from '@/lib/sanity/queries';
import { buildPageMetadata, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, STUDIO_ADDRESS } from '@/lib/seo';
import type { BookingCountMap, Course, Locale } from '@/types';

import styles from './page.module.scss';

const BOOKING_ID = 'book';
const HERO_ID = 'course-hero';

interface CourseDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = locale as Locale;
  const course = await sanityClient.fetch<Course>(courseBySlugQuery, { slug });
  if (!course) return {};

  const title = course.seo?.metaTitle?.[l] || course.title[l];
  const descBlocks = course.description?.[l];
  const description = course.seo?.metaDescription?.[l] || (descBlocks ? portableTextToString(descBlocks) : undefined);
  const ogImage = course.image
    ? urlFor(course.image).width(1200).height(630).url()
    : DEFAULT_OG_IMAGE;

  return buildPageMetadata({
    locale,
    path: `/courses/${slug}`,
    title,
    description,
    image: ogImage,
  });
}

export default async function CourseDetailPage({ params, searchParams }: CourseDetailPageProps) {
  const { locale, slug } = await params;
  const l = locale as Locale;
  const [t, tNav, tAllergens] = await Promise.all([
    getTranslations({ locale, namespace: 'courseDetail' }),
    getTranslations({ locale, namespace: 'navigation' }),
    getTranslations({ locale, namespace: 'allergens' }),
  ]);

  const [course, sessionCounts, query] = await Promise.all([
    sanityClient.fetch<Course>(courseBySlugQuery, { slug }),
    sanityClient.fetch<{ date: string; startTime: string; confirmedCount: number }[]>(
      confirmedBookingsForCourseQuery,
      { courseSlug: slug },
    ),
    searchParams,
  ]);

  if (!course) notFound();

  const {
    _id, title, image, price, currency, duration, maxParticipants, instructor, description,
    intro, banner, gallery, menu, allergenList, allergens, cuisine, corporateEvent,
  } = course;
  const instructorName = instructor?.[l] ?? 'Yutian Xing';
  const descriptionBlocks = description?.[l];
  const priceLabel = formatPrice(price, currency, l);

  const dateEntries = getFutureDateEntries(course.timeSlots ?? [], duration);
  // When the class usually runs, for copy like "One unforgettable evening."
  const coursePart = dateEntries[0] ? dayPart(dateEntries[0].startTime) : 'evening';

  // "YYYY-MM-DD|HH:MM" → confirmed attendees, for the booking widgets
  const bookingCounts: BookingCountMap = {};
  for (const s of sessionCounts ?? []) {
    bookingCounts[`${s.date}|${s.startTime}`] = s.confirmedCount;
  }

  const allergenNames = (allergenList ?? []).map((key) => tAllergens(key).toLocaleLowerCase(l));
  const dishCount = menu?.length ?? 0;

  // ─── Structured data ────────────────────────────────────────────────────────
  const ogImage = image ? urlFor(image).width(1200).height(630).url() : DEFAULT_OG_IMAGE;
  const courseUrl = `${SITE_URL}/${locale}/courses/${slug}`;

  const hasCourseInstance = dateEntries.map((entry) => ({
    '@type': 'CourseInstance',
    courseMode: 'onsite',
    ...(duration && { duration: `PT${duration}M` }),
    startDate: toMadridISOString(entry.date, entry.startTime),
    endDate: toMadridISOString(entry.date, entry.endTime),
    location: {
      '@type': 'Place',
      name: SITE_NAME,
      address: STUDIO_ADDRESS,
    },
    instructor: {
      '@type': 'Person',
      name: instructorName,
    },
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title[l],
    description: descriptionBlocks ? portableTextToString(descriptionBlocks) : undefined,
    image: ogImage,
    url: courseUrl,
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...(duration && { timeRequired: `PT${duration}M` }),
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price.toString(),
        priceCurrency: currency ?? 'EUR',
        availability: 'https://schema.org/InStock',
        url: courseUrl,
      },
    }),
    ...(hasCourseInstance.length > 0 && { hasCourseInstance }),
  };

  const ctaLabel = corporateEvent ? t('requestQuote') : t('bookNow');

  const page = (
    <article className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <CourseHero
        locale={l}
        title={title[l]}
        image={image}
        cuisine={cuisine}
        instructor={instructorName}
        duration={duration}
        maxParticipants={maxParticipants}
        breadcrumbs={[
          { name: tNav('home'), path: '/' },
          { name: tNav('courses'), path: '/courses' },
          { name: title[l], path: `/courses/${slug}` },
        ]}
        cta={{ label: ctaLabel, href: `#${BOOKING_ID}` }}
        id={HERO_ID}
      />

      <div className={styles.shell}>
        <div className={styles.body}>
          <div className={styles.main}>
            <CourseIntro
              eyebrow={intro?.eyebrow?.[l]}
              headline={intro?.headline?.[l]}
              body={descriptionBlocks}
            />
            {banner?.image && (
              <CourseBanner
                image={banner.image}
                alt={banner.image.alt?.[l] ?? ''}
                eyebrow={banner.eyebrow?.[l]}
                title={banner.title?.[l]}
              />
            )}
            {menu && <CourseMenu items={menu} locale={l} dayPart={coursePart} />}
            <CourseIncluded locale={l} />
            {gallery && <CourseGallery images={gallery} locale={l} />}
            <CourseAllergens allergens={allergenList ?? []} notes={allergens?.[l]} locale={l} />
          </div>

          <aside className={styles.sidebar} aria-label={t('quickBooking')}>
            <div className={styles.sidebarInner}>
              {corporateEvent ? (
                <div className={styles.quoteCard}>
                  <p className={styles.quoteEyebrow}>{t('privateEvent')}</p>
                  <p className={styles.quoteText}>{t('quoteText')}</p>
                  <Button href={`#${BOOKING_ID}`} fullWidth>{ctaLabel}</Button>
                </div>
              ) : (
                <BookingWidget variant="compact" />
              )}
            </div>
          </aside>
        </div>

        <CourseReserve
          id={BOOKING_ID}
          eyebrow={corporateEvent ? t('reserve.corporateEyebrow') : t('reserve.eyebrow')}
          title={corporateEvent ? t('reserve.corporateTitle') : t('reserve.title')}
          lead={
            corporateEvent
              ? t('reserve.corporateLead')
              : t(`reserve.lead.${coursePart}`, { count: dishCount })
          }
          note={
            allergenNames.length > 0
              ? {
                  title: t('reserve.noteTitle'),
                  text: t('reserve.contains', {
                    list: new Intl.ListFormat(l, { type: 'conjunction' }).format(allergenNames),
                  }),
                  link: { label: t('reserve.dietaryLink'), href: '/contact' },
                }
              : undefined
          }
        >
          {corporateEvent ? (
            <CorporateEnquiryForm courseName={title[l]} />
          ) : (
            <BookingWidget variant="wide" />
          )}
        </CourseReserve>
      </div>

      <CourseFAQ locale={l} />

      <MobileBookingBar
        summary={corporateEvent ? t('priceOnRequest') : priceLabel}
        note={corporateEvent ? t('privateEvent') : t('perPersonLabel')}
        ctaLabel={ctaLabel}
        targetId={BOOKING_ID}
        afterId={HERO_ID}
      />
    </article>
  );

  if (corporateEvent) return page;

  return (
    <CourseBookingProvider
      course={{
        courseId: _id,
        courseSlug: slug,
        courseTitle: title[l],
        duration,
        maxParticipants,
        price,
        currency,
      }}
      locale={l}
      dateEntries={dateEntries}
      bookingCounts={bookingCounts}
      initialDate={typeof query.date === 'string' ? query.date : undefined}
      initialTime={typeof query.time === 'string' ? query.time : undefined}
    >
      {page}
    </CourseBookingProvider>
  );
}
