import { ChevronLeft, ChevronRight } from '@/components/ui/icons';

import styles from './Pagination.module.scss';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Accessible label for the nav landmark */
  ariaLabel?: string;
}

/** Returns the page numbers + ellipsis markers to display. */
function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '…')[] = [1];

  if (current > 3) pages.push('…');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('…');

  pages.push(total);
  return pages;
}

export default function Pagination({ page, totalPages, onPageChange, ariaLabel = 'Pagination' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages);

  return (
    <nav className={styles.nav} aria-label={ariaLabel}>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      <ol className={styles.list} role="list">
        {pages.map((p, i) =>
          p === '…' ? (
            <li key={`ellipsis-${i}`} className={styles.ellipsis} aria-hidden="true">…</li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ol>

      <button
        type="button"
        className={styles.arrow}
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
