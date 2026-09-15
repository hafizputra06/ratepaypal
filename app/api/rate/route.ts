import { NextResponse } from "next/server";
import {
  API_CACHE_REVALIDATE,
  FALLBACK_MARKET_RATE,
  RATE_PROVIDERS,
} from "@/lib/rate";

export const revalidate = 3600;
export const runtime = "nodejs";

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: API_CACHE_REVALIDATE },
      headers: {
        Accept: "application/json",
        "User-Agent": "ratepaypal/1.0 (+https://github.com/ratepaypal)",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractIdr(provider: string, data: unknown): number | null {
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;
  // exchangerate.fun: { rates: { IDR } } | open.er-api: { rates: { IDR } }
  const rates = d.rates as Record<string, unknown> | undefined;
  if (rates && typeof rates.IDR === "number") return rates.IDR;
  // open.er-api legacy shape uses same `rates` key (handled above)
  void provider;
  return null;
}

export async function GET() {
  const errors: string[] = [];

  for (const provider of RATE_PROVIDERS) {
    try {
      const res = await fetchWithTimeout(provider.url, 8000);

      if (!res.ok) {
        throw new Error(`${provider.name} responded with ${res.status}`);
      }

      const data = (await res.json()) as unknown;
      const marketRate = extractIdr(provider.name, data);

      if (typeof marketRate !== "number" || !Number.isFinite(marketRate)) {
        throw new Error(`IDR rate missing from ${provider.name}`);
      }

      return NextResponse.json({
        ok: true,
        marketRate,
        effectiveRate: marketRate - 600,
        fee: 600,
        source: provider.name,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  console.error("[api/rate] all providers failed:", errors);

  return NextResponse.json(
    {
      ok: false,
      marketRate: FALLBACK_MARKET_RATE,
      effectiveRate: FALLBACK_MARKET_RATE - 600,
      fee: 600,
      source: "fallback",
      updatedAt: new Date().toISOString(),
      fallback: true,
      error:
        "Gagal mengambil kurs dari exchangerate.fun. Menggunakan kurs cadangan.",
      detail: errors.join(" | "),
    },
    { status: 200 }
  );
}
