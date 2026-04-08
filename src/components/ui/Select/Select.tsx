import { forwardRef, type SelectHTMLAttributes } from 'react';

import { ChevronDown } from '@/components/ui/icons';

import styles from './Select.module.scss';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, id, required, className, children, ...props }, ref) => (
    <div className={styles.field}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true"> *</span>
          )}
        </label>
      )}
      <div className={styles.selectWrapper}>
        <select
          ref={ref}
          id={id}
          required={required}
          className={[
            styles.control,
            error ? styles.hasError : '',
            className ?? '',
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className={styles.chevron}  />
      </div>
      {error && (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className={styles.hintText}>{hint}</p>}
    </div>
  ),
);

Select.displayName = 'Select';
export default Select;
