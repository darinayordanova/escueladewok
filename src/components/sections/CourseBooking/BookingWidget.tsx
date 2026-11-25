'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import Button from '@/components/ui/Button/Button';
import { ChevronRight } from '@/components/ui/icons';
import Input from '@/components/ui/Input/Input';
import MonthCalendar, { CapacityBar } from '@/components/ui/MonthCalendar/MonthCalendar';
import QuantityStepper from '@/components/ui/QuantityStepper/QuantityStepper';
import StatusDot from '@/components/ui/StatusDot/StatusDot';
import { availabilityLevel, dayPart, todayISO } from '@/lib/courses/timeslots';
import { formatPrice } from '@/lib/format';

import styles from './BookingWidget.module.scss';
import { useCourseBooking } from './CourseBookingContext';

interface BookingWidgetProps {
  /** `compact` for the narrow sidebar, `wide` for the reserve section. */
  variant: 'compact' | 'wide';
  className?: string;
}

/** Two steps: pick a date on the calendar, then guests and checkout for that session. */
export default function BookingWidget({ variant, className }: BookingWidgetProps) {
  const t = useTranslations('courseDetail');
  const booking = useCourseBooking();
  const { course, locale, dateEntries, selectedDate } = booking;

  // Move focus to whichever step this widget just switched to
  const sessionHeadingRef = useRef<HTMLParagraphElement>(null);
  const calendarHeadingRef = useRef<HTMLParagraphElement>(null);
  const pendingFocus = useRef<'session' | 'calendar' | null>(null);

  useEffect(() => {
    const target = pendingFocus.current === 'session' ? sessionHeadingRef : calendarHeadingRef;
    if (pendingFocus.current) target.current?.focus();
    pendingFocus.current = null;
  }, [selectedDate]);

  const price = formatPrice(course.price, course.currency, locale);
  const isCompact = variant === 'compact';

  return (
    <div className={[styles.card, styles[variant], className ?? ''].filter(Boolean).join(' ')}>
      {dateEntries.length === 0 ? (
        <>
          <Header eyebrow={isCompact ? t('chooseDate') : t('chooseSession')} price={isCompact ? price : undefined} />
          <p className={styles.empty}>{t('noDatesAvailable')}</p>
        </>
      ) : !selectedDate ? (
        <>
          <Header
            eyebrow={isCompact ? t('chooseDate') : t('chooseSession')}
            price={isCompact ? price : undefined}
            headingRef={calendarHeadingRef}
          />
          <MonthCalendar
            legend
            className={`${styles.calendar} ${styles.step}`}
            value={selectedDate}
            onSelect={(date) => {
              pendingFocus.current = 'session';
              booking.selectDate(date);
            }}
            locale={locale}
            initialDate={dateEntries[0]?.date}
            isDateDisabled={(date) => !booking.entriesByDate[date] || date < todayISO()}
            renderIndicator={(date, { isDisabled }) => {
              if (isDisabled) return null;
              const { left, total } = booking.spotsForDate(date);
              return (
                <CapacityBar
                  fill={total > 0 ? Math.round((left / total) * 100) : 0}
                  level={availabilityLevel(left, total)}
                />
              );
            }}
          />
        </>
      ) : (
        <Session
          isCompact={isCompact}
          price={price}
          headingRef={sessionHeadingRef}
          onChangeDate={() => {
            pendingFocus.current = 'calendar';
            booking.clearSelection();
          }}
        />
      )}
    </div>
  );
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

function Header({
  eyebrow,
  price,
  headingRef,
}: {
  eyebrow: string;
  price?: string;
  headingRef?: React.Ref<HTMLParagraphElement>;
}) {
  return (
    <div className={styles.header}>
      <p ref={headingRef} tabIndex={-1} className={styles.eyebrow}>{eyebrow}</p>
      {price && <p className={styles.headerPrice}>{price}</p>}
    </div>
  );
}

function Session({
  isCompact,
  price,
  headingRef,
  onChangeDate,
}: {
  isCompact: boolean;
  price: string;
  headingRef: React.Ref<HTMLParagraphElement>;
  onChangeDate: () => void;
}) {
  const t = useTranslations('courseDetail');
  const tc = useTranslations('cart');
  const booking = useCourseBooking();
  const { course, locale, selectedDate, selectedEntry, timesForDate, status, spotsLeft, guests } = booking;

  const [y, m, d] = selectedDate.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(day);
  const title = selectedEntry
    ? t(`dayPart.${dayPart(selectedEntry.startTime)}`, { weekday })
    : weekday;

  const changeDate = (
    <button type="button" className={styles.changeDate} onClick={onChangeDate}>
      {t('changeDate')}
    </button>
  );

  return (
    <>
      <Header eyebrow={t('yourSession')} price={isCompact ? price : undefined} headingRef={headingRef} />

      <div className={`${styles.session} ${styles.step}`}>
        <div className={styles.sessionMain}>
          <time dateTime={selectedDate} className={styles.dateTile}>
            <span className={styles.tileMonth}>
              {new Intl.DateTimeFormat(locale, { month: 'short' }).format(day).replace('.', '')}
            </span>
            <span className={styles.tileDay}>{d}</span>
            <span className={styles.tileYear}>{y}</span>
          </time>
          <div className={styles.sessionText}>
            <p className={styles.sessionTitle}>{title}</p>
            {selectedEntry && (
              <p className={styles.sessionTime}>
                {selectedEntry.startTime}–{selectedEntry.endTime}
              </p>
            )}
            {changeDate}
          </div>
        </div>
        {selectedEntry && (
          <StatusDot
            className={styles.sessionStatus}
            level={status === 'open' ? availabilityLevel(spotsLeft, course.maxParticipants) : 'none'}
          >
            {status === 'closed'
              ? t('bookingClosedTitle')
              : status === 'soldOut'
                ? t('soldOut')
                : t(spotsLeft === 1 ? 'spotsLeft' : 'spotsLeftPlural', { count: spotsLeft })}
          </StatusDot>
        )}
      </div>

      {/* Several sessions on the same day */}
      {timesForDate.length > 1 && (
        <fieldset className={styles.times}>
          <legend className={styles.label}>{t('chooseTime')}</legend>
          <div className={styles.timeGrid}>
            {timesForDate.map((entry) => {
              const closed = !booking.slotOpen(selectedDate, entry.startTime);
              const spots = booking.spotsFor(selectedDate, entry.startTime);
              const active = entry.startTime === booking.selectedTime;
              return (
                <button
                  key={entry.startTime}
                  type="button"
                  className={[styles.timeSlot, active ? styles.timeSlotActive : ''].filter(Boolean).join(' ')}
                  onClick={() => booking.selectTime(entry.startTime)}
                  aria-pressed={active}
                >
                  <span>{entry.startTime}–{entry.endTime}</span>
                  <span className={styles.timeSlotSpots}>
                    {closed ? t('bookingClosed') : spots === 0 ? t('soldOut') : t('spotsLeftShort', { count: spots })}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {status === 'open' && (
        <>
          <div className={styles.guests}>
            <div>
              <p className={styles.label}>{isCompact ? t('guests') : t('numberOfGuests')}</p>
              <p className={styles.perPerson}>{t('perPerson', { price })}</p>
            </div>
            <QuantityStepper
              value={guests}
              onChange={booking.setGuests}
              max={spotsLeft}
              label={t('numberOfGuests')}
              decreaseLabel={t('removeGuest')}
              increaseLabel={t('addGuest')}
            />
          </div>

          <div className={styles.total}>
            <p className={styles.totalLabel}>{t('total')}</p>
            <p className={styles.totalPrice} aria-live="polite">
              {/* Re-keyed so the figure animates each time it changes */}
              <span key={guests} className={styles.totalValue}>
                {formatPrice(course.price * guests, course.currency, locale)}
              </span>
            </p>
          </div>

          <div className={styles.actions}>
            <Button variant="outline" fullWidth onClick={booking.addToCart}>
              {tc('addToCart')}
            </Button>
            <Button fullWidth onClick={booking.checkout} isLoading={booking.isCheckingOut}>
              {booking.isCheckingOut ? t('processing') : tc('buyNow')}
              {!booking.isCheckingOut && <ChevronRight size={20} />}
            </Button>
          </div>
        </>
      )}

      {status === 'soldOut' && <Waitlist />}

      {status === 'closed' && <p className={styles.note}>{t('bookingClosedSub')}</p>}
    </>
  );
}

function Waitlist() {
  const t = useTranslations('courseDetail');
  const { joinWaitlist } = useCourseBooking();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  if (state === 'sent') {
    return <p className={styles.success} role="status">{t('waitlistSuccess')}</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      await joinWaitlist(email);
      setState('sent');
    } catch {
      setState('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.waitlist}>
      <p className={styles.note}>{t('waitlistSub')}</p>
      <Input
        type="email"
        label={t('checkout.email')}
        hideLabel
        autoComplete="email"
        placeholder={t('waitlistEmailPlaceholder')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        error={state === 'error' ? t('waitlistError') : undefined}
      />
      <Button type="submit" fullWidth isLoading={state === 'sending'}>
        {state === 'sending' ? t('waitlistSending') : t('waitlistNotifyMe')}
      </Button>
    </form>
  );
}
