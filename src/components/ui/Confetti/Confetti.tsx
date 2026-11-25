'use client';

import { useEffect, useRef } from 'react';

import styles from './Confetti.module.scss';

// Brand red, berry, amber, cream and petal pink (lib/voucherThemes)
const BRAND_COLOURS = ['#860A15', '#C42A35', '#E8A33A', '#FFF4DC', '#E8879A'];
const DURATION = 4200;
const FADE = 1000;

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  spin: number;
  sway: number;
  colour: string;
  round: boolean;
}

/** One burst of confetti falling over the page, then gone. Skipped under reduced motion. */
export default function Confetti({ pieces = 160, colours = BRAND_COLOURS }: { pieces?: number; colours?: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const confetti: Piece[] = Array.from({ length: pieces }, () => ({
      x: rand(0, width),
      y: rand(-height * 0.6, -10),
      vx: rand(-0.6, 0.6),
      vy: rand(2, 4.5),
      size: rand(6, 11),
      angle: rand(0, Math.PI * 2),
      spin: rand(-0.12, 0.12),
      sway: rand(0, Math.PI * 2),
      colour: colours[Math.floor(Math.random() * colours.length)],
      round: Math.random() < 0.25,
    }));

    let frame = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = Math.min(1, Math.max(0, (DURATION - elapsed) / FADE));

      for (const p of confetti) {
        p.sway += 0.04;
        p.x += p.vx + Math.sin(p.sway) * 0.8;
        p.y += p.vy;
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.colour;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Flutter: the strip turns edge-on and back
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, (p.size / 2) * Math.abs(Math.cos(p.sway)));
        }
        ctx.restore();
      }

      if (elapsed < DURATION) frame = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, width, height);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [pieces, colours]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
