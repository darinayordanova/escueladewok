'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useCart } from '@/context/CartContext';
import { trackPixel } from '@/lib/analytics/metaPixel';
import { isBookingOpen, slotSpots, todayISO } from '@/lib/courses/timeslots';
import type { BookingCountMap, DateEntry, Locale } from '@/types';

export interface BookableCourse {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  duration: number;
  maxParticipants: number;
  price: number;
  currency: string;
}

/** What can be done with the selected session. */
export type SessionStatus = 'open' | 'soldOut' | 'closed';

interface CourseBookingValue {
  course: BookableCourse;
  locale: Locale;
  dateEntries: DateEntry[];
  entriesByDate: Record<string, DateEntry[]>;
  selectedDate: string;
  selectedTime: string;
  /** Set once both a date and a time are chosen. */
  selectedEntry: DateEntry | undefined;
  timesForDate: DateEntry[];
  status: SessionStatus | undefined;
  spotsLeft: number;
  guests: number;
  setGuests: (guests: number) => void;
  slotOpen: (date: string, time: string) => boolean;
  spotsFor: (date: string, time: string) => number;
  /** Bookable spots across every session on a date, for calendar indicators. */
  spotsForDate: (date: string) => { left: number; total: number };
  selectDate: (date: string) => void;
  selectTime: (time: string) => void;
  clearSelection: () => void;
  addToCart: () => void;
  checkout: () => Promise<void>;
  isCheckingOut: boolean;
  /** The newsletter box beside "Buy now" */
  newsletterOptIn: boolean;
  setNewsletterOptIn: (checked: boolean) => void;
  joinWaitlist: (email: string) => Promise<void>;
}

const CourseBookingContext = createContext<CourseBookingValue | null>(null);

interface CourseBookingProviderProps {
  course: BookableCourse;
  locale: Locale;
  dateEntries: DateEntry[];
  bookingCounts: BookingCountMap;
  /** From the URL, e.g. when arriving from a course card. Ignored if not bookable. */
  initialDate?: string;
  initialTime?: string;
  children: ReactNode;
}

/**
 * One booking selection shared by every booking widget on the course page,
 * so choosing a date in the sidebar and in the reserve section stay in sync.
 */
