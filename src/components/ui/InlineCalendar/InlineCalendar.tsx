'use client';

import { useMemo, useState } from 'react';

import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { todayISO } from '@/lib/courses/timeslots';

import styles from './InlineCalendar.module.scss';

interface InlineCalendarProps {
  value: string;
  onChange: (v: string) => void;
  availableDates: Set<string>;
  locale: string;
}

export default function InlineCalendar({ value, onChange, availableDates, locale }: InlineCalendarProps) {
  const today = useMemo(() => todayISO(), []);

  const initDate = useMemo(() => {
    if (value) return value;
    if (availableDates.size) return [...availableDates].sort()[0];
    return today;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [viewYear, setViewYear] = useState(() => new Date(initDate + 'T00:00:00').getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date(initDate + 'T00:00:00').getMonth());

  const cells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const result: Array<string | null> = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      result.push(
        `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      );
    }
    return result;
  }, [viewYear, viewMonth]);

  const dayNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2025, 0, 6 + i)));
  }, [locale]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
        new Date(viewYear, viewMonth, 1),
      ),
    [locale, viewYear, viewMonth],
  );

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.calHeader}>
        <button type="button" onClick={prevMonth} className={styles.navBtn} aria-label="Previous month">
          <ChevronLeft size={16} />
        </button>
        <span className={styles.monthTitle}>{monthLabel}</span>
        <button type="button" onClick={nextMonth} className={styles.navBtn} aria-label="Next month">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className={styles.dayNames}>
        {dayNames.map(n => (
          <span key={n} className={styles.dayName}>{n}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`p-${i}`} />;

          const day = parseInt(dateStr.split('-')[2], 10);
          const isSelected = dateStr === value;
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const hasEvents = availableDates.has(dateStr);
          const isDisabled = isPast || !hasEvents;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isDisabled}
              className={[
                styles.day,
                isSelected ? styles.daySelected : '',
                isToday && !isSelected ? styles.dayToday : '',
                isPast ? styles.dayPast : '',
                hasEvents && !isSelected ? styles.dayHasEvents : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onChange(dateStr)}
              aria-label={dateStr}
              aria-pressed={isSelected}
            >
              {day}
              {hasEvents && !isSelected && <span className={styles.dot} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
