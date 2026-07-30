import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from '@/components/ui/Link/Link';

import CourseGrid from '@/components/sections/CourseGrid/CourseGrid';
import Hero from '@/components/sections/Hero/Hero';
import UpcomingClasses from '@/components/sections/UpcomingClasses/UpcomingClasses';
import { sanityClient } from '@/lib/sanity/client';
import { allCoursesQuery, featuredCoursesQuery, homepageQuery } from '@/lib/sanity/queries';
import { buildAlternates, DEFAULT_OG_IMAGE, OG_LOCALE, SITE_NAME, SITE_URL } from '@/lib/seo';
import type { Course, Homepage, Locale } from '@/types';

import styles from './page.module.scss';
import CtaBanner from '@/components/sections/CtaBanner/CtaBanner';
import HowItWorks from '@/components/sections/HowItWorks/HowItWorks';
import Testimonials from '@/components/sections/Testimonials/Testimonials';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const description = t('description');

  return {
    title: t('title'),
    description,
    alternates: buildAlternates(''),
    openGraph: {
      title: SITE_NAME,
      description,
      url: `${SITE_URL}/${locale}`,
      locale: OG_LOCALE[locale] ?? 'en_US',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  const [homepage, featuredCourses, allCourses] = await Promise.all([
    sanityClient.fetch<Homepage>(homepageQuery),
    sanityClient.fetch<Course[]>(featuredCoursesQuery),
    sanityClient.fetch<Course[]>(allCoursesQuery),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_NAME,
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'C. del Conde Duque, 10',
      addressLocality: 'Madrid',
      postalCode: '28015',
      addressCountry: 'ES',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 40.4241,
      longitude: -3.7137,
    },
    priceRange: '€€',
    currenciesAccepted: 'EUR',
    openingHoursSpecification: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {homepage && <Hero data={homepage} locale={locale as Locale} />}
 <section className="bg-alt py-10 py-md-16">
        <div className="container">
          <FeaturedSection
            homepage={homepage}
            courses={featuredCourses}
            locale={locale as Locale}
          />
        </div>
      </section>
      <HowItWorks
        title={homepage?.howItWorksTitle}
        steps={homepage?.howItWorksSteps}
        locale={locale as Locale}
      />

      <UpcomingClasses courses={allCourses} locale={locale as Locale} />

      <Testimonials
        title={homepage?.testimonialsTitle}
        testimonials={homepage?.testimonials}
        locale={locale as Locale}
      />

      <CtaBanner />

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
      <p className="overline text-center color-primary mb-4">{t('featuredCoursesLabel')}</p>
      <h2 className='h4 text-center mt-no mb-10'>
        {homepage?.featuredCoursesTitle?.[locale] ?? t('featuredCourses')}
      </h2>
      <CourseGrid courses={courses} locale={locale} />
      <div className={`mt-10 text-center`}>
        <Link href="/courses" hasArrow className={`color-primary font-semibold ${styles.viewAllLink}`}>
          {t('viewAllCourses')} 
        </Link>
      </div>
    </>
  );
}
