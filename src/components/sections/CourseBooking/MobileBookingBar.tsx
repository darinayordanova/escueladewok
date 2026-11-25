'use client';

import { useEffect, useState } from 'react';

import Button from '@/components/ui/Button/Button';
import { ChevronRight } from '@/components/ui/icons';

import styles from './MobileBookingBar.module.scss';

interface MobileBookingBarProps {
  /** The headline figure, e.g. the price. */
  summary: string;
  /** Small line under the summary, e.g. "per person". */
  note?: string;
  ctaLabel: string;
  /** id of the booking section the button scrolls to. */
  targetId: string;
  /** id of an element with its own booking button — the bar waits until it's scrolled past. */
  afterId?: string;
}

/**
 * Floating booking bar on small screens (the sidebar is hidden there). It appears once the
 * hero's button has scrolled away and steps aside again while the booking section is on screen.
 */
export default function MobileBookingBar({ summary, note, ctaLabel, targetId, afterId }: MobileBookingBarProps) {
  const [targetVisible, setTargetVisible] = useState(false);
  const [beforeStart, setBeforeStart] = useState(!!afterId);

  useEffect(() => {
    const target = document.getElementById(targetId);
    const start = afterId ? document.getElementById(afterId) : null;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === target) setTargetVisible(entry.isIntersecting);
          // Still "before" while any of the start element is on screen, or it's below us
          if (entry.target === start) setBeforeStart(entry.isIntersecting || entry.boundingClientRect.top > 0);
        }
      },
      { threshold: [0, 0.15] },
    );
    if (target) observer.observe(target);
    if (start) observer.observe(start);
    return () => observer.disconnect();
  }, [targetId, afterId]);

  const hidden = targetVisible || beforeStart;

  return (
    <div className={[styles.bar, hidden ? styles.hidden : ''].filter(Boolean).join(' ')} inert={hidden}>
      <p className={styles.summary}>
        <span className={styles.price}>{summary}</span>
        {note && <span className={styles.note}>{note}</span>}
      </p>
      <Button href={`#${targetId}`} className={styles.cta}>
        {ctaLabel}
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}
