'use client';

import { useTranslations } from 'next-intl';

import Carousel from '@/components/ui/Carousel/Carousel';
import type { Locale, Testimonial } from '@/types';

import styles from './Testimonials.module.scss';
import classnames from 'classnames';

interface TestimonialsProps {
  title?: { en: string; es: string };
  testimonials?: Testimonial[];
  locale: Locale;
}

function TestimonialCard({ item, locale }: { item: Testimonial; locale: Locale }) {
  return (
    <div className={"pt-10 pb-4 px-6 bg-alt rounded-lg shadow-md " }>
      <span className={styles.quote} aria-hidden="true">&ldquo;</span>
      <p className="text-md mb-2">
        {item.quote[locale]}
      </p>
        <span className={classnames("text-lg text-italic font-bold color-text-light", styles.author)}> {item.author} </span>
    </div>
  );
}

export default function Testimonials({ title, testimonials, locale }: TestimonialsProps) {
  const t = useTranslations('testimonials');

  if (!testimonials?.length) return null;

  return (
    <section className="py-10 py-md-16">
      <div className="container">
        <p className="overline text-center color-primary mb-4">{t('label')}</p>
        <h2 className="h3 text-center mt-no mb-10">
          {title?.[locale] ?? t('fallbackTitle')}
        </h2>
        <div className="grid ">
          <div className="col-12 col-md-8 col-md-offset-2 ">
  <Carousel
            items={testimonials}
            itemsPerPage={1}
            renderItem={(item) => <TestimonialCard item={item} locale={locale} />}
            showControls={true}
            showDots={testimonials.length > 1}
          />
          </div>
        </div>
        
        </div>
    </section>
  );
}
