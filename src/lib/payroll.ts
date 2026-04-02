import { db, type Cashier, type CashierSession, type PayrollLine, type PayrollProfile, type PayrollRun } from './db';

export function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { start, end };
}

export function computeAttendanceForMonth(sessions: CashierSession[]) {
  const days = new Set<string>();
  let hours = 0;
  sessions.forEach((s) => {
    const dayKey = new Date(s.clockIn).toISOString().slice(0, 10);
    days.add(dayKey);
    if (s.clockOut) hours += (new Date(s.clockOut).getTime() - new Date(s.clockIn).getTime()) / 3_600_000;
  });
  return { daysWorked: days.size, totalHours: Math.round(hours * 10) / 10 };
}

export async function upsertPayrollProfile(params: {
  businessId: string;
  tenantId: string;
  cashierId: string;
  baseSalaryMonthly: number;
  hourlyRate: number;
}) {
  const existing = await db.payrollProfiles
    .where('businessId')
    .equals(params.businessId)
    .filter((p) => p.cashierId === params.cashierId)
    .first();

  const now = new Date();
  if (existing?.id) {
    await db.payrollProfiles.update(existing.id, {
      baseSalaryMonthly: params.baseSalaryMonthly,
      hourlyRate: params.hourlyRate,
      isActive: true,
      updatedAt: now,
    });
    return existing.id;
  }

  return db.payrollProfiles.add({
    id: crypto.randomUUID(),
    businessId: params.businessId,
    tenantId: params.tenantId,
    cashierId: params.cashierId,
    baseSalaryMonthly: params.baseSalaryMonthly,
    hourlyRate: params.hourlyRate,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  } satisfies PayrollProfile);
}

export async function generatePayrollForMonth(params: {
  businessId: string;
  tenantId: string;
  month: string; // YYYY-MM
  cashiers: Cashier[];
}) {
  const { start, end } = monthRange(params.month);

  const runId = crypto.randomUUID();
  const run: PayrollRun = {
    id: runId,
    businessId: params.businessId,
    tenantId: params.tenantId,
    month: params.month,
    generatedAt: new Date(),
    generatedBy: 'OWNER',
  };

  const sessions = await db.cashierSessions
    .where('businessId')
    .equals(params.businessId)
    .filter((s) => {
      const d = new Date(s.clockIn);
      return d >= start && d <= end;
    })
    .toArray();

  const profiles = await db.payrollProfiles.where('businessId').equals(params.businessId).toArray();
  const profileByCashier = new Map<string, PayrollProfile>();
  profiles.forEach((p) => profileByCashier.set(p.cashierId, p));

  const lines: PayrollLine[] = params.cashiers
    .filter((c) => c.id && c.isActive)
    .map((c) => {
      const cashierId = c.id!;
      const s = sessions.filter((x) => x.cashierId === cashierId);
      const att = computeAttendanceForMonth(s);
      const prof = profileByCashier.get(cashierId);
      const baseSalaryMonthly = prof?.baseSalaryMonthly ?? 0;
      const hourlyRate = prof?.hourlyRate ?? 0;
      const grossPay = Math.round((baseSalaryMonthly + att.totalHours * hourlyRate) * 100) / 100;
      return {
        id: crypto.randomUUID(),
        payrollRunId: runId,
        businessId: params.businessId,
        tenantId: params.tenantId,
        cashierId,
        daysWorked: att.daysWorked,
        totalHours: att.totalHours,
        baseSalaryMonthly,
        hourlyRate,
        grossPay,
      };
    });

  await db.transaction('rw', db.payrollRuns, db.payrollLines, async () => {
    await db.payrollRuns.add(run);
    await db.payrollLines.bulkAdd(lines);
  });

  return { run, lines };
}

export function payrollLinesToCsv(params: { lines: PayrollLine[]; cashiers: Cashier[] }) {
  const nameById = new Map<string, string>();
  params.cashiers.forEach((c) => {
    if (c.id) nameById.set(c.id, c.name);
  });
  const header = [
    'cashierId',
    'cashierName',
    'daysWorked',
    'totalHours',
    'baseSalaryMonthly',
    'hourlyRate',
    'grossPay',
  ];
  const rows = params.lines.map((l) => [
    l.cashierId,
    JSON.stringify(nameById.get(l.cashierId) ?? ''),
    String(l.daysWorked),
    String(l.totalHours),
    String(l.baseSalaryMonthly),
    String(l.hourlyRate),
    String(l.grossPay),
  ]);
  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

