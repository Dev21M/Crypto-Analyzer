/**
 * Number formatting utilities
 */

export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  const {
    precision = 2,
    compact = false,
    currency = false,
    currencyCode = 'USD',
    locale = 'en-US',
    sign = false,
  } = options;

  if (compact && Math.abs(value) >= 1000) {
    return formatCompactNumber(value, { precision, currency, currencyCode, locale, sign });
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: currency ? 'currency' : 'decimal',
    currency: currency ? currencyCode : undefined,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    signDisplay: sign ? 'exceptZero' : 'auto',
  });

  return formatter.format(value);
}

export function formatCompactNumber(value, options = {}) {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  const {
    precision = 1,
    currency = false,
    currencyCode = 'USD',
    locale = 'en-US',
    sign: showSign = false,
  } = options;

  const absValue = Math.abs(value);
  const signPrefix = value < 0 ? '-' : '';

  let formatted;
  if (absValue >= 1e12) {
    formatted = (absValue / 1e12).toFixed(precision) + 'T';
  } else if (absValue >= 1e9) {
    formatted = (absValue / 1e9).toFixed(precision) + 'B';
  } else if (absValue >= 1e6) {
    formatted = (absValue / 1e6).toFixed(precision) + 'M';
  } else if (absValue >= 1e3) {
    formatted = (absValue / 1e3).toFixed(precision) + 'K';
  } else {
    formatted = absValue.toFixed(precision);
  }

  if (currency) {
    const currencySymbol = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
    }).formatToParts(0).find(p => p.type === 'currency')?.value || '$';
    return signPrefix + currencySymbol + formatted;
  }

  return signPrefix + formatted;
}

export function formatPrice(price, currency = 'USDT', precision = 2) {
  if (price === null || price === undefined || isNaN(price)) return '—';
  return formatNumber(price, { precision, currency: false }) + ' ' + currency;
}

export function formatPercentage(value, options = {}) {
  const { precision = 2, sign = true, multiply = false } = options;
  if (value === null || value === undefined || isNaN(value)) return '—';
  const displayValue = multiply ? value * 100 : value;
  const formatted = formatNumber(displayValue, { precision, sign });
  return `${formatted}%`;
}

export function formatChange(value, options = {}) {
  const { precision = 2, showSign = true } = options;
  if (value === null || value === undefined || isNaN(value)) return '—';
  const prefix = showSign && value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(precision)}%`;
}

export function formatVolume(volume) {
  return formatCompactNumber(volume, { precision: 2 });
}

export function formatMarketCap(cap) {
  return formatCompactNumber(cap, { precision: 2, currency: true, currencyCode: 'USD' });
}

/**
 * Date formatting utilities
 */

export function formatDate(date, options = {}) {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';

  const {
    dateStyle = 'medium',
    timeStyle = 'short',
    locale = 'en-US',
    timeZone = 'UTC',
  } = options;

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    timeZone,
  }).format(d);
}

export function formatTime(date, options = {}) {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: options.timeZone || 'UTC',
    hour12: false,
  }).format(d);
}

export function formatRelativeTime(date, options = {}) {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';

  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return formatDate(d, { dateStyle: 'short' });
}

export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Address/formatting utilities
 */

export function truncateAddress(address, start = 6, end = 4) {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function truncateString(str, length = 20, suffix = '...') {
  if (!str || str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Coin/symbol utilities
 */

export function formatSymbol(symbol) {
  if (!symbol) return '';
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function parseSymbolPair(pair) {
  // BTCUSDT -> { base: 'BTC', quote: 'USDT' }
  const quoteCurrencies = ['USDT', 'USDC', 'BUSD', 'BTC', 'ETH', 'BNB'];
  for (const quote of quoteCurrencies) {
    if (pair.endsWith(quote)) {
      return {
        base: pair.slice(0, -quote.length),
        quote,
      };
    }
  }
  return { base: pair, quote: '' };
}

/**
 * Validation utilities
 */

export function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function roundTo(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export default {
  formatNumber,
  formatCompactNumber,
  formatPrice,
  formatPercentage,
  formatChange,
  formatVolume,
  formatMarketCap,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatDuration,
  truncateAddress,
  truncateString,
  formatSymbol,
  parseSymbolPair,
  isValidNumber,
  clamp,
  roundTo,
};