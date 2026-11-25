'use client';

import { useState } from 'react';

import MonthCalendar, { CalendarDot } from '@/components/ui/MonthCalendar/MonthCalendar';
import { todayISO } from '@/lib/courses/timeslots';

import styles from './InlineCalendar.module.scss';

interface InlineCalendarProps {
  value: string;
  onChange: (v: string) => void;
  availableDates: Set<string>;
  locale: string;
}

/** Always-visible month calendar on a card surface; only days with classes are selectable. */
export default function InlineCalendar({ value, onChange, availableDates, locale }: InlineCalendarProps) {
  const [today] = useState(todayISO);
  const firstAvailable = availableDates.size ? [...availableDates].sort()[0] : undefined;

  return (
    <div className={styles.card}>
      <MonthCalendar
        value={value}
        onSelect={onChange}
        locale={locale}
        initialDate={firstAvailable}
        isDateDisabled={(date) => date < today || !availableDates.has(date)}
        renderIndicator={(date) => (availableDates.has(date) ? <CalendarDot /> : null)}
      />
    </div>
  );
}
