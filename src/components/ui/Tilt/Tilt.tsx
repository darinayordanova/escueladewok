'use client';

import { useRef, type ReactNode } from 'react';

import styles from './Tilt.module.scss';

interface TiltProps {
  children: ReactNode;
  /** Largest tilt either way, in degrees. */
  max?: number;
  className?: string;
}

/**
 * Turns its content in 3D towards the mouse, with a soft light that follows it.
 * Mouse only (touch scrolls as usual); rests flat under reduced motion.
 */
export default function Tilt({ children, max = 8, className }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      // -0.5 … 0.5 across the card
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--tilt-x', `${(-y * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--tilt-y', `${(x * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--glare-x', `${((x + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty('--glare-y', `${((y + 0.5) * 100).toFixed(1)}%`);
      el.dataset.active = '';
    });
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
    delete el.dataset.active;
  }

  return (
    <div className={[styles.scene, className ?? ''].filter(Boolean).join(' ')}>
      <div ref={ref} className={styles.tilt} onPointerMove={handleMove} onPointerLeave={handleLeave}>
        {children}
        <span className={styles.glare} aria-hidden="true" />
      </div>
    </div>
  );
}
