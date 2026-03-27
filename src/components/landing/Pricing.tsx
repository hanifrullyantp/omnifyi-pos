import React from 'react';

type Props = {
  onChooseMonthly: () => void;
  onChooseLifetime: () => void;
};

export default function Pricing({ onChooseMonthly, onChooseLifetime }: Props) {
  return (
    <section id="harga" className="bg-[#111827]">
      <div className="max-w-6xl mx-auto px-5 py-14">
        <h3 className="text-3xl md:text-4xl font-bold text-white text-center">PILIH PAKET INVESTASI ANDA</h3>
        <p className="text-gray-400 text-center mt-2">Mulai kelola usaha dengan cerdas hari ini.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 md:p-8">
            <p className="text-white font-semibold">Paket Bulanan</p>
            <p className="mt-2 text-3xl font-bold text-white">Rp 79.000 <span className="text-sm text-gray-400 font-medium">/ Bulan</span></p>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li>✓ Akses semua fitur selama 1 bulan</li><li>✓ Unlimited transaksi</li><li>✓ Multi-kasir & multi-outlet</li><li>✓ Dashboard & laporan lengkap</li><li>✓ Export PDF & Excel</li><li>✓ Support via chat</li>
            </ul>
            <button onClick={onChooseMonthly} className="mt-5 w-full py-3 rounded-xl border border-white/20 text-white hover:bg-white/10">Pilih Paket</button>
          </div>
          <div className="relative overflow-hidden bg-emerald-500/[0.08] border-2 border-emerald-500/40 rounded-2xl p-6 md:p-8">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">⭐ BEST VALUE</div>
            <p className="text-white font-semibold">Paket Lifetime</p>
            <p className="mt-2 text-3xl font-bold text-white">Rp 349.000 <span className="text-sm text-emerald-400 font-medium">/ Seumur Hidup</span></p>
            <p className="mt-1 text-xs text-emerald-400">Hemat Rp 599.000+ dibanding langganan tahunan</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-200">
              <li>✓ Akses aplikasi seumur hidup</li><li>✓ Unlimited transaksi & outlet</li><li>✓ Semua fitur premium</li><li>✓ Update fitur gratis selamanya</li><li>✓ Support prioritas</li><li>✓ Hak affiliasi</li>
            </ul>
            <button onClick={onChooseLifetime} className="mt-5 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/25">Pilih Paket Lifetime -&gt;</button>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500 text-center">🔒 Garansi 7 hari uang kembali · 💳 Pembayaran aman</p>
      </div>
    </section>
  );
}

