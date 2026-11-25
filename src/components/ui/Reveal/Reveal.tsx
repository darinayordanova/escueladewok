'use client';

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ElementType } from 'react';

type RevealProps<T extends ElementType> = {
  as?: T;
  /** Share of the element that must be on screen before it counts as seen. */
  threshold?: number;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

/**
 * Marks its element `data-inview="true"` the first time it scrolls into view, so CSS can play
 * an entrance once. Content stays visible without it: style only the motion off the attribute.
 */
export default function Reveal<T extends ElementType = 'div'>({ as, threshold = 0.2, ...props }: RevealProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setInView(true);
      observer.disconnect();
    }, { threshold });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return <Tag ref={ref} data-inview={inView} {...props} />;
}
