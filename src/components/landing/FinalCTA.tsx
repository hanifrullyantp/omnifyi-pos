import React from 'react';

type Props = { onStart: () => void };

export default function FinalCTA({ onStart }: Props) {
  return (
    <section className="px-5 py-14">
      <div className="max-w-5xl mx-auto rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-transparent p-8 md:p-12 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-white">Anda sudah bekerja keras membangun usaha.</h3>
        <p className="mt-3 text-lg text-gray-300">Biarkan Omnifyi POS membantu Anda mengelola, memahami, dan mengembangkannya.</p>
        <p className="mt-3 text-base text-gray-400">Dari kasir cepat, stok terpantau, sampai laporan keuangan siap pakai - semua dalam satu aplikasi.</p>
        <p className="mt-4 text-lg text-emerald-400 font-semibold">Beli 1x, Pakai Selamanya</p>
        <button onClick={onStart} className="mt-6 px-10 py-4 rounded-xl text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/25">Mulai Sekarang -&gt;</button>
      </div>
    </section>
  );
}

