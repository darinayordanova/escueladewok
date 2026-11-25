import Breadcrumbs from '@/components/ui/Breadcrumbs/Breadcrumbs';
import type { BreadcrumbEntry } from '@/lib/seo';

import styles from './PageHeader.module.scss';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Home first, current page last. Omit to hide the breadcrumb. */
  breadcrumbs?: BreadcrumbEntry[];
  breadcrumbsLabel?: string;
  locale: string;
}

/** Centred page intro: breadcrumb, display title and lead paragraph. */
export default function PageHeader({
  title,
  description,
  breadcrumbs,
  breadcrumbsLabel = 'Breadcrumb',
  locale,
}: PageHeaderProps) {
  return (
    <header className={`container ${styles.header}`}>
      {breadcrumbs && breadcrumbs.length > 1 && (
        <Breadcrumbs trail={breadcrumbs} locale={locale} ariaLabel={breadcrumbsLabel} />
      )}
      <h1 className={`display ${styles.title}`}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
    </header>
  );
}
