import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  FolderTree,
  List,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { db, type DebtReceivable, type FinanceAccount } from '../../lib/db';
import { cn, formatCurrency } from '../../lib/utils';
import type { CashflowTimelineItem } from '../../lib/financeExport';
import {
  buildCashflowTimeline,
  buildProfitLoss,
  buildRetainedSeries,
  debtStatusLabel,
  OWNER_DRAW_CATEGORY,
} from '../../lib/financeData';
import { useFinanceShell } from './FinanceShellContext';

const INCOME_PRESETS = ['Penjualan lain', 'Bunga', 'Lain-lain (masuk)'];
const EXPENSE_PRESETS = ['Operasional', 'Marketing', 'Utilitas', OWNER_DRAW_CATEGORY, 'Lain-lain (keluar)'];

export function FinanceCashflowTab() {
  const { business, period } = useFinanceShell();
  const bid = business.id!;
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: '',
    amount: '',
    description: '',
    file: null as File | null,
  });

  const [timeline, setTimeline] = useState<CashflowTimelineItem[]>([]);
  const txCount = useLiveQuery(() => db.transactions.where('businessId').equals(bid).count(), [bid]);
  const costCount = useLiveQuery(() => db.businessCosts.where('businessId').equals(bid).count(), [bid]);
  const manualCount = useLiveQuery(() => db.cashflowEntries.where('businessId').equals(bid).count(), [bid]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const t = await buildCashflowTimeline(bid, period.start, period.end);
      if (!cancel) setTimeline(t);
    })();
    return () => {
      cancel = true;
    };
  }, [bid, period.start, period.end, txCount, costCount, manualCount]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    timeline.forEach((i) => s.add(i.category));
    return Array.from(s).sort();
  }, [timeline]);

  const filtered = useMemo(() => {
    return timeline.filter((i) => {
      if (typeFilter !== 'ALL' && i.type !== typeFilter) return false;
      if (categoryFilter && i.category !== categoryFilter) return false;
      return true;
    });
  }, [timeline, typeFilter, categoryFilter]);

  const { totalIn, totalOut, saldo } = useMemo(() => {
    const ti = timeline.filter((i) => i.type === 'INCOME').reduce((s, i) => s + i.amount, 0);
    const to = timeline.filter((i) => i.type === 'EXPENSE').reduce((s, i) => s + i.amount, 0);
    return { totalIn: ti, totalOut: to, saldo: ti - to };
  }, [timeline]);

  const submitManual = async () => {
    const amt = Number(form.amount.replace(/\./g, '').replace(/,/g, '.')) || 0;
    if (!form.category.trim() || amt <= 0) return;
    let attachment: Blob | undefined;
    let attachmentName: string | null = null;
    if (form.file) {
      attachment = form.file;
      attachmentName = form.file.name;
    }
    await db.cashflowEntries.add({
      id: crypto.randomUUID(),
      businessId: bid,
      tenantId: business.tenantId,
      type: formType,
      category: form.category.trim(),
      date: new Date(form.date),
      amount: amt,
      description: form.description.trim() || '-',
      attachment: attachment ?? null,
      attachmentName,
      createdAt: new Date(),
    });
    setShowForm(false);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      category: '',
      amount: '',
      description: '',
      file: null,
    });
  };

  const openQuick = (t: 'INCOME' | 'EXPENSE') => {
    setFormType(t);
    setForm((f) => ({
      ...f,
      category: t === 'INCOME' ? INCOME_PRESETS[0] : EXPENSE_PRESETS[0],
      date: new Date().toISOString().slice(0, 10),
    }));
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Total Masuk</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalIn)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">Total Keluar</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalOut)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Saldo</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(saldo)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openQuick('INCOME')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600"
        >
          <ArrowDownLeft className="w-4 h-4" /> Pemasukan
        </button>
        <button
          type="button"
          onClick={() => openQuick('EXPENSE')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600"
        >
          <ArrowUpRight className="w-4 h-4" /> Pengeluaran
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tipe</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="ALL">Semua</option>
            <option value="INCOME">Masuk</option>
            <option value="EXPENSE">Keluar</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Kategori</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm min-w-[160px]"
          >
            <option value="">Semua</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[480px] overflow-y-auto">
          {filtered.map((row) => (
            <button
              key={row.id}
              type="button"
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div
                className={cn(
                  'mt-0.5 p-2 rounded-xl',
                  row.type === 'INCOME'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/40'
                )}
              >
                {row.type === 'INCOME' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{row.description}</p>
                <p className="text-xs text-gray-500">
                  {row.date.toLocaleString('id-ID')} · {row.category} · {row.source}
                  {row.attachmentName ? ` · 📎 ${row.attachmentName}` : ''}
                </p>
              </div>
              <span
                className={cn(
                  'font-semibold tabular-nums',
                  row.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {row.type === 'INCOME' ? '+' : '−'} {formatCurrency(row.amount)}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="p-8 text-center text-gray-500 text-sm">Belum ada aliran kas di periode ini.</p>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {formType === 'INCOME' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}
            </h3>
            <div>
              <label className="text-xs text-gray-500">Tanggal</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Kategori</label>
              <input
                list={formType === 'INCOME' ? 'income-cats' : 'expense-cats'}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                placeholder="Pilih atau ketik"
              />
              <datalist id="income-cats">
                {INCOME_PRESETS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <datalist id="expense-cats">
                {EXPENSE_PRESETS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-xs text-gray-500">Jumlah (Rp)</label>
              <input
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Deskripsi</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[72px]"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                <Camera className="w-4 h-4" />
                Lampiran foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
                />
              </label>
              {form.file && <p className="text-xs text-gray-500 mt-1">{form.file.name}</p>}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitManual}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FinanceDebtTab() {
  const { business } = useFinanceShell();
  const bid = business.id!;
  const [tab, setTab] = useState<'DEBT' | 'RECEIVABLE'>('DEBT');
  const [payOpen, setPayOpen] = useState<DebtReceivable | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const rows = useLiveQuery(
    () =>
      db.debtReceivables
        .where('businessId')
        .equals(bid)
        .filter((d) => d.type === tab)
        .toArray(),
    [bid, tab]
  );

  const all = useLiveQuery(() => db.debtReceivables.where('businessId').equals(bid).toArray(), [bid]);

  const totals = useMemo(() => {
    const hut = (all ?? []).filter((d) => d.type === 'DEBT' && d.status !== 'PAID').reduce((s, d) => s + d.remainingAmount, 0);
    const piut = (all ?? []).filter((d) => d.type === 'RECEIVABLE' && d.status !== 'PAID').reduce((s, d) => s + d.remainingAmount, 0);
    return { hutang: hut, piutang: piut, net: piut - hut };
  }, [all]);

  const dueSoon = useMemo(() => {
    const week = new Date();
    week.setDate(week.getDate() + 7);
    return (all ?? []).filter(
      (d) => d.status !== 'PAID' && d.dueDate && new Date(d.dueDate) <= week && new Date(d.dueDate) >= new Date()
    );
  }, [all]);

  const paymentsFor = useLiveQuery(
    () => (payOpen ? db.debtPayments.where('debtReceivableId').equals(payOpen.id!).toArray() : []),
    [payOpen?.id]
  );

  const applyPayment = async (full: boolean) => {
    if (!payOpen?.id) return;
    const rem = payOpen.remainingAmount;
    const raw = full ? rem : Number(payAmount.replace(/\./g, '')) || 0;
    const amt = Math.min(Math.max(raw, 0), rem);
    if (amt <= 0) return;

    await db.transaction('rw', db.debtReceivables, db.debtPayments, async () => {
      const cur = await db.debtReceivables.get(payOpen.id!);
      if (!cur) return;
      const newPaid = cur.paidAmount + amt;
      const newRem = cur.totalAmount - newPaid;
      let status: DebtReceivable['status'] = 'PAID';
      if (newRem > 0.5) status = newPaid > 0 ? 'PARTIAL' : 'UNPAID';
      await db.debtPayments.add({
        id: crypto.randomUUID(),
        debtReceivableId: payOpen.id!,
        businessId: bid,
        tenantId: business.tenantId,
        amount: amt,
        paidAt: new Date(),
        notes: full ? 'Pelunasan' : 'Cicilan',
        createdAt: new Date(),
      });
      await db.debtReceivables.update(payOpen.id!, {
        paidAmount: newPaid,
        remainingAmount: Math.max(0, newRem),
        status,
      });
    });
    setPayOpen(null);
    setPayAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-800 p-4">
          <p className="text-sm text-red-600 font-medium">Total Hutang</p>
          <p className="text-xl font-bold">{formatCurrency(totals.hutang)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-gray-800 p-4">
          <p className="text-sm text-emerald-600 font-medium">Total Piutang</p>
          <p className="text-xl font-bold">{formatCurrency(totals.piutang)}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-white dark:bg-gray-800 p-4">
          <p className="text-sm text-blue-600 font-medium">Net (Piutang − Hutang)</p>
          <p className="text-xl font-bold">{formatCurrency(totals.net)}</p>
        </div>
      </div>

      {dueSoon.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">Jatuh tempo 7 hari ke depan</p>
            <ul className="mt-2 text-sm text-amber-800 dark:text-amber-200 space-y-1">
              {dueSoon.map((d) => (
                <li key={d.id}>
                  {d.partyName} — {formatCurrency(d.remainingAmount)} (
                  {d.dueDate ? new Date(d.dueDate).toLocaleDateString('id-ID') : '—'})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
        <button
          type="button"
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'DEBT' ? 'bg-white dark:bg-gray-700 shadow text-gray-900' : 'text-gray-500'
          )}
          onClick={() => setTab('DEBT')}
        >
          Hutang
        </button>
        <button
          type="button"
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'RECEIVABLE' ? 'bg-white dark:bg-gray-700 shadow text-gray-900' : 'text-gray-500'
          )}
          onClick={() => setTab('RECEIVABLE')}
        >
          Piutang
        </button>
      </div>

      <div className="space-y-3">
        {(rows ?? []).map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              setPayOpen(d);
              setPayAmount('');
            }}
            className="w-full flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-left hover:border-emerald-400 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{d.partyName}</p>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    d.status === 'PAID' && 'bg-emerald-100 text-emerald-700',
                    d.status === 'PARTIAL' && 'bg-amber-100 text-amber-700',
                    d.status === 'UNPAID' && 'bg-red-100 text-red-700'
                  )}
                >
                  {debtStatusLabel(d.status)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Jatuh tempo: {d.dueDate ? new Date(d.dueDate).toLocaleDateString('id-ID') : '—'}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                Sisa: <span className="font-bold">{formatCurrency(d.remainingAmount)}</span> / Total{' '}
                {formatCurrency(d.totalAmount)}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
        {(rows ?? []).length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">Tidak ada data.</p>
        )}
      </div>

      {payOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h3 className="font-bold text-lg">{payOpen.partyName}</h3>
            <p className="text-sm text-gray-600">
              Sisa tagihan: <span className="font-semibold">{formatCurrency(payOpen.remainingAmount)}</span>
            </p>
            <div>
              <label className="text-xs text-gray-500">Nominal bayar</label>
              <input
                inputMode="numeric"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Partial"
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2"
              />
            </div>
            {paymentsFor && paymentsFor.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Riwayat cicilan</p>
                <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                  {paymentsFor.map((p) => (
                    <li key={p.id} className="flex justify-between">
                      <span>{new Date(p.paidAt).toLocaleDateString('id-ID')}</span>
                      <span className="font-medium">{formatCurrency(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => applyPayment(false)}
                className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 font-medium text-sm"
              >
                Bayar sebagian
              </button>
              <button
                type="button"
                onClick={() => applyPayment(true)}
                className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600"
              >
                Lunasi
              </button>
              <button type="button" onClick={() => setPayOpen(null)} className="text-sm text-gray-500">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FinancePLTab() {
  const { business, period, exportExcel, exportPdf } = useFinanceShell();
  const bid = business.id!;
  const [report, setReport] = useState<Awaited<ReturnType<typeof buildProfitLoss>> | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      const r = await buildProfitLoss(bid, period.start, period.end);
      if (!c) setReport(r);
    })();
    return () => {
      c = true;
    };
  }, [bid, period.start, period.end]);

  if (!report) {
    return <p className="text-gray-500 text-sm">Menghitung laporan…</p>;
  }

  const row = (label: string, value: number, opts?: { expense?: boolean; strong?: boolean }) => (
    <div
      className={cn(
        'flex justify-between gap-4 text-sm py-1.5 border-b border-gray-100 dark:border-gray-700',
        opts?.strong && 'font-bold text-base border-none pt-3'
      )}
    >
      <span className="text-gray-700 dark:text-gray-200">{label}</span>
      <span
        className={cn(
          'tabular-nums font-medium',
          opts?.expense ? 'text-red-600' : 'text-gray-900 dark:text-white'
        )}
      >
        {opts?.expense && value > 0 ? '(' : ''}
        {formatCurrency(opts?.expense ? Math.abs(value) : value)}
        {opts?.expense && value > 0 ? ')' : ''}
      </span>
    </div>
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 max-w-lg mx-auto shadow-sm">
      <div className="text-center mb-6">
        <p className="text-2xl mb-1">📊</p>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Laporan Laba Rugi</h2>
        <p className="text-sm text-gray-500">Periode: {report.periodeLabel}</p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => exportExcel()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
          >
            📥 Export Excel
          </button>
          <button
            type="button"
            onClick={() => exportPdf()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 dark:bg-gray-700"
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      <p className="text-xs font-bold text-gray-500 tracking-wide mb-2">PENDAPATAN</p>
      {row('Penjualan kotor', report.penjualanKotor)}
      {row('Diskon', report.diskon, { expense: true })}
      {row('Penjualan bersih', report.penjualanBersih, { strong: true })}
      <div className="h-2" />
      {row('HPP', report.hpp, { expense: true })}
      <div className="border-t border-gray-200 dark:border-gray-600 my-2" />
      {row('LABA KOTOR', report.labaKotor, { strong: true })}

      <p className="text-xs font-bold text-gray-500 tracking-wide mt-6 mb-2">BEBAN OPERASIONAL</p>
      {report.operatingBreakdown.map((b) => row(b.category, b.amount, { expense: true }))}
      {row('Total beban', report.totalBeban, { expense: true })}
      <div className="border-t border-gray-200 dark:border-gray-600 my-2" />
      {row('LABA BERSIH', report.labaBersih, { strong: true })}
      <div className="flex justify-between text-sm pt-2">
        <span className="text-gray-600">Net Margin</span>
        <span className="font-semibold">{report.netMargin}%</span>
      </div>
    </div>
  );
}

export function FinanceRetainedTab() {
  const { business } = useFinanceShell();
  const bid = business.id!;
  const [series, setSeries] = useState<Awaited<ReturnType<typeof buildRetainedSeries>>>([]);
  const [months, setMonths] = useState(6);
  const [barDetail, setBarDetail] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      const s = await buildRetainedSeries(bid, months);
      if (!c) setSeries(s);
    })();
    return () => {
      c = true;
    };
  }, [bid, months]);

  const last = series[series.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">Akumulasi laba ditahan dari bulan ke bulan.</p>
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
        >
          {[3, 6, 12, 24].map((m) => (
            <option key={m} value={m}>
              {m} bulan terakhir
            </option>
          ))}
        </select>
      </div>

      {last && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs text-gray-500">Laba bersih (bulan terakhir)</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(last.netProfit)}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs text-gray-500">Pencairan owner (kategori)</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(last.ownerDraw)}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs text-gray-500">Laba ditahan kumulatif</p>
            <p className="text-lg font-bold">{formatCurrency(last.cumulativeRetained)}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 h-72">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Tren laba ditahan (ketuk batang untuk detail)</p>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Line type="monotone" dataKey="cumulativeRetained" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 h-56">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Laba ditahan per bulan</p>
        <ResponsiveContainer width="100%" height="88%">
          <BarChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={40} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`} />
            <Tooltip formatter={(v: number) => formatCurrency(Number(v))} />
            <Bar
              dataKey="retainedInMonth"
              radius={[6, 6, 0, 0]}
              onClick={(_, idx) => {
                const row = series[idx];
                if (row) {
                  setBarDetail(
                    `${row.label}: ditahan ${formatCurrency(row.retainedInMonth)} (laba ${formatCurrency(row.netProfit)}, owner ${formatCurrency(row.ownerDraw)})`
                  );
                }
              }}
            >
              {series.map((entry) => (
                <Cell key={entry.monthKey} fill={entry.retainedInMonth >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {barDetail && <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{barDetail}</p>}
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="text-left p-3">Bulan</th>
              <th className="text-right p-3">Laba bersih</th>
              <th className="text-right p-3">Owner</th>
              <th className="text-right p-3">Ditahan (bln)</th>
              <th className="text-right p-3">Kumulatif</th>
            </tr>
          </thead>
          <tbody>
            {series.map((r) => (
              <tr key={r.monthKey} className="border-t border-gray-100 dark:border-gray-700">
                <td className="p-3">{r.label}</td>
                <td className="p-3 text-right text-emerald-600">{formatCurrency(r.netProfit)}</td>
                <td className="p-3 text-right text-red-600">{formatCurrency(r.ownerDraw)}</td>
                <td className="p-3 text-right">{formatCurrency(r.retainedInMonth)}</td>
                <td className="p-3 text-right font-medium">{formatCurrency(r.cumulativeRetained)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CAT_LABEL: Record<FinanceAccount['category'], string> = {
  asset: 'Aset',
  liability: 'Liabilitas',
  equity: 'Ekuitas',
  income: 'Pendapatan',
  expense: 'Beban',
};

export function FinanceAccountsTab() {
  const { business } = useFinanceShell();
  const bid = business.id!;
  const [treeMode, setTreeMode] = useState(true);
  const [editor, setEditor] = useState<Partial<FinanceAccount> & { mode: 'new' | 'edit' } | null>(null);

  const accounts = useLiveQuery(() => db.financeAccounts.where('businessId').equals(bid).toArray(), [bid]) ?? [];

  const renderTree = (parentId: string | null, depth: number): React.ReactNode => {
    const children = accounts
      .filter((a) => (a.parentId ?? null) === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
    return children.map((a) => (
      <React.Fragment key={a.id}>
        <div
          className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700"
          style={{ paddingLeft: 12 + depth * 16 }}
        >
          <span className="text-xs font-mono text-gray-500 w-20">{a.code}</span>
          <span className="flex-1 font-medium text-gray-900 dark:text-white">{a.name}</span>
          <span className="text-xs text-gray-500 w-24">{CAT_LABEL[a.category]}</span>
          <span className="tabular-nums text-sm w-28 text-right">{formatCurrency(a.balance)}</span>
          {!a.isSystem && (
            <button
              type="button"
              onClick={() =>
                setEditor({
                  mode: 'edit',
                  id: a.id,
                  code: a.code,
                  name: a.name,
                  category: a.category,
                  parentId: a.parentId,
                  sortOrder: a.sortOrder,
                  balance: a.balance,
                })
              }
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
        {treeMode && renderTree(a.id!, depth + 1)}
      </React.Fragment>
    ));
  };

  const flatRows = useMemo(() => {
    const visit = (parentId: string | null, depth: number): { a: FinanceAccount; depth: number }[] => {
      const ch = accounts
        .filter((x) => (x.parentId ?? null) === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
      return ch.flatMap((a) => [{ a, depth }, ...visit(a.id!, depth + 1)]);
    };
    return visit(null, 0);
  }, [accounts]);

  const saveAccount = async () => {
    if (!editor) return;
    const now = new Date();
    if (editor.mode === 'new') {
      await db.financeAccounts.add({
        id: crypto.randomUUID(),
        businessId: bid,
        tenantId: business.tenantId,
        code: (editor.code ?? '').trim() || `ACC-${Date.now()}`,
        name: (editor.name ?? '').trim() || 'Akun baru',
        category: editor.category ?? 'expense',
        parentId: editor.parentId ?? null,
        sortOrder: editor.sortOrder ?? 99,
        balance: Number(editor.balance) || 0,
        isActive: true,
        isSystem: false,
        createdAt: now,
      });
    } else if (editor.id) {
      await db.financeAccounts.update(editor.id, {
        code: (editor.code ?? '').trim(),
        name: (editor.name ?? '').trim(),
        category: editor.category,
        parentId: editor.parentId ?? null,
        sortOrder: Number(editor.sortOrder) || 0,
        balance: Number(editor.balance) || 0,
      });
    }
    setEditor(null);
  };

  const deleteAccount = async (id: string) => {
    const children = accounts.filter((a) => a.parentId === id);
    if (children.length) {
      alert('Hapus sub-akun terlebih dahulu.');
      return;
    }
    await db.financeAccounts.delete(id);
    setEditor(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm',
              treeMode ? 'bg-white dark:bg-gray-700 shadow' : ''
            )}
            onClick={() => setTreeMode(true)}
          >
            <FolderTree className="w-4 h-4" /> Tree
          </button>
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm',
              !treeMode ? 'bg-white dark:bg-gray-700 shadow' : ''
            )}
            onClick={() => setTreeMode(false)}
          >
            <List className="w-4 h-4" /> Flat
          </button>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditor({
              mode: 'new',
              code: '',
              name: '',
              category: 'expense',
              parentId: null,
              sortOrder: 50,
              balance: 0,
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Akun
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        {treeMode ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">{renderTree(null, 0)}</div>
        ) : (
          <div>
            {flatRows.map(({ a, depth }) => (
              <div
                key={a.id}
                className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700 px-3"
                style={{ paddingLeft: 12 + depth * 16 }}
              >
                <span className="text-xs font-mono text-gray-500 w-20">{a.code}</span>
                <span className="flex-1 font-medium">{a.name}</span>
                <span className="text-xs text-gray-500">{CAT_LABEL[a.category]}</span>
                <span className="tabular-nums text-sm w-28 text-right">{formatCurrency(a.balance)}</span>
                {!a.isSystem && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditor({
                        mode: 'edit',
                        id: a.id,
                        code: a.code,
                        name: a.name,
                        category: a.category,
                        parentId: a.parentId,
                        sortOrder: a.sortOrder,
                        balance: a.balance,
                      })
                    }
                    className="p-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 space-y-3">
            <h3 className="font-bold">{editor.mode === 'new' ? 'Akun baru' : 'Ubah akun'}</h3>
            <input
              placeholder="Kode"
              value={editor.code ?? ''}
              onChange={(e) => setEditor({ ...editor, code: e.target.value })}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2"
            />
            <input
              placeholder="Nama"
              value={editor.name ?? ''}
              onChange={(e) => setEditor({ ...editor, name: e.target.value })}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2"
            />
            <select
              value={editor.category ?? 'expense'}
              onChange={(e) =>
                setEditor({ ...editor, category: e.target.value as FinanceAccount['category'] })
              }
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2"
            >
              {(Object.keys(CAT_LABEL) as FinanceAccount['category'][]).map((k) => (
                <option key={k} value={k}>
                  {CAT_LABEL[k]}
                </option>
              ))}
            </select>
            <select
              value={editor.parentId ?? ''}
              onChange={(e) =>
                setEditor({ ...editor, parentId: e.target.value || null })
              }
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2"
            >
              <option value="">— Tanpa induk —</option>
              {accounts
                .filter((x) => editor.mode === 'new' || x.id !== editor.id)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.code} {x.name}
                  </option>
                ))}
            </select>
            <input
              type="number"
              placeholder="Saldo"
              value={editor.balance ?? 0}
              onChange={(e) => setEditor({ ...editor, balance: Number(e.target.value) })}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2"
            />
            <div className="flex gap-2 pt-2">
              {editor.mode === 'edit' && editor.id && (
                <button
                  type="button"
                  onClick={() => deleteAccount(editor.id!)}
                  className="p-3 rounded-xl border border-red-200 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveAccount}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
