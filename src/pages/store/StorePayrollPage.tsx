import React, { useMemo, useState } from 'react';
import { StoreScopedContainer } from './StoreScopedContainer';
import { useAuthStore } from '../../lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { cn, formatCurrency } from '../../lib/utils';
import { generatePayrollForMonth, payrollLinesToCsv, upsertPayrollProfile } from '../../lib/payroll';

export default function StorePayrollPage() {
  const { currentBusiness, currentUser } = useAuthStore();
  const bid = currentBusiness?.id;
  const tenantId = currentBusiness?.tenantId;
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const cashiers = useLiveQuery(() => (bid ? db.cashiers.where('businessId').equals(bid).toArray() : []), [bid]);
  const profiles = useLiveQuery(
    () => (bid ? db.payrollProfiles.where('businessId').equals(bid).toArray() : []),
    [bid]
  );
  const runs = useLiveQuery(
    () =>
      bid
        ? db.payrollRuns
            .where('businessId')
            .equals(bid)
            .filter((r) => r.month === month)
            .toArray()
        : [],
    [bid, month]
  );

  const latestRun = useMemo(() => {
    const arr = runs ?? [];
    if (arr.length === 0) return null;
    return [...arr].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];
  }, [runs]);

  const latestLines = useLiveQuery(
    () => (latestRun?.id ? db.payrollLines.where('payrollRunId').equals(latestRun.id).toArray() : []),
    [latestRun?.id]
  );

  const profileByCashier = useMemo(() => {
    const m = new Map<string, { baseSalaryMonthly: number; hourlyRate: number }>();
    (profiles ?? []).forEach((p) => {
      m.set(p.cashierId, { baseSalaryMonthly: p.baseSalaryMonthly, hourlyRate: p.hourlyRate });
    });
    return m;
  }, [profiles]);

  const [draft, setDraft] = useState<Record<string, { baseSalaryMonthly: number; hourlyRate: number }>>({});

  const effective = useMemo(() => {
    const m = new Map<string, { baseSalaryMonthly: number; hourlyRate: number }>();
    (cashiers ?? []).forEach((c) => {
      if (!c.id) return;
      const d = draft[c.id];
      const p = profileByCashier.get(c.id);
      m.set(c.id, d ?? p ?? { baseSalaryMonthly: 0, hourlyRate: 0 });
    });
    return m;
  }, [cashiers, draft, profileByCashier]);

  const saveProfile = async (cashierId: string) => {
    if (!bid || !tenantId) return;
    const v = effective.get(cashierId);
    if (!v) return;
    await upsertPayrollProfile({
      businessId: bid,
      tenantId,
      cashierId,
      baseSalaryMonthly: Number.isFinite(v.baseSalaryMonthly) ? v.baseSalaryMonthly : 0,
      hourlyRate: Number.isFinite(v.hourlyRate) ? v.hourlyRate : 0,
    });
    setDraft((prev) => {
      const next = { ...prev };
      delete next[cashierId];
      return next;
    });
  };

  const generate = async () => {
    if (!bid || !tenantId || !cashiers?.length) return;
    if (currentUser?.role !== 'OWNER') {
      setMsg('Hanya owner yang bisa generate payroll.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      await generatePayrollForMonth({ businessId: bid, tenantId, month, cashiers });
      setMsg('Payroll berhasil dibuat.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gagal generate payroll.');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    if (!latestLines || !cashiers || latestLines.length === 0) return;
    const csv = payrollLinesToCsv({ lines: latestLines, cashiers });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payroll-${currentBusiness?.name ?? 'Business'}-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalGross = (latestLines ?? []).reduce((s, l) => s + (l.grossPay ?? 0), 0);

  return (
    <StoreScopedContainer>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-wrap items-end gap-3 justify-between">
              <div>
                <h1 className="text-lg font-bold">Payroll</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Generate payroll per bulan berdasarkan absensi (sesi kasir).
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-gray-500">Bulan</label>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="block mt-1 rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-sm bg-transparent"
                  />
                </div>
                <button
                  type="button"
                  disabled={busy || !bid}
                  onClick={generate}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold',
                    busy ? 'bg-gray-200 text-gray-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  )}
                >
                  Generate
                </button>
                <button
                  type="button"
                  disabled={!latestLines || latestLines.length === 0}
                  onClick={exportCsv}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold border',
                    !latestLines || latestLines.length === 0
                      ? 'bg-gray-100 text-gray-400 border-gray-200'
                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900'
                  )}
                >
                  Export CSV
                </button>
              </div>
            </div>
            {msg && <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">{msg}</div>}
            {latestRun && (
              <div className="mt-4 text-xs text-gray-500">
                Run terakhir: {new Date(latestRun.generatedAt).toLocaleString('id-ID')} • Total: {formatCurrency(totalGross)}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <p className="text-sm font-semibold">Profil gaji (per kasir)</p>
              <p className="text-xs text-gray-500 mt-1">Base salary bulanan + tarif per jam (opsional).</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-left">
                  <tr>
                    <th className="p-3">Kasir</th>
                    <th className="p-3 text-right">Gaji pokok/bulan</th>
                    <th className="p-3 text-right">Tarif/jam</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {(cashiers ?? []).map((c) => {
                    if (!c.id) return null;
                    const v = effective.get(c.id)!;
                    const dirty = Boolean(draft[c.id]);
                    return (
                      <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="p-3">{c.name}</td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            value={v.baseSalaryMonthly}
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                [c.id!]: {
                                  baseSalaryMonthly: Number(e.target.value || 0),
                                  hourlyRate: v.hourlyRate,
                                },
                              }))
                            }
                            className="w-36 text-right rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1.5 bg-transparent"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            value={v.hourlyRate}
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                [c.id!]: {
                                  baseSalaryMonthly: v.baseSalaryMonthly,
                                  hourlyRate: Number(e.target.value || 0),
                                },
                              }))
                            }
                            className="w-28 text-right rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1.5 bg-transparent"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            disabled={!dirty || !bid}
                            onClick={() => saveProfile(c.id!)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold border',
                              !dirty ? 'bg-gray-50 text-gray-400 border-gray-200' : 'bg-white hover:bg-gray-50 border-gray-200'
                            )}
                          >
                            Simpan
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {(cashiers ?? []).length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-gray-500" colSpan={4}>
                        Belum ada kasir.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <p className="text-sm font-semibold">Hasil payroll ({month})</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-left">
                  <tr>
                    <th className="p-3">Kasir</th>
                    <th className="p-3 text-right">Hari kerja</th>
                    <th className="p-3 text-right">Total jam</th>
                    <th className="p-3 text-right">Gross pay</th>
                  </tr>
                </thead>
                <tbody>
                  {(latestLines ?? []).map((l) => {
                    const name = (cashiers ?? []).find((c) => c.id === l.cashierId)?.name ?? 'Kasir';
                    return (
                      <tr key={l.id} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="p-3">{name}</td>
                        <td className="p-3 text-right tabular-nums">{l.daysWorked}</td>
                        <td className="p-3 text-right tabular-nums">{l.totalHours}</td>
                        <td className="p-3 text-right font-semibold tabular-nums">{formatCurrency(l.grossPay)}</td>
                      </tr>
                    );
                  })}
                  {(latestLines ?? []).length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-gray-500" colSpan={4}>
                        Belum ada payroll untuk bulan ini. Klik Generate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </StoreScopedContainer>
  );
}

