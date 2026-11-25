import type { ReactNode } from 'react';

import styles from './CourseGrid.module.scss';

interface CourseGridProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}

/** Responsive card grid: 1 column → 2 at md → 3 at lg. */
export default function CourseGrid<T>({ items, getKey, renderItem }: CourseGridProps<T>) {
  if (items.length === 0) return null;

  return (
    <ul className={styles.grid} role="list">
      {items.map((item) => (
        <li key={getKey(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
