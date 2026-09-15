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

const THOUSAND_DOT = /^\d{1,3}(\.\d{3})+$/;
const THOUSAND_COMMA = /^\d{1,3}(,\d{3})+$/;

/** Parse input localized: '.' ribuan, '.'/',' desimal -> number (desimal '.').
 *  Aturan: separator terakhir = desimal, KECUALI bagian setelahnya >3 digit
 *  (artinya user sedang mengetik lanjutan ribuan, mis. "1.0000" = 10000). */
export function parseLocalizedAmount(input: string): number {
  const s = input.replace(/\s/g, "");
  if (!s) return 0;
  const stripDotTail = (t: string): string => {
    if (THOUSAND_DOT.test(t)) return t.replace(/\./g, "");
    const idx = t.lastIndexOf(".");
    if (idx === -1) return t;
    const after = t.slice(idx + 1);
    if (after.length > 3) return t.replace(/\./g, "");
    return t.slice(0, idx).replace(/\./g, "") + "." + after.replace(/\./g, "");
  };
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  let normalized: string;
  if (hasDot && hasComma) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      normalized = s.replace(/\./g, "").replace(/,/g, ".");
    } else {
      normalized = stripDotTail(s.replace(/,/g, ""));
    }
  } else if (hasComma) {
    if (THOUSAND_COMMA.test(s) && (s.match(/,/g) || []).length > 1) {
      normalized = s.replace(/,/g, "");
    } else {
      const idx = s.lastIndexOf(",");
      const after = s.slice(idx + 1);
      if (after.length > 3) {
        normalized = s.replace(/,/g, "");
      } else {
        normalized =
          s.slice(0, idx).replace(/,/g, "") + "." + after.replace(/,/g, "");
      }
    }
  } else if (hasDot) {
    normalized = stripDotTail(s);
  } else {
    normalized = s;
  }
  normalized = normalized.replace(/[^0-9.]/g, "");
  const n = parseFloat(normalized);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Format saat mengetik: ribuan '.', desimal '.' (',' otomatis jadi '.').
 *  Ekor >3 digit dianggap lanjutan ribuan agar "10000" -> "10.000". */
export function formatAmountInput(value: string): string {
  let s = value.replace(/[^0-9.,]/g, "");
  if (!s) return "";
  // Pisahkan ribuan beruntun yang valid ("1.000.000" / "1,000,000")
  if (THOUSAND_DOT.test(s)) return s;
  if (THOUSAND_COMMA.test(s)) return s.replace(/,/g, ".");
  const splitTail = (t: string, sep: "." | ","): [string, string | null] => {
    const idx = t.lastIndexOf(sep);
    const after = t.slice(idx + 1).replace(/[^0-9]/g, "");
    if (after.length > 3) return [t.replace(/[.,]/g, ""), null];
    return [t.slice(0, idx).replace(/[.,]/g, ""), after];
  };
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  let intRaw = s;
  let decRaw: string | null = null;
  if (hasDot && hasComma) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      [intRaw, decRaw] = splitTail(s, ",");
    } else {
      [intRaw, decRaw] = splitTail(s.replace(/,/g, ""), ".");
    }
  } else if (hasComma) {
    [intRaw, decRaw] = splitTail(s, ",");
  } else if (hasDot) {
    [intRaw, decRaw] = splitTail(s, ".");
  }
  intRaw = intRaw.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
  const grouped =
    intRaw === "" ? (decRaw !== null ? "0" : "") : intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (decRaw === null) return grouped;
  return grouped + "." + decRaw;
}

/** Petakan posisi caret setelah format: hitung digit+separator sebelum caret. */
export function caretAfterFormat(formatted: string, sigCount: number): number {
  let c = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/[0-9.,]/.test(formatted[i])) c++;
    if (c >= sigCount) return i + 1;
  }
  return formatted.length;
}
