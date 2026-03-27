import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Business } from '../../lib/db';
import { exportFinanceExcel, exportFinancePDF } from '../../lib/financeExport';
import {
  buildCashflowTimeline,
  buildProfitLoss,
  buildSimpleBalanceSheet,
  loadRawFinanceExportPayload,
} from '../../lib/financeData';

export type FinancePeriod = { start: Date; end: Date; label: string };

type FinanceShellValue = {
  business: Business;
  period: FinancePeriod;
  month: string;
  setMonth: (m: string) => void;
  exportExcel: () => Promise<void>;
  exportPdf: () => Promise<void>;
};

const FinanceShellContext = createContext<FinanceShellValue | null>(null);

export function useFinanceShell() {
  const v = useContext(FinanceShellContext);
  if (!v) throw new Error('useFinanceShell must be used within FinanceShellProvider');
  return v;
}

export function FinanceShellProvider({ business, children }: { business: Business; children: ReactNode }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const period = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    const label = start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    return { start, end, label };
  }, [month]);

  const exportExcel = useCallback(async () => {
    const bid = business.id!;
    const [cashflowItems, profitLoss, balanceSheet, rawData] = await Promise.all([
      buildCashflowTimeline(bid, period.start, period.end),
      buildProfitLoss(bid, period.start, period.end),
      buildSimpleBalanceSheet(bid, period.end),
      loadRawFinanceExportPayload(bid),
    ]);
    exportFinanceExcel({
      businessName: business.name,
      periodeLabel: period.label,
      cashflowItems,
      profitLoss,
      balanceSheet,
      rawData,
    });
  }, [business.id, business.name, period.start, period.end, period.label]);

  const exportPdf = useCallback(async () => {
    const bid = business.id!;
    const [cashflowItems, profitLoss, balanceSheet] = await Promise.all([
      buildCashflowTimeline(bid, period.start, period.end),
      buildProfitLoss(bid, period.start, period.end),
      buildSimpleBalanceSheet(bid, period.end),
    ]);
    exportFinancePDF({
      businessName: business.name,
      logoUrl: business.logoUrl,
      periodeLabel: period.label,
      cashflowItems,
      profitLoss,
      balanceSheet,
    });
  }, [business.id, business.name, business.logoUrl, period.start, period.end, period.label]);

  return (
    <FinanceShellContext.Provider
      value={{ business, period, month, setMonth, exportExcel, exportPdf }}
    >
      {children}
    </FinanceShellContext.Provider>
  );
}
