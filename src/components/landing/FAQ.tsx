import React, { useState } from 'react';

const items = [
  ['Apakah data usaha saya aman?', 'Ya, aman. Data disimpan terenkripsi dengan backup otomatis.'],
  ['Apakah bisa dipakai offline?', 'Bisa. Tetap transaksi saat internet mati, auto sync saat online kembali.'],
  ['Berapa banyak outlet & kasir yang bisa dikelola?', 'Tidak terbatas untuk outlet dan kasir.'],
  ['Apakah bisa cetak struk?', 'Bisa, thermal Bluetooth 58mm/80mm dan bisa share digital.'],
  ['Apa bedanya dengan aplikasi kasir lain?', 'Omnifyi POS gabungkan kasir, stok, HPP, keuangan, planner, laporan dalam satu app.'],
  ['Apakah cocok untuk yang baru mulai usaha?', 'Sangat cocok, UI sederhana dan laporan otomatis.'],
  ['Bagaimana kalau saya butuh bantuan?', 'Support via WhatsApp/email, plus panduan di dalam aplikasi.'],
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="max-w-4xl mx-auto px-5 py-14">
      <h3 className="text-3xl md:text-4xl font-bold text-white text-center">PERTANYAAN YANG SERING DITANYAKAN</h3>
      <p className="text-gray-400 text-center mt-2">Beberapa hal yang paling sering ditanyain calon pengguna sebelum pakai Omnifyi POS.</p>
      <div className="mt-8 space-y-3">
        {items.map((item, i) => (
          <div key={item[0]} className="rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left px-4 py-4 text-white font-medium">{item[0]}</button>
            {open === i && <p className="px-4 pb-4 text-sm text-gray-400">{item[1]}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

