import { forwardRef, type TextareaHTMLAttributes } from 'react';

import Field from '@/components/ui/Field/Field';

import styles from './Textarea.module.scss';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hideLabel?: boolean;
  error?: string;
  hint?: string;
  fieldClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hideLabel, error, hint, id, required, className, fieldClassName, ...props }, ref) => (
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
        <textarea
          ref={ref}
          className={[styles.control, error ? styles.hasError : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
          {...control}
          {...props}
        />
      )}
    </Field>
  ),
);

Textarea.displayName = 'Textarea';
export default Textarea;
