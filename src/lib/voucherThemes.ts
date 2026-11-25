import type { CSSProperties } from 'react';

// Gift voucher designs — shared by the voucher PDF and the vouchers page preview, so both look the same.
// Each design is the voucher's left panel: a ground colour, an SVG motif and, optionally, an illustration.
// Motifs are drawn in panel points (VOUCHER_PAGE.panelWidth × height), below the logo (top left, y < 75).

export const VOUCHER_THEMES = ['classic', 'christmas', 'birthday', 'celebration', 'valentines'] as const;
export type VoucherTheme = (typeof VOUCHER_THEMES)[number];

/** The voucher page in PDF points: 210 × 100 mm (21:10, fits a DL envelope), with the design panel on the left. */
export const VOUCHER_PAGE = { width: 595.28, height: 283.46, panelWidth: 180 } as const;

export interface VoucherThemeStyle {
  background: string;
  /** Dark grounds take the white logo, light grounds the brand red one. */
  tone: 'dark' | 'light';
  /** SVG markup in panel points. */
  motif: string;
  /** Illustration over the motif: a file in /public, placed in panel points. */
  art?: { src: string; x: number; y: number; width: number; height: number };
}

const RED = '#860A15';
const BERRY = '#C42A35';
const INK = '#1A0E0E';
const WHITE = '#FFFFFF';
const AMBER = '#E8A33A';
const CREAM = '#FFF4DC';
const PETAL_PINK = '#E8879A';

const n = (value: number) => Math.round(value * 10) / 10;

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [n(cx + r * Math.cos(a)), n(cy + r * Math.sin(a))];
}

const dots = (points: number[][], colour: string, r = 1.6) =>
  points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${colour}"/>`).join('');

function confetti(x: number, y: number, rot: number, colour: string) {
  return `<rect x="${x - 5}" y="${y - 1.8}" width="10" height="3.6" rx="1.2" fill="${colour}" transform="rotate(${rot} ${x} ${y})"/>`;
}

function sparkle(cx: number, cy: number, r: number, colour: string) {
  const k = r * 0.22;
  return `<path d="M${cx} ${n(cy - r)}Q${n(cx + k)} ${n(cy - k)} ${n(cx + r)} ${cy}Q${n(cx + k)} ${n(cy + k)} ${cx} ${n(cy + r)}Q${n(cx - k)} ${n(cy + k)} ${n(cx - r)} ${cy}Q${n(cx - k)} ${n(cy - k)} ${cx} ${n(cy - r)}Z" fill="${colour}"/>`;
}

function burst(cx: number, cy: number, r: number, colour: string, rays = 12) {
  let out = '';
  for (let i = 0; i < rays; i++) {
    const deg = (360 / rays) * i;
    const [x1, y1] = polar(cx, cy, r * 0.38, deg);
    const [x2, y2] = polar(cx, cy, r, deg);
    const [dx, dy] = polar(cx, cy, r * 1.18, deg);
    out += `<path d="M${x1} ${y1}L${x2} ${y2}"/><circle cx="${dx}" cy="${dy}" r="${n(r / 22)}" fill="${colour}" stroke="none"/>`;
  }
  return `<g stroke="${colour}" stroke-width="${n(Math.max(1.2, r / 18))}" stroke-linecap="round">${out}</g>`;
}

function heart(cx: number, cy: number, size: number, rot: number, paint: string) {
  return `<path d="M0 10C0 2 9 -3 16 5C23 -3 32 2 32 10C32 20 20 26 16 31C12 26 0 20 0 10Z" ${paint} transform="translate(${cx} ${cy}) rotate(${rot}) scale(${n(size / 32)}) translate(-16 -15)"/>`;
}

/** A Chinese paper lantern hanging from the top edge. */
function lantern(cx: number, cy: number, r: number) {
  const ry = n(r * 0.82);
  const cap = n(r * 0.26);
  const top = n(cy - ry - cap);
  return [
    `<path d="M${cx} 0V${top}" stroke="${AMBER}" stroke-width="1.2"/>`,
    `<rect x="${n(cx - r * 0.42)}" y="${top}" width="${n(r * 0.84)}" height="${n(cap + 1)}" rx="1" fill="${AMBER}"/>`,
    `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${ry}" fill="${BERRY}"/>`,
    `<ellipse cx="${cx}" cy="${cy}" rx="${n(r * 0.58)}" ry="${ry}" fill="none" stroke="${RED}" stroke-width="1.3"/>`,
    `<ellipse cx="${cx}" cy="${cy}" rx="${n(r * 0.2)}" ry="${ry}" fill="none" stroke="${AMBER}" stroke-width="1" opacity="0.85"/>`,
    `<rect x="${n(cx - r * 0.42)}" y="${n(cy + ry - 1)}" width="${n(r * 0.84)}" height="${cap}" rx="1" fill="${AMBER}"/>`,
    `<path d="M${cx} ${n(cy + ry + cap)}V${n(cy + ry + cap * 2)}" stroke="${AMBER}" stroke-width="1.2"/>`,
    `<rect x="${n(cx - r * 0.13)}" y="${n(cy + ry + cap * 2)}" width="${n(r * 0.26)}" height="${n(r * 0.75)}" rx="1" fill="${RED}"/>`,
  ].join('');
}

