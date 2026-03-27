import React from 'react';
import { Check } from 'lucide-react';

const points = [
  'Mencatat transaksi secepat 3 detik. Tap produk, pilih pembayaran, selesai.',
  'Melihat kondisi bisnis real-time lewat dashboard yang jelas dan mudah dibaca.',
  'Menghitung HPP & margin setiap produk secara otomatis lewat kalkulator bahan baku.',
  'Kelola kasir, shift, stok, bahan baku, keuangan, hutang-piutang, sampai laporan laba rugi.',
];

export default function ProductIntro() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-14 text-center">
      <p className="text-emerald-400 text-sm">Solusi Lengkap</p>
      <h3 className="text-3xl md:text-5xl font-bold mt-2">
        <span className="text-white">KENDALIKAN USAHA ANDA DENGAN</span>
        <br />
        <span className="text-emerald-400">OMNIFYI POS</span>
      </h3>
      <p className="mt-4 text-base text-gray-400 max-w-3xl mx-auto">
        Omnifyi POS adalah aplikasi kasir & manajemen bisnis lengkap yang membantu UMKM Indonesia.
      </p>
      <div className="mt-8 max-w-2xl mx-auto space-y-4 text-left">
        {points.map((p) => (
          <div key={p} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-gray-300">{p}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-gray-500 italic">Semua dalam satu aplikasi. Bisa offline. Bisa dari HP. Gak perlu laptop.</p>
    </section>
  );
}

