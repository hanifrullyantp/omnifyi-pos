import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Calendar, List, Search, UserCircle } from 'lucide-react';
import { db } from '../lib/db';
import { useAuthStore } from '../lib/store';
import { cn, formatCurrency } from '../lib/utils';
import { ACTIVITY_ACTION_FILTERS, formatActivityAction } from '../lib/activityLog';
import { PAYMENT_METHOD_LABELS } from '../lib/utils';
import { exportAttendanceExcel, sessionsToAttendanceRows } from '../lib/attendanceExport';
import { logActivity } from '../lib/activityLog';

type HistoryTab = 'activity' | 'absensi';

export default function HistoryPage({ initialTab }: { initialTab?: HistoryTab } = {}) {
  const { currentBusiness, currentUser } = useAuthStore();
  const bid = currentBusiness?.id;
  const [tab, setTab] = useState<HistoryTab>(initialTab ?? 'activity');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [cashierFilter, setCashierFilter] = useState<string>('ALL');
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [absMonth, setAbsMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [calCashierId, setCalCashierId] = useState<string>('ALL');
  const [absActionMsg, setAbsActionMsg] = useState<string>('');
  const [absActionBusy, setAbsActionBusy] = useState(false);

  const cashiers = useLiveQuery(
    () => (bid ? db.cashiers.where('businessId').equals(bid).toArray() : []),
    [bid]
  );

  const logsRaw = useLiveQuery(
    () => (bid ? db.activityLogs.where('businessId').equals(bid).toArray() : []),
    [bid]
  );
  const logs = useMemo(() => {
    if (!logsRaw) return [];
    return [...logsRaw].sort(
      (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
    );
  }, [logsRaw]);

  const sessionsRaw = useLiveQuery(
    () => (bid ? db.cashierSessions.where('businessId').equals(bid).toArray() : []),
    [bid]
  );
  const sessions = useMemo(() => {
    if (!sessionsRaw) return [];
    return [...sessionsRaw].sort(
      (x, y) => new Date(y.clockIn).getTime() - new Date(x.clockIn).getTime()
    );
  }, [sessionsRaw]);

  const cashierName = useMemo(() => {
    const m = new Map<string, string>();
    (cashiers ?? []).forEach((c) => {
      if (c.id) m.set(c.id, c.name);
    });
    if (currentUser?.id) m.set(currentUser.id, `${currentUser.name} (Owner)`);
    return (id: string, type: 'OWNER' | 'CASHIER') =>
      type === 'OWNER' ? m.get(id) ?? 'Owner' : m.get(id) ?? 'Kasir';
  }, [cashiers, currentUser]);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    const start = new Date(dateStart);
    const end = new Date(dateEnd);
    end.setHours(23, 59, 59, 999);
    return logs.filter((l) => {
      const d = new Date(l.createdAt);
      if (d < start || d > end) return false;
      if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
      if (cashierFilter !== 'ALL' && l.actorId !== cashierFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const actor = cashierName(l.actorId, l.actorType).toLowerCase();
        if (!l.description.toLowerCase().includes(q) && !l.action.toLowerCase().includes(q) && !actor.includes(q))
          return false;
      }
      return true;
    });
  }, [logs, dateStart, dateEnd, actionFilter, cashierFilter, search, cashierName]);

  const [y, m0] = absMonth.split('-').map(Number);
  const absRangeStart = new Date(y, m0 - 1, 1);
  const absRangeEnd = new Date(y, m0, 0, 23, 59, 59, 999);

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter((s) => {
      const d = new Date(s.clockIn);
      if (d < absRangeStart || d > absRangeEnd) return false;
      if (calCashierId !== 'ALL' && s.cashierId !== calCashierId) return false;
      return true;
    });
  }, [sessions, absRangeStart, absRangeEnd, calCashierId]);

  const calendarMarks = useMemo(() => {
    const marks: Record<string, Set<string>> = {};
    filteredSessions.forEach((s) => {
      const day = new Date(s.clockIn).toISOString().slice(0, 10);
      if (!marks[day]) marks[day] = new Set();
      marks[day].add(s.cashierId);
    });
    return marks;
  }, [filteredSessions]);

  const monthlySummary = useMemo(() => {
    const map = new Map<string, { days: Set<string>; hours: number }>();
    filteredSessions.forEach((s) => {
      const cname = cashierName(s.cashierId, 'CASHIER');
      const day = new Date(s.clockIn).toISOString().slice(0, 10);
      const row = map.get(cname) ?? { days: new Set<string>(), hours: 0 };
      row.days.add(day);
      if (s.clockOut) {
        row.hours += (new Date(s.clockOut).getTime() - new Date(s.clockIn).getTime()) / 3_600_000;
      }
      map.set(cname, row);
    });
    return Array.from(map.entries()).map(([cashierName, v]) => ({
      cashierName,
      daysWorked: v.days.size,
      totalHours: Math.round(v.hours * 10) / 10,
    }));
  }, [filteredSessions, cashierName]);

  const exportAbsensi = () => {
    if (!currentBusiness || !cashiers) return;
    const rows = sessionsToAttendanceRows(filteredSessions, cashiers, bid!);
    exportAttendanceExcel({
      businessName: currentBusiness.name,
      monthLabel: absMonth,
      rows,
      monthlySummary,
    });
  };

  const canManageAttendance = useMemo(() => currentUser?.role === 'OWNER', [currentUser?.role]);

  const doClockIn = async () => {
    if (!bid || !currentBusiness) return;
    if (!canManageAttendance) return;
    if (calCashierId === 'ALL') {
      setAbsActionMsg('Pilih kasir terlebih dulu untuk clock-in.');
      return;
    }
    setAbsActionBusy(true);
    setAbsActionMsg('');
    try {
      const active = await db.cashierSessions
        .where('businessId')
        .equals(bid)
        .filter((s) => s.cashierId === calCashierId && s.status === 'ACTIVE')
        .first();
      if (active?.id) {
        setAbsActionMsg('Kasir ini masih ACTIVE. Lakukan clock-out dulu.');
        return;
      }

      const sessionId = crypto.randomUUID();
      const now = new Date();
      await db.cashierSessions.add({
        id: sessionId,
        cashierId: calCashierId,
        businessId: bid,
        clockIn: now,
        pinVerifiedAt: now,
        status: 'ACTIVE',
        deviceInfo: 'manual-attendance',
      });
      await logActivity({
        tenantId: currentBusiness.tenantId,
        businessId: bid,
        actorType: 'OWNER',
        actorId: currentUser?.id ?? 'OWNER',
        action: 'CLOCK_IN',
        entityType: 'SESSION',
        entityId: sessionId,
        description: `Clock-in manual untuk ${cashierName(calCashierId, 'CASHIER')}`,
        metadata: { cashierId: calCashierId, source: 'manual-attendance' },
      });
      setAbsActionMsg('Clock-in tersimpan.');
    } catch (e) {
      setAbsActionMsg(e instanceof Error ? e.message : 'Gagal clock-in.');
    } finally {
      setAbsActionBusy(false);
    }
  };

  const doClockOut = async () => {
    if (!bid || !currentBusiness) return;
    if (!canManageAttendance) return;
    if (calCashierId === 'ALL') {
      setAbsActionMsg('Pilih kasir terlebih dulu untuk clock-out.');
      return;
    }
    setAbsActionBusy(true);
    setAbsActionMsg('');
    try {
      const active = await db.cashierSessions
        .where('businessId')
        .equals(bid)
        .filter((s) => s.cashierId === calCashierId && s.status === 'ACTIVE')
        .first();
      if (!active?.id) {
        setAbsActionMsg('Tidak ada sesi ACTIVE untuk kasir ini.');
        return;
      }

      const now = new Date();
      await db.cashierSessions.update(active.id, { clockOut: now, status: 'CLOSED' });
      await logActivity({
        tenantId: currentBusiness.tenantId,
        businessId: bid,
        actorType: 'OWNER',
        actorId: currentUser?.id ?? 'OWNER',
        action: 'CLOCK_OUT',
        entityType: 'SESSION',
        entityId: active.id,
        description: `Clock-out manual untuk ${cashierName(calCashierId, 'CASHIER')}`,
        metadata: { cashierId: calCashierId, source: 'manual-attendance' },
      });
      setAbsActionMsg('Clock-out tersimpan.');
    } catch (e) {
      setAbsActionMsg(e instanceof Error ? e.message : 'Gagal clock-out.');
    } finally {
      setAbsActionBusy(false);
    }
  };

  if (!bid) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Link to="/dashboard" className="text-emerald-600">
          ← Dashboard
        </Link>
      </div>
    );
  }

  const daysInMonth = new Date(y, m0, 0).getDate();
  const firstWeekday = new Date(y, m0 - 1, 1).getDay();

  return (
    <div className="ui-page">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">History &amp; Activity</h1>
      </header>

      <div className="ui-container max-w-5xl space-y-6">
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
          <button
            type="button"
            onClick={() => setTab('activity')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              tab === 'activity' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-500'
            )}
          >
            <List className="w-4 h-4" /> Activity Log
          </button>
          <button
            type="button"
            onClick={() => setTab('absensi')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              tab === 'absensi' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-500'
            )}
          >
            <Calendar className="w-4 h-4" /> Absensi
          </button>
        </div>

        {tab === 'activity' && (
          <>
            <div className="flex flex-wrap gap-3 items-end bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 min-w-[200px] flex-1">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari deskripsi, aksi, nama…"
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Dari</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="block mt-1 rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Sampai</label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="block mt-1 rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Kasir</label>
                <select
                  value={cashierFilter}
                  onChange={(e) => setCashierFilter(e.target.value)}
                  className="block mt-1 rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-sm min-w-[140px]"
                >
                  <option value="ALL">Semua</option>
                  {(cashiers ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  {currentUser?.id && (
                    <option value={currentUser.id}>{currentUser.name} (Owner)</option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tipe</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="block mt-1 rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-sm min-w-[160px]"
                >
                  {ACTIVITY_ACTION_FILTERS.map((a) => (
                    <option key={a} value={a}>
                      {a === 'ALL' ? 'Semua' : formatActivityAction(a)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const meta = log.metadata as Record<string, unknown> | undefined;
                const total = meta?.total as number | undefined;
                const pm = meta?.paymentMethod as string | undefined;
                const inv = meta?.invoiceNumber as string | undefined;
                return (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                        <UserCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {cashierName(log.actorId, log.actorType)}{' '}
                          <span className="font-normal text-gray-500 text-sm">
                            ({log.actorType === 'CASHIER' ? 'Kasir' : 'Owner'})
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          🕐 {new Date(log.createdAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-2 font-medium">
                          {formatActivityAction(log.action)}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{log.description}</p>
                        {inv && (
                          <p className="text-xs text-gray-500 mt-1 font-mono">Invoice: {inv}</p>
                        )}
                        {typeof total === 'number' && (
                          <p className="text-sm mt-1">
                            Total: <span className="font-semibold">{formatCurrency(total)}</span>
                            {pm && (
                              <span className="text-gray-500">
                                {' '}
                                ({PAYMENT_METHOD_LABELS[pm] ?? pm})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredLogs.length === 0 && (
                <p className="text-center text-gray-500 py-12 text-sm">Tidak ada log untuk filter ini.</p>
              )}
            </div>
          </>
        )}

        {tab === 'absensi' && (
          <>
            <div className="flex flex-wrap gap-3 items-end bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <div>
                <label className="text-xs text-gray-500">Bulan</label>
                <input
                  type="month"
                  value={absMonth}
                  onChange={(e) => setAbsMonth(e.target.value)}
                  className="block mt-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Kasir</label>
                <select
                  value={calCashierId}
                  onChange={(e) => setCalCashierId(e.target.value)}
                  className="block mt-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm min-w-[160px]"
                >
                  <option value="ALL">Semua</option>
                  {(cashiers ?? []).map((c) => (
                    <option key={c.id} value={c.id!}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {canManageAttendance && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={absActionBusy}
                    onClick={doClockIn}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-semibold border',
                      absActionBusy
                        ? 'bg-gray-100 text-gray-400 border-gray-200'
                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900'
                    )}
                  >
                    Clock-in
                  </button>
                  <button
                    type="button"
                    disabled={absActionBusy}
                    onClick={doClockOut}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-semibold border',
                      absActionBusy
                        ? 'bg-gray-100 text-gray-400 border-gray-200'
                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900'
                    )}
                  >
                    Clock-out
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={exportAbsensi}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
              >
                Export Excel
              </button>
            </div>
            {absActionMsg && (
              <div className="text-sm text-gray-600 dark:text-gray-300 -mt-2">{absActionMsg}</div>
            )}

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                Kalender (hari dengan sesi)
              </p>
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-gray-500">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <div key={`e-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const key = `${y}-${String(m0).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const set = calendarMarks[key];
                  const active = set && set.size > 0;
                  return (
                    <div
                      key={key}
                      className={cn(
                        'aspect-square rounded-lg text-sm flex flex-col items-center justify-center border',
                        active
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-800 font-semibold'
                          : 'border-gray-100 dark:border-gray-700 text-gray-600'
                      )}
                    >
                      {day}
                      {active && <span className="text-[10px] leading-none">{set?.size} 👤</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
              <p className="p-4 text-sm font-medium border-b border-gray-100 dark:border-gray-700">
                List sesi
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-left">
                    <tr>
                      <th className="p-3">Kasir</th>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Masuk</th>
                      <th className="p-3">Keluar</th>
                      <th className="p-3 text-right">Durasi (jam)</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((s) => {
                      const inD = new Date(s.clockIn);
                      const outD = s.clockOut ? new Date(s.clockOut) : null;
                      const hrs = outD
                        ? Math.round(((outD.getTime() - inD.getTime()) / 3_600_000) * 10) / 10
                        : '—';
                      return (
                        <tr key={s.id} className="border-t border-gray-100 dark:border-gray-700">
                          <td className="p-3">{cashierName(s.cashierId, 'CASHIER')}</td>
                          <td className="p-3">{inD.toLocaleDateString('id-ID')}</td>
                          <td className="p-3">
                            {inD.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3">
                            {outD
                              ? outD.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </td>
                          <td className="p-3 text-right">{hrs}</td>
                          <td className="p-3">
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full',
                                s.status === 'ACTIVE' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                              )}
                            >
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredSessions.length === 0 && (
                  <p className="p-8 text-center text-gray-500 text-sm">Belum ada data sesi.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-sm font-medium mb-3">Ringkasan bulanan per kasir</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100 dark:border-gray-700">
                    <th className="pb-2">Kasir</th>
                    <th className="pb-2">Hari kerja</th>
                    <th className="pb-2 text-right">Total jam</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.map((r) => (
                    <tr key={r.cashierName} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-2">{r.cashierName}</td>
                      <td className="py-2">{r.daysWorked}</td>
                      <td className="py-2 text-right">{r.totalHours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {monthlySummary.length === 0 && (
                <p className="text-gray-500 text-sm py-4 text-center">Tidak ada ringkasan.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
