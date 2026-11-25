import Image from 'next/image';
import type { ReactNode } from 'react';

import CuisinePill from '@/components/ui/CuisinePill/CuisinePill';
import { ArrowRight } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import { urlFor } from '@/lib/sanity/image';
import type { SanityImage } from '@/types';

import styles from './CourseCard.module.scss';

export interface CourseCardLayoutProps {
  href: string;
  title: string;
  description?: string;
  image?: SanityImage;
  imageAlt: string;
  cuisine?: { value: string; label: string };
  /** Content above the title — session date/time or course facts. */
  meta?: ReactNode;
  /** Left side of the footer — usually the price. */
  footerStart?: ReactNode;
  ctaLabel: string;
  /** De-emphasise the card (e.g. sold out) while keeping it readable and clickable. */
  muted?: boolean;
  headingLevel?: 'h2' | 'h3';
}

/**
 * Shared shell for every course card. The title link is stretched over the
 * whole card, so the card is one click target and one tab stop with no nested links.
 */
export default function CourseCardLayout({
  href,
  title,
  description,
  image,
  imageAlt,
  cuisine,
  meta,
  footerStart,
  ctaLabel,
  muted = false,
  headingLevel: Heading = 'h3',
}: CourseCardLayoutProps) {
  return (
    <article className={[styles.card, muted ? styles.muted : ''].filter(Boolean).join(' ')}>
      <div className={styles.media}>
        {image ? (
          <Image
            src={urlFor(image).width(900).height(600).url()}
            alt={imageAlt}
            fill
            className={styles.image}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true" />
        )}
        {cuisine && <CuisinePill cuisine={cuisine.value} label={cuisine.label} className={styles.pill} />}
      </div>

      <div className={styles.body}>
        {meta && <div className={styles.meta}>{meta}</div>}

        <h5 className={`${styles.title} mt-5 mb-3 `}>
          <Link href={href} className={styles.titleLink}>
            {title}
          </Link>
        </h5>

        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.footer}>
          {footerStart}
          <span className={styles.cta} aria-hidden="true">
            {ctaLabel}
            <ArrowRight size={17} className={styles.ctaArrow} />
          </span>
        </div>
      </div>
    </article>
  );
}

// ─── Slot building blocks ─────────────────────────────────────────────────────

/** Bold red line at the top of the meta block (date or event type). */
export function CourseCardEyebrow({ children, dateTime }: { children: ReactNode; dateTime?: string }) {
  return dateTime ? (
    <time dateTime={dateTime} className={styles.eyebrow}>{children}</time>
  ) : (
    <p className={styles.eyebrow}>{children}</p>
  );
}

/** Muted row under the eyebrow — items spread to both ends. */
export function CourseCardMetaRow({ children }: { children: ReactNode }) {
  return <div className={styles.metaRow}>{children}</div>;
}

/** Inline list of short course facts, e.g. duration and group size. */
export function CourseCardFacts({ items }: { items: string[] }) {
  return (
    <ul className={styles.facts}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function CourseCardPrice({ children }: { children: ReactNode }) {
  return <p className={styles.price}>{children}</p>;
}

/** Small text in place of a price. */
export function CourseCardNote({ children }: { children: ReactNode }) {
  return <p className={styles.footerNote}>{children}</p>;
}
