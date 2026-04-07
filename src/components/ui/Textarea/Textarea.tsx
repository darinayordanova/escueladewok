import { forwardRef, type TextareaHTMLAttributes } from 'react';

import styles from './Textarea.module.scss';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
      <textarea
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

Textarea.displayName = 'Textarea';
export default Textarea;
