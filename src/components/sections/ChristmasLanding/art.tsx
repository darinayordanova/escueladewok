import Image from 'next/image';
import type { CSSProperties } from 'react';

import type { VoucherKey } from '@/lib/vouchers';
import { VOUCHER_PAGE, VOUCHER_THEME_STYLES, voucherThemeStyle, type VoucherTheme } from '@/lib/voucherThemes';

import styles from './art.module.scss';

// Decorative drawings for the Christmas page. All aria-hidden: the copy around them says what they show.

/** The brand's four-point star (Print/Star 8), in its own gold. */
export function Star({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 21 28" className={className} style={style} aria-hidden="true">
      <path fill="#F0B752" d="M10.5 0C11.4 9 13 12.6 21 14 13 15.4 11.4 19 10.5 28 9.6 19 8 15.4 0 14 8 12.6 9.6 9 10.5 0Z" />
    </svg>
  );
}

/** Front pocket of a plain red envelope (the flap is drawn separately so it can open). */
export function EnvelopeFront({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 190" preserveAspectRatio="none" className={className} aria-hidden="true">
      <rect width="300" height="190" fill="#9C0C19" />
      <polygon points="0,190 150,92 300,190" fill="#B01020" />
    </svg>
  );
}

export interface PriceCardCopy {
  name: string;
  detail: string;
}

/** A small voucher for one amount: a design panel from the real vouchers beside the details. */
export function PriceCard({ voucherKey, amount, theme, copy }: { voucherKey: VoucherKey; amount: number; theme: VoucherTheme; copy: PriceCardCopy }) {
  const { tone, ...panelStyle } = voucherThemeStyle(theme);
  const { art } = VOUCHER_THEME_STYLES[theme];
  const { panelWidth, height } = VOUCHER_PAGE;

  return (
    <span className={styles.card} data-voucher={voucherKey}>
      <span className={`${styles.panel} ${tone === 'dark' ? styles.dark : ''}`} style={panelStyle}>
        {art && (
          <Image
            src={art.src}
            alt=""
            width={art.width * 2}
            height={art.height * 2}
            className={styles.art}
            style={{ left: `${(art.x / panelWidth) * 100}%`, top: `${(art.y / height) * 100}%`, width: `${(art.width / panelWidth) * 100}%` }}
          />
        )}
        <Image src="/logo.svg" alt="" width={72} height={51} className={styles.logo} />
      </span>
      <span className={styles.details}>
        <span className={styles.amount}>{amount}<span>€</span></span>
        <span className={styles.name}>{copy.name}</span>
        <span className={styles.detail}>{copy.detail}</span>
      </span>
    </span>
  );
}
