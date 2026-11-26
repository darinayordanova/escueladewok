'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import NewsletterForm from '@/components/sections/NewsletterForm/NewsletterForm';
import Button from '@/components/ui/Button/Button';
import { Close, Mail } from '@/components/ui/icons';
import { usePathname } from '@/i18n/navigation';

import styles from './NewsletterPrompt.module.scss';

// Remembers that the prompt was already shown, so it appears on a first visit only.
// A UI preference the visitor's own action sets: no cookie consent needed for it.
const STORAGE_KEY = 'woklab:newsletter-prompt';

// Pages where it would get in the way: booking (the mobile booking bar sits at the
// bottom), the subscribe confirmation itself, and the legal pages people come to read.
const HIDDEN_ON = [/^\/courses\/[^/]+/, /^\/booking/, /^\/subscribe/, /^\/privacy/, /^\/terms/];

/** Show once the visitor has scrolled this share of a screen, or after this long. */
const SCROLL_SHARE = 0.5;
const DELAY_MS = 20_000;

function alreadySeen() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return true; // storage blocked: never nag on every page
  }
}

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    /* storage blocked */
  }
}

/**
 * A small card in the bottom corner on a first visit: no backdrop, no focus trap,
 * the page stays usable around it. It starts closed (a title and one button) and
 * opens to the form when asked; it steps aside while the footer's own form is on screen.
 */
export default function NewsletterPrompt() {
  const t = useTranslations('newsletter');
  const pathname = usePathname();

  const [open, setOpen] = useState(false); // on screen at all
  const [expanded, setExpanded] = useState(false); // showing the form
  const [footerInView, setFooterInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

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

  // Arm once per first visit: wait for a scroll or a pause, then show and remember.
  useEffect(() => {
    if (open || hiddenHere || alreadySeen()) return;

    let timer = 0;
    const show = () => {
      cleanup();
      markSeen();
      setOpen(true);
    };
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * SCROLL_SHARE) show();
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };

    timer = window.setTimeout(show, DELAY_MS);
    window.addEventListener('scroll', onScroll, { passive: true });
    return cleanup;
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

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    // Only when focus is in the card: Escape elsewhere belongs to the page (e.g. the menu)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ref.current?.contains(document.activeElement)) close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;

  const away = footerInView || hiddenHere;

  return (
    <aside
      ref={ref}
      className={`${styles.prompt} ${away ? styles.away : ''}`}
      aria-label={t('promptLabel')}
      aria-hidden={away || undefined}
      inert={away || undefined}
    >
      <div className={styles.head}>
        <span className={styles.icon} aria-hidden="true">
          <Mail size={18} />
        </span>
        <div className={styles.text}>
          <h2 className={styles.title}>{t('title')}</h2>
          <p className={styles.sub}>{t('teaser')}</p>
        </div>
        <button type="button" className={styles.close} onClick={close} aria-label={t('close')}>
          <Close size={18} />
        </button>
      </div>

      {expanded ? (
        <div className={styles.body}>
          <NewsletterForm source="popup" focusOnMount />
        </div>
      ) : (
        <Button size="sm" fullWidth onClick={() => setExpanded(true)} className={styles.cta}>
          {t('submit')}
        </Button>
      )}
    </aside>
  );
}
