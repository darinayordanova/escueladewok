'use client';

import { useEffect, useMemo, useState } from 'react';

import { ChevronLeft, ChevronRight } from '@/components/ui/icons';

import styles from './Carousel.module.scss';

interface CarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemsPerPage?: number;
  autoPlayMs?: number;
  className?: string;
  showControls?: boolean;
  showDots?: boolean;
  align?: 'start' | 'center' | 'end';
}

export default function Carousel<T>({
  items,
  renderItem,
  itemsPerPage = 1,
  autoPlayMs = 3000,
  className,
  showControls = true,
  showDots = true,
  align = 'center',
}: CarouselProps<T>) {
  const [pageIdx, setPageIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const pages = useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += itemsPerPage) {
      result.push(items.slice(i, i + itemsPerPage));
    }
    return result;
  }, [items, itemsPerPage]);

  useEffect(() => {
    if (paused || pages.length <= 1) return;
    const id = setInterval(
      () => setPageIdx(i => (i + 1) % pages.length),
      autoPlayMs,
    );
    return () => clearInterval(id);
  }, [paused, pages.length, autoPlayMs]);

  if (pages.length === 0) return null;

  function navigate(idx: number) {
    setPaused(true);
    setPageIdx(idx);
  }

  return (
    <div className={[styles.carousel, className].filter(Boolean).join(' ')}>
      <div className={styles.trackWrap}>
        <div
          className={styles.track}
          style={{ '--idx': pageIdx } as React.CSSProperties}
        >
          {pages.map((page, pi) => (
            <div key={pi} className={styles.slide}>
              {page.map((item, ii) => renderItem(item, pi * itemsPerPage + ii))}
            </div>
          ))}
        </div>
      </div>

      {pages.length > 1 && (
        <div className={` ${styles.controls} ${styles[align]}`}>
          {showControls &&(
            <button
            type="button"
            className={styles.btn}
            onClick={() => navigate((pageIdx - 1 + pages.length) % pages.length)}
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          )}
          

          {showDots && (
            <div className={styles.dots}>
              {pages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`${styles.dot} ${i === pageIdx ? styles.dotActive : ''}`}
                onClick={() => navigate(i)}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>)}

          {showControls&&(<button
            type="button"
            className={styles.btn}
            onClick={() => navigate((pageIdx + 1) % pages.length)}
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>)}
        </div>
      )}
    </div>
  );
}
