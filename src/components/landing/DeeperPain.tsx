import React from 'react';
import { X } from 'lucide-react';

const lines = [
  ['"Kok uangnya segini doang?"', ' - padahal rasanya rame banget, tapi gak ada data yang bisa nunjukin kemana uangnya pergi.'],
  ['Stok sering kehabisan tanpa disadari.', ' Pelanggan dateng, barangnya kosong. Bahan baku habis pas lagi rame. Gak ada alert, gak ada sistem.'],
  ['Kasir gak terkontrol dan gak tercatat.', ' Siapa yang jaga, jam berapa masuk, transaksi apa aja yang diproses - semua berdasarkan kepercayaan doang.'],
  ['Mau bikin laporan keuangan tapi gak tau caranya.', ' Akhirnya cuma ngandelin feeling, bukan data. Pajak? Laba rugi? Cashflow? Blank.'],
  ['Mau scale up, buka cabang, tapi data usaha pertama aja masih berantakan.', ' Gimana mau berkembang kalau fondasi datanya aja gak kuat?'],
];

export default function DeeperPain() {
  return (
    <section className="bg-[#111827]">
      <div className="max-w-4xl mx-auto px-5 py-14">
        <h3 className="text-2xl md:text-3xl font-bold text-white text-center">ATAU ANDA JUGA MENGALAMI HAL INI?</h3>
        <div className="mt-8 space-y-5">
          {lines.map((line) => (
            <div key={line[0]} className="flex items-start gap-4">
              <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-base text-gray-300"><span className="text-white font-medium">{line[0]}</span>{line[1]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

