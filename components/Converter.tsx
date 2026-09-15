"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
} from "motion/react";
import {
  RATE_FEE,
  caretAfterFormat,
  formatAmountInput,
  formatIDR,
  formatNumber,
  parseLocalizedAmount,
} from "@/lib/rate";
import LogoMark from "./Logo";

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

const EASE = [0.22, 1, 0.36, 1] as const;

/** Angka animasi terisolasi: tick spring hanya render komponen ini, input tidak ikut. */
const AnimatedIDR = memo(function AnimatedIDR({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 170, damping: 26 });
  const [display, setDisplay] = useState(value);

  useMotionValueEvent(spring, "change", (v) => setDisplay(v));

  useEffect(() => {
    if (reduce) {
      mv.jump(value);
      setDisplay(value);
    } else {
      mv.set(value);
    }
  }, [value, mv, reduce]);

  return <>{formatIDR(display)}</>;
});

const AnimatedUSD = memo(function AnimatedUSD({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 170, damping: 26 });
  const [display, setDisplay] = useState(value);

  useMotionValueEvent(spring, "change", (v) => setDisplay(v));

  useEffect(() => {
    if (reduce) {
      mv.jump(value);
      setDisplay(value);
    } else {
      mv.set(value);
    }
  }, [value, mv, reduce]);

  return <>${formatNumber(display)}</>;
});

