'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

import { ChevronDown } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import type { VoucherKey } from '@/lib/vouchers';
import type { VoucherTheme } from '@/lib/voucherThemes';

import { EnvelopeFlap, EnvelopePocket, PriceCard, Star, type PriceCardCopy } from './art';
import styles from './EnvelopeScene.module.scss';

export interface SceneCard {
  voucherKey: VoucherKey;
  amount: number;
  theme: VoucherTheme;
  copy: PriceCardCopy;
  href: string;
  label: string;
}

interface EnvelopeSceneProps {
  cards: SceneCard[];
  scrollPrompt: string;
  eyebrow: string;
  title: string;
  sub: string;
  hint: string;
}

// Scroll progress 0 → 1 through the pinned scene drives every part:
// the flap opens, the cards rise and fan out, then the envelope sinks and the cards settle in a row.
const FAN_X = [-0.27, -0.09, 0.09, 0.27];
const FAN_R = [-14, -5, 5, 14];
const FINAL_R = [-2, 1.5, -1.5, 2];
/** The voucher's height as a share of its width (595 × 283 pt). */
const CARD_RATIO = 283.46 / 595.28;
const FAN_SCALE = 0.85;
/** Envelope height and flap height as shares of its width (art.tsx: 300 × 186, flap 104). */
const ENV_RATIO = 186 / 300;
const FLAP_RATIO = 104 / 186;

// Scroll progress for each card: rising out of the envelope, then settling into the row
const riseWindow = (i: number) => [0.26 + 0.025 * i, 0.48 + 0.025 * i] as const;
const settleWindow = (i: number) => [0.56 + 0.03 * i, 0.86] as const;
/**
 * When every card moves in front of the envelope — all at once, so no card ever jumps over
 * another. Every card has risen clear of the pocket by then (the last finishes at 0.555).
 */
const IN_FRONT_AT = settleWindow(0)[0];

// The night sky: left %, top %, size px, twinkle delay s
const STARS = [
  [6, 14, 14, 0], [18, 62, 10, -1.2], [27, 24, 8, -2.4], [38, 84, 12, -0.6], [47, 10, 10, -3.1],
  [58, 70, 8, -1.8], [66, 30, 14, -2.7], [79, 12, 9, -0.3], [88, 52, 12, -1.5], [94, 86, 8, -2.2],
  [12, 88, 9, -3.4], [72, 90, 11, -0.9], [33, 46, 7, -2], [84, 34, 7, -1.1],
];

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const segment = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOutBack = (x: number) => 1 + 2.3 * Math.pow(x - 1, 3) + 1.3 * Math.pow(x - 1, 2);

