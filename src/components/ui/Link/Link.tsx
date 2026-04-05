import { Link as IntlLink } from '@/i18n/navigation';
import type { ComponentPropsWithoutRef } from 'react';

import styles from './Link.module.scss';

type LinkProps = ComponentPropsWithoutRef<typeof IntlLink> & {
  hasArrow?: boolean;
};

export default function Link({ hasArrow, children, className, ...props }: LinkProps) {
  return (
    <IntlLink
      className={[styles.link, hasArrow ? styles.arrow : '', className ?? ''].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </IntlLink>
  );
}
