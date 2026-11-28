'use client';

import type { ComponentProps, MouseEvent, ReactNode } from 'react';

import Button from '@/components/ui/Button/Button';

import type { Format } from './options';

/** What a link elsewhere on the page fills into the enquiry form */
export interface Prefill {
  format?: Format;
  /** An extra to tick, e.g. "impact" (Cook for Others) */
  extra?: string;
}

export const PREFILL_EVENT = 'corporate:prefill';

/** Asks the form to take these choices; the form ticks them and scrolls to them. */
function prefill(event: MouseEvent, detail: Prefill) {
  // Ctrl/Cmd-click opens the plain link in a new tab
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  window.dispatchEvent(new CustomEvent<Prefill>(PREFILL_EVENT, { detail }));
}

/** A plain link that fills the form in place; its href still works without JavaScript. */
export function PrefillLink({ prefill: detail, href, className, children }: {
  prefill: Prefill;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className} onClick={(e) => prefill(e, detail)}>
      {children}
    </a>
  );
}

/** The site's Button, as a link that fills the form in place */
export function PrefillButton({ prefill: detail, href, ...props }: { prefill: Prefill; href: string } & Omit<ComponentProps<typeof Button>, 'href' | 'onClick'>) {
  return <Button {...(props as object)} href={href} onClick={(e: MouseEvent) => prefill(e, detail)} />;
}
