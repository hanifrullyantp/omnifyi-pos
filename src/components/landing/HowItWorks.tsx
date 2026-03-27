import React from 'react';

const steps = [
  ['1', 'Setup Usaha & Produk', 'Daftar akun, isi profil usaha, tambahkan produk dan bahan baku.'],
  ['2', 'Mulai Jualan di Layar POS', 'Kasir login PIN, tap produk, pilih pembayaran, selesai.'],
  ['3', 'Pantau & Kelola dari Dashboard', 'Owner pantau omzet, stok, laporan, dan keputusan bisnis dari HP.'],
];

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="max-w-6xl mx-auto px-5 py-14">
      <h3 className="text-3xl md:text-4xl font-bold text-white text-center">CARA KERJA OMNIFYI POS DALAM 3 LANGKAH MUDAH</h3>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((s) => (
          <div key={s[1]} className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white text-xl font-bold flex items-center justify-center mx-auto">{s[0]}</div>
            <p className="text-lg font-semibold text-white mt-4">{s[1]}</p>
            <p className="text-sm text-gray-400 mt-2">{s[2]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

