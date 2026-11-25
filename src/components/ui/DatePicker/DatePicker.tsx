'use client';

import { useEffect, useRef, useState } from 'react';

import Field from '@/components/ui/Field/Field';
import { Calendar, ChevronDown, Close } from '@/components/ui/icons';
import MonthCalendar, { CalendarDot } from '@/components/ui/MonthCalendar/MonthCalendar';
import { todayISO } from '@/lib/courses/timeslots';

import styles from './DatePicker.module.scss';

interface DatePickerProps {
  value: string;                 // YYYY-MM-DD or ''
  onChange: (v: string) => void;
  /** Dates with classes — get a dot, and are the only selectable days when provided. */
  availableDates?: Set<string>;
  /** Last selectable date (YYYY-MM-DD). */
  maxDate?: string;
  disabled?: boolean;
  label?: string;
  hideLabel?: boolean;
  /** Extra detail behind an ⓘ next to the label. */
  info?: string;
  placeholder: string;
  clearLabel: string;
  locale: string;
  id?: string;
  className?: string;
}

export default function DatePicker({
  value,
  onChange,
  availableDates,
  maxDate,
  disabled,
  label,
  hideLabel,
  info,
  placeholder,
  clearLabel,
  locale,
  id,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [today] = useState(todayISO);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click or Escape (returning focus to the trigger)
  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const firstAvailable = availableDates?.size ? [...availableDates].sort()[0] : undefined;

  const triggerLabel = value
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(value + 'T00:00:00'),
      )
    : null;

  function handleSelect(date: string) {
    onChange(date);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <Field label={label} hideLabel={hideLabel} info={info} id={id} className={className}>
      {(control) => (
        <div ref={containerRef} className={styles.wrapper}>
          <div className={[styles.control, open ? styles.controlOpen : '', disabled ? styles.controlDisabled : ''].filter(Boolean).join(' ')}>
            <button
              ref={triggerRef}
              type="button"
              className={styles.trigger}
              onClick={() => setOpen((o) => !o)}
              disabled={disabled}
              aria-expanded={open}
              aria-haspopup="dialog"
              id={control.id}
              aria-describedby={control['aria-describedby']}
            >
              <Calendar size={18} className={styles.icon} />
              <span className={value ? styles.value : styles.placeholder}>{triggerLabel ?? placeholder}</span>
              {!value && <ChevronDown size={18} className={styles.chevron} />}
            </button>

            {value && !disabled && (
              <button type="button" className={styles.clear} onClick={() => onChange('')} aria-label={clearLabel}>
                <Close size={14} />
              </button>
            )}
          </div>

          {open && !disabled && (
            <div className={styles.popover} role="dialog" aria-label={label ?? placeholder}>
              <MonthCalendar
                value={value}
                onSelect={handleSelect}
                locale={locale}
                initialDate={firstAvailable}
                isDateDisabled={(date) => date < today || (!!maxDate && date > maxDate) || (!!availableDates && !availableDates.has(date))}
                renderIndicator={(date) => (availableDates?.has(date) ? <CalendarDot /> : null)}
              />
            </div>
          )}
        </div>
      )}
    </Field>
  );
}
