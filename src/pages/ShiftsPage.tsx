import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Clock,
  Users,
  Calculator,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { db, type Cashier, type CashierSession, type Shift } from '../lib/db';
import { useAuthStore } from '../lib/store';
import { formatCurrency } from '../lib/utils';
import { PAYMENT_METHOD_LABELS } from '../lib/utils';
import { computeSessionCloseSummary } from '../lib/shiftCloseHelpers';
import { logActivity } from '../lib/activityLog';

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function ShiftsPage() {
  const { currentBusiness, currentTenant, currentUser } = useAuthStore();
  const bid = currentBusiness?.id!;
  const tid = currentTenant?.id!;
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [shiftEdit, setShiftEdit] = useState<Partial<Shift> & { mode?: 'new' } | null>(null);
  const [closeSession, setCloseSession] = useState<CashierSession | null>(null);
  const [actualCash, setActualCash] = useState('');
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  const shifts = useLiveQuery(
    () => (currentBusiness?.id ? db.shifts.where('businessId').equals(bid).toArray() : []),
    [bid, currentBusiness?.id]
  );
  const cashiers = useLiveQuery(
    () => (bid ? db.cashiers.where('businessId').equals(bid).filter((c) => c.isActive).toArray() : []),
    [bid]
  );
  const assignments = useLiveQuery(
    () => (bid ? db.shiftAssignments.where('businessId').equals(bid).toArray() : []),
    [bid]
  );
  const activeSessions = useLiveQuery(
    () =>
      bid
        ? db.cashierSessions
            .where('businessId')
            .equals(bid)
            .filter((s) => s.status === 'ACTIVE')
            .toArray()
        : [],
    [bid]
  );

  const assignsByKey = useMemo(() => {
    const m = new Map<string, string>();
    (assignments ?? []).forEach((a) => {
      m.set(`${a.date}:${a.shiftId}`, a.cashierId);
    });
    return m;
  }, [assignments]);

  const cashierById = useMemo(() => {
    const m = new Map<string, Cashier>();
    (cashiers ?? []).forEach((c) => c.id && m.set(c.id, c));
    return m;
  }, [cashiers]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const setAssignment = async (dateStr: string, shiftId: string, cashierId: string) => {
    const existing = await db.shiftAssignments
      .where('businessId')
      .equals(bid)
      .filter((a) => a.date === dateStr && a.shiftId === shiftId)
      .first();
    if (!cashierId) {
      if (existing?.id) await db.shiftAssignments.delete(existing.id);
      return;
    }
    if (existing?.id) {
      await db.shiftAssignments.update(existing.id, { cashierId });
    } else {
      await db.shiftAssignments.add({
        id: crypto.randomUUID(),
        businessId: bid,
        tenantId: tid,
        shiftId,
        cashierId,
        date: dateStr,
        createdAt: new Date(),
      });
    }
  };

  const saveShift = async () => {
    if (!shiftEdit?.name?.trim()) return;
    if (shiftEdit.mode === 'new') {
      await db.shifts.add({
        id: crypto.randomUUID(),
        businessId: bid,
        name: shiftEdit.name.trim(),
        startTime: shiftEdit.startTime || '07:00',
        endTime: shiftEdit.endTime || '15:00',
        isActive: true,
      });
    } else if (shiftEdit.id) {
      await db.shifts.update(shiftEdit.id, {
        name: shiftEdit.name?.trim(),
        startTime: shiftEdit.startTime,
        endTime: shiftEdit.endTime,
        isActive: shiftEdit.isActive ?? true,
      });
    }
    setShiftEdit(null);
  };

  const liveDuration = (s: CashierSession) => {
    const ms = Date.now() - new Date(s.clockIn).getTime();
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return `${h}j ${m}m`;
  };

  const shiftRevenue = async (s: CashierSession) => {
    const end = new Date();
    const txs = await db.transactions
      .where('businessId')
      .equals(bid)
      .filter(
        (t) =>
          t.cashierId === s.cashierId &&
          t.status === 'COMPLETED' &&
          new Date(t.createdAt) >= new Date(s.clockIn) &&
          new Date(t.createdAt) <= end
      )
      .toArray();
    return txs.reduce((sum, t) => sum + t.total, 0);
  };

  const [revMap, setRevMap] = useState<Record<string, number>>({});
  React.useEffect(() => {
    let cancel = false;
    (async () => {
      if (!activeSessions?.length) {
        setRevMap({});
        return;
      }
      const next: Record<string, number> = {};
      for (const s of activeSessions) {
        if (!s.id) continue;
        next[s.id] = await shiftRevenue(s);
      }
      if (!cancel) setRevMap(next);
    })();
    return () => {
      cancel = true;
    };
  }, [activeSessions, bid]);

  const confirmClose = async () => {
    if (!closeSession?.id || !currentUser?.id) return;
    const cash = Number(actualCash.replace(/\./g, '')) || 0;
    const clockIn = new Date(closeSession.clockIn);
    const summary = await computeSessionCloseSummary(bid, closeSession.cashierId, clockIn);
    const variance = cash - summary.expectedCash;
    await db.shiftCloses.add({
      id: crypto.randomUUID(),
      businessId: bid,
      tenantId: tid,
      cashierId: closeSession.cashierId,
      cashierSessionId: closeSession.id,
      expectedCash: summary.expectedCash,
      actualCash: cash,
      variance,
      transactionCount: summary.transactionCount,
      voidCount: summary.voidCount,
      totalRevenue: summary.totalRevenue,
      paymentBreakdownJson: JSON.stringify(summary.paymentBreakdown),
      closedAt: new Date(),
      closedBy: 'OWNER',
    });
    await db.cashierSessions.update(closeSession.id, {
      clockOut: new Date(),
      status: 'CLOSED',
    });
    await logActivity({
      tenantId: tid,
      businessId: bid,
      actorType: 'OWNER',
      actorId: currentUser.id,
      action: 'SHIFT_CLOSE',
      entityType: 'SESSION',
      entityId: closeSession.id,
      description: `Tutup shift kasir — selisih kas ${formatCurrency(variance)}`,
      metadata: { expectedCash: summary.expectedCash, actualCash: cash },
    });
    setCloseSession(null);
    setActualCash('');
  };

  if (!currentBusiness?.id) {
    return (
      <div className="p-8">
        <Link to="/dashboard" className="text-emerald-600">
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">Manajemen Shift</h1>
      </header>

      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Pengaturan shift
            </h2>
            <button
              type="button"
              onClick={() =>
                setShiftEdit({ mode: 'new', name: '', startTime: '07:00', endTime: '21:00' })
              }
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Buat shift
            </button>
          </div>
          <div className="space-y-2">
            {(shifts ?? []).map((sh) => (
              <div
                key={sh.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-gray-100 dark:border-gray-700"
              >
                <div>
                  <p className="font-medium">{sh.name}</p>
                  <p className="text-sm text-gray-500">
                    {sh.startTime} – {sh.endTime}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShiftEdit({ ...sh, mode: undefined })}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap justify-between gap-3 mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> Jadwal kasir
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekStart((w) => addDays(w, -7))}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-[180px] text-center">
                {weekDays[0].toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} –{' '}
                {weekDays[6].toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <button
                type="button"
                onClick={() => setWeekStart((w) => addDays(w, 7))}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'weekly' | 'monthly')}
                className="rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1 text-sm"
              >
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan (grid sama, navigasi minggu)</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Pilih kasir per sel (bukan drag–drop): praktis di mobile &amp; desktop.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b">Shift \\ Hari</th>
                  {weekDays.map((d) => (
                    <th key={ymd(d)} className="p-2 border-b text-center">
                      {d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(shifts ?? []).map((sh) => (
                  <tr key={sh.id}>
                    <td className="p-2 border-b font-medium whitespace-nowrap">
                      {sh.name}
                      <br />
                      <span className="text-gray-500 font-normal">
                        {sh.startTime}-{sh.endTime}
                      </span>
                    </td>
                    {weekDays.map((d) => {
                      const key = `${ymd(d)}:${sh.id!}`;
                      const cid = assignsByKey.get(key) ?? '';
                      return (
                        <td key={key} className="p-1 border-b align-top">
                          <select
                            value={cid}
                            onChange={(e) => setAssignment(ymd(d), sh.id!, e.target.value)}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-1 py-1.5 text-[11px]"
                          >
                            <option value="">—</option>
                            {(cashiers ?? []).map((c) => (
                              <option key={c.id} value={c.id!}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> Shift aktif
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {(activeSessions ?? []).length === 0 && (
              <p className="text-sm text-gray-500">Tidak ada kasir yang sedang clock-in.</p>
            )}
            {(activeSessions ?? []).map((s) => {
              const c = cashierById.get(s.cashierId);
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-4"
                >
                  <p className="font-semibold">{c?.name ?? s.cashierId}</p>
                  <p className="text-xs text-gray-600">Mulai: {new Date(s.clockIn).toLocaleString('id-ID')}</p>
                  <p className="text-sm mt-1">Durasi: {liveDuration(s)}</p>
                  <p className="text-sm font-medium text-emerald-700">
                    Omzet sesi: {formatCurrency(revMap[s.id!] ?? 0)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCloseSession(s)}
                    className="mt-3 w-full py-2 rounded-lg bg-gray-900 text-white text-sm font-medium"
                  >
                    Tutup shift (kas)
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {shiftEdit && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full space-y-3 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold">{shiftEdit.mode === 'new' ? 'Shift baru' : 'Edit shift'}</h3>
            <input
              placeholder="Nama"
              value={shiftEdit.name ?? ''}
              onChange={(e) => setShiftEdit({ ...shiftEdit, name: e.target.value })}
              className="w-full rounded-xl border px-3 py-2"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                value={shiftEdit.startTime ?? '07:00'}
                onChange={(e) => setShiftEdit({ ...shiftEdit, startTime: e.target.value })}
                className="rounded-xl border px-3 py-2"
              />
              <input
                type="time"
                value={shiftEdit.endTime ?? '15:00'}
                onChange={(e) => setShiftEdit({ ...shiftEdit, endTime: e.target.value })}
                className="rounded-xl border px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShiftEdit(null)} className="flex-1 py-2 border rounded-xl">
                Batal
              </button>
              <button
                type="button"
                onClick={saveShift}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-semibold"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {closeSession && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full space-y-4 border border-gray-200 dark:border-gray-700 shadow-xl">
            <h3 className="font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5" /> Tutup shift — hitung kas
            </h3>
            <CloseShiftPreview bid={bid} session={closeSession} />
            <div>
              <label className="text-xs text-gray-500">Uang di laci (aktual)</label>
              <input
                inputMode="numeric"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
                placeholder="Rp"
              />
            </div>
            <p className="text-xs text-gray-500">
              Selisih dicatat otomatis. Ringkasan bisa dicetak dari browser (Ctrl+P).
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCloseSession(null);
                  setActualCash('');
                }}
                className="flex-1 py-3 border rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  void confirmClose();
                }}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold"
              >
                Simpan &amp; tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CloseShiftPreview({ bid, session }: { bid: string; session: CashierSession }) {
  const [sum, setSum] = useState<{
    expectedCash: number;
    tx: number;
    voids: number;
    total: number;
    br: Record<string, number>;
  } | null>(null);

  React.useEffect(() => {
    let c = false;
    (async () => {
      const s = await computeSessionCloseSummary(bid, session.cashierId, new Date(session.clockIn));
      if (!c)
        setSum({
          expectedCash: s.expectedCash,
          tx: s.transactionCount,
          voids: s.voidCount,
          total: s.totalRevenue,
          br: s.paymentBreakdown as Record<string, number>,
        });
    })();
    return () => {
      c = true;
    };
  }, [bid, session]);

  if (!sum) return <p className="text-sm text-gray-500">Menghitung…</p>;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-600 p-3 text-sm space-y-1" id="shift-close-print">
      <p>
        <span className="text-gray-500">Kas diharapkan (tunai):</span>{' '}
        <span className="font-semibold">{formatCurrency(sum.expectedCash)}</span>
      </p>
      <p>
        Transaksi: {sum.tx} · Void: {sum.voids} · Omzet: {formatCurrency(sum.total)}
      </p>
      <div className="text-xs text-gray-600">
        {Object.entries(sum.br).map(([k, v]) => (
          <div key={k}>
            {PAYMENT_METHOD_LABELS[k] ?? k}: {formatCurrency(v)}
          </div>
        ))}
      </div>
    </div>
  );
}
