import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const items = [
  'Transaksi lebih cepat, antrian berkurang. Pelanggan senang, kasir gak pusing.',
  'Tau persis laba bersih per hari, minggu, dan bulan langsung dari dashboard.',
  'Gak pernah lagi kehabisan stok dadakan karena sistem alert sebelum habis.',
  'Kasir terkontrol, setiap transaksi tercatat siapa yang input dan kapan.',
  'Keputusan bisnis berdasarkan data, bukan feeling semata.',
  'Lebih percaya diri untuk scale up karena laporan rapi dan profesional.',
];

export default function AfterUsing() {
  return (
    <section className="bg-[#111827]">
      <div className="max-w-6xl mx-auto px-5 py-14">
        <h3 className="text-3xl md:text-4xl font-bold text-white text-center">PENGALAMAN SETELAH PAKAI OMNIFYI POS</h3>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((x) => (
            <div key={x} className="flex items-start gap-4 p-5 bg-emerald-500/[0.04] rounded-xl border border-emerald-500/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-gray-300">{x}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

