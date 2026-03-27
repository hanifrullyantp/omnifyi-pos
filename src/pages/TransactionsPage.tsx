import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Search,
  X,
  Eye,
  CalendarRange,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { db, type PaymentMethod, type TransactionStatus, type Transaction, type TransactionItem, type Cashier } from '../lib/db';
import { useAuthStore } from '../lib/store';
import { cn, formatCurrency } from '../lib/utils';
import { PAYMENT_METHOD_LABELS } from '../lib/utils';
import { exportTransactionsExcel, exportTransactionsPdf, type TransactionsExportRow } from '../lib/transactionsExport';

type StatusFilter = 'ALL' | TransactionStatus;
type PaymentFilter = 'ALL' | PaymentMethod;

function toDateInputValue(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

function statusTone(status: TransactionStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
    case 'VOIDED':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function formatTxDate(d: Date) {
  return new Date(d).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
}

function TransactionDetailModal({
  txId,
  open,
  onClose,
}: {
  txId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const items = useLiveQuery(
    () => {
      if (!open || !txId) return [];
      return db.transactionItems.where('transactionId').equals(txId).toArray();
    },
    [open, txId]
  );

  const tx = useLiveQuery(
    () => {
      if (!open || !txId) return null;
      return db.transactions.get(txId as any);
    },
    [open, txId]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center">
        <div className="w-full md:max-w-3xl md:mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-t-2xl md:rounded-2xl shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-4 h-4 text-brand-600" />
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                Detail transaksi
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 md:p-6 space-y-4 overflow-y-auto max-h-[70dvh]">
            {tx && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-3">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Invoice & tanggal
                  </p>
                  <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
                    {tx.invoiceNumber}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{formatTxDate(tx.createdAt)}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-3">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status & metode bayar
                  </p>
                  <p className={cn('inline-flex px-2 py-1 rounded-full text-[11px] font-semibold mt-2', statusTone(tx.status))}>
                    {tx.status}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {PAYMENT_METHOD_LABELS[tx.paymentMethod] ?? tx.paymentMethod}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Item transaksi</p>
                {items && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{items.length} baris</span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Produk</th>
                      <th className="px-3 py-2 font-semibold">Qty</th>
                      <th className="px-3 py-2 font-semibold">Harga</th>
                      <th className="px-3 py-2 font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    {items?.map((it: TransactionItem) => (
                      <tr key={it.id ?? `${it.productId}-${it.transactionId}`}>
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-100">{it.productName}</td>
                        <td className="px-3 py-2 font-semibold text-gray-900 dark:text-gray-100">{it.quantity}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                          {formatCurrency(it.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                          {formatCurrency(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                    {!items?.length && (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                          Belum ada item.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {tx && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-3">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subtotal</p>
                  <p className="mt-1 font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    {formatCurrency(tx.subtotal)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-3">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Diskon</p>
                  <p className="mt-1 font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    {formatCurrency(tx.discountAmount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-3">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pajak</p>
                  <p className="mt-1 font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    {formatCurrency(tx.taxAmount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-3">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p>
                  <p className="mt-1 font-bold tabular-nums text-brand-700 dark:text-brand-300">
                    {formatCurrency(tx.total)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { currentBusiness, currentUser } = useAuthStore();
  const bid = currentBusiness?.id;

  const [dateStart, setDateStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toDateInputValue(d);
  });
  const [dateEnd, setDateEnd] = useState(() => toDateInputValue(new Date()));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');
  const [cashierFilter, setCashierFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const transactionsRaw = useLiveQuery(
    () => (bid ? db.transactions.where('businessId').equals(bid).toArray() : []),
    [bid]
  );

  const cashiers = useLiveQuery(
    () => (bid ? db.cashiers.where('businessId').equals(bid).filter((c) => c.isActive).toArray() : []),
    [bid]
  );

  const cashierMap = useMemo(() => {
    const m = new Map<string, string>();
    (cashiers ?? []).forEach((c: Cashier) => {
      if (c.id) m.set(c.id, c.name);
    });
    if (currentUser?.id) m.set(currentUser.id, `${currentUser.name} (Owner)`);
    return m;
  }, [cashiers, currentUser]);

  const filtered = useMemo(() => {
    const start = new Date(dateStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateEnd);
    end.setHours(23, 59, 59, 999);

    const q = normalizeQuery(search);
    return (transactionsRaw ?? [])
      .filter((tx: Transaction) => {
        const d = new Date(tx.createdAt);
        if (d < start || d > end) return false;
        if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;
        if (paymentFilter !== 'ALL' && tx.paymentMethod !== paymentFilter) return false;
        if (cashierFilter !== 'ALL' && tx.cashierId !== cashierFilter) return false;
        if (q) {
          const hay = `${tx.invoiceNumber} ${tx.customerName ?? ''} ${tx.notes ?? ''} ${tx.cashierId}`;
          if (!hay.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a: Transaction, b: Transaction) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactionsRaw, dateStart, dateEnd, statusFilter, paymentFilter, cashierFilter, search]);

  const totals = useMemo(() => {
    const completed = filtered.filter((t) => t.status === 'COMPLETED');
    const omzet = completed.reduce((s, t) => s + t.total, 0);
    const discounts = completed.reduce((s, t) => s + t.discountAmount, 0);
    const tax = completed.reduce((s, t) => s + t.taxAmount, 0);
    const service = completed.reduce((s, t) => s + t.serviceCharge, 0);
    return { omzet, discounts, tax, service, count: filtered.length, completedCount: completed.length };
  }, [filtered]);

  const filterLabel = useMemo(() => {
    const s =
      statusFilter === 'ALL' ? 'Semua status' : statusFilter === 'COMPLETED' ? 'Selesai' : statusFilter === 'PENDING' ? 'Pending' : 'Void';
    const m =
      paymentFilter === 'ALL' ? 'Semua metode' : PAYMENT_METHOD_LABELS[paymentFilter] ?? paymentFilter;
    const k = cashierFilter === 'ALL' ? 'Semua kasir' : cashierMap.get(cashierFilter) ?? cashierFilter;
    return `${dateStart} → ${dateEnd} · ${s} · ${m} · ${k}`;
  }, [dateStart, dateEnd, statusFilter, paymentFilter, cashierFilter, cashierMap]);

  const handleExportExcel = () => {
    if (!currentBusiness) return;
    const rows: TransactionsExportRow[] = filtered.map((tx) => ({
      invoice: tx.invoiceNumber,
      tanggal: new Date(tx.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      kasir: cashierMap.get(tx.cashierId) ?? tx.cashierId,
      status: tx.status,
      metode: PAYMENT_METHOD_LABELS[tx.paymentMethod] ?? tx.paymentMethod,
      subtotal: tx.subtotal,
      diskon: tx.discountAmount,
      pajak: tx.taxAmount,
      service: tx.serviceCharge,
      total: tx.total,
      pelanggan: tx.customerName ?? undefined,
      catatan: tx.notes ?? undefined,
    }));
    exportTransactionsExcel({
      businessName: currentBusiness.name,
      filterLabel,
      generatedAt: new Date(),
      rows,
    });
  };

  const handleExportPdf = () => {
    if (!currentBusiness) return;
    const rows: TransactionsExportRow[] = filtered.map((tx) => ({
      invoice: tx.invoiceNumber,
      tanggal: new Date(tx.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      kasir: cashierMap.get(tx.cashierId) ?? tx.cashierId,
      status: tx.status,
      metode: PAYMENT_METHOD_LABELS[tx.paymentMethod] ?? tx.paymentMethod,
      subtotal: tx.subtotal,
      diskon: tx.discountAmount,
      pajak: tx.taxAmount,
      service: tx.serviceCharge,
      total: tx.total,
      pelanggan: tx.customerName ?? undefined,
      catatan: tx.notes ?? undefined,
    }));
    exportTransactionsPdf({
      businessName: currentBusiness.name,
      filterLabel,
      generatedAt: new Date(),
      rows,
    });
  };

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = (id?: string) => {
    if (!id) return;
    setSelectedTxId(id);
    setDetailOpen(true);
  };

  if (!bid) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Link to="/dashboard" className="text-brand-600 font-medium">
          ← Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-sm md:text-base text-gray-900 dark:text-gray-100 pb-36 w-full min-w-0 max-w-full">
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0" aria-label="Kembali">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">Transaksi</h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {totals.count} transaksi · {totals.completedCount} selesai
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari invoice / catatan…"
                className="w-full sm:w-[220px] pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={!filtered.length}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!filtered.length}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5 min-w-0 w-full max-w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-brand-600" />
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Filter transaksi
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Dari</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="mt-0.5 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Sampai</label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="mt-0.5 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="mt-0.5 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  <option value="ALL">Semua</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="PENDING">Pending</option>
                  <option value="VOIDED">Void</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Pembayaran</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
                  className="mt-0.5 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  <option value="ALL">Semua</option>
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m] ?? m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Kasir</label>
                <select
                  value={cashierFilter}
                  onChange={(e) => setCashierFilter(e.target.value)}
                  className="mt-0.5 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  <option value="ALL">Semua kasir</option>
                  {(cashiers ?? []).map((c) => (
                    <option key={c.id} value={c.id ?? ''}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-sm">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Omzet selesai</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(totals.omzet)}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-sm">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Diskon</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(totals.discounts)}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-sm">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pajak</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(totals.tax)}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-sm">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Service charge</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(totals.service)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Daftar transaksi</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} hasil</span>
            </div>

            <div className="overflow-x-auto overscroll-x-contain max-w-full touch-pan-x">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Invoice</th>
                    <th className="px-3 py-2 font-semibold">Tanggal</th>
                    <th className="px-3 py-2 font-semibold">Kasir</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Metode</th>
                    <th className="px-3 py-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((tx) => (
                    <tr
                      key={tx.id ?? tx.invoiceNumber}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer"
                      onClick={() => openDetail(tx.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <td className="px-3 py-2 font-mono text-[11px] text-gray-900 dark:text-gray-100">{tx.invoiceNumber}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatTxDate(tx.createdAt)}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300 truncate max-w-[160px]">{cashierMap.get(tx.cashierId) ?? tx.cashierId}</td>
                      <td className="px-3 py-2">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold', statusTone(tx.status))}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{PAYMENT_METHOD_LABELS[tx.paymentMethod] ?? tx.paymentMethod}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                        {formatCurrency(tx.total)}
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={6} className="px-3 py-14 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada transaksi untuk filter ini.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <TransactionDetailModal
        txId={selectedTxId}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedTxId(null);
        }}
      />
    </>
  );
}

