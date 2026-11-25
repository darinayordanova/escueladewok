// Words printed on the gift voucher — shared by the voucher PDF and the vouchers page preview,
// so the preview reads exactly like the voucher people receive.

import type { Locale } from '@/types';

export interface VoucherText {
  headerSub: string;
  for: string;
  from: string;
  code: string;
  validUntil: string;
  footerPrefix: string;
  footerLinkLabel: string;
  footerSuffix: string;
  footerQuestions: string;
}

export const VOUCHER_TEXT: Record<Locale, VoucherText> = {
  en: {
    headerSub: 'An unforgettable hands-on cooking experience in the heart of Madrid. From the wok to the table.',
    for: 'FOR',
    from: 'FROM',
    code: 'VOUCHER CODE',
    validUntil: 'Valid until',
    footerPrefix: 'Enter this code at checkout on ',
    footerLinkLabel: 'woklab.es',
    footerSuffix: ' to redeem your voucher.',
    footerQuestions: 'Questions? info@woklab.es',
  },
  es: {
    headerSub: 'Una experiencia culinaria inolvidable y práctica en el corazón de Madrid. Del wok a la mesa.',
    for: 'PARA',
    from: 'DE',
    code: 'CÓDIGO DEL VALE',
    validUntil: 'Válido hasta el',
    footerPrefix: 'Introduce este código al finalizar tu compra en ',
    footerLinkLabel: 'woklab.es',
    footerSuffix: ' para canjear tu vale.',
    footerQuestions: '¿Preguntas? info@woklab.es',
  },
};

export function voucherText(locale: string): VoucherText {
  return VOUCHER_TEXT[locale === 'es' ? 'es' : 'en'];
}
