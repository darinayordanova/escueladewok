'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Close } from '@/components/ui/icons';
import { todayISO } from '@/lib/courses/timeslots';

import styles from './DatePicker.module.scss';

interface DatePickerProps {
  value: string;                 // YYYY-MM-DD or ''
  onChange: (v: string) => void;
  availableDates?: Set<string>;  // dates with events → show dot indicator
  placeholder: string;
  clearLabel: string;
  locale: string;
}

export default function DatePicker({
  value,
  onChange,
  availableDates,
  placeholder,
  clearLabel,
  locale,
}: DatePickerProps) {
  const today = useMemo(() => todayISO(), []);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialise calendar to selected date's month, first available, or today
  const initDate = useMemo(() => {
    if (value) return value;
    if (availableDates?.size) return [...availableDates].sort()[0];
    return today;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [viewYear, setViewYear] = useState(() => new Date(initDate + 'T00:00:00').getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date(initDate + 'T00:00:00').getMonth());

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // When a value is set externally, snap the calendar to that month
  useEffect(() => {
    if (value) {
      setViewYear(new Date(value + 'T00:00:00').getFullYear());
      setViewMonth(new Date(value + 'T00:00:00').getMonth());
    }
  }, [value]);

  // ── Calendar grid ──────────────────────────────────────────────────────────
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

  const triggerLabel = value
    ? new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value + 'T00:00:00'))
    : null;

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function handleSelect(dateStr: string) {
    onChange(dateStr);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
  }

  return (
    <div ref={containerRef} className={styles.wrapper}>
      {/* ── Trigger ───────────────────────────────────────────────────────── */}
      <button
        type="button"
        className={[styles.trigger, open ? styles.triggerOpen : '', value ? styles.triggerActive : ''].filter(Boolean).join(' ')}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Calendar className={styles.calIcon} size={16} />

        <span className={value ? styles.triggerValue : styles.triggerPlaceholder}>
          {triggerLabel ?? placeholder}
        </span>

        {value ? (
          <span
            className={styles.clearX}
            role="button"
            tabIndex={0}
            aria-label={clearLabel}
            onClick={handleClear}
            onKeyDown={(e) => e.key === 'Enter' && handleClear(e as never)}
          >
            <Close size={14} />
          </span>
        ) : (
          <ChevronDown className={styles.chevron} size={20} />
        )}
      </button>

      {/* ── Popover ───────────────────────────────────────────────────────── */}
      {open && (
        <div className={styles.popover} role="dialog" aria-label={placeholder}>
          {/* Month header */}
          <div className={styles.calHeader}>
            <button type="button" onClick={prevMonth} className={styles.navBtn} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <span className={styles.monthTitle}>{monthLabel}</span>
            <button type="button" onClick={nextMonth} className={styles.navBtn} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day names */}
          <div className={styles.dayNames}>
            {dayNames.map((n) => (
              <span key={n} className={styles.dayName}>{n}</span>
            ))}
          </div>

          {/* Day grid */}
          <div className={styles.grid}>
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={`p-${i}`} />;

              const day = parseInt(dateStr.split('-')[2], 10);
              const isSelected = dateStr === value;
              const isToday = dateStr === today;
              const isPast = dateStr < today;
              const hasEvents = availableDates?.has(dateStr);

              return (
                <button
                  key={dateStr}
                  type="button"
                  className={[
                    styles.day,
                    isSelected ? styles.daySelected : '',
                    isToday && !isSelected ? styles.dayToday : '',
                    isPast && !isSelected ? styles.dayPast : '',
                    hasEvents && !isSelected ? styles.dayHasEvents : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleSelect(dateStr)}
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
      )}
    </div>
  );
}
