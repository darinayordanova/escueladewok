import { CUISINE_COLOR, CUISINE_FALLBACK_COLOR } from '@/lib/cuisine';
import type { CuisineType } from '@/types';

import styles from './CuisinePill.module.scss';

interface CuisinePillProps {
  cuisine: CuisineType | string;
  label: string;
  className?: string;
}

export default function CuisinePill({ cuisine, label, className }: CuisinePillProps) {
  const color = CUISINE_COLOR[cuisine] ?? CUISINE_FALLBACK_COLOR;

  return (
    <span
      className={`py-1 px-3 color-white text-xs m-no font-semibold text-uppercase ${styles.pill}${className ? ` ${className}` : ''}`}
      style={{ '--pill-bg': color} as React.CSSProperties}
    >
      {label}
    </span>
  );
}
