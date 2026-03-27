import React from 'react';

const items = [
  ['1', 'Data Aman & Tersinkron', 'Data aman, backup otomatis, multi-device dan multi-outlet.'],
  ['2', 'Multi Usaha & Multi Kasir', '1 akun untuk banyak usaha dan kasir dengan PIN masing-masing.'],
  ['3', 'Dashboard & Grafik Interaktif', 'Pantau omzet, laba, stok, kasir aktif, produk terlaris.'],
  ['4', 'Kalkulator HPP Otomatis', 'Masukkan komposisi bahan, HPP dan margin dihitung real-time.'],
  ['5', 'Cetak Laporan PDF & Excel', 'Rekap transaksi, cashflow, laba rugi siap unduh.'],
  ['6', 'Offline First / PWA', 'Tetap bisa jualan walau internet mati, auto sync saat online.'],
];

export default function FeatureHighlights() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-14">
      <h3 className="text-3xl md:text-4xl font-bold text-white text-center">Kelola Usaha Dari Genggaman</h3>
      <p className="text-gray-400 text-center mt-2">Kemudahan menjalankan bisnis dengan segudang fitur Omnifyi POS</p>
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((i) => (
          <div key={i[1]} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-3xl font-bold text-emerald-500/30 mb-3">{i[0]}</p>
            <p className="text-base font-semibold text-white">{i[1]}</p>
            <p className="text-sm text-gray-400 mt-2">{i[2]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

