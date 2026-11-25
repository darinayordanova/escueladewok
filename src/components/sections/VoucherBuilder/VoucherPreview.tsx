import Image from 'next/image';
import { useTranslations } from 'next-intl';

import Tilt from '@/components/ui/Tilt/Tilt';
import { formatVoucherDate, formatVoucherTypeName, voucherExpiry, type VoucherFormat } from '@/lib/vouchers';
import { voucherText } from '@/lib/voucherText';
import { VOUCHER_THEME_STYLES, voucherThemeStyle, type VoucherTheme } from '@/lib/voucherThemes';

import styles from './VoucherPreview.module.scss';

interface VoucherPreviewProps {
  voucherKey: string;
  amount: number;
  format: VoucherFormat;
  theme: VoucherTheme;
  to: string;
  from: string;
  message: string;
  locale: string;
  /** Just the voucher, without the linen stage behind it. */
  bare?: boolean;
}

/**
 * Live copy of the voucher PDF (lib/pdf/voucherPdf) at screen size — same layout, words and design.
 * The printed card sits on its envelope; the page turns towards the mouse.
 */
export default function VoucherPreview({ voucherKey, amount, format, theme, to, from, message, locale, bare }: VoucherPreviewProps) {
  const t = useTranslations('vouchers');
  const text = voucherText(locale);
  const { tone, ...themeVars } = voucherThemeStyle(theme);
  const { art } = VOUCHER_THEME_STYLES[theme];

  return (
    <div className={[styles.stage, format === 'physical' ? styles.physical : '', bare ? styles.bare : ''].filter(Boolean).join(' ')} aria-hidden="true">
      <div className={styles.envelope} />

      <Tilt className={styles.tilt}>
      <div className={styles.page}>
        <div className={styles.sheet} style={themeVars}>
          {/* Design panel — re-keyed so a new design fades in */}
          <div key={theme} className={`${styles.panel} ${tone === 'dark' ? styles.dark : ''}`}>
            {art && (
              // Placed in PDF points, like the PDF places it
              <Image
                src={art.src}
                alt=""
                width={600}
                height={773}
                className={styles.art}
                style={{ '--x': art.x, '--y': art.y, '--w': art.width } as React.CSSProperties}
              />
            )}
            <Image src="/logo.svg" alt="" width={72} height={51} className={styles.logo} />
          </div>

          <div className={styles.details}>
            <p className={styles.voucherType}>
              {formatVoucherTypeName(voucherKey, locale)}
              {/* Re-keyed so a new amount fades in; written as the PDF writes it */}
              <span key={amount} className={styles.price}>{amount} €</span>
            </p>
            <p className={styles.intro}>{text.headerSub}</p>

            <div className={styles.divider} />

            <dl className={styles.names}>
              <div>
                <dt className={styles.label}>{text.for}</dt>
                <dd className={to ? styles.name : `${styles.name} ${styles.placeholder}`}>{to || t('preview.toFallback')}</dd>
              </div>
              <div>
                <dt className={styles.label}>{text.from}</dt>
                <dd className={from ? styles.name : `${styles.name} ${styles.placeholder}`}>{from || t('preview.fromFallback')}</dd>
              </div>
            </dl>
            {message && <p className={styles.message}>“{message}”</p>}

            <div className={styles.codeRow}>
              <div>
                <p className={styles.label}>{text.code}</p>
                <p className={styles.code}>••••-••••</p>
              </div>
              <p className={styles.validUntil} suppressHydrationWarning>
                {text.validUntil} {formatVoucherDate(voucherExpiry(), locale)}
              </p>
            </div>

            <p className={styles.footer}>
              {text.footerPrefix}
              <span className={styles.link}>{text.footerLinkLabel}</span>
              {text.footerSuffix} {text.footerQuestions}
            </p>
          </div>
        </div>
      </div>
      </Tilt>
    </div>
  );
}
