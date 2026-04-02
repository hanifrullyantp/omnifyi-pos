import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Store,
  Users,
  CalendarDays,
  Shield,
  Clock3,
  Wallet,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatCurrency } from '../lib/utils';

export default function StorePage() {
  const navigate = useNavigate();
  const params = useParams();
  const storeId = params.storeId as string | undefined;
  const { currentBusiness, setBusiness } = useAuthStore();

  const business = useLiveQuery(() => (storeId ? db.businesses.get(storeId) : undefined), [storeId]);

  useEffect(() => {
    if (business?.id && currentBusiness?.id !== business.id) setBusiness(business);
  }, [business, currentBusiness?.id, setBusiness]);

  const today = useMemo(() => {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    const e = new Date();
    e.setHours(23, 59, 59, 999);
    return { s, e };
  }, []);

  const txToday = useLiveQuery(
    () =>
      business?.id
        ? db.transactions
            .where('businessId')
            .equals(business.id)
            .filter((t) => {
              const d = new Date(t.createdAt);
              return d >= today.s && d <= today.e && t.status === 'COMPLETED';
            })
            .toArray()
        : [],
    [business?.id, today.s.getTime(), today.e.getTime()]
  );

  const omzet = txToday?.reduce((s, t) => s + t.total, 0) ?? 0;

  if (!storeId) return <NavigateFallback />;

  if (!business) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] p-4">
        <div className="max-w-xl mx-auto">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-[#8B949E]">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <div className="mt-6 rounded-2xl bg-[#161B22] p-5">
            <p className="text-sm text-[#8B949E]">Memuat data gerai…</p>
          </div>
        </div>
      </div>
    );
  }

  const tiles = [
    { id: 'shift', icon: CalendarDays, label: 'Shift', sub: 'Kelola shift harian', to: `/dashboard/store/${encodeURIComponent(storeId)}/shifts` },
    { id: 'roles', icon: Shield, label: 'Jabatan', sub: 'Permission & role', to: `/dashboard/store/${encodeURIComponent(storeId)}/roles` },
    { id: 'staff', icon: Users, label: 'Karyawan', sub: 'Kasir & tim', to: `/dashboard/store/${encodeURIComponent(storeId)}/staff` },
    { id: 'attendance', icon: Clock3, label: 'Absensi', sub: 'Clock-in/out', to: `/dashboard/store/${encodeURIComponent(storeId)}/attendance` },
    { id: 'payroll', icon: Wallet, label: 'Payroll', sub: 'Gaji & komisi', to: `/dashboard/store/${encodeURIComponent(storeId)}/payroll` },
    { id: 'settings', icon: Settings, label: 'Settings', sub: 'Pengaturan gerai', to: `/dashboard/store/${encodeURIComponent(storeId)}/settings` },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] pb-24">
      <header className="sticky top-0 z-40 bg-[#0D1117]/70 backdrop-blur border-b border-[#1E293B]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-11 h-11 grid place-items-center rounded-xl hover:bg-white/5 active:scale-[0.98]"
            aria-label="Kembali ke dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-[#8B949E]" />
          </button>
          <div className="min-w-0 text-center">
            <p className="text-sm font-semibold truncate">{business.name}</p>
            <p className="text-[11px] text-[#8B949E] truncate">Dashboard gerai</p>
          </div>
          <div className="w-11 h-11 grid place-items-center rounded-xl">
            <Store className="w-5 h-5 text-emerald-300" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <section className="rounded-2xl bg-gradient-to-b from-[#161B22] to-[#1C2333] p-4">
          <p className="text-[11px] text-[#8B949E]">Omzet hari ini</p>
          <p className="text-2xl font-extrabold tabular-nums">{formatCurrency(omzet)}</p>
          <p className="text-xs text-[#8B949E] mt-1">Tap gerai di dashboard untuk ganti outlet aktif.</p>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-base font-semibold">Menu Gerai</p>
            <Link to={`/dashboard/store/${encodeURIComponent(storeId)}/settings`} className="text-sm text-emerald-300 font-semibold">
              Pengaturan →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {tiles.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(t.to)}
                className="rounded-2xl bg-[#161B22] border border-[#30363D]/60 p-4 text-left hover:bg-white/5 active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/5 grid place-items-center">
                    <t.icon className="w-5 h-5 text-[#8B949E]" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#30363D]" />
                </div>
                <p className="mt-3 text-sm font-semibold">{t.label}</p>
                <p className="text-xs text-[#8B949E] mt-0.5">{t.sub}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-[#161B22] border border-[#30363D]/60 p-4">
          <p className="text-sm font-semibold">Catatan</p>
          <p className="text-xs text-[#8B949E] mt-1 leading-relaxed">
            Halaman ini adalah landing “dashboard per toko”. Saya sudah siapkan struktur dan navigasi. Berikutnya kita bisa isi
            detail khusus: status buka/tutup, shift aktif, daftar karyawan, absensi, dan payroll.
          </p>
        </section>
      </main>
    </div>
  );
}

function NavigateFallback() {
  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] p-4">
      <p className="text-sm text-[#8B949E]">Gerai tidak ditemukan.</p>
    </div>
  );
}

