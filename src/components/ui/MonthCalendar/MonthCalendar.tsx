'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState, type ReactNode } from 'react';

import { ArrowLeft, ArrowRight } from '@/components/ui/icons';
import { todayISO } from '@/lib/courses/timeslots';

import styles from './MonthCalendar.module.scss';

export interface DayState {
  isSelected: boolean;
  isDisabled: boolean;
}

interface MonthCalendarProps {
  /** Selected date, "YYYY-MM-DD" or ''. */
  value: string;
  onSelect: (date: string) => void;
  locale: string;
  /** Month shown first ("YYYY-MM-DD"). Defaults to the selected date, then today. */
  initialDate?: string;
  isDateDisabled?: (date: string) => boolean;
  /** Marker at the foot of a bookable day — see CalendarDot / CapacityBar. */
  renderIndicator?: (date: string, state: DayState) => ReactNode;
  /** Show the Available / Selected key under the grid. */
  legend?: boolean;
  className?: string;
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseISO(date: string) {
  const [y, m] = date.split('-').map(Number);
  return { year: y, month: m - 1 };
}

/** Monday-first month grid shared by the booking card, date picker and inline calendar. */
export default function MonthCalendar({
  value,
  onSelect,
  locale,
  initialDate,
  isDateDisabled,
  renderIndicator,
  legend = false,
  className,
}: MonthCalendarProps) {
  const t = useTranslations('calendar');
  const [today] = useState(todayISO);
  const [view, setView] = useState(() => parseISO(value || initialDate || today));
  // Which way the last month change went, so the grid slides in from that side
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);

  // Follow external selection changes to another month (adjusting state during render)
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (value) setView(parseISO(value));
  }

  const cells = useMemo(() => {
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const firstDow = new Date(view.year, view.month, 1).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const result: Array<string | null> = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(toISO(view.year, view.month, d));
    return result;
  }, [view]);

  const dayNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    // 2025-01-06 is a Monday
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2025, 0, 6 + i)));
  }, [locale]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(view.year, view.month, 1),
  );
  const dayLabel = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  // Nothing before the current month can be booked
  const todayView = parseISO(today);
  const atFirstMonth = view.year * 12 + view.month <= todayView.year * 12 + todayView.month;

  function shiftMonth(delta: number) {
    setDirection(delta > 0 ? 'next' : 'prev');
    setView(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  return (
    <div className={[styles.calendar, className ?? ''].filter(Boolean).join(' ')}>
      <div className={styles.header}>
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className={styles.navBtn}
          aria-label={t('prevMonth')}
          disabled={atFirstMonth}
        >
          <ArrowLeft size={16} />
        </button>
        <span className={styles.monthTitle} aria-live="polite">{monthLabel}</span>
        <button type="button" onClick={() => shiftMonth(1)} className={styles.navBtn} aria-label={t('nextMonth')}>
          <ArrowRight size={16} />
        </button>
      </div>

      <div className={styles.dayNames} aria-hidden="true">
        {dayNames.map((name, i) => (
          <span key={i}>{name}</span>
        ))}
      </div>

      <div
        key={`${view.year}-${view.month}`}
        className={[styles.grid, direction ? styles[`slide-${direction}`] : ''].filter(Boolean).join(' ')}
      >
        {cells.map((date, i) => {
          if (!date) return <span key={`pad-${i}`} />;

          const isSelected = date === value;
          const isPast = date < today;
          const isDisabled = isDateDisabled?.(date) ?? false;
          const [y, m, d] = date.split('-').map(Number);

          return (
            <button
              key={date}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(date)}
              aria-pressed={isSelected}
              aria-label={dayLabel.format(new Date(y, m - 1, d))}
              aria-current={date === today ? 'date' : undefined}
              className={[
                styles.day,
                isSelected ? styles.daySelected : '',
                date === today ? styles.dayToday : '',
                isPast ? styles.dayPast : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {d}
              {renderIndicator?.(date, { isSelected, isDisabled })}
            </button>
          );
        })}
      </div>

      {legend && (
        <ul className={styles.legend}>
          <li><span className={`${styles.swatch} ${styles.swatchAvailable}`} aria-hidden="true" />{t('legendAvailable')}</li>
          <li><span className={`${styles.swatch} ${styles.swatchSelected}`} aria-hidden="true" />{t('legendSelected')}</li>
        </ul>
      )}
    </div>
  );
}

// ─── Indicators ───────────────────────────────────────────────────────────────

/** A day that has classes, when there's no capacity to show. */
export function CalendarDot() {
  return <span className={`${styles.indicator} ${styles.dot}`} aria-hidden="true" />;
}

/** How much capacity is left, coloured by availability level. */
export function CapacityBar({
  fill,
  level,
}: {
  /** 0–100 — share of spots still free */
  fill: number;
  level: 'high' | 'medium' | 'low' | 'none';
}) {
  return (
    <span
      className={`${styles.indicator} ${styles.bar} ${styles[`bar-${level}`]}`}
      style={{ '--fill': `${fill}%` } as React.CSSProperties}
      aria-hidden="true"
    />
  );
}
