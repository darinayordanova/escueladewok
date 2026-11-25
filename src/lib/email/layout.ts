// Building blocks for the emails customers receive.
// Email apps ignore most CSS: tables for layout, inline styles only, web-safe fonts, PNG images.

import { SITE_URL, STUDIO_ADDRESS } from '@/lib/seo';
import type { Locale } from '@/types';

const C = {
  red: '#860A15',
  ink: '#1A0E0E',
  text: '#3D2B2B',
  muted: '#7A5C5C',
  linen: '#F5F0F0',
  petal: '#FBE8EA',
  line: '#E6D9D9',
};
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export const STUDIO_LINE = `${STUDIO_ADDRESS.streetAddress}, ${STUDIO_ADDRESS.postalCode} ${STUDIO_ADDRESS.addressLocality}`;
export const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Wok Lab, ${STUDIO_LINE}`)}`;
export const siteLink = (locale: Locale, path = '') => `${SITE_URL}/${locale}${path}`;

/** Escape customer-typed text before it goes into an email's HTML. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const FOOTER: Record<Locale, { tagline: string; questions: string }> = {
  en: { tagline: 'Asian cooking school in Madrid', questions: 'Questions? Just reply to this email.' },
  es: { tagline: 'Escuela de cocina asiática en Madrid', questions: '¿Alguna pregunta? Responde a este email.' },
};

/** The whole email: red band with the logo, white card, footer with the studio's details. */
export function emailLayout({ locale, preheader, body }: { locale: Locale; preheader: string; body: string }) {
  const f = FOOTER[locale];
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<title>Wok Lab</title>
</head>
<body style="margin:0;padding:0;background-color:${C.linen};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.linen};">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
    <tr><td align="center" style="background-color:${C.red};border-radius:16px 16px 0 0;padding:28px 24px;">
      <a href="${SITE_URL}" style="text-decoration:none;"><img src="${SITE_URL}/images/email/logo-white.png" width="120" alt="Wok Lab" style="display:block;border:0;width:120px;height:auto;" /></a>
    </td></tr>
    <tr><td style="background-color:#FFFFFF;border-radius:0 0 16px 16px;padding:40px 32px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.text};">
      ${body}
    </td></tr>
    <tr><td align="center" style="padding:28px 24px;font-family:${SANS};font-size:12px;line-height:1.7;color:${C.muted};">
      <strong style="color:${C.text};">Wok Lab</strong> · ${f.tagline}<br />
      ${STUDIO_LINE}<br />
      <a href="${SITE_URL}" style="color:${C.red};text-decoration:none;">woklab.es</a> · <a href="https://www.instagram.com/woklab.es" style="color:${C.red};text-decoration:none;">Instagram</a><br />
      ${f.questions}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

export const eyebrow = (text: string) =>
  `<p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${C.red};">${text}</p>`;

export const heading = (text: string) =>
  `<h1 style="margin:0 0 16px;font-family:${SERIF};font-size:28px;font-weight:600;line-height:1.25;color:${C.ink};">${text}</h1>`;

export const paragraph = (html: string) => `<p style="margin:0 0 16px;">${html}</p>`;

export const subheading = (text: string) =>
  `<h2 style="margin:32px 0 12px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">${text}</h2>`;

/** Label/value rows in a soft panel. */
export function detailsTable(rows: [label: string, value: string][], title?: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;background-color:${C.linen};border-radius:12px;">
<tr><td style="padding:20px 24px;">
  ${title ? `<p style="margin:0 0 12px;font-family:${SERIF};font-size:20px;font-weight:600;line-height:1.3;color:${C.ink};">${title}</p>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${rows
      .map(
        ([label, value], i) =>
          `<tr><td style="padding:8px 12px 8px 0;font-size:14px;color:${C.muted};vertical-align:top;width:38%;${i ? `border-top:1px solid ${C.line};` : ''}">${label}</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:${C.ink};vertical-align:top;${i ? `border-top:1px solid ${C.line};` : ''}">${value}</td></tr>`,
      )
      .join('')}
  </table>
</td></tr>
</table>`;
}

/** The voucher code, large, in a dashed "coupon" box. */
export const codeBox = (label: string, code: string, note: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
<tr><td align="center" style="padding:24px;background-color:${C.petal};border:2px dashed ${C.red};border-radius:12px;">
  <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">${label}</p>
  <p style="margin:0 0 6px;font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:700;letter-spacing:4px;color:${C.red};">${code}</p>
  <p style="margin:0;font-size:13px;color:${C.muted};">${note}</p>
</td></tr>
</table>`;

/** The sender's personal message, as a quote. */
export const quote = (text: string, author: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
<tr><td style="padding:16px 20px;border-left:3px solid ${C.red};background-color:${C.linen};border-radius:0 12px 12px 0;">
  <p style="margin:0 0 6px;font-family:${SERIF};font-size:18px;font-style:italic;line-height:1.5;color:${C.ink};">“${text}”</p>
  <p style="margin:0;font-size:13px;color:${C.muted};">— ${author}</p>
</td></tr>
</table>`;

/** Numbered steps. */
export const steps = (items: string[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
${items
  .map(
    (item, i) =>
      `<tr><td width="36" style="padding:6px 0;vertical-align:top;"><div style="width:26px;height:26px;border-radius:13px;background-color:${C.red};color:#FFFFFF;font-size:13px;font-weight:600;line-height:26px;text-align:center;">${i + 1}</div></td><td style="padding:8px 0 6px;font-size:15px;color:${C.text};vertical-align:top;">${item}</td></tr>`,
  )
  .join('')}
</table>`;

/** A link that looks like the site's buttons. */
export const button = (label: string, href: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="border-radius:999px;background-color:${C.red};">
<a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:999px;">${label}</a>
</td></tr></table>`;

export const signOff = (lines: string) => `<p style="margin:24px 0 0;">${lines}</p>`;

export const note = (html: string) => `<p style="margin:0 0 16px;font-size:14px;color:${C.muted};">${html}</p>`;
