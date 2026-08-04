import { Suspense } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import BookingCard from '@/components/sections/BookingCard/BookingCard';
import BookingDrawer from '@/components/sections/BookingDrawer/BookingDrawer';
import CorporateDrawer from '@/components/sections/CorporateDrawer/CorporateDrawer';
import CorporateEnquiryForm from '@/components/sections/CorporateEnquiryForm/CorporateEnquiryForm';
import CourseAbout from '@/components/sections/CourseAbout/CourseAbout';
import CourseAllergens from '@/components/sections/CourseAllergens/CourseAllergens';
import CourseFAQ from '@/components/sections/CourseFAQ/CourseFAQ';
import CourseMenu from '@/components/sections/CourseMenu/CourseMenu';
import CuisinePill from '@/components/ui/CuisinePill/CuisinePill';
import { getFutureDateEntries, toMadridISOString } from '@/lib/courses/timeslots';
import { sanityClient } from '@/lib/sanity/client';
import { urlFor } from '@/lib/sanity/image';
import { confirmedBookingsForCourseQuery, courseBySlugQuery } from '@/lib/sanity/queries';
import { buildPageMetadata, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, STUDIO_ADDRESS } from '@/lib/seo';
import { portableTextToString } from '@/lib/portableTextToString';
import type { BookingCountMap, Course, Locale } from '@/types';
import { PortableText } from '@portabletext/react';
import instructorImage from '@public/images/instructor.webp';
import styles from './page.module.scss';
import Button from '@/components/ui/Button/Button';
import Download from '@/components/ui/icons/Download';

interface CourseDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
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

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { locale, slug } = await params;
  const [t, tCourses, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'courseDetail' }),
    getTranslations({ locale, namespace: 'courses' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);

  const [course, sessionCounts] = await Promise.all([
    sanityClient.fetch<Course>(courseBySlugQuery, { slug }),
    sanityClient.fetch<{ date: string; startTime: string; confirmedCount: number }[]>(
      confirmedBookingsForCourseQuery,
      { courseSlug: slug },
    ),
  ]);

  if (!course) notFound();

  const l = locale as Locale;
  const { _id, title, image, price, currency, duration, maxParticipants, instructor, description, about, menu, allergens, cuisine, corporateEvent, brochure } = course;
  const brochureUrl = brochure?.asset?.url;
  const descriptionBlocks = description?.[l];
  const descriptionPlain = descriptionBlocks ? portableTextToString(descriptionBlocks) : undefined;
    const instructorName = instructor?.[l] ?? 'Yutian Xing';

  const dateEntries = getFutureDateEntries(course.timeSlots ?? [], duration);

  // Build a map of "YYYY-MM-DD|HH:MM" -> confirmedCount for the client component
  const bookingCounts: BookingCountMap = {};
  for (const s of sessionCounts ?? []) {
    bookingCounts[`${s.date}|${s.startTime}`] = s.confirmedCount;
  }

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
    description: descriptionPlain,
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

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: tNav('home'), item: `${SITE_URL}/${locale}` },
      { '@type': 'ListItem', position: 2, name: tNav('courses'), item: `${SITE_URL}/${locale}/courses` },
      { '@type': 'ListItem', position: 3, name: title[l], item: courseUrl },
    ],
  };

  return (
    <article className="pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container">
        {/* ── Hero image ── */}
        <div className="grid mt-10 mt-md-8 mb-8 gap-4">
          <div className='col-12 col-md-6'>
              <header className="mb-no mb-md-10">
              {cuisine && <CuisinePill cuisine={cuisine} label={tCourses(`cuisine.${cuisine}`)} />}

              <h1 className="h3 mt-1 mb-4">{title[l]}</h1>

               
                <div className="mt-2" >
                  <p className='font-heading mb-2 color-text-muted font-medium'>{t('instructor')}</p>
                  <div className='flex gap-2 flex-align-center'>
                    <Image src={instructorImage} alt={instructorName} width={40} height={40} className={styles.instructorImage} />
                <p className="text-lg font-semibold m-no">
                   {instructorName}
                </p></div>
                </div>
              

              {brochureUrl && (
                <Button
                  href={brochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  size='sm'
                  className='mt-8'
                >
                  <Download size={16} />
                  {t('downloadBrochure')}
                </Button>
              )}
            </header>
          </div>
          <div className='col-12 col-md-6'>

          {image && (
            <div className={styles.imageWrapper}>
              <Image
                src={urlFor(image).width(1200).height(600).url()}
                alt={image.alt?.[l] ?? title[l]}
                fill
                priority
                className={styles.image}
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
            
          )}
        </div>
        </div>

        <div className={styles.layout}>
          <div >
{descriptionBlocks && descriptionBlocks.length > 0 && (
                <div className="text-md mb-4">
                  <PortableText value={descriptionBlocks} />
                </div>
              )}
             
            {/* ── Page builder: about sections ── */}
            {about && about.length > 0 && (
              <section>
                <h2 className={`h5 ${styles.sectionTitle}`}>{t('about')}</h2>
                <CourseAbout sections={about} locale={l} />
              </section>
            )}

            {/* ── Menu: dishes students will cook ── */}
            {menu && menu.length > 0 && (
              <CourseMenu items={menu} locale={l} />
            )}

            {/* ── Allergens ── */}
            {allergens && (
              <CourseAllergens allergens={allergens} locale={l} />
            )}

            {/* ── FAQ ── */}
            <CourseFAQ locale={l} />
          </div>

          {/* ── Sidebar: enquiry form (corporate) or booking card (desktop) ── */}
          <aside className={styles.sidebar}>
            {corporateEvent ? (
              <CorporateEnquiryForm courseName={title[l]} />
            ) : (
              <Suspense fallback={<div className={styles.bookingCardSkeleton} aria-hidden="true" />}>
                <BookingCard
                  courseId={_id}
                  courseSlug={slug}
                  courseTitle={title[l]}
                  duration={duration}
                  dateEntries={dateEntries}
                  bookingCounts={bookingCounts}
                  maxParticipants={maxParticipants}
                  price={price}
                  currency={currency}
                  locale={l}
                />
              </Suspense>
            )}
          </aside>
        </div>
      </div>

      {/* ── Mobile bottom drawer (hidden on lg+) ── */}
      {corporateEvent ? (
        <CorporateDrawer courseName={title[l]} />
      ) : (
        <BookingDrawer
          courseId={_id}
          courseSlug={slug}
          courseTitle={title[l]}
          duration={duration}
          dateEntries={dateEntries}
          bookingCounts={bookingCounts}
          maxParticipants={maxParticipants}
          price={price}
          currency={currency}
          locale={l}
        />
      )}
    </article>
  );
}
