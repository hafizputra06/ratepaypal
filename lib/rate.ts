export const RATE_FEE = 600;

export const RATE_FETCH_URL = "https://api.exchangerate.fun/latest?base=USD";

export interface RateProvider {
  name: string;
  url: string;
}

export const RATE_PROVIDERS: RateProvider[] = [
  { name: "exchangerate.fun", url: "https://api.exchangerate.fun/latest?base=USD" },
  { name: "open.er-api.com", url: "https://open.er-api.com/v6/latest/USD" },
  { name: "frankfurter.app", url: "https://api.frankfurter.app/latest?from=USD&to=IDR" },
];

export const API_CACHE_REVALIDATE = 3600;

export const FALLBACK_MARKET_RATE = 17650;

export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatCompactIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
