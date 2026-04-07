import { forwardRef, type InputHTMLAttributes } from 'react';

import styles from './Input.module.scss';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, required, className, ...props }, ref) => (
    <div className={styles.field}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true"> *</span>
          )}
        </label>
      )}
      <input
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
      />
      {error && (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className={styles.hintText}>{hint}</p>}
    </div>
  ),
);

Input.displayName = 'Input';
export default Input;
