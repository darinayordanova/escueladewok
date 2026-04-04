'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { formatDate } from '@/lib/courses/timeslots';
import type { BookingCountMap, DateEntry, Locale } from '@/types';

import styles from './BookingCard.module.scss';

interface BookingCardProps {
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

export default function BookingCard({
  courseId,
  courseSlug,
  courseTitle,
  duration,
  dateEntries,
  bookingCounts,
  maxParticipants,
  price,
  currency,
  locale,
}: BookingCardProps) {
  const t = useTranslations('courseDetail');
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Date selection ─────────────────────────────────────────────────────────
  const paramDate = searchParams.get('date');
  const paramTime = searchParams.get('time');
  const initialValue =
    paramDate && paramTime && dateEntries.some((e) => e.date === paramDate && e.startTime === paramTime)
      ? `${paramDate}|${paramTime}`
      : dateEntries[0]
        ? `${dateEntries[0].date}|${dateEntries[0].startTime}`
        : '';

  const [selectedValue, setSelectedValue] = useState(initialValue);

  const selected = dateEntries.find((e) => `${e.date}|${e.startTime}` === selectedValue);

  const confirmedCount = selected ? (bookingCounts[`${selected.date}|${selected.startTime}`] ?? 0) : 0;
  const spotsLeft = selected ? Math.max(0, maxParticipants - confirmedCount) : 0;
  const isSoldOut = selected ? spotsLeft === 0 : false;

  function handleDateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const [date, time] = value.split('|');
    setSelectedValue(value);
    router.replace(`?date=${date}&time=${time}`, { scroll: false });
  }

  return (
    <div className={styles.bookingCard}>
      <p className={styles.price}>
        {price} {currency}
      </p>

      {dateEntries.length > 0 ? (
        <>
          <div className={styles.field}>
            <label htmlFor="date-select" className={styles.label}>
              {t('chooseDate')}
            </label>
            <select
              id="date-select"
              className={styles.select}
              value={selectedValue}
              onChange={handleDateChange}
              disabled={false}
            >
              {dateEntries.map((entry) => (
                <option
                  key={`${entry.date}|${entry.startTime}`}
                  value={`${entry.date}|${entry.startTime}`}
                >
                  {formatDate(entry.date, locale, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' · '}
                  {entry.startTime} – {entry.endTime}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className={styles.meta}>
              <p className={styles.timeRange}>
                {t('timeRange', { start: selected.startTime, end: selected.endTime })}
              </p>
              <p className={isSoldOut ? styles.soldOut : styles.spotsLeft}>
                {isSoldOut
                  ? t('soldOut')
                  : spotsLeft === 1
                    ? t('spotsLeft', { count: spotsLeft })
                    : t('spotsLeftPlural', { count: spotsLeft })}
              </p>
            </div>
          )}

          <div className={styles.comingSoon}>
            <p className={styles.comingSoonTitle}>{t('paymentComingSoon')}</p>
            <p className={styles.comingSoonSub}>{t('paymentComingSoonSub')}</p>
          </div>
        </>
      ) : (
        <p className={styles.noDates}>{t('noDatesAvailable')}</p>
      )}
    </div>
  );
}
