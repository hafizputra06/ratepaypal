PRD: Web Converter Rate USD ke IDR (PayPal Theme)

1. Ringkasan Produk
   Aplikasi web berbasis Next.js yang mengkonversi mata uang USD ke IDR secara real-time dengan skema potongan rate sebesar Rp 600 dari rate pasar asli. Tampilan antarmuka mengusung estetika khas PayPal yang bersih, modern, dan responsif di layar mobile. Sumber data rate asli disesuaikan khusus menggunakan API dari https://exchangerate.fun/.

2. Fitur Utama
   Real-time Exchange Rate: Mengambil kurs terkini USD ke IDR khusus dari API exchangerate.fun.

Formula Potongan Otomatis: Rate yang dipakai sistem adalah rate asli dari exchangerate.fun dikurangi Rp 600 (contoh: rate asli 17.500 dikurangi 600 menjadi 16.900 IDR).

Kalkulator Dua Arah: Mengonversi nilai USD ke IDR maupun kalkulasi balik dari IDR ke USD berdasarkan rate efektif.

Rincian Transparansi Kurs: Menampilkan perincian rate pasar asli, nilai potongan Rp 600, dan rate akhir yang dipakai.

Antarmuka Responsif ala PayPal: Menggunakan skema warna khas PayPal (navy, biru terang, latar abu) dengan sudut rounded yang halus.

Caching Strategy Next.js: Optimasi pemanggilan API eksternal exchangerate.fun agar pemrosesan data tetap cepat dan efisien.

3. Spesifikasi Teknis dan Stack
   Framework: Next.js (App Router, React, Tailwind CSS)

Styling: Tailwind CSS dengan skema warna PayPal

State Management: React useState dan useMemo

Integrasi API Kurs:

Provider Tunggal: https://exchangerate.fun/

Endpoint: Fetch data kurs USD ke IDR secara langsung melalui server-side route.

4. Alur Kerja Data dan Perhitungan
   Pengguna memasukkan nominal USD, misalnya 100 USD.

Sistem memanggil API route Next.js /api/rate.

API serverless Next.js melakukan fetch data kurs terbaru dari https://exchangerate.fun/.

Sistem memperoleh rate asli (contoh: 1 USD = Rp 17.500).

Sistem menghitung Rate Efektif: 17.500 - 600 = 16.900 IDR.

Sistem menampilkan hasil akhir: 100 x 16.900 = Rp 1.690.000.

Tampilan menyertakan perincian total potongan (100 x 600 = Rp 60.000).

5. Penanganan Error dan Caching Strategy
   Menggunakan strategi revalidasi fetch pada Next.js agar panggilan ke exchangerate.fun efisien.

Penanganan error fallback jika endpoint exchangerate.fun mengalami kendala response atau server timeout.
