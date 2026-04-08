import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { Link } from '@/i18n/navigation';
import type { ComponentPropsWithoutRef } from 'react';

import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonColor = 'white' | 'black';

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  color?: ButtonColor;
};

type AsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
    isLoading?: boolean;
  };

type AsLink = BaseProps &
  ComponentPropsWithoutRef<typeof Link> & {
    href: string;
    isLoading?: never;
    disabled?: never;
  };

type ButtonProps = AsButton | AsLink;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    color,
    children,
    className,
    ...props
  },
  ref,
) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    color ? styles[color] : '',
    fullWidth ? styles.fullWidth : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  if (props.href !== undefined) {
    const { href, ...linkProps } = props as AsLink;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { isLoading, disabled, ...buttonProps } = props as AsButton;
  return (
    <button
      ref={ref}
      className={`${classes}${isLoading ? ` ${styles.loading}` : ''}`}
      disabled={disabled || isLoading}
      {...buttonProps}
    >
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
});

export default Button;
