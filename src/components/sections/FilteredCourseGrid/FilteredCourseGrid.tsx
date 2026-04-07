'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import CourseGrid from '@/components/sections/CourseGrid/CourseGrid';
import type { Course, CourseOccurrence, CuisineType, Locale } from '@/types';

import styles from './FilteredCourseGrid.module.scss';

type Props =
  | { mode: 'occurrences'; occurrences: CourseOccurrence[]; locale: Locale }
  | { mode: 'courses'; courses: Course[]; locale: Locale };

export default function FilteredCourseGrid(props: Props) {
  const { locale } = props;
  const t = useTranslations('filters');
  const tc = useTranslations('courses');

  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState<CuisineType | ''>('');
  const [date, setDate] = useState('');

  // Derive available cuisines from the dataset
  const availableCuisines = useMemo<CuisineType[]>(() => {
    const raw =
      props.mode === 'occurrences'
        ? props.occurrences.map((o) => o.course.cuisine)
        : props.courses.map((c) => c.cuisine);
    return [...new Set(raw.filter(Boolean))] as CuisineType[];
  }, [props]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (props.mode === 'occurrences') {
      return props.occurrences.filter((occ) => {
        const c = occ.course;
        if (q && !c.title[locale].toLowerCase().includes(q)) return false;
        if (cuisine && c.cuisine !== cuisine) return false;
        if (date && occ.date !== date) return false;
        return true;
      });
    }

    return props.courses.filter((c) => {
      if (q && !c.title[locale].toLowerCase().includes(q)) return false;
      if (cuisine && c.cuisine !== cuisine) return false;
      return true;
    });
  }, [props, search, cuisine, date, locale]);

  const hasActiveFilters = search !== '' || cuisine !== '' || date !== '';

  function clearFilters() {
    setSearch('');
    setCuisine('');
    setDate('');
  }

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t('searchPlaceholder')}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            className={styles.select}
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value as CuisineType | '')}
            aria-label={t('cuisineLabel')}
          >
            <option value="">{t('allCuisines')}</option>
            {availableCuisines.map((c) => (
              <option key={c} value={c}>
                {tc(`cuisine.${c}`)}
              </option>
            ))}
          </select>
        </div>

        {props.mode === 'occurrences' && (
          <div className={styles.filterGroup}>
            <input
              type="date"
              className={styles.dateInput}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label={t('dateLabel')}
            />
          </div>
        )}

        {hasActiveFilters && (
          <button type="button" className={styles.clearBtn} onClick={clearFilters}>
            {t('clearFilters')}
          </button>
        )}
      </div>

      {/* ── Results ── */}
      {filtered.length === 0 ? (
        <p className={styles.empty}>{t('noResults')}</p>
      ) : props.mode === 'occurrences' ? (
        <CourseGrid occurrences={filtered as CourseOccurrence[]} locale={locale} />
      ) : (
        <CourseGrid courses={filtered as Course[]} locale={locale} />
      )}
    </div>
  );
}
