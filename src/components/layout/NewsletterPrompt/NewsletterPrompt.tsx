'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import NewsletterForm from '@/components/sections/NewsletterForm/NewsletterForm';
import { ChevronDown, Close } from '@/components/ui/icons';
import { usePathname } from '@/i18n/navigation';

import styles from './NewsletterPrompt.module.scss';
import { isPromptDone, markPromptDone, PROMPT_DONE_EVENT } from './promptStorage';

// Pages where it would get in the way: after checkout, the subscribe confirmation itself,
// and the legal pages people come to read. (On course pages it sits above the booking bar.)
const HIDDEN_ON = [/^\/booking/, /^\/subscribe/, /^\/privacy/, /^\/terms/];

/**
 * Show after this much time on the site. Counted per browser tab in sessionStorage,
 * so it adds up across pages and reloads; only while the tab is visible.
 */
const DELAY_MS = 2 * 60 * 1000;
const TIME_KEY = 'woklab:time-on-site';
const TICK_MS = 1000;

/** Left alone this long, the pill folds down to just the flower and the arrow. */
const COMPACT_AFTER_MS = 5_000;

function readTimeOnSite() {
  try {
    return Number(sessionStorage.getItem(TIME_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeTimeOnSite(ms: number) {
  try {
    sessionStorage.setItem(TIME_KEY, String(ms));
  } catch {
    /* storage blocked: the count restarts on each page load */
  }
}

/**
 * A small card in the bottom corner, once, after 2 minutes on the site: no backdrop, no focus trap,
 * the page stays usable around it. It starts closed (a title and one button) and
 * opens to the form when asked; it steps aside while the footer's own form is on screen.
 */
export default function NewsletterPrompt() {
  const t = useTranslations('newsletter');
  const pathname = usePathname();

  const [open, setOpen] = useState(false); // on screen at all
  const [expanded, setExpanded] = useState(false); // showing the form
  const [footerInView, setFooterInView] = useState(false);
  const [compact, setCompact] = useState(false); // pill folded to icon + arrow
  const [engaged, setEngaged] = useState(false); // pointer over it or focus in it
  const ref = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const bodyId = useId();

  const hiddenHere = HIDDEN_ON.some((re) => re.test(pathname));

  // Development only: ?newsletter-prompt shows it at once (=open with the form), for checking the design.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const force = new URLSearchParams(window.location.search).get('newsletter-prompt');
    if (force === null) return;
    const id = window.setTimeout(() => {
      setOpen(true);
      setExpanded(force === 'open');
    });
    return () => window.clearTimeout(id);
  }, []);

  // Left alone for a while, the pill folds to the flower and the arrow. Hover or focus
  // brings the text back and holds it; leaving starts the countdown again.
  useEffect(() => {
    if (!open || expanded || compact || engaged) return;
    const id = window.setTimeout(() => setCompact(true), COMPACT_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [open, expanded, compact, engaged]);

  const engage = () => {
    setEngaged(true);
    setCompact(false);
  };

  // Count time on the site; once it reaches the delay, show on the next allowed page and remember.
  useEffect(() => {
    if (open || isPromptDone()) return;

    let elapsed = readTimeOnSite();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        elapsed += TICK_MS;
        writeTimeOnSite(elapsed);
      }
      if (elapsed >= DELAY_MS && !hiddenHere) {
        window.clearInterval(id);
        setOpen(true);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [open, hiddenHere]);

  // Never two forms on screen: step aside while the footer's form shows.
  useEffect(() => {
    if (!open) return;
    const footer = document.querySelector('[data-newsletter-footer]');
    if (!footer) return;
    const io = new IntersectionObserver(([entry]) => setFooterInView(entry.isIntersecting));
    io.observe(footer);
    return () => io.disconnect();
  }, [open, pathname]);

  // Closing is the visitor saying no: never show it again.
  const close = useCallback(() => {
    markPromptDone();
    setOpen(false);
  }, []);

  // Subscribed from the footer while the prompt is up: it has done its job, take it away.
  useEffect(() => {
    if (!open) return;
    const onDone = (e: Event) => {
      if ((e as CustomEvent<{ source?: string }>).detail?.source !== 'popup') setOpen(false);
    };
    window.addEventListener(PROMPT_DONE_EVENT, onDone);
    return () => window.removeEventListener(PROMPT_DONE_EVENT, onDone);
  }, [open]);

  // Escape folds the coupon back into the pill (only when focus is in it: Escape elsewhere
  // belongs to the page). Dismissing for good is the × button's job.
  useEffect(() => {
    if (!open || !expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ref.current?.contains(document.activeElement)) {
        setExpanded(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, expanded]);

  // Opening on request puts the cursor in the email field, once the coupon has unfolded.
  useEffect(() => {
    if (!expanded) return;
    const id = window.setTimeout(() => ref.current?.querySelector<HTMLInputElement>('input[type="email"]')?.focus(), 320);
    return () => window.clearTimeout(id);
  }, [expanded]);

  if (!open) return null;

  const away = footerInView || hiddenHere;

  return (
    <aside
      ref={ref}
      className={[styles.prompt, expanded ? styles.open : '', compact ? styles.compact : '', away ? styles.away : '']
        .filter(Boolean)
        .join(' ')}
      onPointerEnter={engage}
      onPointerLeave={() => setEngaged(false)}
      onFocus={engage}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEngaged(false);
      }}
      aria-label={t('promptLabel')}
      aria-hidden={away || undefined}
      inert={away || undefined}
    >
      {/* The pill: always there; folds the coupon open and shut */}
      <div className={styles.head}>
        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => {
            setCompact(false);
            setExpanded((v) => !v);
          }}
          aria-label={compact ? t('promptPill') : undefined}
        >
          <span className={styles.badge} aria-hidden="true">
            <span className={styles.flower} />
          </span>
          <span className={styles.pill}>{t('promptPill')}</span>
          <ChevronDown size={24} className={styles.chevron} />
        </button>
        {/* Dismissing for good is offered once the coupon is open, not on the pill */}
        {expanded && (
          <button type="button" className={styles.dismiss} onClick={close} aria-label={t('promptDismiss')}>
            <Close size={14} />
          </button>
        )}
      </div>

      {/* The coupon: red face with the offer, white stub with the form, notched where they meet */}
      <div id={bodyId} className={styles.body} inert={!expanded || undefined}>
        <div className={styles.clip}>
          <div className={styles.face}>
            <p className={styles.kicker}>{t('promptTitle')}</p>
            <p className={styles.big} aria-hidden="true">
              10<span className={styles.pct}>%</span>
            </p>
            <h2 className={styles.offer}>
              <span className="sr-only">10% </span>
              {t('promptOffer')}
            </h2>
          </div>
          <div className={styles.stub}>
            <p className={styles.stubSub}>{t('sub')}</p>
            <NewsletterForm source="popup" submitLabel={t('promptCta')} />
          </div>
        </div>
      </div>
    </aside>
  );
}
