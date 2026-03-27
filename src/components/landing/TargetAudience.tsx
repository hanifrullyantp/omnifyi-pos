import React from 'react';

const items = [
  ['☕', 'Kedai Kopi & Kafe', 'Kelola menu, topping, stok bahan kopi, sampai shift barista.'],
  ['🍽️', 'Warung Makan & Restoran', 'Catat pesanan cepat, hitung HPP menu, pantau bahan dapur.'],
  ['🛒', 'Toko Retail & Kelontong', 'Scan barcode, kelola SKU, pantau stok real-time.'],
  ['🏭', 'Home Industry', 'Hitung HPP produksi, kelola bahan baku, simulasi margin.'],
  ['🧁', 'Bisnis Kuliner & Catering', 'Catat pesanan, hitung bahan per porsi, pantau profit menu.'],
  ['💼', 'Usaha Jasa & Freelancer', 'Catat pemasukan-pengeluaran dan kelola invoice klien.'],
];

export default function TargetAudience() {
  return (
    <section className="bg-[#111827]">
      <div className="max-w-6xl mx-auto px-5 py-14">
        <h3 className="text-3xl md:text-4xl font-bold text-white text-center">UNTUK SIAPA OMNIFYI POS?</h3>
        <p className="text-gray-400 text-center mt-2">Dirancang khusus untuk berbagai jenis UMKM Indonesia</p>
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((x) => (
            <div key={x[1]} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-3xl mb-3">{x[0]}</p>
              <p className="text-base font-semibold text-white">{x[1]}</p>
              <p className="text-sm text-gray-400 mt-2">{x[2]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

