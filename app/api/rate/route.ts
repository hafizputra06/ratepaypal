import { NextResponse } from "next/server";
import {
  API_CACHE_REVALIDATE,
  FALLBACK_MARKET_RATE,
  RATE_FETCH_URL,
} from "@/lib/rate";

export const revalidate = 3600;
export const runtime = "nodejs";

interface ExchangeRateResponse {
  base?: string;
  rates?: Record<string, number>;
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(RATE_FETCH_URL, {
      signal: controller.signal,
      next: { revalidate: API_CACHE_REVALIDATE },
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`exchangerate.fun responded with ${res.status}`);
    }

    const data = (await res.json()) as ExchangeRateResponse;

    if (!data.rates || typeof data.rates.IDR !== "number") {
      throw new Error("IDR rate missing from response");
    }

    const marketRate = data.rates.IDR;

    return NextResponse.json({
      ok: true,
      marketRate,
      effectiveRate: marketRate - 600,
      fee: 600,
      source: data.base ?? "USD",
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/rate] fetch exchangerate.fun failed:", err);
    return NextResponse.json(
      {
        ok: false,
        marketRate: FALLBACK_MARKET_RATE,
        effectiveRate: FALLBACK_MARKET_RATE - 600,
        fee: 600,
        source: "USD",
        updatedAt: new Date().toISOString(),
        fallback: true,
        error:
          "Gagal mengambil kurs dari exchangerate.fun. Menggunakan kurs cadangan.",
      },
      { status: 200 }
    );
  }
}
