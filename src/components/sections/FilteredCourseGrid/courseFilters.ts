import type { CuisineType } from '@/types';

export const CUISINES: CuisineType[] = ['chinese', 'korean', 'japanese', 'thai', 'vietnamese'];

export interface CourseFilters {
  q: string;
  cuisine: CuisineType | '';
  date: string; // "YYYY-MM-DD" or ''
  page: number;
}

export const EMPTY_FILTERS: CourseFilters = { q: '', cuisine: '', date: '', page: 1 };

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

/** Read filters from a page's searchParams, dropping anything invalid. */
export function parseCourseFilters(params: RawParams): CourseFilters {
  const cuisine = first(params.cuisine);
  const date = first(params.date);
  const page = Number.parseInt(first(params.page), 10);

  return {
    q: first(params.q).slice(0, 100),
    cuisine: (CUISINES as string[]).includes(cuisine) ? (cuisine as CuisineType) : '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

/** Query string for the filters — default values are omitted to keep URLs short. */
export function serializeCourseFilters(filters: CourseFilters): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.cuisine) params.set('cuisine', filters.cuisine);
  if (filters.date) params.set('date', filters.date);
  if (filters.page > 1) params.set('page', String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Lowercase and strip accents so "japones" matches "Japonés". */
export function normalizeSearch(text: string) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}
