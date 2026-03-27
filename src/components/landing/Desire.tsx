import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const items = [
  'Semua transaksi tercatat otomatis cukup tap layar. Gak perlu tulis manual, gak perlu hitung sendiri.',
  'Satu aplikasi yang langsung kasih tau omzet hari ini, laba kotor, produk terlaris, dan uangnya kemana aja - real-time.',
  'Stok produk & bahan baku terupdate otomatis setiap ada penjualan. Dapat alert sebelum kehabisan.',
  'Tau persis berapa HPP, margin, dan profit bersih setiap produk. Ada kalkulator simulasi harga.',
];

export default function Desire() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-14">
      <p className="text-emerald-400 text-sm text-center">Yang Sebenarnya Anda Butuhkan</p>
      <h3 className="text-3xl md:text-4xl font-bold text-white text-center mt-2">MUNGKIN INI YANG ANDA INGINKAN</h3>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((text) => (
          <div key={text} className="rounded-xl p-5 border border-emerald-500/20 bg-emerald-500/[0.05] flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-base text-gray-300">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

