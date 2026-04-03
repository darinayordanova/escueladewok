'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import Button from '@/components/ui/Button/Button';
import { formatDate } from '@/lib/courses/timeslots';
import type { DateEntry, Locale } from '@/types';

import styles from './BookingCard.module.scss';

interface BookingCardProps {
  dateEntries: DateEntry[];
  price: number;
  currency: string;
  maxParticipants?: number;
  locale: Locale;
}

export default function BookingCard({
  dateEntries,
  price,
  currency,
  maxParticipants,
  locale,
}: BookingCardProps) {
  const t = useTranslations('courseDetail');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive selected value from URL params, fall back to first entry
  const paramDate = searchParams.get('date');
  const paramTime = searchParams.get('time');
  const selectedValue =
    paramDate && paramTime && dateEntries.some((e) => e.date === paramDate && e.startTime === paramTime)
      ? `${paramDate}|${paramTime}`
      : (dateEntries[0] ? `${dateEntries[0].date}|${dateEntries[0].startTime}` : '');

  const selected = dateEntries.find(
    (e) => `${e.date}|${e.startTime}` === selectedValue,
  );

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const [date, time] = e.target.value.split('|');
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
              onChange={handleChange}
            >
              {dateEntries.map((entry) => (
                <option key={`${entry.date}|${entry.startTime}`} value={`${entry.date}|${entry.startTime}`}>
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
            <p className={styles.timeRange}>
              {t('timeRange', { start: selected.startTime, end: selected.endTime })}
            </p>
          )}
        </>
      ) : (
        <p className={styles.noDates}>{t('noDatesAvailable')}</p>
      )}

      <ul className={styles.details}>
        {maxParticipants && (
          <li>{t('maxParticipants', { count: maxParticipants })}</li>
        )}
      </ul>

      <Button fullWidth size="lg" disabled={dateEntries.length === 0}>
        {t('bookThisCourse')}
      </Button>
    </div>
  );
}
