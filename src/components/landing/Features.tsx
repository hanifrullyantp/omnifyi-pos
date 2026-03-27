import React from 'react';
import { FlaskConical, LayoutDashboard, MonitorSmartphone, Package, TrendingUp, Users, Wallet, Wifi } from 'lucide-react';

const data = [
  { icon: MonitorSmartphone, title: 'Kasir / POS', desc: 'Transaksi cepat, support barcode scanner & cetak struk.' },
  { icon: Package, title: 'Manajemen Produk & Stok', desc: 'Kelola produk, kategori, dan alert stok menipis otomatis.' },
  { icon: FlaskConical, title: 'Bahan Baku & Kalkulator HPP', desc: 'Hitung HPP otomatis, margin jelas, bahan baku sinkron.' },
  { icon: LayoutDashboard, title: 'Dashboard Realtime', desc: 'Pantau omzet, transaksi, laba, stok, kasir aktif.' },
  { icon: Wallet, title: 'Keuangan Lengkap', desc: 'Cashflow, laba rugi, hutang-piutang, export Excel/PDF.' },
  { icon: TrendingUp, title: 'Business Planner', desc: 'Proyeksi profit, BEP, target vs aktual untuk scale up.' },
  { icon: Users, title: 'Manajemen Kasir & Shift', desc: 'Login PIN, absensi, history aktivitas, kontrol permission.' },
  { icon: Wifi, title: 'PWA & Offline First', desc: 'Tetap transaksi walau internet mati, auto sync saat online.' },
];

export default function Features() {
  return (
    <section id="fitur" className="max-w-6xl mx-auto px-5 py-14">
      <p className="text-emerald-400 text-sm text-center">Fitur Lengkap</p>
      <h3 className="text-3xl md:text-4xl font-bold text-white text-center mt-2">FITUR-FITUR UTAMA OMNIFYI POS</h3>
      <p className="text-gray-400 text-center mt-2">Semua yang dibutuhkan UMKM, dalam satu aplikasi</p>
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((item) => (
          <div key={item.title} className="rounded-xl p-5 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4">
              <item.icon className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-white mb-2">{item.title}</p>
            <p className="text-sm text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

