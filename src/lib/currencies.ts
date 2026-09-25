import { CurrencyCode, CurrencyConfig } from '@/types';

export const CURRENCIES: Record<string, CurrencyConfig> = {
  // Popular & Southeast Asia
  THB: { code: 'THB', symbol: '฿', label: 'Thai Baht (THB)', decimalDigits: 2, region: 'Southeast Asia' },
  USD: { code: 'USD', symbol: '$', label: 'US Dollar (USD)', decimalDigits: 2, region: 'Popular' },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro (EUR)', decimalDigits: 2, region: 'Popular' },
  GBP: { code: 'GBP', symbol: '£', label: 'British Pound (GBP)', decimalDigits: 2, region: 'Popular' },
  JPY: { code: 'JPY', symbol: '¥', label: 'Japanese Yen (JPY)', decimalDigits: 0, region: 'Popular' },
  SGD: { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (SGD)', decimalDigits: 2, region: 'Southeast Asia' },
  MYR: { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit (MYR)', decimalDigits: 2, region: 'Southeast Asia' },
  IDR: { code: 'IDR', symbol: 'Rp', label: 'Indonesian Rupiah (IDR)', decimalDigits: 0, region: 'Southeast Asia' },
  PHP: { code: 'PHP', symbol: '₱', label: 'Philippine Peso (PHP)', decimalDigits: 2, region: 'Southeast Asia' },
  VND: { code: 'VND', symbol: '₫', label: 'Vietnamese Dong (VND)', decimalDigits: 0, region: 'Southeast Asia' },

  // Asia & Pacific
  CNY: { code: 'CNY', symbol: '¥', label: 'Chinese Yuan (CNY)', decimalDigits: 2, region: 'Asia & Pacific' },
  HKD: { code: 'HKD', symbol: 'HK$', label: 'Hong Kong Dollar (HKD)', decimalDigits: 2, region: 'Asia & Pacific' },
  TWD: { code: 'TWD', symbol: 'NT$', label: 'New Taiwan Dollar (TWD)', decimalDigits: 0, region: 'Asia & Pacific' },
  KRW: { code: 'KRW', symbol: '₩', label: 'South Korean Won (KRW)', decimalDigits: 0, region: 'Asia & Pacific' },
  INR: { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)', decimalDigits: 2, region: 'Asia & Pacific' },
  AUD: { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (AUD)', decimalDigits: 2, region: 'Asia & Pacific' },
  NZD: { code: 'NZD', symbol: 'NZ$', label: 'New Zealand Dollar (NZD)', decimalDigits: 2, region: 'Asia & Pacific' },
  PKR: { code: 'PKR', symbol: 'PKR', label: 'Pakistani Rupee (PKR)', decimalDigits: 2, region: 'Asia & Pacific' },
  BDT: { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka (BDT)', decimalDigits: 2, region: 'Asia & Pacific' },
  LKR: { code: 'LKR', symbol: 'Rs', label: 'Sri Lankan Rupee (LKR)', decimalDigits: 2, region: 'Asia & Pacific' },
  KZT: { code: 'KZT', symbol: '₸', label: 'Kazakhstani Tenge (KZT)', decimalDigits: 2, region: 'Asia & Pacific' },

  // Europe
  CHF: { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc (CHF)', decimalDigits: 2, region: 'Europe' },
  SEK: { code: 'SEK', symbol: 'kr', label: 'Swedish Krona (SEK)', decimalDigits: 2, region: 'Europe' },
  NOK: { code: 'NOK', symbol: 'kr', label: 'Norwegian Krone (NOK)', decimalDigits: 2, region: 'Europe' },
  DKK: { code: 'DKK', symbol: 'kr.', label: 'Danish Krone (DKK)', decimalDigits: 2, region: 'Europe' },
  PLN: { code: 'PLN', symbol: 'zł', label: 'Polish Zloty (PLN)', decimalDigits: 2, region: 'Europe' },
  CZK: { code: 'CZK', symbol: 'Kč', label: 'Czech Koruna (CZK)', decimalDigits: 2, region: 'Europe' },
  HUF: { code: 'HUF', symbol: 'Ft', label: 'Hungarian Forint (HUF)', decimalDigits: 0, region: 'Europe' },
  RON: { code: 'RON', symbol: 'lei', label: 'Romanian Leu (RON)', decimalDigits: 2, region: 'Europe' },
  BGN: { code: 'BGN', symbol: 'лв', label: 'Bulgarian Lev (BGN)', decimalDigits: 2, region: 'Europe' },
  TRY: { code: 'TRY', symbol: '₺', label: 'Turkish Lira (TRY)', decimalDigits: 2, region: 'Europe' },
  ISK: { code: 'ISK', symbol: 'kr', label: 'Icelandic Króna (ISK)', decimalDigits: 0, region: 'Europe' },
  RSD: { code: 'RSD', symbol: 'din', label: 'Serbian Dinar (RSD)', decimalDigits: 2, region: 'Europe' },
  UAH: { code: 'UAH', symbol: '₴', label: 'Ukrainian Hryvnia (UAH)', decimalDigits: 2, region: 'Europe' },

  // Americas
  CAD: { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CAD)', decimalDigits: 2, region: 'Americas' },
  BRL: { code: 'BRL', symbol: 'R$', label: 'Brazilian Real (BRL)', decimalDigits: 2, region: 'Americas' },
  MXN: { code: 'MXN', symbol: 'Mex$', label: 'Mexican Peso (MXN)', decimalDigits: 2, region: 'Americas' },
  CLP: { code: 'CLP', symbol: 'CLP$', label: 'Chilean Peso (CLP)', decimalDigits: 0, region: 'Americas' },
  COP: { code: 'COP', symbol: 'COL$', label: 'Colombian Peso (COP)', decimalDigits: 0, region: 'Americas' },
  ARS: { code: 'ARS', symbol: 'ARS$', label: 'Argentine Peso (ARS)', decimalDigits: 2, region: 'Americas' },
  PEN: { code: 'PEN', symbol: 'S/', label: 'Peruvian Sol (PEN)', decimalDigits: 2, region: 'Americas' },
  CRC: { code: 'CRC', symbol: '₡', label: 'Costa Rican Colón (CRC)', decimalDigits: 0, region: 'Americas' },
  UYU: { code: 'UYU', symbol: '$U', label: 'Uruguayan Peso (UYU)', decimalDigits: 2, region: 'Americas' },

  // Middle East & Africa
  AED: { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)', decimalDigits: 2, region: 'Middle East & Africa' },
  SAR: { code: 'SAR', symbol: 'SAR', label: 'Saudi Riyal (SAR)', decimalDigits: 2, region: 'Middle East & Africa' },
  QAR: { code: 'QAR', symbol: 'QR', label: 'Qatari Riyal (QAR)', decimalDigits: 2, region: 'Middle East & Africa' },
  KWD: { code: 'KWD', symbol: 'KD', label: 'Kuwaiti Dinar (KWD)', decimalDigits: 3, region: 'Middle East & Africa' },
  BHD: { code: 'BHD', symbol: 'BD', label: 'Bahraini Dinar (BHD)', decimalDigits: 3, region: 'Middle East & Africa' },
  OMR: { code: 'OMR', symbol: 'OMR', label: 'Omani Rial (OMR)', decimalDigits: 3, region: 'Middle East & Africa' },
  ILS: { code: 'ILS', symbol: '₪', label: 'Israeli Shekel (ILS)', decimalDigits: 2, region: 'Middle East & Africa' },
  ZAR: { code: 'ZAR', symbol: 'R', label: 'South African Rand (ZAR)', decimalDigits: 2, region: 'Middle East & Africa' },
  EGP: { code: 'EGP', symbol: 'E£', label: 'Egyptian Pound (EGP)', decimalDigits: 2, region: 'Middle East & Africa' },
  NGN: { code: 'NGN', symbol: '₦', label: 'Nigerian Naira (NGN)', decimalDigits: 2, region: 'Middle East & Africa' },
  KES: { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling (KES)', decimalDigits: 2, region: 'Middle East & Africa' },
  MAD: { code: 'MAD', symbol: 'MAD', label: 'Moroccan Dirham (MAD)', decimalDigits: 2, region: 'Middle East & Africa' },
  GHS: { code: 'GHS', symbol: 'GH₵', label: 'Ghanaian Cedi (GHS)', decimalDigits: 2, region: 'Middle East & Africa' },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

export const CURRENCY_REGIONS = [
  'Southeast Asia',
  'Popular',
  'Asia & Pacific',
  'Europe',
  'Americas',
  'Middle East & Africa',
] as const;

export const GROUPED_CURRENCIES: Record<string, CurrencyConfig[]> = CURRENCY_REGIONS.reduce(
  (acc, region) => {
    acc[region] = CURRENCY_LIST.filter((c) => c.region === region);
    return acc;
  },
  {} as Record<string, CurrencyConfig[]>
);

export function getCurrencyConfig(currencyCode: string): CurrencyConfig {
  return (
    CURRENCIES[currencyCode] || {
      code: currencyCode,
      symbol: currencyCode,
      label: currencyCode,
      decimalDigits: 2,
      region: 'Other',
    }
  );
}

export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'USD'): string {
  const config = getCurrencyConfig(currencyCode);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: config.code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: config.decimalDigits,
      maximumFractionDigits: config.decimalDigits,
    }).format(amount);
  } catch {
    return `${config.symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: config.decimalDigits,
      maximumFractionDigits: config.decimalDigits,
    })}`;
  }
}

export function formatCompactCurrency(amount: number, currencyCode: CurrencyCode = 'USD'): string {
  const config = getCurrencyConfig(currencyCode);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: config.code,
      notation: 'compact',
      compactDisplay: 'short',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `${config.symbol}${amount >= 1000 ? (amount / 1000).toFixed(1) + 'k' : amount}`;
  }
}
