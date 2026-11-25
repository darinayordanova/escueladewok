import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import Field from '@/components/ui/Field/Field';

import styles from './Input.module.scss';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hideLabel?: boolean;
  error?: string;
  hint?: string;
  /** Decorative icon rendered before the text, e.g. <Search size={18} /> */
  startIcon?: ReactNode;
  /** Class for the outer field wrapper (layout); `className` styles the box. */
  fieldClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hideLabel, error, hint, startIcon, id, required, className, fieldClassName, disabled, ...props }, ref) => (
    <Field
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      required={required}
      id={id}
      className={fieldClassName}
    >
      {(control) => (
        <div
          className={[
            styles.control,
            error ? styles.hasError : '',
            disabled ? styles.isDisabled : '',
            className ?? '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {startIcon && <span className={styles.icon} aria-hidden="true">{startIcon}</span>}
          <input ref={ref} className={styles.input} disabled={disabled} {...control} {...props} />
        </div>
      )}
    </Field>
  ),
);

Input.displayName = 'Input';
export default Input;
