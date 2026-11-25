import { PortableText } from '@portabletext/react';

import type { PortableTextBlock } from '@/types';

import styles from './CourseIntro.module.scss';

interface CourseIntroProps {
  eyebrow?: string;
  headline?: string;
  body?: PortableTextBlock[];
}

/** Opening statement plus the course description, set in two columns on desktop. */
export default function CourseIntro({ eyebrow, headline, body }: CourseIntroProps) {
  if (!headline && !body?.length) return null;

  return (
    <section className={styles.section}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      {headline && <p className={styles.headline}>{headline}</p>}
      {body && body.length > 0 && (
        <div className={styles.body}>
          <PortableText value={body} />
        </div>
      )}
    </section>
  );
}
