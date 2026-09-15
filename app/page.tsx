import Converter from "@/components/Converter";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-8 sm:py-14">
      <header className="mb-8 max-w-xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-paypal-mist bg-white px-4 py-1.5 text-xs font-semibold text-paypal-blue shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-paypal-sky" />
          Real-time USD → IDR
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-paypal-navy sm:text-4xl">
          Konversi <span className="text-paypal-blue">USD</span> ke{" "}
          <span className="text-paypal-sky">IDR</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
          Kurs pasar asli dari exchangerate.fun, dipotong otomatis Rp 600.
          Transparan, cepat, dan tampil rapi di layar mobile.
        </p>
      </header>

      <Converter />
    </main>
  );
}
