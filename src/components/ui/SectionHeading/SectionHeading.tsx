import styles from './SectionHeading.module.scss';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  /** Continuation set in red italics, e.g. "Cook. Share. *Discover.*" */
  accent?: string;
  /** Put the accent on its own line instead of after the title. */
  accentOnNewLine?: boolean;
  size?: 'md' | 'lg';
  /** `light` for dark or brand-red backgrounds. */
  tone?: 'dark' | 'light';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  id?: string;
  className?: string;
}

/** Eyebrow + large display heading used to open each course page section. */
export default function SectionHeading({
  eyebrow,
  title,
  accent,
  accentOnNewLine = false,
  size = 'md',
  tone = 'dark',
  as: Heading = 'h2',
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div className={[styles.root, styles[size], styles[tone], className ?? ''].filter(Boolean).join(' ')}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <Heading id={id} className={styles.title}>
        {title}
        {accent && (
          <>
            {accentOnNewLine ? <br /> : ' '}
            <em className={styles.accent}>{accent}</em>
          </>
        )}
      </Heading>
    </div>
  );
}
