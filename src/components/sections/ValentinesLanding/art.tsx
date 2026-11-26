import Image from 'next/image';
import type { CSSProperties } from 'react';

import type { VoucherKey } from '@/lib/vouchers';
import { VOUCHER_PAGE, VOUCHER_THEME_STYLES, voucherThemeStyle, type VoucherTheme } from '@/lib/voucherThemes';

import styles from './art.module.scss';

// Decorative drawings for the Valentine's page. All aria-hidden: the copy around them says what they show.

/** A heart in the Valentine's voucher's pink. CSS can recolour it (`path { fill }`). */
export function Heart({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 22" className={className} style={style} aria-hidden="true">
      <path fill="#F4A7B4" d="M12 21.6 10.3 20C4.2 14.6.2 11 .2 6.6.2 3 3 .2 6.6.2c2 0 4 1 5.4 2.5C13.4 1.2 15.4.2 17.4.2 21 .2 23.8 3 23.8 6.6c0 4.4-4 8-10.1 13.4Z" />
    </svg>
  );
}

// A plain red envelope, 300 × 186 with a 300 × 104 flap. Drawn at those exact proportions so
// nothing stretches; the back, pocket and flap are separate so cards can sit between them.

/** The envelope's pocket: sides and bottom, open in a V at the top. */
export function EnvelopePocket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 186" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M0 0 L150 98 L300 0 V186 H0 Z" fill="#A30D1A" />
      <path d="M0 186 L150 106 L300 186 Z" fill="#B91226" />
    </svg>
  );
}

/** The flap, a triangle with a softened tip. Its colour comes from CSS (outside and inside differ). */
export function EnvelopeFlap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 104" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M0 0 H300 L166 93 Q150 104 134 93 Z" />
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
