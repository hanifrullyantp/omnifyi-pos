import React from 'react';
import { motion } from 'framer-motion';

const items = [
  ['😫', 'Hitung Manual Terus', 'Tiap transaksi masih dihitung manual pakai kalkulator. Salah pencet, salah hitung, rugi sendiri.'],
  ['📝', 'Catatan Berantakan', 'Masih pakai buku catatan dan nota kertas. Akhir bulan bingung rekap, data hilang, atau gak lengkap.'],
  ['🤷', 'Omzet Besar, Profit Hilang', 'Rasanya rame, omzet banyak, tapi pas dihitung kok untungnya gak ada? Uangnya kemana?'],
  ['😵', 'Gak Paham HPP & Margin', 'Gak tau harga pokok produk sebenarnya berapa, asal pasang harga, gak tau margin berapa persen.'],
];

export default function PainPoints() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-14">
      <p className="text-emerald-400 text-sm uppercase tracking-widest text-center">Masalah Umum UMKM</p>
      <h3 className="text-3xl md:text-4xl font-bold text-white text-center mt-2">MUNGKIN ANDA MENGALAMI INI</h3>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <motion.div key={item[1]} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }} className="rounded-xl p-6 border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]">
            <p className="text-4xl mb-4">{item[0]}</p>
            <p className="text-base font-semibold text-white">{item[1]}</p>
            <p className="text-sm text-gray-400 mt-2">{item[2]}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

