import type { ReactNode } from 'react';

import Button from '@/components/ui/Button/Button';
import Confetti from '@/components/ui/Confetti/Confetti';
import { Check } from '@/components/ui/icons';

import styles from './Confirmation.module.scss';

export interface ConfirmationStep {
  title: string;
  detail?: ReactNode;
  done: boolean;
}

interface ConfirmationProps {
  title: string;
  subtitle: string;
  /** What was bought, shown large beside the steps. */
  aside: ReactNode;
  stepsLabel: string;
  steps: ConfirmationStep[];
  actions: { primary: { label: string; href: string }; secondary: { label: string; href: string } };
}

/** Shared thank-you page after a purchase: heading, what was bought, what happens next — and confetti. */
export default function Confirmation({ title, subtitle, aside, stepsLabel, steps, actions }: ConfirmationProps) {
  return (
    <section className={styles.section}>
      <Confetti />

      <div className={`container ${styles.layout}`}>
        <div className={styles.intro}>
          <span className={styles.badge} aria-hidden="true">
            <Check size={22} />
          </span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.aside}>{aside}</div>

        <div className={styles.next}>
          <h2 className={styles.stepsLabel}>{stepsLabel}</h2>
          <ol className={styles.steps}>
            {steps.map((step, i) => (
              <li key={step.title} className={`${styles.step} ${step.done ? styles.done : ''}`}>
                <span className={styles.marker} aria-hidden="true">
                  {step.done ? <Check size={14} /> : i + 1}
                </span>
                <div>
                  <p className={styles.stepTitle}>{step.title}</p>
                  {step.detail && <p className={styles.stepDetail}>{step.detail}</p>}
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.actions}>
            <Button href={actions.primary.href}>{actions.primary.label}</Button>
            <Button href={actions.secondary.href} variant="outline">{actions.secondary.label}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
