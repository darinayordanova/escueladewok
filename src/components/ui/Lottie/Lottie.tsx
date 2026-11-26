'use client';

import type { DotLottie } from '@lottiefiles/dotlottie-react';
import dynamic from 'next/dynamic';
import { useEffect, useState, type ReactNode } from 'react';
import { preload } from 'react-dom';

import styles from './Lottie.module.scss';

// The player (and its WebAssembly renderer) loads only in the browser, after the page
const DotLottieReact = dynamic(() => import('@lottiefiles/dotlottie-react').then((mod) => mod.DotLottieReact), { ssr: false });

/**
 * The renderer @lottiefiles/dotlottie-web fetches by default. Keep the version in step with the
 * installed package: if they drift, the preload is wasted but the player still works.
 */
const RENDERER_URL = 'https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web@0.82.1/dist/dotlottie-player.wasm';
/** Only people who will see the animation download it. */
const MOTION_OK = '(prefers-reduced-motion: no-preference)';

interface LottieProps {
  /** A .lottie or Lottie .json file, e.g. in /public/animations. */
  src: string;
  /** Still image shown until the animation is ready, if it fails, and for reduced motion. Sets the size. */
  fallback: ReactNode;
  loop?: boolean;
  /** Above the fold: start downloading the animation and its renderer with the page. */
  priority?: boolean;
  className?: string;
}

/**
 * Lottie animation over a still fallback. The fallback holds the space and stays for
 * people who prefer reduced motion, so the animation never shifts the layout.
 */
export default function Lottie({ src, fallback, loop = true, priority = false, className }: LottieProps) {
  if (priority) {
    // <link rel="preload"> in the page's head. Same mode as the player's own fetch, so it reuses them.
    preload(src, { as: 'fetch', crossOrigin: 'anonymous', media: MOTION_OK });
    preload(RENDERER_URL, { as: 'fetch', crossOrigin: 'anonymous', media: MOTION_OK });
  }

  const [player, setPlayer] = useState<DotLottie | null>(null);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!player) return;
    const onLoad = () => setReady(true);
    const onError = () => setReady(false);
    player.addEventListener('load', onLoad);
    player.addEventListener('loadError', onError);
    return () => {
      player.removeEventListener('load', onLoad);
      player.removeEventListener('loadError', onError);
    };
  }, [player]);

  return (
    <div className={`${styles.root} ${className ?? ''}`} data-ready={ready}>
      <div className={styles.fallback}>{fallback}</div>
      {!reducedMotion && (
        <DotLottieReact src={src} autoplay loop={loop} dotLottieRefCallback={setPlayer} className={styles.player} aria-hidden="true" />
      )}
    </div>
  );
}
