import { useId, type ReactNode } from 'react';

import styles from './Field.module.scss';

/** Props a Field hands to its control so label, hint and error are wired up for assistive tech. */
export interface FieldControlProps {
  id: string;
  required?: boolean;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

export interface FieldProps {
  label?: string;
  /** Hide the label visually but keep it for screen readers. */
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Control id — generated when omitted. */
  id?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * Label + control + hint/error wrapper shared by every form control.
 * The control itself is rendered via the children render-prop.
 */
export default function Field({
  label,
  hideLabel = false,
  hint,
  error,
  required,
  id,
  className,
  children,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;

  const describedBy = [error ? errorId : null, hint && !error ? hintId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={[styles.field, className ?? ''].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={controlId} className={hideLabel ? 'sr-only' : styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true"> *</span>
          )}
        </label>
      )}

      {children({
        id: controlId,
        required,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}

      {error && (
        <p id={errorId} className={styles.errorText} role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className={styles.hintText}>
          {hint}
        </p>
      )}
    </div>
  );
}
