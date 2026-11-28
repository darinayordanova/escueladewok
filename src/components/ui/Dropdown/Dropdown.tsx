'use client';

import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

import Field from '@/components/ui/Field/Field';
import { Check, ChevronDown } from '@/components/ui/icons';

import styles from './Dropdown.module.scss';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string> {
  label: string;
  /** Sent with the form, through a hidden input */
  name: string;
  options: DropdownOption<T>[];
  /** '' shows the placeholder */
  value: T | '';
  onChange: (value: T) => void;
  placeholder?: string;
  id?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  fieldClassName?: string;
}

/**
 * A select in the site's style: the closed control matches Input and Select, the open list
 * is a white rounded panel instead of the system menu. Keyboard: arrows, Home/End, Enter,
 * Escape and typing a first letter, as on a native select.
 */
export default function Dropdown<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
  placeholder,
  id,
  hint,
  error,
  required,
  fieldClassName,
}: DropdownProps<T>) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = options.findIndex((option) => option.value === value);

  // Closes on a click anywhere else
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  // The list takes focus when it opens, so the keys below work in it
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  // Keeps the highlighted option in view in a long list
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const show = () => {
    setActive(selected >= 0 ? selected : 0);
    setOpen(true);
  };

  const pick = (index: number) => {
    onChange(options[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onButtonKey = (event: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      show();
    }
  };

  const onListKey = (event: KeyboardEvent) => {
    const last = options.length - 1;
    const moves: Record<string, () => void> = {
      ArrowDown: () => setActive((i) => Math.min(last, i + 1)),
      ArrowUp: () => setActive((i) => Math.max(0, i - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => pick(active),
      ' ': () => pick(active),
      Escape: () => {
        setOpen(false);
        buttonRef.current?.focus();
      },
      Tab: () => setOpen(false),
    };
    if (moves[event.key]) {
      if (event.key !== 'Tab') event.preventDefault();
      moves[event.key]();
      return;
    }
    // A letter jumps to the next option starting with it
    if (event.key.length === 1) {
      const letter = event.key.toLowerCase();
      const order = [...options.keys()].map((n) => (active + 1 + n) % options.length);
      const hit = order.find((n) => options[n].label.toLowerCase().startsWith(letter));
      if (hit !== undefined) setActive(hit);
    }
  };

  return (
    <Field label={label} hint={hint} error={error} required={required} id={id} className={fieldClassName}>
      {(control) => (
        <div ref={rootRef} className={styles.root}>
          <input type="hidden" name={name} value={value} />
          <button
            ref={buttonRef}
            type="button"
            id={control.id}
            className={[styles.control, open ? styles.isOpen : '', error ? styles.hasError : ''].filter(Boolean).join(' ')}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-describedby={control['aria-describedby']}
            onClick={() => (open ? setOpen(false) : show())}
            onKeyDown={onButtonKey}
          >
            <span className={selected >= 0 ? styles.value : styles.placeholder}>
              {selected >= 0 ? options[selected].label : placeholder}
            </span>
            <ChevronDown size={18} className={styles.chevron} />
          </button>

          {open && (
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-label={label}
              aria-activedescendant={`${listId}-${active}`}
              className={styles.list}
              onKeyDown={onListKey}
            >
              {options.map((option, i) => (
                <li
                  key={option.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === selected}
                  className={[styles.option, i === active ? styles.isActive : ''].filter(Boolean).join(' ')}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => pick(i)}
                >
                  {option.label}
                  {i === selected && <Check size={16} className={styles.tick} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Field>
  );
}