/** Plum blossom: five round petals and a gold heart. */
function blossom(cx: number, cy: number, r: number, colour: string) {
  const petals = [0, 72, 144, 216, 288]
    .map((deg) => {
      const [x, y] = polar(cx, cy, r * 0.55, deg - 90);
      return `<circle cx="${x}" cy="${y}" r="${n(r * 0.5)}" fill="${colour}"/>`;
    })
    .join('');
  return `${petals}<circle cx="${cx}" cy="${cy}" r="${n(r * 0.24)}" fill="${AMBER}"/>`;
}

/** A striped birthday candle standing at `base`, flame lit. */
function candle(x: number, base: number, height: number, body: string, stripe: string) {
  const top = base - height;
  const stripes = [0.25, 0.5, 0.75]
    .map((k) => `M${n(x - 2.6)} ${n(top + height * k + 2)}L${n(x + 2.6)} ${n(top + height * k - 2)}`)
    .join('');
  const tip = top - 3;
  return [
    `<rect x="${n(x - 2.6)}" y="${top}" width="5.2" height="${height}" rx="1.5" fill="${body}"/>`,
    `<path d="${stripes}" stroke="${stripe}" stroke-width="1.4"/>`,
    `<path d="M${x} ${top}V${tip}" stroke="${INK}" stroke-width="1"/>`,
    `<circle cx="${x}" cy="${tip - 5}" r="8" fill="${CREAM}" opacity="0.35"/>`,
    `<path d="M${x} ${tip - 12}C${x + 4.5} ${tip - 6} ${x + 4} ${tip} ${x} ${tip}C${x - 4} ${tip} ${x - 4.5} ${tip - 6} ${x} ${tip - 12}Z" fill="${AMBER}"/>`,
    `<path d="M${x} ${tip - 7}C${x + 2} ${tip - 4} ${x + 2} ${tip - 1} ${x} ${tip - 1}C${x - 2} ${tip - 1} ${x - 2} ${tip - 4} ${x} ${tip - 7}Z" fill="${CREAM}"/>`,
  ].join('');
}

/** A bowl of longevity noodles — the Chinese birthday dish — with chopsticks and lit candles. */
function noodleBowl(cx: number, rim: number) {
  const w = 54;
  return [
    // Chopsticks, resting in the noodles
    `<path d="M${cx + 64} ${rim - 64}L${cx + 4} ${rim + 4}" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>`,
    `<path d="M${cx + 76} ${rim - 54}L${cx + 14} ${rim + 6}" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>`,
    // Candles stuck into the noodles (drawn first, so the noodles hide their feet)
    candle(cx - 28, rim - 4, 24, WHITE, RED),
    candle(cx - 11, rim - 8, 30, RED, WHITE),
    candle(cx + 6, rim - 6, 24, WHITE, RED),
    // Noodles heaped above the rim
    `<path d="M${cx - w + 6} ${rim}C${cx - 34} ${rim - 18} ${cx - 18} ${rim - 4} ${cx - 8} ${rim - 16}S${cx + 18} ${rim - 6} ${cx + 28} ${rim - 15}S${cx + 46} ${rim - 4} ${cx + w - 6} ${rim}Z" fill="${CREAM}"/>`,
    `<path d="M${cx - 38} ${rim - 4}c8 -10 16 -2 24 -10M${cx - 4} ${rim - 6}c8 -9 16 -1 24 -9M${cx + 22} ${rim - 3}c6 -6 12 -2 18 -6" stroke="${AMBER}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    // Bowl, rim and foot
    `<path d="M${cx - w} ${rim}H${cx + w}C${cx + w} ${rim + 34} ${cx + 30} ${rim + 54} ${cx} ${rim + 54}C${cx - 30} ${rim + 54} ${cx - w} ${rim + 34} ${cx - w} ${rim}Z" fill="${RED}"/>`,
    `<path d="M${cx - w + 4} ${rim + 14}c9 -6 18 6 27 0s18 6 27 0 18 6 27 0 18 6 27 0" stroke="${AMBER}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
    `<rect x="${cx - w - 2}" y="${rim - 3}" width="${(w + 2) * 2}" height="6" rx="3" fill="${BERRY}"/>`,
    `<rect x="${cx - 16}" y="${rim + 52}" width="32" height="6" rx="2" fill="${BERRY}"/>`,
  ].join('');
}

