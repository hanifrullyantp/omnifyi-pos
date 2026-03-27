import * as XLSX from 'xlsx';
import type { CashierSession, Cashier } from './db';

function safeName(s: string) {
  return s.replace(/[^\w\-]+/g, '-');
}

export function exportAttendanceExcel(params: {
  businessName: string;
  monthLabel: string;
  rows: {
    cashierName: string;
    date: string;
    clockIn: string;
    clockOut: string;
    durationHours: number;
  }[];
  monthlySummary: { cashierName: string; daysWorked: number; totalHours: number }[];
}) {
  const wb = XLSX.utils.book_new();
  const sheet1 = XLSX.utils.json_to_sheet(params.rows);
  XLSX.utils.book_append_sheet(wb, sheet1, 'Absensi Detail');
  const sheet2 = XLSX.utils.json_to_sheet(params.monthlySummary);
  XLSX.utils.book_append_sheet(wb, sheet2, 'Ringkasan Bulanan');
  XLSX.writeFile(wb, `Absensi-${safeName(params.businessName)}-${safeName(params.monthLabel)}.xlsx`);
}

export function sessionsToAttendanceRows(
  sessions: CashierSession[],
  cashiers: Cashier[],
  businessId: string
) {
  const byId = new Map(cashiers.map((c) => [c.id!, c]));
  return sessions
    .filter((s) => s.businessId === businessId)
    .map((s) => {
      const c = byId.get(s.cashierId);
      const inD = new Date(s.clockIn);
      const outD = s.clockOut ? new Date(s.clockOut) : null;
      const ms = outD ? outD.getTime() - inD.getTime() : 0;
      const durationHours = Math.round((ms / 3_600_000) * 10) / 10;
      return {
        cashierName: c?.name ?? s.cashierId,
        date: inD.toLocaleDateString('id-ID'),
        clockIn: inD.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        clockOut: outD ? outD.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—',
        durationHours,
      };
    });
}
