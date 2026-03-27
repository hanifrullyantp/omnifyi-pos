import React, { useState } from 'react';

const tabs = ['POS Screen', 'Dashboard', 'Manajemen Produk', 'Laporan Keuangan'] as const;

export default function Preview() {
  const [active, setActive] = useState<typeof tabs[number]>('POS Screen');
  return (
    <section className="max-w-6xl mx-auto px-5 py-14">
      <h3 className="text-3xl md:text-4xl font-bold text-white text-center">LIHAT OMNIFYI POS BERAKSI</h3>
      <p className="text-gray-400 text-center mt-2">Preview tampilan aplikasi yang akan Anda gunakan setiap hari</p>
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActive(t)} className={`px-4 py-2 rounded-lg text-sm ${active === t ? 'bg-emerald-500 text-white' : 'border border-white/20 text-gray-300'}`}>{t}</button>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="h-64 md:h-80 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-gray-400">
          Screenshot Mockup - {active}
        </div>
        <p className="mt-3 text-sm text-gray-400 text-center">{active} menampilkan alur kerja yang cepat, jelas, dan mobile-friendly.</p>
      </div>
    </section>
  );
}

