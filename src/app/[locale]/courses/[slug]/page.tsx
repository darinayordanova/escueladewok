import { Suspense } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import BookingCard from '@/components/sections/BookingCard/BookingCard';
import CourseAbout from '@/components/sections/CourseAbout/CourseAbout';
import CourseMenu from '@/components/sections/CourseMenu/CourseMenu';
import { getFutureDateEntries } from '@/lib/courses/timeslots';
import { sanityClient } from '@/lib/sanity/client';
import { urlFor } from '@/lib/sanity/image';
import { confirmedBookingsForCourseQuery, courseBySlugQuery, courseSlugParams } from '@/lib/sanity/queries';
import type { BookingCountMap, Course, Locale } from '@/types';

import styles from './page.module.scss';

interface CourseDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await sanityClient.fetch<{ slug: string }[]>(courseSlugParams);
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = await sanityClient.fetch<Course>(courseBySlugQuery, { slug });
  if (!course) return {};
  return {
    title: course.title[locale as Locale],
    description: course.description?.[locale as Locale],
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'courseDetail' });

  const [course, sessionCounts] = await Promise.all([
    sanityClient.fetch<Course>(courseBySlugQuery, { slug }),
    sanityClient.fetch<{ date: string; startTime: string; confirmedCount: number }[]>(
      confirmedBookingsForCourseQuery,
      { courseSlug: slug },
    ),
  ]);

  if (!course) notFound();

  const l = locale as Locale;
  const { _id, title, image, price, currency, duration, maxParticipants, instructor, about, menu, cuisine } = course;

  const dateEntries = getFutureDateEntries(course.timeSlots ?? [], duration);

  // Build a map of "YYYY-MM-DD|HH:MM" -> confirmedCount for the client component
  const bookingCounts: BookingCountMap = {};
  for (const s of sessionCounts ?? []) {
    bookingCounts[`${s.date}|${s.startTime}`] = s.confirmedCount;
  }

  return (
    <article className={styles.page}>
      <div className="container">
        {/* ── Hero image ── */}
        <div className={styles.hero}>
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

        <div className={styles.layout}>
          <div className={styles.main}>
            {/* ── Header ── */}
            <header className={styles.header}>
              <span className={styles.difficulty}>{cuisine}</span>
              <h1 className={styles.title}>{title[l]}</h1>
              {instructor && (
                <p className={styles.instructor}>
                  {t('instructor')} {instructor[l]}
                </p>
              )}
            </header>

            {/* ── Page builder: about sections ── */}
            {about && about.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{t('about')}</h2>
                <CourseAbout sections={about} locale={l} />
              </section>
            )}

            {/* ── Menu: dishes students will cook ── */}
            {menu && menu.length > 0 && (
              <CourseMenu items={menu} locale={l} />
            )}
          </div>

          {/* ── Sidebar: booking card ── */}
          <aside className={styles.sidebar}>
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
          </aside>
        </div>
      </div>
    </article>
  );
}
