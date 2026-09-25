import { CurrencyCode } from '@/types';
import { CURRENCIES, getCurrencyConfig } from './currencies';

// Baseline exchange rates against 1 USD (Standard market rates)
export const DEFAULT_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  THB: 35.5,     // 1 USD = 35.5 THB (1 JPY ~ 0.233 THB)
  JPY: 152.0,    // 1 USD = 152 JPY
  EUR: 0.92,     // 1 USD = 0.92 EUR
  GBP: 0.78,     // 1 USD = 0.78 GBP
  SGD: 1.34,     // 1 USD = 1.34 SGD
  CNY: 7.25,     // 1 USD = 7.25 CNY
  KRW: 1380.0,   // 1 USD = 1380 KRW
  AUD: 1.52,     // 1 USD = 1.52 AUD
  CAD: 1.38,     // 1 USD = 1.38 CAD
  CHF: 0.89,     // 1 USD = 0.89 CHF
  HKD: 7.82,     // 1 USD = 7.82 HKD
  TWD: 32.2,     // 1 USD = 32.2 TWD
  MYR: 4.68,     // 1 USD = 4.68 MYR
  IDR: 16200.0,  // 1 USD = 16,200 IDR
  PHP: 58.5,     // 1 USD = 58.5 PHP
  VND: 25400.0,  // 1 USD = 25,400 VND
  NZD: 1.65,
  INR: 83.5,
  BRL: 5.45,
  MXN: 18.2,
  SEK: 10.5,
  NOK: 10.7,
  DKK: 6.85,
  PLN: 3.98,
  TRY: 33.0,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.385,
  ILS: 3.75,
  ZAR: 18.1,
};

/**
 * Get rate to USD for a given currency code. Defaults to 1.0 if not listed.
 */
export function getRateToUSD(currency: CurrencyCode): number {
  return DEFAULT_RATES_TO_USD[currency] || 1.0;
}

/**
 * Get exchange rate: How many units of `to` per 1 unit of `from`.
 * Formula: (units of TO per USD) / (units of FROM per USD)
 */
export function getExchangeRate(from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return 1;
  const fromToUsd = getRateToUSD(from);
  const toToUsd = getRateToUSD(to);
  if (fromToUsd === 0) return 1;
  return toToUsd / fromToUsd;
}

/**
 * Convert an amount from one currency to another.
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to || amount === 0) return amount;
  const rate = getExchangeRate(from, to);
  return amount * rate;
}

/**
 * Formats a readable pair exchange rate string (e.g. "1 JPY ≈ 0.23 THB" or "1 USD ≈ 35.50 THB")
 */
export function formatExchangeRateString(
  from: CurrencyCode,
  to: CurrencyCode
): string {
  const rate = getExchangeRate(from, to);
  const toConfig = getCurrencyConfig(to);
  const decimals = rate < 0.01 ? 4 : rate < 1 ? 3 : toConfig.decimalDigits;
  return `1 ${from} ≈ ${rate.toFixed(decimals)} ${to}`;
}

/**
 * Safely resolves the goal currency or falls back to user settings currency.
 */
export function getEffectiveGoalCurrency(
  goalCurrency: CurrencyCode | undefined,
  fallbackBaseCurrency: CurrencyCode = 'USD'
): CurrencyCode {
  return goalCurrency || fallbackBaseCurrency;
}
