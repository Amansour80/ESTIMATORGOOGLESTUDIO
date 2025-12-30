/**
 * Currency formatting utilities that use organization settings
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'د.إ',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: 'ر.س',
  QAR: 'ر.ق',
  OMR: 'ر.ع.',
  KWD: 'د.ك',
};

export const CURRENCY_LOCALES: Record<string, string> = {
  AED: 'en-AE',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  SAR: 'ar-SA',
  QAR: 'ar-QA',
  OMR: 'ar-OM',
  KWD: 'ar-KW',
};

/**
 * Format currency with proper symbol and locale
 */
export function formatCurrency(
  value: number,
  currencyCode: string = 'AED',
  options: { decimals?: number; showSymbol?: boolean; showCode?: boolean } = {}
): string {
  const { decimals = 0, showSymbol = false, showCode = true } = options;

  const locale = CURRENCY_LOCALES[currencyCode] || 'en-AE';
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(value);

  if (showSymbol) {
    const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
    return `${symbol} ${formatted}`;
  }

  if (showCode) {
    return `${formatted} ${currencyCode}`;
  }

  return formatted;
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
}

/**
 * Get locale for a currency code
 */
export function getCurrencyLocale(currencyCode: string): string {
  return CURRENCY_LOCALES[currencyCode] || 'en-AE';
}

/**
 * Format currency for exports (includes both symbol and code)
 */
export function formatCurrencyForExport(value: number, currencyCode: string = 'AED'): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || '';
  const locale = CURRENCY_LOCALES[currencyCode] || 'en-AE';
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);

  if (symbol) {
    return `${symbol} ${formatted} ${currencyCode}`;
  }

  return `${formatted} ${currencyCode}`;
}
