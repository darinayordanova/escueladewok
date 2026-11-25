'use client';

import { useId } from 'react';

import styles from './ChipGroup.module.scss';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string> {
  legend: string;
  hideLegend?: boolean;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Radio group name — generated when omitted. */
  name?: string;
  /** Tighter chips, for a filter row that has to fit several options. */
  size?: 'md' | 'sm';
  className?: string;
}

/**
 * Single-choice pill group. Built on native radios so arrow-key navigation,
 * form semantics and screen-reader announcements come for free.
 */
export default function ChipGroup<T extends string>({
  legend,
  hideLegend = false,
  options,
  value,
  onChange,
  name,
  size = 'md',
  className,
}: ChipGroupProps<T>) {
  const generatedName = useId();
  const groupName = name ?? generatedName;

  return (
    <fieldset className={[styles.group, styles[size], className ?? ''].filter(Boolean).join(' ')}>
      <legend className={hideLegend ? 'sr-only' : styles.legend}>{legend}</legend>
      <div className={styles.chips}>
        {options.map((option) => (
          <label key={option.value} className={styles.chip}>
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className={styles.input}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
