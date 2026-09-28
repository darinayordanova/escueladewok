'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';

import { ChevronLeft, ChevronRight, Close } from '@/components/ui/icons';
import { urlFor } from '@/lib/sanity/image';
import type { HomeGalleryItem, HomeGalleryVideo, Locale, LocaleString } from '@/types';

import styles from './PhotoGallery.module.scss';

interface PhotoGalleryProps {
  title?: LocaleString;
  images?: HomeGalleryItem[];
  locale: Locale;
}

/**
 * Silent, control-less looping clip. Plays only while on screen (saves battery
 * and data) and never for visitors who prefer reduced motion — they see the
 * poster / first frame instead.
 */
function LoopingVideo({
  item,
  posterUrl,
  className,
}: {
  item: HomeGalleryVideo;
  posterUrl?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // Set as a property too: browsers only allow programmatic play when muted,
    // and React doesn't reliably reflect the `muted` attribute.
    video.muted = true;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;

    function sync() {
      if (visible && !reduceMotion.matches) video!.play().catch(() => {});
      else video!.pause();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    reduceMotion.addEventListener('change', sync);

    return () => {
      observer.disconnect();
      reduceMotion.removeEventListener('change', sync);
    };
  }, []);

  // Without a poster, nudge past 0s so mobile Safari paints the first frame.
  const src = posterUrl ? item.videoUrl : `${item.videoUrl}#t=0.1`;

  return (
    <video
      ref={ref}
      className={className}
      poster={posterUrl}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src={src} type={item.mimeType ?? 'video/mp4'} />
    </video>
  );
}

export default function PhotoGallery({ title, images, locale }: PhotoGalleryProps) {
  const t = useTranslations('gallery');
  const headingId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  // Skip videos whose file is missing (e.g. a draft entry without an upload).
  const items = images?.filter((it) => it._type !== 'galleryVideo' || it.videoUrl) ?? [];
  if (!items.length) return null;

  const count = items.length;

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

  const current = openIdx !== null ? items[openIdx] : null;

  return (
    <section className={`bg-alt py-10 py-md-16 ${styles.section}`} aria-labelledby={headingId}>
      <div className="container">
        <p className="overline text-center color-primary mb-4">{t('label')}</p>
        <h2 id={headingId} className="h3 text-center mt-no mb-10">
          {title?.[locale] ?? t('fallbackTitle')}
        </h2>

        <ul className={styles.board} role="list">
          {items.map((item, i) => {
            const alt = item.alt?.[locale] ?? '';
            const caption = item.caption?.[locale];
            return (
              <li key={item._key} className={styles.item}>
                <button
                  type="button"
                  className={styles.polaroid}
                  onClick={() => open(i)}
                  aria-label={t('open', { alt: caption || alt })}
                  aria-haspopup="dialog"
                >
                  <span className={styles.photo}>
                    <span className={styles.media}>
                      {item._type === 'galleryVideo' ? (
                        <LoopingVideo
                          item={item}
                          posterUrl={
                            item.poster?.asset
                              ? urlFor(item.poster).width(480).height(600).auto('format').url()
                              : undefined
                          }
                          className={styles.video}
                        />
                      ) : (
                        <Image
                          src={urlFor(item).width(480).height(600).auto('format').url()}
                          alt={alt}
                          fill
                          sizes="(max-width: 768px) 45vw, (max-width: 1024px) 30vw, 260px"
                          placeholder={item.lqip ? 'blur' : 'empty'}
                          blurDataURL={item.lqip}
                          className={styles.img}
                        />
                      )}
                    </span>
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
              {current._type === 'galleryVideo' ? (
                <>
                  <LoopingVideo
                    key={current._key}
                    item={current}
                    posterUrl={
                      current.poster?.asset
                        ? urlFor(current.poster.asset).width(1200).fit('max').auto('format').url()
                        : undefined
                    }
                    className={styles.lightboxImg}
                  />
                  <span className="sr-only">{current.alt?.[locale]}</span>
                </>
              ) : (
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
              )}
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
