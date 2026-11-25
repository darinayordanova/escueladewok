import Button from '@/components/ui/Button/Button';

import styles from './CtaBanner.module.scss';

interface CtaBannerProps {
  eyebrow?: string;
  /** Each line renders on its own row. */
  headingLines: string[];
  sub?: string;
  cta: { label: string; href: string };
  /**
   * `stacked` — patterned background, button under the copy (homepage).
   * `split` — flat brand red, copy left and button right on desktop.
   */
  layout?: 'stacked' | 'split';
  /** Classes for the outer section, e.g. the colour showing behind the rounded corners. */
  className?: string;
}

export default function CtaBanner({
  eyebrow,
  headingLines,
  sub,
  cta,
  layout = 'stacked',
  className,
}: CtaBannerProps) {
  const isSplit = layout === 'split';

  return (
    <section className={className}>
      <div className={`color-white ${isSplit ? styles.split : `bg-gradient-pattern ${styles.stacked}`} ${styles.panel}`}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.copy}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h2 className={styles.heading}>
              {headingLines.map((line, i) => (
                <span key={i} className={styles.line}>{line}</span>
              ))}
            </h2>
            {sub && <p className={styles.sub}>{sub}</p>}
          </div>
          <Button href={cta.href} color="white" className={styles.button}>
            {cta.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
