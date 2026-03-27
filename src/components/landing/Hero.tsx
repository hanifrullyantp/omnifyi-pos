import React from 'react';
import { motion } from 'framer-motion';

type Props = {
  onTryClick: () => void;
  onDemoClick: () => void;
};

export default function Hero({ onTryClick, onDemoClick }: Props) {
  return (
    <section className="max-w-6xl mx-auto px-5 py-14 md:py-20 text-center relative">
      <div className="absolute -top-20 -right-10 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
      <p className="text-emerald-400 text-sm">Untuk pemilik UMKM, warung, kedai, dan bisnis kecil di Indonesia</p>
      <h1 className="mt-4 text-4xl md:text-6xl font-bold text-white leading-tight">
        Masih Pakai Kalkulator
        <br />
        &amp; Buku Catatan untuk Jualan?
      </h1>
      <h2 className="mt-4 text-2xl md:text-4xl font-bold text-emerald-400 leading-tight">
        Kelola Penjualan, Stok &amp;
        <br />
        Keuangan Usaha dalam
        <br />
        Satu Aplikasi Cerdas
      </h2>
      <p className="mt-5 text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
        Cukup tap layar -&gt; Transaksi tercatat, Stok terupdate, Laporan keuangan siap. Tanpa ribet, tanpa mahal.
      </p>
      <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onTryClick} className="px-8 py-4 rounded-xl text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">Coba Gratis Sekarang -&gt;</button>
        <button onClick={onDemoClick} className="px-6 py-4 rounded-xl border border-white/20 text-white">▶ Lihat Demo</button>
      </div>
      <p className="mt-4 text-sm text-emerald-400 font-medium">Beli 1x, Pakai Selamanya</p>
      <p className="text-xs text-gray-500">✓ Bisa dipakai offline · ✓ PWA untuk semua device</p>
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="mt-8 max-w-4xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-emerald-500/10">
        <div className="h-64 md:h-80 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-gray-400">Dashboard Preview / Screenshot</div>
      </motion.div>
    </section>
  );
}

