'use client';

import Image from 'next/image';
import { useState } from 'react';

import styles from './MenuStack.module.scss';

export interface StackMenu {
  key: string;
  label: string;
  name: string;
  dishes: { key: string; name: string; text: string }[];
  /** "Show menu 2: Spice, Pull, Slurp" */
  showLabel: string;
}

interface MenuStackProps {
  menus: StackMenu[];
  /** "Tap the menu behind to swap" */
  hint: string;
}

/**
 * The event menus as printed cards, one on top of the other. Tapping the card behind (or the
 * hint under them) shuffles it to the front: the top card swings out to the left and tucks in
 * behind as the other one comes forward.
 */
export default function MenuStack({ menus, hint }: MenuStackProps) {
  const [front, setFront] = useState(0);
  // Counts the swaps, so each one replays the animation; none plays on the first render
  const [swaps, setSwaps] = useState(0);
  const back = (front + 1) % menus.length;

  const swap = () => {
    setFront(back);
    setSwaps((n) => n + 1);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.stack}>
        {menus.map((menu, i) => {
          const isFront = i === front;
          const motion = swaps === 0 ? '' : isFront ? styles.comingForward : styles.goingBack;
          return (
            <article
              key={`${menu.key}-${swaps}`}
              className={`${styles.paper} ${isFront ? styles.front : styles.back} ${motion}`}
              aria-hidden={isFront ? undefined : true}
            >
              <div className={styles.head}>
                <p className={styles.label}>{menu.label}</p>
                <h3 className={styles.name}>{menu.name}</h3>
              </div>
              <div className={styles.ornament} aria-hidden="true">
                <Image src="/images/pattern2.svg" alt="" width={48} height={48} />
              </div>
              <ol className={styles.list}>
                {menu.dishes.map((dish, n) => (
                  <li key={dish.key} className={styles.item}>
                    <span className={styles.number} aria-hidden="true">{String(n + 1).padStart(2, '0')}</span>
                    <div>
                      <p className={styles.dish}>{dish.name}</p>
                      <p className={styles.description}>{dish.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {/* The visible edge of the card behind: a mouse target only (the hint button is the keyboard's) */}
              {!isFront && <button type="button" className={styles.backHit} tabIndex={-1} onClick={swap} aria-label={menu.showLabel} />}
            </article>
          );
        })}
      </div>

      <button type="button" className={styles.hint} onClick={swap} aria-label={menus[back].showLabel}>
        <span className={styles.hintIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </span>
        {hint}
      </button>
    </div>
  );
}