/**
 * Seigaiha — overlapping waves, the classic East Asian pattern — as a tiling SVG pattern.
 * Each wave is concentric rings; rows overlap by half a radius, drawn top to bottom.
 */
function waves(id: string, r: number, ground: string, line: string) {
  const wave = (cx: number, cy: number) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${ground}" stroke="${line}" stroke-width="1.1"/>` +
    [0.72, 0.44, 0.16].map((k) => `<circle cx="${cx}" cy="${cy}" r="${n(r * k)}" fill="none" stroke="${line}" stroke-width="1.1"/>`).join('');
  const tile = `${wave(0, 0)}${wave(2 * r, 0)}${wave(r, r / 2)}${wave(0, r)}${wave(2 * r, r)}`;
  return `<defs><pattern id="${id}" width="${2 * r}" height="${r}" patternUnits="userSpaceOnUse">${tile}</pattern></defs>` +
    `<rect width="100%" height="100%" fill="url(#${id})"/>`;
}

/** A soup dumpling (xiaolongbao): a pleated dome gathered to a knot. */
function dumpling(x: number, y: number, size: number) {
  const top = n(y - size * 0.9);
  const pleats = [-0.62, -0.22, 0.22, 0.62]
    .map((k) => `M${x} ${top}Q${n(x + size * k * 0.6)} ${n(y - size * 0.5)} ${n(x + size * k)} ${n(y - size * 0.12)}`)
    .join('');
  return [
    `<path d="M${x - size} ${y}C${x - size} ${n(y - size * 1.15)} ${x + size} ${n(y - size * 1.15)} ${x + size} ${y}Q${x} ${n(y + size * 0.28)} ${x - size} ${y}Z" fill="#FFF6E6" stroke="#E6CFA8" stroke-width="1"/>`,
    `<path d="${pleats}" stroke="#E0C597" stroke-width="1" fill="none" stroke-linecap="round"/>`,
    `<circle cx="${x}" cy="${top}" r="${n(size * 0.13)}" fill="#E0C597"/>`,
  ].join('');
}

/** A bamboo steamer of dumplings, steam rising — the cooking school's signature. */
function steamer(cx: number, rim: number) {
  const w = 56;
  const BAMBOO = '#D9A55B';
  const BAMBOO_DARK = '#A8722F';
  const steam = [-20, 0, 20]
    .map((dx, i) => `<path d="M${cx + dx} ${rim - 34 - (i === 1 ? 6 : 0)}c-6 -7 6 -11 0 -18s6 -11 0 -17" stroke="${WHITE}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.85"/>`)
    .join('');
  const slats = [-38, -19, 0, 19, 38].map((dx) => `M${cx + dx} ${rim + 12}V${rim + 40}`).join('');
  return [
    steam,
    // Basket: body, woven bands, slats
    `<path d="M${cx - w} ${rim}V${rim + 34}Q${cx - w} ${rim + 46} ${cx - w + 12} ${rim + 46}H${cx + w - 12}Q${cx + w} ${rim + 46} ${cx + w} ${rim + 34}V${rim}Z" fill="${BAMBOO}"/>`,
    `<path d="M${cx - w} ${rim + 12}H${cx + w}M${cx - w} ${rim + 30}H${cx + w}" stroke="${BAMBOO_DARK}" stroke-width="1.6"/>`,
    `<path d="${slats}" stroke="${BAMBOO_DARK}" stroke-width="1" opacity="0.5"/>`,
    // Rim and the paper liner the dumplings sit on
    `<ellipse cx="${cx}" cy="${rim}" rx="${w}" ry="13" fill="${BAMBOO_DARK}"/>`,
    `<ellipse cx="${cx}" cy="${rim}" rx="${w - 6}" ry="10" fill="#F2E2C4"/>`,
    dumpling(cx, rim - 6, 14),
    dumpling(cx - 24, rim + 3, 14),
    dumpling(cx + 24, rim + 3, 14),
  ].join('');
}

