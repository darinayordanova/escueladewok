import { forwardRef, type InputHTMLAttributes } from 'react';

import { Check } from '@/components/ui/icons';

import styles from './Checkbox.module.scss';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  /** Extra class for the label text, e.g. light text on a dark ground. */
  labelClassName?: string;
}

/** A checkbox with its label beside it; the native input stays for keyboard and screen readers. */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ label, labelClassName, className, ...props }, ref) => (
  <label className={[styles.checkbox, className ?? ''].filter(Boolean).join(' ')}>
    <input ref={ref} type="checkbox" className={styles.input} {...props} />
    <span className={styles.box} aria-hidden="true">
      <Check size={12} className={styles.tick} />
    </span>
    <span className={[styles.label, labelClassName ?? ''].filter(Boolean).join(' ')}>{label}</span>
  </label>
));

Checkbox.displayName = 'Checkbox';

export default Checkbox;
