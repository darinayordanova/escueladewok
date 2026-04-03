import { Suspense } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import BookingCard from '@/components/sections/BookingCard/BookingCard';
import { getFutureDateEntries } from '@/lib/courses/timeslots';
import { sanityClient } from '@/lib/sanity/client';
import { urlFor } from '@/lib/sanity/image';
import { courseBySlugQuery, courseSlugParams } from '@/lib/sanity/queries';
import type { Course, Locale } from '@/types';

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

  const course = await sanityClient.fetch<Course>(courseBySlugQuery, { slug });

  if (!course) {
    notFound();
  }

  const l = locale as Locale;
  const { title, description, image, price, currency, duration, maxParticipants, difficulty, instructor } = course;

  const dateEntries = getFutureDateEntries(course.timeSlots ?? [], duration);

  return (
    <article className={styles.page}>
      <div className={styles.container}>
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
            <header className={styles.header}>
              <span className={styles.difficulty}>{difficulty}</span>
              <h1 className={styles.title}>{title[l]}</h1>
              {instructor && (
                <p className={styles.instructor}>
                  {t('instructor')} {instructor[l]}
                </p>
              )}
            </header>

            {description?.[l] && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{t('about')}</h2>
                <p className={styles.description}>{description[l]}</p>
              </section>
            )}
          </div>

          <aside className={styles.sidebar}>
            <Suspense fallback={<BookingCardSkeleton />}>
              <BookingCard
                dateEntries={dateEntries}
                price={price}
                currency={currency}
                maxParticipants={maxParticipants}
                locale={l}
              />
            </Suspense>
          </aside>
        </div>
      </div>
    </article>
  );
}

function BookingCardSkeleton() {
  return <div className={styles.bookingCardSkeleton} aria-hidden="true" />;
}
