import CourseCard from '@/components/sections/CourseCard/CourseCard';
import type { Course, CourseOccurrence, Locale } from '@/types';

import styles from './CourseGrid.module.scss';

type CourseGridProps =
  | { courses: Course[]; occurrences?: undefined; locale: Locale }
  | { occurrences: CourseOccurrence[]; courses?: undefined; locale: Locale };

export default function CourseGrid({ courses, occurrences, locale }: CourseGridProps) {
  if (occurrences) {
    if (occurrences.length === 0) return null;
    return (
      <ul className={styles.grid} role="list">
        {occurrences.map((occ) => (
          <li key={`${occ.course._id}-${occ.date}-${occ.startTime}`}>
            <CourseCard course={occ.course} locale={locale} occurrence={occ} />
          </li>
        ))}
      </ul>
    );
  }

  if (!courses || courses.length === 0) return null;
  return (
    <ul className={styles.grid} role="list">
      {courses.map((course) => (
        <li key={course._id}>
          <CourseCard course={course} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
