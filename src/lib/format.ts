/** Localised price — whole amounts without decimals ("€89" / "89 €"), otherwise two. */
export function formatPrice(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Non-ISO currency value from the CMS
    return `${amount} ${currency}`;
  }
}
