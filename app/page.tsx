"use client";

import { motion } from "motion/react";
import Converter from "@/components/Converter";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-8 sm:py-14">
      <motion.header
        variants={container}
        initial="hidden"
        animate="show"
        className="mb-8 max-w-xl text-center"
      >
        <motion.div
          variants={item}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-paypal-mist bg-white px-4 py-1.5 text-xs font-semibold text-paypal-blue shadow-sm"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-paypal-sky" />
          Real-time USD → IDR
        </motion.div>
        <motion.h1
          variants={item}
          className="text-3xl font-extrabold tracking-tight text-paypal-navy sm:text-4xl"
        >
          Konversi <span className="text-paypal-blue">USD</span> ke{" "}
          <span className="text-paypal-sky">IDR</span>
        </motion.h1>
        <motion.p
          variants={item}
          className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base"
        >
          Kurs pasar real-time, dipotong otomatis Rp 600. Transparan,
          cepat, dan tampil rapi di layar mobile.
        </motion.p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="w-full max-w-xl"
      >
        <Converter />
      </motion.div>
    </main>
  );
}
