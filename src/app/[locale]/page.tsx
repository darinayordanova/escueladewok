import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import CourseGrid from '@/components/sections/CourseGrid/CourseGrid';
import Hero from '@/components/sections/Hero/Hero';
import { Link } from '@/i18n/navigation';
import { sanityClient } from '@/lib/sanity/client';
import { featuredCoursesQuery, homepageQuery } from '@/lib/sanity/queries';
import type { Course, Homepage, Locale } from '@/types';

import styles from './page.module.scss';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return { title: t('title'), description: t('description') };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  const [homepage, featuredCourses] = await Promise.all([
    sanityClient.fetch<Homepage>(homepageQuery),
    sanityClient.fetch<Course[]>(featuredCoursesQuery),
  ]);

  return (
    <>
      {homepage && <Hero data={homepage} locale={locale as Locale} />}

      <section className={styles.featured}>
        <div className={styles.container}>
          <FeaturedSection
            homepage={homepage}
            courses={featuredCourses}
            locale={locale as Locale}
          />
        </div>
      </section>
    </>
  );
}

function FeaturedSection({
  homepage,
  courses,
  locale,
}: {
  homepage: Homepage | null;
  courses: Course[];
  locale: Locale;
}) {
  const t = useTranslations('home');

  if (!courses || courses.length === 0) return null;

  return (
    <>
      <h2 className={styles.sectionTitle}>
        {homepage?.featuredCoursesTitle?.[locale] ?? t('featuredCourses')}
      </h2>
      <CourseGrid courses={courses} locale={locale} />
      <div className={styles.viewAll}>
        <Link href="/courses" className={styles.viewAllLink}>
          {t('viewAllCourses')} &rarr;
        </Link>
      </div>
    </>
  );
}
