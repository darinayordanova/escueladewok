import type { ReactNode } from 'react';

import type { AvailabilityLevel } from '@/lib/courses/timeslots';

import styles from './StatusDot.module.scss';

interface StatusDotProps {
  level: AvailabilityLevel;
  children: ReactNode;
  className?: string;
}

/** Coloured dot + label. The label carries the meaning; colour only reinforces it. */
export default function StatusDot({ level, children, className }: StatusDotProps) {
  return (
    <span className={[styles.status, styles[level], className ?? ''].filter(Boolean).join(' ')}>
      <span className={styles.dot} aria-hidden="true" />
      {children}
    </span>
  );
}
