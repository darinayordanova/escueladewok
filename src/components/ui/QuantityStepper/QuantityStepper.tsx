'use client';

import { useState } from 'react';

import { Minus, Plus } from '@/components/ui/icons';

import styles from './QuantityStepper.module.scss';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  /** No ceiling when left out */
  max?: number;
  /** Accessible name of the whole control, e.g. "Number of guests". */
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  /** The number can also be typed; out-of-range values snap to min or max on leaving the field. */
  editable?: boolean;
  /** Form name for the typed number */
  name?: string;
  className?: string;
}

/** − value + pill. The value is announced as it changes, or typed when `editable`. */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = Infinity,
  label,
  decreaseLabel,
  increaseLabel,
  editable = false,
  name,
  className,
}: QuantityStepperProps) {
  // What is in the box while typing (may be empty or out of range for a moment); null shows the value
  const [draft, setDraft] = useState<string | null>(null);

  const type = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    setDraft(digits);
    const n = Number(digits);
    if (digits && n >= min && n <= max) onChange(n);
  };
  const settle = () => {
    const next = draft ? Math.min(max, Math.max(min, Number(draft))) : value;
    setDraft(null);
    if (next !== value) onChange(next);
  };

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
      {editable ? (
        <input
          type="text"
          inputMode="numeric"
          name={name}
          className={`${styles.value} ${styles.input}`}
          value={draft ?? String(value)}
          aria-label={label}
          onChange={(e) => type(e.target.value)}
          onBlur={settle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              settle();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              setDraft(null);
              onChange(Math.min(max, Math.max(min, value + (e.key === 'ArrowUp' ? 1 : -1))));
            }
          }}
          onFocus={(e) => e.target.select()}
        />
      ) : (
        <output className={styles.value} aria-live="polite">
          {value}
        </output>
      )}
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
