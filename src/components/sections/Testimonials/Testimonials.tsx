'use client';

import classnames from 'classnames';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';

import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { formatDate } from '@/lib/courses/timeslots';
import type { Locale, Testimonial } from '@/types';

import styles from './Testimonials.module.scss';

interface TestimonialsProps {
  title?: { en: string; es: string };
  testimonials?: Testimonial[];
  locale: Locale;
}

const SWIPE_THRESHOLD_PX = 50;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function Testimonials({ title, testimonials, locale }: TestimonialsProps) {
  const t = useTranslations('testimonials');
  const headingId = useId();
  const [active, setActive] = useState(0);
  // Only announce slide changes once the visitor has interacted, so screen
  // readers aren't interrupted on page load.
  const [interacted, setInteracted] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  // Height of the active slide, so the stage fits each quote instead of
  // reserving space for the longest one. Animated via CSS.
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const el = slideRefs.current[active];
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);

  if (!testimonials?.length) return null;

  const count = testimonials.length;
  const hasMany = count > 1;

  function go(delta: number) {
    setInteracted(true);
    setActive((i) => (i + delta + count) % count);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) go(dx < 0 ? 1 : -1);
  }

  return (
    <section className="py-10 py-md-16" aria-labelledby={headingId}>
      <div className="container">
        <p className="overline text-center color-primary mb-4">{t('label')}</p>
        <h2 id={headingId} className="h3 text-center mt-no mb-10">
          {title?.[locale] ?? t('fallbackTitle')}
        </h2>

        <div
          className={styles.stage}
          role={hasMany ? 'region' : undefined}
          aria-roledescription={hasMany ? t('carousel') : undefined}
          aria-labelledby={headingId}
          onKeyDown={hasMany ? handleKeyDown : undefined}
          onTouchStart={hasMany ? (e) => (touchStartX.current = e.touches[0].clientX) : undefined}
          onTouchEnd={hasMany ? handleTouchEnd : undefined}
        >
          {/* Controls sit above the quote so they stay put while the height
              adapts to each testimonial. */}
          <div className={styles.topBar}>
            <span className={styles.mark} aria-hidden="true">&ldquo;</span>
            {hasMany && (
              <div className={styles.controls}>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => go(-1)}
                  aria-label={t('previous')}
                >
                  <ChevronLeft size={18} />
                </button>

                <div className={styles.progress} aria-hidden="true">
                  <span className={styles.counter}>
                    <span className={styles.current}>{pad(active + 1)}</span>
                    <span className={styles.total}> / {pad(count)}</span>
                  </span>
                  <span className={styles.bar}>
                    <span
                      className={styles.barFill}
                      style={{ transform: `scaleX(${(active + 1) / count})` }}
                    />
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => go(1)}
                  aria-label={t('next')}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          <div
            className={styles.slides}
            style={{ height }}
            aria-live={interacted ? 'polite' : 'off'}
          >
            {testimonials.map((item, i) => {
              const isActive = i === active;
              const course = item.course?.title?.[locale];
              const date = item.dateTaken
                ? formatDate(item.dateTaken, locale, { month: 'long', year: 'numeric' })
                : undefined;
              const meta = [course, date].filter(Boolean).join(' · ');

              return (
                <figure
                  key={item._key}
                  ref={(el) => {
                    slideRefs.current[i] = el;
                  }}
                  className={classnames(styles.slide, isActive && styles.slideActive)}
                  role={hasMany ? 'group' : undefined}
                  aria-roledescription={hasMany ? t('slide') : undefined}
                  aria-label={hasMany ? t('slideOf', { index: i + 1, total: count }) : undefined}
                  aria-hidden={!isActive}
                  inert={!isActive}
                >
                  <blockquote className={styles.quote}>
                    <p>{item.quote[locale]}</p>
                  </blockquote>
                  <figcaption className={styles.author}>
                    <span className={styles.avatar} aria-hidden="true">
                      {initials(item.author)}
                    </span>
                    <span className={styles.authorText}>
                      <cite className={styles.name}>{item.author}</cite>
                      {meta && <span className={styles.meta}>{meta}</span>}
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
