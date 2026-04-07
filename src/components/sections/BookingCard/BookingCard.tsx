'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Input from '@/components/ui/Input/Input';

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

const TODAY = new Date().toISOString().split('T')[0];

export default function BookingCard({
  courseSlug,
  courseTitle,
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

  // ── Group entries by date ─────────────────────────────────────────────────
  const entriesByDate = useMemo(
    () =>
      dateEntries.reduce<Record<string, DateEntry[]>>((acc, e) => {
        (acc[e.date] ??= []).push(e);
        return acc;
      }, {}),
    [dateEntries],
  );

  // ── Resolve initial selection from URL params ─────────────────────────────
  const paramDate = searchParams.get('date') ?? '';
  const paramTime = searchParams.get('time') ?? '';
  const initDate =
    paramDate && entriesByDate[paramDate] && paramDate >= TODAY ? paramDate : '';
  const initTime = (() => {
    if (!initDate) return '';
    const times = entriesByDate[initDate] ?? [];
    if (times.some((e) => e.startTime === paramTime)) return paramTime;
    if (times.length === 1) return times[0].startTime;
    return '';
  })();

  // ── State ─────────────────────────────────────────────────────────────────
  const [viewYear, setViewYear] = useState(() => {
    const d = initDate || dateEntries[0]?.date || '';
    return d ? new Date(d + 'T00:00:00').getFullYear() : new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = initDate || dateEntries[0]?.date || '';
    return d ? new Date(d + 'T00:00:00').getMonth() : new Date().getMonth();
  });
  const [selectedDate, setSelectedDate] = useState(initDate);
  const [selectedTime, setSelectedTime] = useState(initTime);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // ── Derived ───────────────────────────────────────────────────────────────
  const timesForDate: DateEntry[] = selectedDate ? (entriesByDate[selectedDate] ?? []) : [];
  const selectedEntry = timesForDate.find((e) => e.startTime === selectedTime);
  const confirmedCount = selectedEntry
    ? (bookingCounts[`${selectedDate}|${selectedTime}`] ?? 0)
    : 0;
  const spotsLeft = selectedEntry ? Math.max(0, maxParticipants - confirmedCount) : 0;
  const isSoldOut = !!selectedEntry && spotsLeft === 0;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function spotsForDate(date: string) {
    const entries = entriesByDate[date] ?? [];
    const left = entries.reduce(
      (sum, e) => sum + Math.max(0, maxParticipants - (bookingCounts[`${date}|${e.startTime}`] ?? 0)),
      0,
    );
    return { left, total: entries.length * maxParticipants };
  }

  function slotSpots(date: string, startTime: string) {
    return Math.max(0, maxParticipants - (bookingCounts[`${date}|${startTime}`] ?? 0));
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleDateSelect(date: string) {
    const times = entriesByDate[date] ?? [];
    const autoTime = times.length === 1 ? times[0].startTime : '';
    setSelectedDate(date);
    setSelectedTime(autoTime);
    setWaitlistStatus('idle');
    router.replace(autoTime ? `?date=${date}&time=${autoTime}` : `?date=${date}`, { scroll: false });
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    setWaitlistStatus('idle');
    if (selectedDate) router.replace(`?date=${selectedDate}&time=${time}`, { scroll: false });
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setWaitlistStatus('sending');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: waitlistEmail,
          courseTitle,
          courseSlug,
          date: selectedDate,
          startTime: selectedTime,
        }),
      });
      if (!res.ok) throw new Error();
      setWaitlistStatus('sent');
    } catch {
      setWaitlistStatus('error');
    }
  }

  // ── Calendar grid ─────────────────────────────────────────────────────────
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1; // Monday-first
    const cells: Array<string | null> = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(
        `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      );
    }
    return cells;
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

  return (
    <div className={styles.card}>
      <p className={styles.price}>
        {price} {currency}
      </p>

      {dateEntries.length === 0 ? (
        <p className={styles.noDates}>{t('noDatesAvailable')}</p>
      ) : (
        <>
          {/* ── Calendar ──────────────────────────────────────────────── */}
          <div className={styles.calendar}>
            <div className={styles.calHeader}>
              <button type="button" onClick={prevMonth} className={styles.navBtn} aria-label="Previous month">
                ‹
              </button>
              <span className={styles.monthLabel}>{monthLabel}</span>
              <button type="button" onClick={nextMonth} className={styles.navBtn} aria-label="Next month">
                ›
              </button>
            </div>

            <div className={styles.dayNames}>
              {dayNames.map((n) => (
                <span key={n} className={styles.dayName}>{n}</span>
              ))}
            </div>

            <div className={styles.grid}>
              {calendarCells.map((dateStr, i) => {
                if (!dateStr) return <div key={`e-${i}`} />;

                const day = parseInt(dateStr.split('-')[2], 10);
                const hasSlots = !!entriesByDate[dateStr];
                const isPast = dateStr < TODAY;
                const isDisabled = !hasSlots || isPast;
                const isSelected = dateStr === selectedDate;
                const { left, total } = hasSlots ? spotsForDate(dateStr) : { left: 0, total: 0 };
                const fillPct = total > 0 ? Math.round((left / total) * 100) : 0;

                const barMod =
                  left === 0 ? styles.barFull
                  : fillPct > 50 ? styles.barGreen
                  : fillPct > 20 ? styles.barOrange
                  : styles.barRed;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    className={[
                      styles.day,
                      hasSlots && !isPast ? styles.dayActive : '',
                      isDisabled ? styles.dayDisabled : '',
                      isSelected ? styles.daySelected : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => !isDisabled && handleDateSelect(dateStr)}
                    aria-pressed={isSelected}
                    aria-label={dateStr}
                    tabIndex={isDisabled ? -1 : 0}
                  >
                    <span className={styles.dayNum}>{day}</span>
                    {hasSlots && !isPast && (
                      <span
                        className={`${styles.capacityBar} ${barMod}`}
                        style={{ '--fill': `${fillPct}%` } as React.CSSProperties}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Time slots ────────────────────────────────────────────── */}
          {selectedDate && timesForDate.length > 0 && (
            <div className={styles.times}>
              <p className={styles.timesLabel}>{t('chooseTime')}</p>
              <div className={styles.timeGrid}>
                {timesForDate.map((entry) => {
                  const spots = slotSpots(selectedDate, entry.startTime);
                  const full = spots === 0;
                  const active = selectedTime === entry.startTime;

                  return (
                    <button
                      key={entry.startTime}
                      type="button"
                      className={[
                        styles.timeSlot,
                        active ? styles.timeSlotActive : '',
                        full ? styles.timeSlotFull : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => handleTimeSelect(entry.startTime)}
                      aria-pressed={active}
                    >
                      <span className={styles.slotRange}>
                        {entry.startTime} – {entry.endTime}
                      </span>
                      <span className={styles.slotSpots}>
                        {full ? t('soldOut') : t('spotsLeftShort', { count: spots })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Waitlist / CTA ────────────────────────────────────────── */}
          {selectedEntry && (
            isSoldOut ? (
              <div className={styles.waitlist}>
                <p className={styles.waitlistTitle}>{t('waitlistTitle')}</p>
                <p className={styles.waitlistSub}>{t('waitlistSub')}</p>
                {waitlistStatus === 'sent' ? (
                  <p className={styles.waitlistSuccess}>{t('waitlistSuccess')}</p>
                ) : (
                  <form onSubmit={handleWaitlist} className={styles.waitlistForm}>
                    <Input
                      type="email"
                      className={styles.waitlistInput}
                      placeholder={t('waitlistEmailPlaceholder')}
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className={styles.waitlistBtn}
                      disabled={waitlistStatus === 'sending'}
                    >
                      {waitlistStatus === 'sending' ? t('waitlistSending') : t('waitlistNotifyMe')}
                    </button>
                    {waitlistStatus === 'error' && (
                      <p className={styles.waitlistError}>{t('waitlistError')}</p>
                    )}
                  </form>
                )}
              </div>
            ) : (
              <div className={styles.comingSoon}>
                <p className={styles.comingSoonTitle}>{t('paymentComingSoon')}</p>
                <p className={styles.comingSoonSub}>{t('paymentComingSoonSub')}</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