export default function Converter() {
  const [rate, setRate] = useState<ApiRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("100");
  const [direction, setDirection] = useState<Direction>("USD_TO_IDR");
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const el = e.target;
      const raw = el.value;
      const caret = el.selectionStart ?? raw.length;
      const sigCount = (raw.slice(0, caret).match(/[0-9.,]/g) || []).length;
      const formatted = formatAmountInput(raw);
      setAmount(formatted);
      const pos = caretAfterFormat(formatted, sigCount);
      requestAnimationFrame(() => {
        inputRef.current?.setSelectionRange(pos, pos);
      });
    },
    []
  );

  const numericAmount = useMemo(() => parseLocalizedAmount(amount), [amount]);

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
      <motion.div
        layout
        transition={{ duration: 0.4, ease: EASE }}
        className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-paypal-mist transition-shadow duration-500 hover:shadow-lift"
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-paypal-navy to-paypal-dark px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex items-center gap-2">
            <LogoMark size={30} className="shrink-0 rounded-lg shadow-sm" />
            <span className="text-lg font-extrabold italic tracking-tight">
              <span className="text-white">Pay</span>
              <span className="text-paypal-sky">Pal</span>
            </span>
            <span className="text-paypal-mist/70">|</span>
            <span className="text-sm font-medium text-paypal-mist">
              Rate Converter
            </span>
          </div>
          <motion.button
            onClick={loadRate}
            disabled={loading}
            whileTap={{ scale: 0.93 }}
            whileHover={loading ? undefined : { scale: 1.04 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-white/20 disabled:opacity-50"
          >
            <motion.span
              animate={loading ? { rotate: 360 } : { rotate: 0 }}
              transition={
                loading
                  ? { duration: 0.9, repeat: Infinity, ease: "linear" }
                  : { duration: 0.3 }
              }
              className="inline-block"
            >
              ↻
            </motion.span>
            {loading ? "Memuat..." : "Refresh"}
          </motion.button>
        </div>

        <div className="p-5 sm:p-7">
          <div className="relative mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-paypal-smoke p-1.5">
            {(
              [
                { id: "USD_TO_IDR", label: "USD ke IDR" },
                { id: "IDR_TO_USD", label: "IDR ke USD" },
              ] as const
            ).map((tab) => {
              const active = direction === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDirection(tab.id)}
                  className={`relative rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-300 ${
                    active
                      ? "text-paypal-navy"
                      : "text-slate-500 hover:text-paypal-blue"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="dir-pill"
                      transition={{ duration: 0.35, ease: EASE }}
                      className="absolute inset-0 rounded-xl bg-white shadow-sm"
                    />
                  )}
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-600">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={direction}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="block"
                >
                  {isUsdToIdr ? "Jumlah dalam USD" : "Jumlah dalam IDR"}
                </motion.span>
              </AnimatePresence>
            </label>
          </div>
          <motion.div
            layout
            transition={{ duration: 0.3, ease: EASE }}
            className="flex items-center rounded-2xl border-2 border-paypal-mist bg-white px-4 py-3 transition-all duration-300 focus-within:-translate-y-0.5 focus-within:border-paypal-blue focus-within:shadow-lift focus-within:ring-4 focus-within:ring-paypal-blue/10"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isUsdToIdr ? "usd" : "idr"}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="mr-3 select-none rounded-lg bg-paypal-smoke px-2.5 py-1 text-sm font-bold text-paypal-navy"
              >
                {isUsdToIdr ? "$" : "Rp"}
              </motion.span>
            </AnimatePresence>
            <input
              ref={inputRef}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={amount}
              onChange={handleAmountChange}
              placeholder="0"
              className="tabular w-full bg-transparent text-2xl font-bold text-slate-800 outline-none placeholder:text-slate-300"
            />
            <span className="ml-2 select-none text-sm font-semibold text-slate-400">
              {isUsdToIdr ? "USD" : "IDR"}
            </span>
          </motion.div>

          <AnimatePresence initial={false}>
            {isUsdToIdr && (
              <motion.div
                key="quick"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((value, i) => (
                    <motion.button
                      key={value}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04, ease: EASE }}
                      whileTap={{ scale: 0.92 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() =>
                        setAmount(formatAmountInput(String(value)))
                      }
                      className="rounded-full border border-paypal-mist bg-white px-3 py-1 text-xs font-semibold text-paypal-blue transition-colors duration-300 hover:border-paypal-blue hover:bg-paypal-smoke"
                    >
                      ${value}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            layout
            transition={{ duration: 0.4, ease: EASE }}
            className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-paypal-blue to-paypal-sky p-5 text-white shadow-inner"
          >
            <AnimatePresence>
              {loading && (
                <motion.div
                  key="shimmer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="shimmer-line pointer-events-none absolute inset-0"
                />
              )}
            </AnimatePresence>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
              {isUsdToIdr ? "Anda menerima" : "Total dibutuhkan"}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={`${direction}-${loading && !rate}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="tabular mt-1 break-words text-3xl font-extrabold sm:text-4xl"
              >
                {loading && !rate ? (
                  "Menghitung..."
                ) : isUsdToIdr ? (
                  <AnimatedIDR value={result.converted} />
                ) : (
                  <AnimatedUSD value={result.converted} />
                )}
              </motion.p>
            </AnimatePresence>
            <p className="tabular mt-2 text-xs text-white/80">
              1 USD = {rate ? formatIDR(rate.effectiveRate) : "..."} (kurs
              efektif)
            </p>
          </motion.div>

          <AnimatePresence initial={false}>
            {rate?.fallback && (
              <motion.div
                key="fallback"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  {rate.error ??
                    "Kurs live tidak tersedia. Menampilkan kurs cadangan."}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            layout
            transition={{ duration: 0.35, ease: EASE }}
            className="mt-6 rounded-2xl border border-paypal-mist"
          >
            <div className="border-b border-paypal-mist px-4 py-3">
              <h2 className="text-sm font-bold text-paypal-navy">
                Rincian Transparansi Kurs
              </h2>
            </div>
            <dl className="divide-y divide-paypal-mist text-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-slate-500">Rate pasar asli</dt>
                <dd className="tabular font-semibold text-slate-800">
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
                <dd className="tabular font-semibold text-rose-600">
                  {rate ? `-${formatIDR(rate.fee)}` : "..."}
                </dd>
              </div>
              <div className="flex items-center justify-between bg-paypal-smoke/60 px-4 py-3">
                <dt className="font-semibold text-paypal-navy">Rate efektif</dt>
                <dd className="tabular font-bold text-paypal-navy">
                  {rate ? formatIDR(rate.effectiveRate) : "..."}
                </dd>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-slate-500">Nilai di rate pasar</dt>
                <dd className="tabular font-semibold text-slate-800">
                  {isUsdToIdr ? (
                    <AnimatedIDR value={result.marketValue} />
                  ) : (
                    <AnimatedUSD value={result.marketValue} />
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-slate-500">Total potongan</dt>
                <dd className="tabular font-semibold text-rose-600">
                  {isUsdToIdr ? (
                    <>
                      -<AnimatedIDR value={result.totalFee} />
                    </>
                  ) : (
                    <>
                      -<AnimatedUSD value={result.totalFee} />
                    </>
                  )}
                </dd>
              </div>
            </dl>
          </motion.div>

          <p className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Sumber: {rate ? rate.source : "kurs pasar"} · diperbarui{" "}
              {updatedLabel} WIB · cache 1 jam
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          </p>
        </div>
      </motion.div>

      <p className="mt-5 text-center text-xs text-slate-400">
        Demo konverter dengan skema potongan rate Rp 600. Bukan produk resmi
        PayPal.
      </p>
    </div>
  );
}
