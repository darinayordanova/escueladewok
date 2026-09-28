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
  const [paused, setPaused] = useState(false);
  const [withTransition, setWithTransition] = useState(true);

  const pages = useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += itemsPerPage) {
      result.push(items.slice(i, i + itemsPerPage));
    }
    return result;
  }, [items, itemsPerPage]);

  const loop = pages.length > 1;

  // When looping, pad the track with a clone of the last page before the first
  // and a clone of the first page after the last. That way "next" from the last
  // slide (or "prev" from the first) keeps animating in the same direction —
  // into the clone — instead of jumping backwards across the whole track.
  const track = useMemo(() => {
    if (!loop) return pages.map((page, i) => ({ page, realPageIdx: i }));
    return [
      { page: pages[pages.length - 1], realPageIdx: pages.length - 1 },
      ...pages.map((page, i) => ({ page, realPageIdx: i })),
      { page: pages[0], realPageIdx: 0 },
    ];
  }, [loop, pages]);

  // Index into `track`. Real page 0 lives at trackIdx 1 once looping (0 is the clone).
  const [trackIdx, setTrackIdx] = useState(loop ? 1 : 0);

  // Reset if the page count changes (e.g. items load in after the initial render).
  // Adjusted during render rather than in an effect, per React's guidance for
  // resetting state in response to a prop change.
  const resetKey = `${loop}-${pages.length}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setWithTransition(false);
    setTrackIdx(loop ? 1 : 0);
  }

  const pageIdx = loop
    ? (((trackIdx - 1) % pages.length) + pages.length) % pages.length
    : trackIdx;

  function move(delta: number) {
    setWithTransition(true);
    setTrackIdx((i) => i + delta);
  }

  useEffect(() => {
    if (paused || pages.length <= 1) return;
    const id = setInterval(() => move(1), autoPlayMs);
    return () => clearInterval(id);
  }, [paused, pages.length, autoPlayMs]);

  if (pages.length === 0) return null;

  function goTo(idx: number) {
    setPaused(true);
    setWithTransition(true);
    setTrackIdx(loop ? idx + 1 : idx);
  }

  function step(delta: 1 | -1) {
    setPaused(true);
    move(delta);
  }

  // Once the "slide into the clone" animation finishes, snap invisibly back to
  // the matching real slide so the loop can repeat indefinitely.
  function handleTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (!loop || e.propertyName !== 'transform' || e.target !== e.currentTarget) return;
    if (trackIdx === 0) {
      setWithTransition(false);
      setTrackIdx(pages.length);
    } else if (trackIdx === track.length - 1) {
      setWithTransition(false);
      setTrackIdx(1);
    }
  }

  return (
    <div className={[styles.carousel, className].filter(Boolean).join(' ')}>
      <div className={styles.trackWrap}>
        <div
          className={`${styles.track} ${withTransition ? '' : styles.noTransition}`}
          style={{ '--idx': trackIdx } as React.CSSProperties}
          onTransitionEnd={handleTransitionEnd}
        >
          {track.map(({ page, realPageIdx }, pi) => (
            <div key={pi} className={styles.slide}>
              {page.map((item, ii) => renderItem(item, realPageIdx * itemsPerPage + ii))}
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
            onClick={() => step(-1)}
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
                onClick={() => goTo(i)}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>)}

          {showControls&&(<button
            type="button"
            className={styles.btn}
            onClick={() => step(1)}
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>)}
        </div>
      )}
    </div>
  );
}
