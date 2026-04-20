import CourseCard from '@/components/sections/CourseCard/CourseCard';
import { slotSpots } from '@/lib/courses/timeslots';
import type { BookingCountMap, Course, CourseOccurrence, Locale } from '@/types';

import styles from './CourseGrid.module.scss';

type CourseGridProps =
  | { courses: Course[]; occurrences?: undefined; locale: Locale; bookingCounts?: undefined }
  | { occurrences: CourseOccurrence[]; courses?: undefined; locale: Locale; bookingCounts?: BookingCountMap };

export default function CourseGrid({ courses, occurrences, locale, bookingCounts }: CourseGridProps) {
  if (occurrences) {
    if (occurrences.length === 0) return null;
    return (
      <ul className={styles.grid} role="list">
        {occurrences.map((occ) => {
          const perCourseMap: BookingCountMap = {};
          if (bookingCounts) {
            for (const [key, count] of Object.entries(bookingCounts)) {
              if (key.startsWith(`${occ.course.slug.current}|`)) {
                perCourseMap[key.slice(occ.course.slug.current.length + 1)] = count;
              }
            }
          }
          const spots = slotSpots(occ.course.maxParticipants, perCourseMap, occ.date, occ.startTime);
          return (
            <li key={`${occ.course._id}-${occ.date}-${occ.startTime}`}>
              <CourseCard course={occ.course} locale={locale} occurrence={occ} spotsLeft={spots} />
            </li>
          );
        })}
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
