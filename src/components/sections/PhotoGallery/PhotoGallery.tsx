'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';

import { ChevronLeft, ChevronRight, Close } from '@/components/ui/icons';
import { urlFor } from '@/lib/sanity/image';
import type { HomeGalleryImage, Locale, LocaleString } from '@/types';

import styles from './PhotoGallery.module.scss';

interface PhotoGalleryProps {
  title?: LocaleString;
  images?: HomeGalleryImage[];
  locale: Locale;
}

export default function PhotoGallery({ title, images, locale }: PhotoGalleryProps) {
  const t = useTranslations('gallery');
  const headingId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (!images?.length) return null;

  const count = images.length;

  function open(i: number) {
    setOpenIdx(i);
    dialogRef.current?.showModal();
  }

  function step(delta: number) {
    setOpenIdx((i) => (i === null ? i : (i + delta + count) % count));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  }

  // Clicking the backdrop (the dialog element itself, outside its content) closes it.
  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) dialogRef.current?.close();
  }

  const current = openIdx !== null ? images[openIdx] : null;

  return (
    <section className={`bg-alt py-10 py-md-16 ${styles.section}`} aria-labelledby={headingId}>
      <div className="container">
        <p className="overline text-center color-primary mb-4">{t('label')}</p>
        <h2 id={headingId} className="h3 text-center mt-no mb-10">
          {title?.[locale] ?? t('fallbackTitle')}
        </h2>

        <ul className={styles.board} role="list">
          {images.map((img, i) => {
            const alt = img.alt?.[locale] ?? '';
            const caption = img.caption?.[locale];
            return (
              <li key={img._key} className={styles.item}>
                <button
                  type="button"
                  className={styles.polaroid}
                  onClick={() => open(i)}
                  aria-label={t('open', { alt: caption || alt })}
                  aria-haspopup="dialog"
                >
                  <span className={styles.photo}>
                    <Image
                      src={urlFor(img).width(480).height(600).auto('format').url()}
                      alt={alt}
                      fill
                      sizes="(max-width: 768px) 45vw, (max-width: 1024px) 30vw, 260px"
                      placeholder={img.lqip ? 'blur' : 'empty'}
                      blurDataURL={img.lqip}
                      className={styles.img}
                    />
                  </span>
                  {caption && <span className={styles.caption}>{caption}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        className={styles.lightbox}
        aria-label={t('dialogLabel')}
        onClick={handleDialogClick}
        onKeyDown={handleKeyDown}
        onClose={() => setOpenIdx(null)}
      >
        {current && (
          <figure className={styles.lightboxFigure}>
            <div className={styles.lightboxPhoto}>
              <Image
                key={current._key}
                src={urlFor(current.asset).width(1600).fit('max').auto('format').url()}
                alt={current.alt?.[locale] ?? ''}
                width={current.dimensions?.width ?? 1600}
                height={current.dimensions?.height ?? 1200}
                sizes="90vw"
                placeholder={current.lqip ? 'blur' : 'empty'}
                blurDataURL={current.lqip}
                className={styles.lightboxImg}
              />
            </div>
            <figcaption className={styles.lightboxCaption}>
              <span>{current.caption?.[locale]}</span>
              {count > 1 && (
                <span className={styles.lightboxCounter}>
                  {(openIdx ?? 0) + 1} / {count}
                </span>
              )}
            </figcaption>
          </figure>
        )}

        <button
          type="button"
          className={`${styles.lbBtn} ${styles.lbClose}`}
          onClick={() => dialogRef.current?.close()}
          aria-label={t('close')}
          autoFocus
        >
          <Close size={20} />
        </button>
        {count > 1 && (
          <>
            <button
              type="button"
              className={`${styles.lbBtn} ${styles.lbPrev}`}
              onClick={() => step(-1)}
              aria-label={t('previous')}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className={`${styles.lbBtn} ${styles.lbNext}`}
              onClick={() => step(1)}
              aria-label={t('next')}
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </dialog>
    </section>
  );
}
