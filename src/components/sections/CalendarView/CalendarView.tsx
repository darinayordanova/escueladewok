'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import { CUISINE_BG, CUISINE_COLOR, CUISINE_FALLBACK_BG, CUISINE_FALLBACK_COLOR } from '@/lib/cuisine';
import { todayISO } from '@/lib/courses/timeslots';
import type { CourseOccurrence, CuisineType, Locale } from '@/types';

import styles from './CalendarView.module.scss';

interface CalendarViewProps {
  occurrences: CourseOccurrence[];
  locale: Locale;
}

export default function CalendarView({ occurrences, locale }: CalendarViewProps) {
  const t = useTranslations('calendar');
  const today = useMemo(() => todayISO(), []);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  // ── Group occurrences by date ───────────────────────────────────────────────
  const byDate = useMemo(
    () =>
      occurrences.reduce<Record<string, CourseOccurrence[]>>((acc, occ) => {
        (acc[occ.date] ??= []).push(occ);
        return acc;
      }, {}),
    [occurrences],
  );

  // ── Calendar grid cells ─────────────────────────────────────────────────────
  const cells = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1; // Monday-first

    const result: Array<string | null> = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      result.push(
        `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      );
    }
    // Pad trailing cells so the grid is always full rows
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [year, month]);

  // ── Localised labels ────────────────────────────────────────────────────────
  const dayNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2025, 0, 6 + i)));
  }, [locale]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
        new Date(year, month, 1),
      ),
    [locale, year, month],
  );

  // ── Navigation ──────────────────────────────────────────────────────────────
  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }
  function goToToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  // ── Count of events this month (for empty-state check) ─────────────────────
  const eventsThisMonth = cells.filter(
    (d) => d && byDate[d]?.length,
  ).length;

  return (
    <div className={styles.wrapper}>
      {/* ── Cuisine legend ──────────────────────────────────────────────────── */}
      <div className={styles.legend}>
        {(Object.keys(CUISINE_COLOR) as CuisineType[]).map((c) => (
          <span key={c} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: CUISINE_COLOR[c] }}
            />
            {t(`cuisine.${c}`)}
          </span>
        ))}
      </div>

      {/* ── Calendar header ─────────────────────────────────────────────────── */}
      <div className={`flex flex-align-center flex-justify-center flex-md-justify-between gap-4 mb-4`}>
        <div className={styles.headerNav}>
          <button type="button" onClick={prevMonth} className={styles.navBtn} aria-label={t('prevMonth')}>
            <ChevronLeft size={18} />
          </button>
          <h2 className={styles.monthTitle}>{monthLabel}</h2>
          <button type="button" onClick={nextMonth} className={styles.navBtn} aria-label={t('nextMonth')}>
            <ChevronRight size={18} />
          </button>
        </div>

        {!isCurrentMonth && (
          <button type="button" onClick={goToToday} className={`hidden visible-md ${styles.todayBtn}`}>
            {t('today')}
          </button>
        )}
      </div>

      {/* ── Day-name row (grid only) ────────────────────────────────────────── */}
      <div className={`${styles.dayNames} ${styles.gridOnly}`}>
        {dayNames.map((name) => (
          <span key={name} className={styles.dayName}>{name}</span>
        ))}
      </div>

      {/* ── Calendar grid (md+) ─────────────────────────────────────────────── */}
      <div className={`${styles.grid} ${styles.gridOnly}`}>
        {cells.map((dateStr, i) => {
          if (!dateStr) {
            return <div key={`pad-${i}`} className={styles.cellPad} />;
          }

          const day = parseInt(dateStr.split('-')[2], 10);
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const events = byDate[dateStr] ?? [];
          const isWeekend = (i % 7) >= 5;

          return (
            <div
              key={dateStr}
              className={[
                styles.cell,
                isPast ? styles.cellPast : '',
                isToday ? styles.cellToday : '',
                isWeekend ? styles.cellWeekend : '',
                events.length > 0 ? styles.cellActive : '',
              ].filter(Boolean).join(' ')}
            >
              <span className={[styles.dayNum, isToday ? styles.dayNumToday : ''].filter(Boolean).join(' ')}>
                {day}
              </span>
              {events.length > 0 && (
                <div className={styles.events}>
                  {events.map((occ) => {
                    const color = CUISINE_COLOR[occ.course.cuisine ?? ''] ?? CUISINE_FALLBACK_COLOR;
                    const bg = CUISINE_BG[occ.course.cuisine ?? ''] ?? CUISINE_FALLBACK_BG;
                    return (
                      <Link
                        key={`${occ.course._id}-${occ.startTime}`}
                        href={`/courses/${occ.course.slug.current}?date=${occ.date}&time=${occ.startTime}`}
                        className={styles.event}
                        style={{ '--ev-color': color, '--ev-bg': bg } as React.CSSProperties}
                      >
                        <span className={styles.eventTime}>{occ.startTime}</span>
                        <span title={occ.course.title[locale]} className={`text-sm m-no ${styles.eventTitle}`}>
                          {occ.course.title[locale]}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Agenda list (mobile only) ────────────────────────────────────────── */}
      <div className={`${styles.agenda} ${styles.mobileOnly}`}>
        <div className='flex flex-column gap-4'>
        {cells.filter((d): d is string => !!d && !!(byDate[d]?.length)).length === 0 ? null :
          cells.filter((d): d is string => !!d && !!(byDate[d]?.length)).map((dateStr) => {
            const isToday = dateStr === today;
            const isPast = dateStr < today;
            const events = byDate[dateStr];
            const [, , dd] = dateStr.split('-');
            const dateLabel = new Intl.DateTimeFormat(locale, {
              weekday: 'long', day: 'numeric', month: 'long',
            }).format(new Date(dateStr + 'T00:00:00'));

            return (
              <div key={dateStr} className={[styles.agendaDay, isPast ? styles.agendaDayPast : ''].filter(Boolean).join(' ')}>
                <div className={styles.agendaDateRow}>
                  <span className={[styles.agendaDayNum, isToday ? styles.dayNumToday : ''].filter(Boolean).join(' ')}>
                    {dd}
                  </span>
                  <span className={styles.agendaDateLabel}>{dateLabel}</span>
                </div>
                <div className={styles.agendaEvents}>
                  {events.map((occ) => {
                    const color = CUISINE_COLOR[occ.course.cuisine ?? ''] ?? CUISINE_FALLBACK_COLOR;
                    const bg = CUISINE_BG[occ.course.cuisine ?? ''] ?? CUISINE_FALLBACK_BG;
                    return (
                      <Link
                        key={`${occ.course._id}-${occ.startTime}`}
                        href={`/courses/${occ.course.slug.current}?date=${occ.date}&time=${occ.startTime}`}
                        className={styles.agendaEvent}
                        style={{ '--ev-color': color, '--ev-bg': bg } as React.CSSProperties}
                      >
                        <span className={styles.agendaDot} style={{ background: color }} />
                        <div className={styles.agendaEventInfo}>
                          <span className={styles.agendaEventTitle}>{occ.course.title[locale]}</span>
                          <span className={styles.agendaEventTime}>{occ.startTime}</span>
                        </div>
                        <ChevronRight size={16} className={styles.agendaChevron} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })
        }
        </div>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {eventsThisMonth === 0 && (
        <p className="text-center text-muted pt-16 pb-8 text-lg">
          {t('noEvents')}
        </p>
      )}
    </div>
  );
}
