import {
  db,
  type BusinessCost,
  type Transaction,
  type CashflowEntry,
  type DebtReceivable,
} from './db';
import type {
  CashflowTimelineItem,
  ProfitLossReport,
  SimpleBalanceSheet,
} from './financeExport';

export const OWNER_DRAW_CATEGORY = 'Pencairan owner';

function inRange(d: Date, start: Date, end: Date): boolean {
  const t = d.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export function periodLabelFor(start: Date): string {
  return start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export async function buildCashflowTimeline(
  businessId: string,
  start: Date,
  end: Date
): Promise<CashflowTimelineItem[]> {
  const items: CashflowTimelineItem[] = [];

  const txs = await db.transactions
    .where('businessId')
    .equals(businessId)
    .filter(
      (t) => t.status === 'COMPLETED' && inRange(new Date(t.createdAt), start, end)
    )
    .toArray();

  for (const tx of txs) {
    items.push({
      id: `sale-${tx.id}`,
      date: new Date(tx.createdAt),
      type: 'INCOME',
      category: 'Penjualan',
      description: `Invoice ${tx.invoiceNumber}`,
      amount: tx.total,
      source: 'sale',
    });
  }

  const costs = await db.businessCosts
    .where('businessId')
    .equals(businessId)
    .filter((c) => c.isActive && inRange(new Date(c.createdAt), start, end))
    .toArray();

  for (const c of costs) {
    items.push({
      id: `cost-${c.id}`,
      date: new Date(c.createdAt),
      type: 'EXPENSE',
      category: costLabel(c),
      description: c.name,
      amount: c.amount,
      source: 'cost',
    });
  }

  const manual = await db.cashflowEntries
    .where('businessId')
    .equals(businessId)
    .filter((e) => inRange(new Date(e.date), start, end))
    .toArray();

  for (const e of manual) {
    items.push({
      id: `manual-${e.id}`,
      date: new Date(e.date),
      type: e.type,
      category: e.category,
      description: e.description,
      amount: e.amount,
      source: 'manual',
      attachmentName: e.attachmentName ?? null,
    });
  }

  return items.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function costLabel(c: BusinessCost): string {
  const map: Record<string, string> = {
    SALARY: 'Gaji',
    OPERATIONAL: 'Operasional',
    PRODUCTION: 'Utilitas',
    MARKETING: 'Marketing',
    OTHER: 'Lain-lain',
  };
  return `${map[c.type] ?? c.type} · ${c.name}`;
}

async function totalHppForTransactions(transactions: Transaction[]): Promise<number> {
  let hpp = 0;
  for (const tx of transactions) {
    const items = await db.transactionItems.where('transactionId').equals(tx.id!).toArray();
    for (const line of items) {
      const product = await db.products.get(line.productId);
      if (product) hpp += product.hpp * line.quantity;
    }
  }
  return hpp;
}

export async function buildProfitLoss(
  businessId: string,
  start: Date,
  end: Date
): Promise<ProfitLossReport> {
  const txs = await db.transactions
    .where('businessId')
    .equals(businessId)
    .filter(
      (t) => t.status === 'COMPLETED' && inRange(new Date(t.createdAt), start, end)
    )
    .toArray();

  const penjualanKotor = txs.reduce((s, t) => s + t.subtotal, 0);
  const diskon = txs.reduce((s, t) => s + t.discountAmount, 0);
  const penjualanBersih = penjualanKotor - diskon;
  const hpp = await totalHppForTransactions(txs);
  const labaKotor = penjualanBersih - hpp;

  const costs = await db.businessCosts
    .where('businessId')
    .equals(businessId)
    .filter((c) => c.isActive && inRange(new Date(c.createdAt), start, end))
    .toArray();

  const bucket = new Map<string, number>();
  for (const c of costs) {
    const label = c.name;
    bucket.set(label, (bucket.get(label) ?? 0) + c.amount);
  }

  const operatingBreakdown = Array.from(bucket.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const manualExpense = await db.cashflowEntries
    .where('businessId')
    .equals(businessId)
    .filter(
      (e) =>
        e.type === 'EXPENSE' &&
        e.category !== OWNER_DRAW_CATEGORY &&
        inRange(new Date(e.date), start, end)
    )
    .toArray();

  for (const e of manualExpense) {
    const key = e.category || 'Lain-lain (manual)';
    bucket.set(key, (bucket.get(key) ?? 0) + e.amount);
  }

  const mergedBreakdown = Array.from(bucket.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const totalBeban = mergedBreakdown.reduce((s, b) => s + b.amount, 0);
  const labaBersih = labaKotor - totalBeban;
  const netMargin =
    penjualanBersih > 0 ? Math.round((labaBersih / penjualanBersih) * 1000) / 10 : 0;

  return {
    periodeLabel: periodLabelFor(start),
    penjualanKotor,
    diskon,
    penjualanBersih,
    hpp,
    labaKotor,
    operatingBreakdown: mergedBreakdown,
    totalBeban,
    labaBersih,
    netMargin,
  };
}

export async function buildSimpleBalanceSheet(
  businessId: string,
  asOf: Date
): Promise<SimpleBalanceSheet> {
  const startEpoch = new Date(2000, 0, 1);
  const timeline = await buildCashflowTimeline(businessId, startEpoch, asOf);
  const totalMasuk = timeline.filter((i) => i.type === 'INCOME').reduce((s, i) => s + i.amount, 0);
  const totalKeluar = timeline.filter((i) => i.type === 'EXPENSE').reduce((s, i) => s + i.amount, 0);
  const saldoKas = totalMasuk - totalKeluar;

  const debts = await db.debtReceivables.where('businessId').equals(businessId).toArray();
  const piutang = debts
    .filter((d) => d.type === 'RECEIVABLE' && d.status !== 'PAID')
    .reduce((s, d) => s + d.remainingAmount, 0);
  const hutang = debts
    .filter((d) => d.type === 'DEBT' && d.status !== 'PAID')
    .reduce((s, d) => s + d.remainingAmount, 0);
  const ekuitas = saldoKas + piutang - hutang;

  return {
    periodeLabel: `Per ${asOf.toLocaleDateString('id-ID')}`,
    saldoKas,
    piutang,
    hutang,
    ekuitas,
  };
}

export interface RetainedMonthPoint {
  monthKey: string;
  label: string;
  start: Date;
  netProfit: number;
  ownerDraw: number;
  retainedInMonth: number;
  cumulativeRetained: number;
}

export async function buildRetainedSeries(
  businessId: string,
  monthsBack: number
): Promise<RetainedMonthPoint[]> {
  const now = new Date();
  const points: RetainedMonthPoint[] = [];
  let cumulative = 0;

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    const pl = await buildProfitLoss(businessId, start, end);
    const draws = await db.cashflowEntries
      .where('businessId')
      .equals(businessId)
      .filter(
        (e) =>
          e.type === 'EXPENSE' &&
          e.category === OWNER_DRAW_CATEGORY &&
          inRange(new Date(e.date), start, end)
      )
      .toArray();
    const ownerDraw = draws.reduce((s, e) => s + e.amount, 0);
    const retainedInMonth = pl.labaBersih - ownerDraw;
    cumulative += retainedInMonth;

    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    points.push({
      monthKey,
      label: d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      start,
      netProfit: pl.labaBersih,
      ownerDraw,
      retainedInMonth,
      cumulativeRetained: cumulative,
    });
  }

  return points;
}

export function stripBlobForExport(entries: CashflowEntry[]): Record<string, unknown>[] {
  return entries.map((e) => ({
    ...e,
    attachment: e.attachment ? '[Blob]' : null,
    date: e.date instanceof Date ? e.date.toISOString() : e.date,
    createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
  }));
}

export async function loadRawFinanceExportPayload(businessId: string) {
  const [transactions, transactionItems, businessCosts, cashflowEntries, debtReceivables, debtPayments] =
    await Promise.all([
      db.transactions.where('businessId').equals(businessId).toArray(),
      db.transactionItems.toArray(),
      db.businessCosts.where('businessId').equals(businessId).toArray(),
      db.cashflowEntries.where('businessId').equals(businessId).toArray(),
      db.debtReceivables.where('businessId').equals(businessId).toArray(),
      db.debtPayments.where('businessId').equals(businessId).toArray(),
    ]);

  const txIds = new Set(transactions.map((t) => t.id));
  const items = transactionItems.filter((i) => txIds.has(i.transactionId));

  return {
    transactions,
    transactionItems: items,
    businessCosts,
    cashflowEntries: stripBlobForExport(cashflowEntries),
    debtReceivables,
    debtPayments,
  };
}

export function debtStatusLabel(status: DebtReceivable['status']): string {
  if (status === 'PAID') return 'Lunas';
  if (status === 'PARTIAL') return 'Sebagian';
  return 'Belum';
}