/** Pinned scroll scene: a red envelope opens and the four voucher cards come out of it. */
export default function EnvelopeScene({ cards, scrollPrompt, eyebrow, title, sub, hint }: EnvelopeSceneProps) {
  const sceneRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const stage = stageRef.current;
    if (!scene || !stage) return;

    const part = (name: string) => stage.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
    const [back, front, flap, prompt, heading, cue] = ['back', 'front', 'flap', 'prompt', 'heading', 'cue'].map(part);
    const cardEls = [...stage.querySelectorAll<HTMLElement>('[data-part="card"]')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    let m = { width: 0, height: 0, wide: false, envW: 0, envH: 0, envTop: 0, cardW: 0, cardH: 0, gap: 0 };

    const measure = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const wide = width >= 1000;
      const envW = Math.min(460, width * 0.84);
      const envH = envW * ENV_RATIO;
      const envTop = height * 0.6 - envH / 2;
      const cardW = wide ? Math.min(250, (width - 96 - 66) / 4) : Math.min(240, (width - 32 - 14) / 2);
      m = { width, height, wide, envW, envH, envTop, cardW, cardH: cardW * CARD_RATIO, gap: wide ? 22 : 14 };
      stage.style.setProperty('--env-w', `${envW}px`);
      stage.style.setProperty('--env-h', `${envH}px`);
      stage.style.setProperty('--flap-h', `${envH * FLAP_RATIO}px`);
      stage.style.setProperty('--env-top', `${envTop}px`);
      stage.style.setProperty('--card-w', `${cardW}px`);
    };

    const render = (p: number) => {
      const sink = easeInOut(segment(p, 0.6, 0.9));
      const envY = sink * m.envH * 0.8;
      const envOpacity = String(1 - segment(p, 0.64, 0.9));
      back.style.transform = front.style.transform = `translateY(${envY}px)`;
      back.style.opacity = front.style.opacity = flap.style.opacity = envOpacity;
      // The flap folds up over its top edge: a flat flip (scaleY 1 → -1) keeps its edges crisp
      // and its hinge exactly on the envelope's top edge. Past halfway its inside shows.
      const fold = Math.cos(Math.PI * easeInOut(segment(p, 0.05, 0.28)));
      flap.style.transform = `translateY(${envY}px) scaleY(${fold})`;
      flap.dataset.side = fold < 0 ? 'inside' : 'outside';
      // Closed, the flap covers the pocket; open, it stands behind the cards (it is a flat line at the switch)
      flap.style.zIndex = fold < 0 ? '1' : '21';
      const inFront = p >= IN_FRONT_AT;

      const startScale = Math.min(1, (m.envW * 0.34) / m.cardW);
      cardEls.forEach((card, i) => {
        const rise = easeOutBack(segment(p, ...riseWindow(i)));
        const settle = easeInOut(segment(p, ...settleWindow(i)));
        // Inside, each card's top sits just below the pocket's V (art.tsx: 106 of 186), so none
        // shows through the opening before it rises
        const y0 = m.envTop + m.envH * (110 / 186) + (m.cardH * startScale) / 2;
        // Fanned out, the tilted card clears the pocket's edge completely, so bringing it
        // in front of the envelope (below) never shows a corner jumping over the pocket
        const tilt = (Math.abs(FAN_R[i]) * Math.PI) / 180;
        const halfExtent = (FAN_SCALE * (m.cardW * Math.sin(tilt) + m.cardH * Math.cos(tilt))) / 2;
        const y1 = m.envTop - halfExtent - 10 - Math.abs(i - 1.5) * 6;
        let xEnd: number;
        let yEnd: number;
        if (m.wide) {
          xEnd = (i - 1.5) * (m.cardW + m.gap);
          yEnd = m.height * 0.6;
        } else {
          xEnd = ((i % 2) - 0.5) * (m.cardW + m.gap);
          yEnd = m.height * 0.62 + ((i >> 1) - 0.5) * (m.cardH + m.gap);
        }
        const x = lerp(lerp(0, FAN_X[i] * m.envW, rise), xEnd, settle);
        const y = lerp(lerp(y0, y1, rise), yEnd, settle);
        const rotate = lerp(lerp(0, FAN_R[i], rise), FINAL_R[i], settle);
        const scale = lerp(lerp(startScale, FAN_SCALE, rise), 1, settle);
        card.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`;
        // Same order throughout (each card above the one before), behind the pocket (z 20)
        // until all of them move in front together
        card.style.zIndex = String((inFront ? 30 : 10) + i);
      });

      prompt.style.opacity = String(1 - segment(p, 0.03, 0.16));
      const headingIn = segment(p, 0.72, 0.88);
      heading.style.opacity = String(headingIn);
      heading.style.transform = `translateY(${(1 - headingIn) * 18}px)`;
      cue.style.opacity = String(1 - segment(p, 0, 0.06));
      // Cards only take clicks once they have settled
      stage.dataset.live = String(p > 0.9);
      stage.dataset.ready = 'true';
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      if (reduced.matches) return render(1);
      const rect = scene.getBoundingClientRect();
      const travel = Math.max(1, scene.offsetHeight - stage.clientHeight);
      render(clamp(-rect.top / travel));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      update();
    };

    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section ref={sceneRef} className={styles.scene} aria-labelledby="christmas-cards-title">
      <div className={styles.sticky}>
        <div ref={stageRef} className={styles.stage} data-live="false">
          <p className={styles.prompt} data-part="prompt" aria-hidden="true">{scrollPrompt}</p>
          <div className={styles.heading} data-part="heading">
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h2 id="christmas-cards-title" className={styles.title}>{title}</h2>
            <p className={styles.sub}>{sub}</p>
          </div>

          {STARS.map(([left, top, size, delay], i) => (
            <Star
              key={i}
              className={styles.star}
              style={{ left: `${left}%`, top: `${top}%`, width: size, '--delay': `${delay}s` } as CSSProperties}
            />
          ))}

          <div className={styles.back} data-part="back" />
          <div className={styles.front} data-part="front"><EnvelopePocket className={styles.fill} /></div>
          <div className={styles.flap} data-part="flap" data-side="outside"><EnvelopeFlap className={styles.fill} /></div>

          {cards.map((card) => (
            <Link key={card.voucherKey} href={card.href} className={styles.card} data-part="card" aria-label={card.label}>
              <PriceCard voucherKey={card.voucherKey} amount={card.amount} theme={card.theme} copy={card.copy} />
            </Link>
          ))}

          <p className={styles.cue} data-part="cue" aria-hidden="true">
            {hint}
            <ChevronDown size={22} />
          </p>
        </div>
      </div>
    </section>
  );
}
