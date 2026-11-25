import type { ReactNode } from 'react';

import SectionHeading from '@/components/ui/SectionHeading/SectionHeading';
import { Link } from '@/i18n/navigation';

import styles from './CourseReserve.module.scss';

interface CourseReserveProps {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  /** "Good to know" note, e.g. the allergens. */
  note?: { title: string; text: string; link: { label: string; href: string } };
  /** The booking widget or enquiry form. */
  children: ReactNode;
}

/** Closing booking section: pitch on the left, booking on the right. */
export default function CourseReserve({ id, eyebrow, title, lead, note, children }: CourseReserveProps) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <div className={styles.copy}>
        <SectionHeading id={`${id}-title`} eyebrow={eyebrow} title={title} size="lg" />
        <p className={styles.lead}>{lead}</p>

        {note && (
          <div className={styles.note}>
            <p className={styles.noteTitle}>{note.title}</p>
            <p className={styles.noteText}>{note.text}</p>
            <Link href={note.link.href} className={styles.noteLink}>
              {note.link.label} <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </div>

      <div className={styles.booking}>{children}</div>
    </section>
  );
}
