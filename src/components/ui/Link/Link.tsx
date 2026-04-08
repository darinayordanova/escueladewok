import { Link as IntlLink } from '@/i18n/navigation';
import type { ComponentPropsWithoutRef } from 'react';
import { ArrowRight } from '../icons';
import styles from './Link.module.scss';

type LinkProps = ComponentPropsWithoutRef<typeof IntlLink> & {
  hasArrow?: boolean;
};

export default function Link({ hasArrow, children, className, ...props }: LinkProps) {
  return (
    <IntlLink
      className={["inline-flex flex-align-center gap-1 font-medium",styles.link, className ?? ''].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
      {hasArrow && <ArrowRight size={16} className={styles.linkArrow} />}
    </IntlLink>
  );
}
