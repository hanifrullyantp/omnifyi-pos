import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, FileSpreadsheet, FileText, Loader2, RefreshCw, CalendarRange } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';
import { db, type PaymentMethod, type TransactionStatus } from '../lib/db';
import { useAuthStore } from '../lib/store';
import { cn, formatCurrency } from '../lib/utils';
import { PAYMENT_METHOD_COLORS, PAYMENT_METHOD_LABELS } from '../lib/utils';
import {
  exportReportsExcel,
  exportReportsPdf,
  paymentLabel,
  type ReportExportPayload,
} from '../lib/reportsExport';

type StatusFilter = 'ALL' | TransactionStatus;
type PaymentFilter = 'ALL' | PaymentMethod;

interface Aggregates {
  daily: { key: string; label: string; omzet: number; transaksi: number; labaKotor: number }[];
  paymentRows: { methodKey: string; metode: string; jumlahTrx: number; total: number }[];
  topProducts: { nama: string; qty: number; pendapatan: number }[];
  totalHpp: number;
  totalItemsQty: number;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function ReportsPage() {
  const { currentBusiness } = useAuthStore();
  const bid = currentBusiness?.id;

  const [dateStart, setDateStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');
  const [cashierFilter, setCashierFilter] = useState<string>('ALL');
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [aggLoading, setAggLoading] = useState(false);

  const cashiers = useLiveQuery(
    () => (bid ? db.cashiers.where('businessId').equals(bid).filter((c) => c.isActive).toArray() : []),
    [bid]
  );

  const transactionsRaw = useLiveQuery(
    () => (bid ? db.transactions.where('businessId').equals(bid).toArray() : []),
    [bid]
  );

  const cashierName = useMemo(() => {
    const m = new Map<string, string>();
    (cashiers ?? []).forEach((c) => {
      if (c.id) m.set(c.id, c.name);
    });
    return (id: string) => m.get(id) ?? id.slice(0, 8);
  }, [cashiers]);

  const filteredTx = useMemo(() => {
    if (!transactionsRaw) return [];
    const start = new Date(dateStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateEnd);
    end.setHours(23, 59, 59, 999);
    return transactionsRaw.filter((tx) => {
      const d = new Date(tx.createdAt);
      if (d < start || d > end) return false;
      if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;
      if (paymentFilter !== 'ALL' && tx.paymentMethod !== paymentFilter) return false;
      if (cashierFilter !== 'ALL' && tx.cashierId !== cashierFilter) return false;
      return true;
    });
  }, [transactionsRaw, dateStart, dateEnd, statusFilter, paymentFilter, cashierFilter]);

  const syncKpis = useMemo(() => {
    const completed = filteredTx.filter((t) => t.status === 'COMPLETED');
    const voided = filteredTx.filter((t) => t.status === 'VOIDED');
    const pending = filteredTx.filter((t) => t.status === 'PENDING');
    const omzet = completed.reduce((s, t) => s + t.total, 0);
    const totalDiscount = completed.reduce((s, t) => s + t.discountAmount, 0);
    const totalTax = completed.reduce((s, t) => s + t.taxAmount, 0);
    const totalService = completed.reduce((s, t) => s + t.serviceCharge, 0);
    const n = completed.length;
    const avgBasket = n > 0 ? omzet / n : 0;
    const totalHpp = aggregates?.totalHpp ?? 0;
    const grossProfit = omzet - totalHpp;
    const marginPercent = omzet > 0 ? Math.round((grossProfit / omzet) * 1000) / 10 : 0;
    return {
      totalOmzet: omzet,
      completedCount: n,
      voidCount: voided.length,
      pendingCount: pending.length,
      totalDiscount,
      totalTax,
      totalService,
      totalHpp,
      grossProfit,
      marginPercent,
      avgBasket,
      totalItemsQty: aggregates?.totalItemsQty ?? 0,
    };
  }, [filteredTx, aggregates?.totalHpp, aggregates?.totalItemsQty]);

  useEffect(() => {
    if (!bid) return;
    let cancelled = false;
    const completed = filteredTx.filter((t) => t.status === 'COMPLETED');
    setAggLoading(true);
    (async () => {
      const dayMap = new Map<string, { omzet: number; count: number; hpp: number }>();
      const payMap = new Map<string, { count: number; amount: number }>();
      const prodMap = new Map<string, { qty: number; revenue: number }>();
      let totalHpp = 0;
      let totalItemsQty = 0;

      for (const tx of completed) {
        const dayKey = new Date(tx.createdAt).toISOString().slice(0, 10);
        const row = dayMap.get(dayKey) ?? { omzet: 0, count: 0, hpp: 0 };
        row.omzet += tx.total;
        row.count += 1;

        const pm = tx.paymentMethod;
        const pr = payMap.get(pm) ?? { count: 0, amount: 0 };
        pr.count += 1;
        pr.amount += tx.total;
        payMap.set(pm, pr);

        if (!tx.id) continue;
        const items = await db.transactionItems.where('transactionId').equals(tx.id).toArray();
        let txHpp = 0;
        for (const it of items) {
          const p = await db.products.get(it.productId);
          const lineHpp = (p?.hpp ?? 0) * it.quantity;
          txHpp += lineHpp;
          totalItemsQty += it.quantity;
          const cur = prodMap.get(it.productName) ?? { qty: 0, revenue: 0 };
          cur.qty += it.quantity;
          cur.revenue += it.subtotal;
          prodMap.set(it.productName, cur);
        }
        row.hpp += txHpp;
        totalHpp += txHpp;
        dayMap.set(dayKey, row);
      }

      const daily = Array.from(dayMap.entries())
        .sort(([wa], [wb]) => wa.localeCompare(wb))
        .map(([key, v]) => ({
          key,
          label: new Date(key + 'T12:00:00').toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
          }),
          omzet: v.omzet,
          transaksi: v.count,
          labaKotor: v.omzet - v.hpp,
        }));

      const paymentRows = Array.from(payMap.entries()).map(([method, v]) => ({
        methodKey: method,
        metode: paymentLabel(method),
        jumlahTrx: v.count,
        total: v.amount,
      }));

      const topProducts = Array.from(prodMap.entries())
        .map(([nama, v]) => ({ nama, qty: v.qty, pendapatan: v.revenue }))
        .sort((a, b) => b.pendapatan - a.pendapatan)
        .slice(0, 15);

      if (!cancelled) {
        setAggregates({ daily, paymentRows, topProducts, totalHpp, totalItemsQty });
        setAggLoading(false);
      }
    })().catch(() => {
      if (!cancelled) setAggLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filteredTx, bid]);

  const filterLabel = useMemo(() => {
    const parts = [
      `${dateStart} → ${dateEnd}`,
      statusFilter === 'ALL' ? 'Semua status' : statusFilter,
      paymentFilter === 'ALL' ? 'Semua metode' : PAYMENT_METHOD_LABELS[paymentFilter] ?? paymentFilter,
      cashierFilter === 'ALL' ? 'Semua kasir' : cashierName(cashierFilter),
    ];
    return parts.join(' · ');
  }, [dateStart, dateEnd, statusFilter, paymentFilter, cashierFilter, cashierName]);

  const buildExportPayload = useCallback((): ReportExportPayload | null => {
    if (!currentBusiness || !aggregates) return null;
    const completed = filteredTx.filter((t) => t.status === 'COMPLETED');
    const omzet = completed.reduce((s, t) => s + t.total, 0);
    const totalDiscount = completed.reduce((s, t) => s + t.discountAmount, 0);
    const totalTax = completed.reduce((s, t) => s + t.taxAmount, 0);
    const totalService = completed.reduce((s, t) => s + t.serviceCharge, 0);
    const n = completed.length;
    const avgBasket = n > 0 ? omzet / n : 0;
    const grossProfit = omzet - aggregates.totalHpp;
    const marginPercent = omzet > 0 ? Math.round((grossProfit / omzet) * 1000) / 10 : 0;

    const sortedTrx = [...filteredTx].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      businessName: currentBusiness.name,
      generatedAt: new Date(),
      filterLabel,
      kpis: {
        totalOmzet: omzet,
        completedCount: n,
        voidCount: filteredTx.filter((t) => t.status === 'VOIDED').length,
        pendingCount: filteredTx.filter((t) => t.status === 'PENDING').length,
        totalDiscount,
        totalTax,
        totalService,
        totalHpp: aggregates.totalHpp,
        grossProfit,
        marginPercent,
        avgBasket,
        totalItemsQty: aggregates.totalItemsQty,
      },
      daily: aggregates.daily.map((d) => ({
        tanggal: d.label,
        omzet: d.omzet,
        transaksi: d.transaksi,
        labaKotor: d.labaKotor,
      })),
      paymentRows: aggregates.paymentRows.map(({ metode, jumlahTrx, total }) => ({ metode, jumlahTrx, total })),
      topProducts: aggregates.topProducts,
      transactions: sortedTrx.map((t) => ({
        invoice: t.invoiceNumber,
        tanggal: new Date(t.createdAt).toLocaleString('id-ID'),
        status: t.status,
        metode: paymentLabel(t.paymentMethod),
        kasir: cashierName(t.cashierId),
        subtotal: t.subtotal,
        diskon: t.discountAmount,
        pajak: t.taxAmount,
        service: t.serviceCharge,
        total: t.total,
      })),
    };
  }, [currentBusiness, aggregates, filteredTx, filterLabel, cashierName]);

  const handleExcel = () => {
    const p = buildExportPayload();
    if (p) exportReportsExcel(p);
  };

  const handlePdf = () => {
    const p = buildExportPayload();
    if (p) exportReportsPdf(p);
  };

  const applyPreset = (preset: 'today' | '7d' | '30d' | 'month') => {
    const end = new Date();
    const start = new Date();
    if (preset === 'today') {
      setDateStart(startOfToday().toISOString().slice(0, 10));
      setDateEnd(end.toISOString().slice(0, 10));
      return;
    }
    if (preset === '7d') start.setDate(start.getDate() - 7);
    if (preset === '30d') start.setDate(start.getDate() - 30);
    if (preset === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }
    setDateStart(start.toISOString().slice(0, 10));
    setDateEnd(end.toISOString().slice(0, 10));
  };

  const pieData = useMemo(
    () =>
      (aggregates?.paymentRows ?? []).map((r) => ({
        name: r.metode,
        methodKey: r.methodKey,
        value: r.total,
      })),
    [aggregates?.paymentRows]
  );

  const topBarData = useMemo(
    () =>
      (aggregates?.topProducts ?? [])
        .slice(0, 8)
        .map((p) => ({ nama: p.nama.length > 22 ? p.nama.slice(0, 22) + '…' : p.nama, pendapatan: p.pendapatan }))
        .reverse(),
    [aggregates?.topProducts]
  );

  const chartDaily = useMemo(
    () => aggregates?.daily.map((d) => ({ ...d, name: d.label })) ?? [],
    [aggregates?.daily]
  );

  if (!bid) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Link to="/dashboard" className="text-brand-600 font-medium">
          ← Dashboard
        </Link>
      </div>
    );
  }

  const txsTable = useMemo(() => {
    return [...filteredTx].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredTx]);

  return (
    <div className="ui-page">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap items-center gap-3">
        <Link to="/dashboard" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">Laporan penjualan</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{currentBusiness?.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExcel}
            disabled={!aggregates || aggLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white disabled:opacity-50 active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button
            type="button"
            onClick={handlePdf}
            disabled={!aggregates || aggLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white disabled:opacity-50 active:scale-[0.98]"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </header>

      <div className="ui-container max-w-7xl space-y-5">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <CalendarRange className="w-4 h-4 text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rentang cepat</span>
            {(
              [
                ['today', 'Hari ini'],
                ['7d', '7 hari'],
                ['30d', '30 hari'],
                ['month', 'Bulan ini'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => applyPreset(k)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-700"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <div>
              <label className="text-[10px] font-medium text-gray-500">Dari</label>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="mt-0.5 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-500">Sampai</label>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="mt-0.5 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-500">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="mt-0.5 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                <option value="ALL">Semua</option>
                <option value="COMPLETED">Selesai</option>
                <option value="PENDING">Pending</option>
                <option value="VOIDED">Void</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-500">Pembayaran</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
                className="mt-0.5 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                <option value="ALL">Semua</option>
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="text-[10px] font-medium text-gray-500">Kasir</label>
              <select
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                className="mt-0.5 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                <option value="ALL">Semua kasir</option>
                {(cashiers ?? []).map((c) => (
                  <option key={c.id} value={c.id!}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Filter aktif:</span> {filterLabel}
            {aggLoading && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menghitung HPP &amp; produk…</span>
              </>
            )}
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard title="Omzet (selesai)" value={formatCurrency(syncKpis.totalOmzet)} hint={`${syncKpis.completedCount} trx`} tone="brand" />
          <KpiCard
            title="Laba kotor"
            value={formatCurrency(syncKpis.grossProfit)}
            hint={`Margin ${syncKpis.marginPercent}%`}
            tone="indigo"
          />
          <KpiCard title="Rata keranjang" value={formatCurrency(syncKpis.avgBasket)} hint="Per trx selesai" tone="slate" />
          <KpiCard
            title="Item terjual"
            value={String(syncKpis.totalItemsQty)}
            hint={`Diskon ${formatCurrency(syncKpis.totalDiscount)} · Void ${syncKpis.voidCount}`}
            tone="amber"
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard title="Pajak" value={formatCurrency(syncKpis.totalTax)} hint="Total periode" tone="muted" />
          <KpiCard title="Service charge" value={formatCurrency(syncKpis.totalService)} hint="Total periode" tone="muted" />
          <KpiCard title="HPP" value={formatCurrency(syncKpis.totalHpp)} hint="Dari kartu stok" tone="muted" />
          <KpiCard
            title="Pending / Void"
            value={`${syncKpis.pendingCount} / ${syncKpis.voidCount}`}
            hint="Semua di filter"
            tone="rose"
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm min-h-[300px]">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Omzet &amp; laba harian</h2>
            <p className="text-[10px] text-gray-400 mb-3">Batang: omzet · Garis: laba kotor</p>
            {chartDaily.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="h-[260px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartDaily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v))} />
                    <Tooltip formatter={(val: number) => formatCurrency(Number(val))} />
                    <Legend />
                    <Bar dataKey="omzet" name="Omzet" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="labaKotor" name="Laba kotor" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm min-h-[300px]">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Metode pembayaran</h2>
            <p className="text-[10px] text-gray-400 mb-2">Berdasarkan omzet (selesai)</p>
            {pieData.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="h-[260px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={2}>
                      {pieData.map((slice) => (
                        <Cell
                          key={slice.methodKey}
                          fill={PAYMENT_METHOD_COLORS[slice.methodKey] ?? '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-center">
              {pieData.map((p) => (
                <span key={p.methodKey} className="text-[9px] flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  <span className="w-2 h-2 rounded-full" style={{ background: PAYMENT_METHOD_COLORS[p.methodKey] ?? '#94a3b8' }} />
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Top produk (pendapatan)</h2>
          {topBarData.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topBarData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="nama" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="pendapatan" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Detail transaksi</h2>
            <span className="text-[11px] text-gray-500">{txsTable.length} baris</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 font-semibold">Invoice</th>
                  <th className="px-3 py-2 font-semibold">Tanggal</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Bayar</th>
                  <th className="px-3 py-2 font-semibold">Kasir</th>
                  <th className="px-3 py-2 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {txsTable.slice(0, 150).map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30">
                    <td className="px-3 py-2 font-mono text-[11px]">{t.invoiceNumber}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                          t.status === 'COMPLETED' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40',
                          t.status === 'PENDING' && 'bg-amber-100 text-amber-800',
                          t.status === 'VOIDED' && 'bg-rose-100 text-rose-800'
                        )}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">{paymentLabel(t.paymentMethod)}</td>
                    <td className="px-3 py-2 truncate max-w-[100px]">{cashierName(t.cashierId)}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">{formatCurrency(t.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {txsTable.length === 0 && (
              <p className="text-center text-gray-500 py-10 text-sm">Tidak ada transaksi untuk filter ini.</p>
            )}
            {txsTable.length > 150 && (
              <p className="text-center text-[11px] text-gray-400 py-2">Menampilkan 150 pertama — unduh Excel untuk semua.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  tone: 'brand' | 'indigo' | 'slate' | 'amber' | 'muted' | 'rose';
}) {
  const ring = {
    brand: 'border-brand-100 bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/30 dark:to-gray-800',
    indigo: 'border-indigo-100 bg-indigo-50/50 dark:bg-indigo-950/20',
    slate: 'border-gray-100 dark:border-gray-700',
    amber: 'border-amber-100 bg-amber-50/40 dark:bg-amber-950/20',
    muted: 'border-gray-100 dark:border-gray-700 opacity-90',
    rose: 'border-rose-100 bg-rose-50/40 dark:bg-rose-950/20',
  }[tone];
  return (
    <div className={cn('rounded-2xl border p-3.5 shadow-sm', ring)}>
      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
      <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums break-all">{value}</p>
      <p className="text-[10px] text-gray-400 mt-1 leading-snug">{hint}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 text-sm">
      <RefreshCw className="w-8 h-8 mb-2 opacity-40" />
      Belum ada data untuk ditampilkan
    </div>
  );
}
