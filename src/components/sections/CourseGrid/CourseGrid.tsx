import CourseCard from '@/components/sections/CourseCard/CourseCard';
import type { Course, Locale } from '@/types';

import styles from './CourseGrid.module.scss';

interface CourseGridProps {
  courses: Course[];
  locale: Locale;
}

export default function CourseGrid({ courses, locale }: CourseGridProps) {
  if (courses.length === 0) {
    return null;
  }

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
