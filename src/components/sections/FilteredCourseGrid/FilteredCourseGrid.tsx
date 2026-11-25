'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

import CorporateCourseCard from '@/components/sections/CorporateCourseCard/CorporateCourseCard';
import CourseCard from '@/components/sections/CourseCard/CourseCard';
import CourseGrid from '@/components/sections/CourseGrid/CourseGrid';
import ChipGroup from '@/components/ui/ChipGroup/ChipGroup';
import DatePicker from '@/components/ui/DatePicker/DatePicker';
import { Search } from '@/components/ui/icons';
import Input from '@/components/ui/Input/Input';
import Pagination from '@/components/ui/Pagination/Pagination';
import type { Course, CuisineType, ListedOccurrence, Locale } from '@/types';

import {
  CUISINES,
  EMPTY_FILTERS,
  normalizeSearch,
  serializeCourseFilters,
  type CourseFilters,
} from './courseFilters';
import styles from './FilteredCourseGrid.module.scss';

const PAGE_SIZE = 12;

type Props = { locale: Locale; initialFilters?: CourseFilters } & (
  | { variant: 'schedule'; occurrences: ListedOccurrence[] }
  | { variant: 'corporate'; courses: Course[] }
);

type Item = ListedOccurrence | Course;

const courseOf = (item: Item): Course => ('course' in item ? item.course : item);

/**
 * Search + cuisine (+ date for the schedule) filters over a course list.
 * Filters live in component state and are mirrored to the URL, so a filtered
 * view can be shared, bookmarked and restored on back-navigation.
 */
export default function FilteredCourseGrid(props: Props) {
  const { locale, initialFilters = EMPTY_FILTERS } = props;
  const t = useTranslations('filters');
  const tc = useTranslations('courses');
  const resultsRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState(initialFilters);
  const items: Item[] = props.variant === 'schedule' ? props.occurrences : props.courses;

  // Mirror filters to the URL without a server round-trip
  useEffect(() => {
    const next = `${window.location.pathname}${serializeCourseFilters(filters)}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, '', next);
    }
  }, [filters]);

  function updateFilters(patch: Partial<Omit<CourseFilters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }

  function changePage(page: number) {
    setFilters((f) => ({ ...f, page }));
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Options derived from the data ─────────────────────────────────────────
  const cuisineOptions = useMemo(() => {
    const present = new Set(items.map((item) => courseOf(item).cuisine).filter(Boolean));
    return [
      { value: '' as const, label: t('allCuisines') },
      ...CUISINES.filter((c) => present.has(c)).map((c) => ({ value: c, label: tc(`cuisine.${c}`) })),
    ];
  }, [items, t, tc]);

  const availableDates = useMemo(
    () => (props.variant === 'schedule' ? new Set(props.occurrences.map((o) => o.date)) : undefined),
    [props],
  );

  // ── Filtering ─────────────────────────────────────────────────────────────
  // Corporate events are few enough to scan, so only the class schedule gets a search box
  const hasSearch = props.variant === 'schedule';

  const filtered = useMemo(() => {
    const q = hasSearch ? normalizeSearch(filters.q) : '';
    return items.filter((item) => {
      const course = courseOf(item);
      if (filters.cuisine && course.cuisine !== filters.cuisine) return false;
      if (filters.date && 'date' in item && item.date !== filters.date) return false;
      if (q) {
        const haystack = normalizeSearch(
          `${course.title[locale]} ${course.cuisine ? tc(`cuisine.${course.cuisine}`) : ''}`,
        );
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, hasSearch, filters.q, filters.cuisine, filters.date, locale, tc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters = (hasSearch && filters.q !== '') || filters.cuisine !== '' || filters.date !== '';

  return (
    <div>
      {/* ── Filter bar ── */}
      <div role="search" className={styles.filterBar}>
        {hasSearch && (
          <Input
            type="search"
            label={t('searchLabel')}
            placeholder={t('searchPlaceholder')}
            value={filters.q}
            onChange={(e) => updateFilters({ q: e.target.value })}
            startIcon={<Search size={18} />}
            fieldClassName={styles.search}
            autoComplete="off"
          />
        )}

        {availableDates && (
          <DatePicker
            label={t('dateLabel')}
            placeholder={t('datePlaceholder')}
            clearLabel={t('clearDate')}
            value={filters.date}
            onChange={(date) => updateFilters({ date })}
            availableDates={availableDates}
            locale={locale}
            className={styles.date}
          />
        )}

        {cuisineOptions.length > 2 && (
          <ChipGroup<CuisineType | ''>
            legend={t('cuisineLabel')}
            options={cuisineOptions}
            value={filters.cuisine}
            onChange={(cuisine) => updateFilters({ cuisine })}
            size="sm"
            className={styles.cuisine}
          />
        )}
      </div>

      {/* ── Results ── */}
      <div ref={resultsRef} className={styles.results}>
        <div className={styles.resultsBar}>
          <h2 className={styles.resultsCount} aria-live="polite">
            {t(props.variant === 'corporate' ? 'eventsCount' : 'resultsCount', { count: filtered.length })}
          </h2>
          {hasActiveFilters && (
            <button type="button" className={styles.clearBtn} onClick={() => setFilters(EMPTY_FILTERS)}>
              {t('clearFilters')}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className={styles.empty}>{t('noResults')}</p>
        ) : (
          <>
            {props.variant === 'schedule' ? (
              <CourseGrid
                items={paginated as ListedOccurrence[]}
                getKey={(o) => `${o.course._id}-${o.date}-${o.startTime}`}
                renderItem={(o) => <CourseCard course={o.course} locale={locale} session={o} />}
              />
            ) : (
              <CourseGrid
                items={paginated as Course[]}
                getKey={(c) => c._id}
                renderItem={(c) => <CorporateCourseCard course={c} locale={locale} />}
              />
            )}
            <Pagination page={page} totalPages={totalPages} onPageChange={changePage} />
          </>
        )}
      </div>
    </div>
  );
}
