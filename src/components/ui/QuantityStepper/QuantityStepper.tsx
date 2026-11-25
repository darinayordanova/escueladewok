'use client';

import { Minus, Plus } from '@/components/ui/icons';

import styles from './QuantityStepper.module.scss';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  /** Accessible name of the whole control, e.g. "Number of guests". */
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  className?: string;
}

/** − value + pill. The value is announced as it changes. */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  label,
  decreaseLabel,
  increaseLabel,
  className,
}: QuantityStepperProps) {
  return (
    <div role="group" aria-label={label} className={[styles.stepper, className ?? ''].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={styles.btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={decreaseLabel}
      >
        <Minus size={18} />
      </button>
      <output className={styles.value} aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={styles.btn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={increaseLabel}
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
