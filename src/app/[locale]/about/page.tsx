import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import CourseAbout from '@/components/sections/CourseAbout/CourseAbout';
import PageHeader from '@/components/sections/PageHeader/PageHeader';
import TeamGrid from '@/components/sections/TeamGrid/TeamGrid';
import { sanityClient } from '@/lib/sanity/client';
import { aboutPageQuery } from '@/lib/sanity/queries';
import { buildPageMetadata } from '@/lib/seo';
import type { AboutPage, Locale } from '@/types';


interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await sanityClient.fetch<AboutPage>(aboutPageQuery);
  const l = locale as Locale;

  return buildPageMetadata({
    locale,
    path: '/about',
    title: page?.title?.[l],
    description: page?.subtitle?.[l],
  });
}

export default async function AboutPageRoute({ params }: AboutPageProps) {
  const { locale } = await params;
  const tNav = await getTranslations({ locale, namespace: 'navigation' });
  const l = locale as Locale;

  const page = await sanityClient.fetch<AboutPage>(aboutPageQuery);

  return (
    <>
      <PageHeader
        locale={locale}
        title={page?.title?.[l] ?? tNav('about')}
        description={page?.subtitle?.[l]}
        breadcrumbs={[
          { name: tNav('home'), path: '/' },
          { name: tNav('about'), path: '/about' },
        ]}
        breadcrumbsLabel={tNav('breadcrumb')}
      />
      <div className="container pt-10 mb-16">

        {/* ── Page builder content ── */}
        {page?.content && page.content.length > 0 && (
          <section>
            <CourseAbout sections={page.content} locale={l} />
          </section>
        )}

        {/* ── Team ── */}
        {page?.team && page.team.length > 0 && (
          <section className="my-6">
         
            <TeamGrid members={page.team} locale={l} />
          </section>
        )}
      </div>
    </>
  );
}
