"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RATE_FEE, formatIDR, formatNumber } from "@/lib/rate";

type Direction = "USD_TO_IDR" | "IDR_TO_USD";

interface ApiRate {
  ok: boolean;
  marketRate: number;
  effectiveRate: number;
  fee: number;
  source: string;
  updatedAt: string;
  fallback?: boolean;
  error?: string;
}

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];

export default function Converter() {
  const [rate, setRate] = useState<ApiRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("100");
  const [direction, setDirection] = useState<Direction>("USD_TO_IDR");

  const loadRate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rate", { cache: "no-store" });
      const data: ApiRate = await res.json();
      setRate(data);
    } catch {
      setRate({
        ok: false,
        marketRate: 17650,
        effectiveRate: 17050,
        fee: RATE_FEE,
        source: "USD",
        updatedAt: new Date().toISOString(),
        fallback: true,
        error: "Koneksi ke server gagal. Menggunakan kurs cadangan.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRate();
  }, [loadRate]);

  const numericAmount = useMemo(() => {
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }, [amount]);

  const result = useMemo(() => {
    if (!rate) return { converted: 0, totalFee: 0, marketValue: 0 };
    if (direction === "USD_TO_IDR") {
      return {
        converted: numericAmount * rate.effectiveRate,
        totalFee: numericAmount * rate.fee,
        marketValue: numericAmount * rate.marketRate,
      };
    }
    const usd = rate.effectiveRate > 0 ? numericAmount / rate.effectiveRate : 0;
    return {
      converted: usd,
      totalFee: usd * rate.fee,
      marketValue: usd * rate.marketRate,
    };
  }, [rate, numericAmount, direction]);

  const isUsdToIdr = direction === "USD_TO_IDR";
  const updatedLabel = rate
    ? new Date(rate.updatedAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  return (
    <div className="w-full max-w-xl">
      <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-paypal-mist">
        <div className="flex items-center justify-between bg-gradient-to-r from-paypal-navy to-paypal-dark px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold italic tracking-tight">
              <span className="text-white">Pay</span>
              <span className="text-paypal-sky">Pal</span>
            </span>
            <span className="text-paypal-mist/70">|</span>
            <span className="text-sm font-medium text-paypal-mist">
              Rate Converter
            </span>
          </div>
          <button
            onClick={loadRate}
            disabled={loading}
            className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
          >
            {loading ? "Memuat..." : "Refresh"}
          </button>
        </div>

        <div className="p-5 sm:p-7">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-paypal-smoke p-1.5">
            <button
              onClick={() => setDirection("USD_TO_IDR")}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isUsdToIdr
                  ? "bg-white text-paypal-navy shadow-sm"
                  : "text-slate-500 hover:text-paypal-blue"
              }`}
            >
              USD ke IDR
            </button>
            <button
              onClick={() => setDirection("IDR_TO_USD")}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                !isUsdToIdr
                  ? "bg-white text-paypal-navy shadow-sm"
                  : "text-slate-500 hover:text-paypal-blue"
              }`}
            >
              IDR ke USD
            </button>
          </div>

          <label className="mb-2 block text-sm font-semibold text-slate-600">
            {isUsdToIdr ? "Jumlah dalam USD" : "Jumlah dalam IDR"}
          </label>
          <div className="flex items-center rounded-2xl border-2 border-paypal-mist bg-white px-4 py-3 transition focus-within:border-paypal-blue focus-within:ring-4 focus-within:ring-paypal-blue/10">
            <span className="mr-3 select-none rounded-lg bg-paypal-smoke px-2.5 py-1 text-sm font-bold text-paypal-navy">
              {isUsdToIdr ? "$" : "Rp"}
            </span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent text-2xl font-bold text-slate-800 outline-none placeholder:text-slate-300"
            />
            <span className="ml-2 select-none text-sm font-semibold text-slate-400">
              {isUsdToIdr ? "USD" : "IDR"}
            </span>
          </div>

          {isUsdToIdr && (
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  onClick={() => setAmount(String(value))}
                  className="rounded-full border border-paypal-mist bg-white px-3 py-1 text-xs font-semibold text-paypal-blue transition hover:border-paypal-blue hover:bg-paypal-smoke"
                >
                  ${value}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-2xl bg-gradient-to-br from-paypal-blue to-paypal-sky p-5 text-white shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
              {isUsdToIdr ? "Anda menerima" : "Total dibutuhkan"}
            </p>
            <p className="mt-1 break-words text-3xl font-extrabold sm:text-4xl">
              {loading && !rate
                ? "Menghitung..."
                : isUsdToIdr
                  ? formatIDR(result.converted)
                  : `$${formatNumber(result.converted)}`}
            </p>
            <p className="mt-2 text-xs text-white/80">
              1 USD ={" "}
              {rate ? formatIDR(rate.effectiveRate) : "..."} (kurs efektif)
            </p>
          </div>

          {rate?.fallback && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              {rate.error ??
                "Kurs live tidak tersedia. Menampilkan kurs cadangan."}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-paypal-mist">
            <div className="border-b border-paypal-mist px-4 py-3">
              <h2 className="text-sm font-bold text-paypal-navy">
                Rincian Transparansi Kurs
              </h2>
            </div>
            <dl className="divide-y divide-paypal-mist text-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-slate-500">Rate pasar asli</dt>
                <dd className="font-semibold text-slate-800">
                  {rate ? formatIDR(rate.marketRate) : "..."}
                </dd>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-slate-500">
                  Potongan rate
                  <span className="ml-1 rounded bg-paypal-smoke px-1.5 py-0.5 text-[11px] font-semibold text-paypal-blue">
                    -Rp {rate ? rate.fee : RATE_FEE}
                  </span>
                </dt>
                <dd className="font-semibold text-rose-600">
                  {rate ? `-${formatIDR(rate.fee)}` : "..."}
                </dd>
              </div>
              <div className="flex items-center justify-between bg-paypal-smoke/60 px-4 py-3">
                <dt className="font-semibold text-paypal-navy">Rate efektif</dt>
                <dd className="font-bold text-paypal-navy">
                  {rate ? formatIDR(rate.effectiveRate) : "..."}
                </dd>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-slate-500">
                  {isUsdToIdr ? "Nilai di rate pasar" : "Nilai di rate pasar"}
                </dt>
                <dd className="font-semibold text-slate-800">
                  {isUsdToIdr
                    ? formatIDR(result.marketValue)
                    : `$${formatNumber(result.marketValue)}`}
                </dd>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-slate-500">Total potongan</dt>
                <dd className="font-semibold text-rose-600">
                  {isUsdToIdr
                    ? `-${formatIDR(result.totalFee)}`
                    : `-$${formatNumber(result.totalFee)}`}
                </dd>
              </div>
            </dl>
          </div>

          <p className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Sumber: exchangerate.fun · diperbarui {updatedLabel} WIB · cache 1
              jam
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          </p>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-slate-400">
        Demo konverter dengan skema potongan rate Rp 600. Bukan produk resmi
        PayPal.
      </p>
    </div>
  );
}
