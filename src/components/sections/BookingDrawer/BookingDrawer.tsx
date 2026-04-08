'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import BookingCard from '@/components/sections/BookingCard/BookingCard';
import { Close } from '@/components/ui/icons';
import type { BookingCountMap, DateEntry, Locale } from '@/types';
import Button from '@/components/ui/Button/Button';
import styles from './BookingDrawer.module.scss';

interface BookingDrawerProps {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  duration: number;
  dateEntries: DateEntry[];
  bookingCounts: BookingCountMap;
  maxParticipants: number;
  price: number;
  currency: string;
  locale: Locale;
}

export default function BookingDrawer(props: BookingDrawerProps) {
  const t = useTranslations('courseDetail');
  const [isOpen, setIsOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Move focus into the sheet when it opens
  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    openRef.current?.focus();
  }

  return (
    <div className={styles.root} aria-hidden={undefined}>
      {/* ── Fixed bottom trigger bar ──────────────────────────────────────── */}
      <div className={styles.bar}>
        <div className={`flex flex-align-center flex-justify-between gap-4 ${styles.barInner}`}>
          <span className="font-bold text-xl m-no">
            {props.price} {props.currency}
          </span>
          <Button
            ref={openRef}
            type="button"
            onClick={open}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-controls="booking-sheet"
          >
            {t('bookThisCourse')}
          </Button>
        </div>
      </div>

      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* ── Close button — floats above the sheet, over the backdrop ─────── */}
      <button
        ref={closeRef}
        type="button"
        onClick={close}
        className={`${styles.closeBtn} ${isOpen ? styles.closeBtnVisible : ''}`}
        aria-label="Close booking panel"
      >
        <Close size={22} />
      </button>

      {/* ── Slide-up sheet ───────────────────────────────────────────────── */}
      <div
        ref={sheetRef}
        id="booking-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t('bookThisCourse')}
        className={`${styles.sheet} ${isOpen ? styles.sheetOpen : ''}`}
        aria-hidden={!isOpen || undefined}
      >
        {/* Drag handle */}
        <div className={styles.handle} aria-hidden="true" />

        {/* Sheet header */}
        <div className={`${styles.sheetHeader}`}>
          <p className="font-heading font-bold text-lg m-no">{t('schedule')}</p>
        </div>

        {/* BookingCard content */}
        <div className={styles.sheetBody}>
          <Suspense>
            <BookingCard {...props} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
