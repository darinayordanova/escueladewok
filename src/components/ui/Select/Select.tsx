import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';

import Field from '@/components/ui/Field/Field';
import { ChevronDown } from '@/components/ui/icons';

import styles from './Select.module.scss';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hideLabel?: boolean;
  error?: string;
  hint?: string;
  startIcon?: ReactNode;
  fieldClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hideLabel, error, hint, startIcon, id, required, className, fieldClassName, disabled, children, ...props }, ref) => (
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
          <select ref={ref} className={styles.select} disabled={disabled} {...control} {...props}>
            {children}
          </select>
          <ChevronDown size={18} className={styles.chevron} />
        </div>
      )}
    </Field>
  ),
);

Select.displayName = 'Select';
export default Select;
