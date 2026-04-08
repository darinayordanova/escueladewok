'use client';

import { useEffect, useRef, useState } from 'react';

import { Close } from '@/components/ui/icons';

import styles from './MobileDrawer.module.scss';
import Button from '../Button/Button';

interface MobileDrawerProps {
  /** Content rendered in the fixed bottom bar beside the trigger button */
  barSlot?: React.ReactNode;
  /** Label on the trigger button */
  triggerLabel: string;
  /** Title shown in the sheet header */
  drawerTitle: string;
  children: React.ReactNode;
}

export default function MobileDrawer({ barSlot, triggerLabel, drawerTitle, children }: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  function open() { setIsOpen(true); }
  function close() { setIsOpen(false); openRef.current?.focus(); }

  return (
    <div className={styles.root}>
      {/* ── Fixed bottom bar ── */}
      <div className={styles.bar}>
        <div className={`flex flex-align-center gap-4 ${styles.barInner} ${barSlot ? 'flex-justify-between' : 'flex-justify-center'}`}>
          {barSlot && <div className={styles.barSlot}>{barSlot}</div>}
          <Button
            ref={openRef}
            type="button"
            onClick={open}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-controls="mobile-drawer-sheet"
          >
            {triggerLabel}
          </Button>
        </div>
      </div>

      {/* ── Backdrop ── */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* ── Close button — floats above the sheet ── */}
      <button
        ref={closeRef}
        type="button"
        onClick={close}
        className={`${styles.closeBtn} ${isOpen ? styles.closeBtnVisible : ''}`}
        aria-label="Close panel"
      >
        <Close size={22} />
      </button>

      {/* ── Slide-up sheet ── */}
      <div
        id="mobile-drawer-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={drawerTitle}
        className={`${styles.sheet} ${isOpen ? styles.sheetOpen : ''}`}
        aria-hidden={!isOpen || undefined}
      >
        <div className={styles.handle} aria-hidden="true" />
        <div className={styles.sheetHeader}>
          <p className="font-heading font-bold text-lg m-no">{drawerTitle}</p>
        </div>
        <div className={styles.sheetBody}>{children}</div>
      </div>
    </div>
  );
}