export function CourseBookingProvider({
  course,
  locale,
  dateEntries,
  bookingCounts,
  initialDate = '',
  initialTime = '',
  children,
}: CourseBookingProviderProps) {
  const { addItem, openCart } = useCart();

  const entriesByDate = useMemo(
    () =>
      dateEntries.reduce<Record<string, DateEntry[]>>((acc, e) => {
        (acc[e.date] ??= []).push(e);
        return acc;
      }, {}),
    [dateEntries],
  );

  // Captured once so every slot is judged against the same moment
  const [now] = useState(() => Date.now());

  const [selectedDate, setSelectedDate] = useState(() =>
    initialDate && entriesByDate[initialDate] && initialDate >= todayISO() ? initialDate : '',
  );
  const [selectedTime, setSelectedTime] = useState(() => {
    const times = entriesByDate[selectedDate] ?? [];
    if (times.some((e) => e.startTime === initialTime)) return initialTime;
    return times.length === 1 ? times[0].startTime : '';
  });
  const [guests, setGuestsState] = useState(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  const slotOpen = useCallback(
    (date: string, time: string) => isBookingOpen(date, time, bookingCounts[`${date}|${time}`] ?? 0, now),
    [bookingCounts, now],
  );

  const spotsFor = useCallback(
    (date: string, time: string) => slotSpots(course.maxParticipants, bookingCounts, date, time),
    [bookingCounts, course.maxParticipants],
  );

  const spotsForDate = useCallback(
    (date: string) => {
      const entries = entriesByDate[date] ?? [];
      // Closed sessions count as having no spots left
      const left = entries.reduce(
        (sum, e) => sum + (slotOpen(date, e.startTime) ? spotsFor(date, e.startTime) : 0),
        0,
      );
      return { left, total: entries.length * course.maxParticipants };
    },
    [entriesByDate, slotOpen, spotsFor, course.maxParticipants],
  );

  const timesForDate = selectedDate ? (entriesByDate[selectedDate] ?? []) : [];
  const selectedEntry = timesForDate.find((e) => e.startTime === selectedTime);
  const spotsLeft = selectedEntry ? spotsFor(selectedDate, selectedTime) : 0;
  const status: SessionStatus | undefined = !selectedEntry
    ? undefined
    : !slotOpen(selectedDate, selectedTime)
      ? 'closed'
      : spotsLeft === 0
        ? 'soldOut'
        : 'open';

  // Keep the URL shareable without a server round-trip
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedDate) params.set('date', selectedDate);
    else params.delete('date');
    if (selectedTime) params.set('time', selectedTime);
    else params.delete('time');
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [selectedDate, selectedTime]);

  function selectDate(date: string) {
    const times = entriesByDate[date] ?? [];
    setSelectedDate(date);
    setSelectedTime(times.length === 1 ? times[0].startTime : '');
    setGuestsState(1);
  }

  function selectTime(time: string) {
    setSelectedTime(time);
    setGuestsState(1);
  }

  function clearSelection() {
    setSelectedDate('');
    setSelectedTime('');
    setGuestsState(1);
  }

  function setGuests(value: number) {
    setGuestsState(Math.max(1, Math.min(value, spotsLeft || 1)));
  }

  function buildCartItem() {
    return {
      courseId: course.courseId,
      courseSlug: course.courseSlug,
      courseTitle: course.courseTitle,
      date: selectedDate,
      startTime: selectedTime,
      endTime: selectedEntry?.endTime ?? '',
      duration: course.duration,
      price: course.price,
      currency: course.currency,
      maxParticipants: course.maxParticipants,
    };
  }

  // Ads: someone looked at this class
  useEffect(() => {
    trackPixel('ViewContent', {
      content_ids: [course.courseSlug],
      content_name: course.courseTitle,
      content_type: 'product',
      value: course.price,
      currency: course.currency,
    });
  }, [course.courseSlug, course.courseTitle, course.price, course.currency]);

  function addToCart() {
    if (status !== 'open') return;
    trackPixel('AddToCart', {
      content_ids: [course.courseSlug],
      content_name: course.courseTitle,
      content_type: 'product',
      value: course.price * guests,
      currency: course.currency,
    });
    addItem(buildCartItem(), guests);
    openCart();
  }

  async function checkout() {
    if (status !== 'open') return;
    setIsCheckingOut(true);
    trackPixel('InitiateCheckout', {
      content_ids: [course.courseSlug],
      content_type: 'product',
      value: course.price * guests,
      currency: course.currency,
      num_items: guests,
    });
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ ...buildCartItem(), quantity: guests }],
          locale,
          newsletter: newsletterOptIn,
          cancelPath: `/${locale}/courses/${course.courseSlug}?date=${selectedDate}&time=${selectedTime}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unknown error');
      window.location.href = data.url;
    } catch {
      setIsCheckingOut(false);
    }
  }

  async function joinWaitlist(email: string) {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        courseTitle: course.courseTitle,
        courseSlug: course.courseSlug,
        date: selectedDate,
        startTime: selectedTime,
      }),
    });
    if (!res.ok) throw new Error('Waitlist request failed');
  }

  const value: CourseBookingValue = {
    course,
    locale,
    dateEntries,
    entriesByDate,
    selectedDate,
    selectedTime,
    selectedEntry,
    timesForDate,
    status,
    spotsLeft,
    guests,
    setGuests,
    slotOpen,
    spotsFor,
    spotsForDate,
    selectDate,
    selectTime,
    clearSelection,
    addToCart,
    checkout,
    isCheckingOut,
    newsletterOptIn,
    setNewsletterOptIn,
    joinWaitlist,
  };

  return <CourseBookingContext.Provider value={value}>{children}</CourseBookingContext.Provider>;
}

export function useCourseBooking() {
  const ctx = useContext(CourseBookingContext);
  if (!ctx) throw new Error('useCourseBooking must be used inside <CourseBookingProvider>');
  return ctx;
}
