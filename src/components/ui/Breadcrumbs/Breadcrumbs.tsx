import { Link } from '@/i18n/navigation';
import { buildBreadcrumbJsonLd, type BreadcrumbEntry } from '@/lib/seo';

import styles from './Breadcrumbs.module.scss';

interface BreadcrumbsProps {
  /** Home first, current page last. */
  trail: BreadcrumbEntry[];
  locale: string;
  ariaLabel: string;
  /** `responsive`: centred on small screens, left-aligned from lg up. */
  align?: 'center' | 'start' | 'responsive';
  className?: string;
}

/** Visible breadcrumb trail plus the matching BreadcrumbList JSON-LD. */
export default function Breadcrumbs({ trail, locale, ariaLabel, align = 'center', className }: BreadcrumbsProps) {
  const jsonLd = buildBreadcrumbJsonLd(locale, trail);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label={ariaLabel} className={[styles.nav, className ?? ''].filter(Boolean).join(' ')}>
        <ol className={`${styles.list} ${styles[align]}`}>
          {trail.map((entry, i) => (
            <li key={entry.path} className={styles.item}>
              {i === trail.length - 1 ? (
                <span className={styles.current} aria-current="page">{entry.name}</span>
              ) : (
                <Link href={entry.path} className={styles.link}>{entry.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
