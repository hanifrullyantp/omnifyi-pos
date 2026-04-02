import { db, type PaymentMethod } from './db';

export interface SessionCloseSummary {
  expectedCash: number;
  transactionCount: number;
  voidCount: number;
  totalRevenue: number;
  paymentBreakdown: Record<PaymentMethod, number>;
}

export interface DayCloseSummary extends SessionCloseSummary {
  openingCash: number;
  expectedDrawerCash: number;
}

export async function computeSessionCloseSummary(
  businessId: string,
  cashierId: string,
  clockIn: Date,
  end: Date = new Date()
): Promise<SessionCloseSummary> {
  const txs = await db.transactions
    .where('businessId')
    .equals(businessId)
    .filter((t) => {
      const d = new Date(t.createdAt);
      return t.cashierId === cashierId && d >= clockIn && d <= end;
    })
    .toArray();

  const completed = txs.filter((t) => t.status === 'COMPLETED');
  const voided = txs.filter((t) => t.status === 'VOIDED');
  const paymentBreakdown: Record<string, number> = {
    CASH: 0,
    QRIS: 0,
    TRANSFER: 0,
    EWALLET: 0,
  };
  let totalRevenue = 0;
  for (const t of completed) {
    totalRevenue += t.total;
    paymentBreakdown[t.paymentMethod] = (paymentBreakdown[t.paymentMethod] || 0) + t.total;
  }
  const expectedCash = completed
    .filter((t) => t.paymentMethod === 'CASH')
    .reduce((s, t) => s + t.total, 0);

  return {
    expectedCash,
    transactionCount: completed.length,
    voidCount: voided.length,
    totalRevenue,
    paymentBreakdown: paymentBreakdown as Record<PaymentMethod, number>,
  };
}

export async function computeDayCloseSummary(
  businessId: string,
  start: Date,
  end: Date,
  openingCash: number = 0
): Promise<DayCloseSummary> {
  const txs = await db.transactions
    .where('businessId')
    .equals(businessId)
    .filter((t) => {
      const d = new Date(t.createdAt);
      return d >= start && d <= end;
    })
    .toArray();

  const completed = txs.filter((t) => t.status === 'COMPLETED');
  const voided = txs.filter((t) => t.status === 'VOIDED');

  const paymentBreakdown: Record<string, number> = {
    CASH: 0,
    QRIS: 0,
    TRANSFER: 0,
    EWALLET: 0,
  };
  let totalRevenue = 0;
  for (const t of completed) {
    totalRevenue += t.total;
    paymentBreakdown[t.paymentMethod] = (paymentBreakdown[t.paymentMethod] || 0) + t.total;
  }

  const cashSales = completed
    .filter((t) => t.paymentMethod === 'CASH')
    .reduce((s, t) => s + t.total, 0);

  const expectedDrawerCash = openingCash + cashSales;

  return {
    openingCash,
    expectedDrawerCash,
    expectedCash: cashSales,
    transactionCount: completed.length,
    voidCount: voided.length,
    totalRevenue,
    paymentBreakdown: paymentBreakdown as Record<PaymentMethod, number>,
  };
}