export const VOUCHER_THEME_STYLES: Record<VoucherTheme, VoucherThemeStyle> = {
  classic: {
    background: RED,
    tone: 'dark',
    motif: [
      waves('classic-waves', 14, RED, '#9C1A25'),
      steamer(90, 208),
      sparkle(28, 120, 5, AMBER),
      sparkle(156, 104, 6, AMBER),
      sparkle(160, 168, 3.5, AMBER),
    ].join(''),
  },
  christmas: {
    background: '#EEF2EC',
    tone: 'light',
    motif: [
      dots([[22, 96], [156, 84], [40, 140], [170, 150], [14, 188], [164, 200], [30, 262], [154, 258], [96, 82]], '#C3D0C5', 2),
      sparkle(26, 118, 5, AMBER),
      sparkle(158, 112, 6, AMBER),
      sparkle(160, 232, 4, AMBER),
      sparkle(18, 214, 4, AMBER),
    ].join(''),
    // Lantern tree — public/images/vouchers/christmas-tree.png (600 × 773)
    art: { src: '/images/vouchers/christmas-tree.png', x: 20, y: 86, width: 140, height: 180.4 },
  },
  birthday: {
    background: '#F0B443',
    tone: 'light',
    motif: [
      noodleBowl(84, 196),
      confetti(150, 92, 30, RED),
      confetti(28, 112, -25, WHITE),
      confetti(162, 150, 70, INK),
      confetti(20, 170, 15, RED),
      confetti(160, 238, -40, WHITE),
      confetti(26, 246, 55, INK),
      dots([[120, 90], [40, 92], [170, 196], [14, 216], [150, 270]], RED, 2.4),
      dots([[100, 112], [10, 140], [176, 120]], WHITE, 2.4),
    ].join(''),
  },
  celebration: {
    background: INK,
    tone: 'dark',
    motif: [
      lantern(128, 62, 18),
      lantern(162, 110, 12),
      burst(58, 196, 34, AMBER),
      burst(140, 238, 18, BERRY, 10),
      sparkle(120, 160, 6, AMBER),
      sparkle(24, 112, 4, WHITE),
      sparkle(168, 186, 4, WHITE),
      sparkle(30, 262, 5, AMBER),
      sparkle(96, 268, 3, WHITE),
    ].join(''),
  },
  valentines: {
    background: '#F7DCE0',
    tone: 'light',
    motif: [
      // Plum blossom branch
      `<path d="M-4 268C40 246 72 206 108 176S158 124 186 104M70 208C70 186 60 166 42 150M128 158C140 142 140 126 132 112" stroke="#5A2A2A" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      blossom(108, 176, 13, RED),
      blossom(150, 134, 10, BERRY),
      blossom(42, 150, 11, RED),
      blossom(132, 110, 8, PETAL_PINK),
      blossom(78, 200, 8, PETAL_PINK),
      blossom(174, 108, 7, RED),
      dots([[58, 228], [96, 188], [164, 120]], BERRY, 2.6),
      heart(60, 104, 16, -14, `fill="${RED}" opacity="0.55"`),
      heart(146, 222, 22, 12, `fill="${RED}"`),
      heart(30, 236, 11, -8, `fill="${BERRY}" opacity="0.7"`),
      heart(108, 258, 9, 10, `fill="${RED}" opacity="0.45"`),
    ].join(''),
  },
};

export function isVoucherTheme(value: unknown): value is VoucherTheme {
  return typeof value === 'string' && (VOUCHER_THEMES as readonly string[]).includes(value);
}

/** The design panel's ground and motif as a standalone SVG (the illustration is placed separately). */
export function voucherPanelSvg(theme: VoucherTheme) {
  const { background, motif } = VOUCHER_THEME_STYLES[theme];
  const { panelWidth: w, height: h } = VOUCHER_PAGE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="${background}"/>${motif}
</svg>`;
}

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Custom properties that paint a design panel (see VoucherPreview and the design swatches). */
export function voucherThemeStyle(theme: VoucherTheme): CSSProperties & { tone: VoucherThemeStyle['tone'] } {
  const { background, tone, art } = VOUCHER_THEME_STYLES[theme];
  return {
    tone,
    '--voucher-bg': background,
    '--voucher-panel': svgUrl(voucherPanelSvg(theme)),
    '--voucher-art': art ? `url("${art.src}")` : 'none',
  } as CSSProperties & { tone: VoucherThemeStyle['tone'] };
}
