import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, Lock, LogOut, Store, X, AlertTriangle, Wallet, Printer, User } from 'lucide-react';
import { db, type ActivityLog, type StoreDay, type TaskColumn, type TaskItem } from '../../lib/db';
import { useAuthStore } from '../../lib/store';
import { cn, formatCurrency } from '../../lib/utils';
import { computeDayCloseSummary } from '../../lib/shiftCloseHelpers';
import { logActivity } from '../../lib/activityLog';

interface CashierDashboardScreenProps {
  onGoToPOS: () => void;
  onSwitchCashier: () => void;
}

export default function CashierDashboardScreen({ onGoToPOS, onSwitchCashier }: CashierDashboardScreenProps) {
  const { currentBusiness, currentCashier } = useAuthStore();
  const bid = currentBusiness?.id;

  const todayYmd = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }, []);

  const storeDay = useLiveQuery(
    () =>
      bid
        ? db.storeDays
            .where('businessId')
            .equals(bid)
            .filter((sd) => sd.dateYmd === todayYmd)
            .first()
        : Promise.resolve(undefined as unknown as StoreDay | undefined),
    [bid, todayYmd]
  );

  const isStoreOpen = !!storeDay && storeDay.status === 'OPEN';
  const [nowTs, setNowTs] = useState(() => Date.now());

  const todayRange = useMemo(() => {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    const e = new Date();
    e.setHours(23, 59, 59, 999);
    return { s, e };
  }, []);

  const txToday = useLiveQuery(
    () =>
      bid
        ? db.transactions
            .where('businessId')
            .equals(bid)
            .filter((t) => {
              const d = new Date(t.createdAt);
              return t.status === 'COMPLETED' && d >= todayRange.s && d <= todayRange.e;
            })
            .toArray()
        : [],
    [bid, todayRange.s.getTime(), todayRange.e.getTime()]
  );

  const lowStock = useLiveQuery(
    () =>
      bid
        ? db.products
            .where('businessId')
            .equals(bid)
            .filter((p) => p.isActive && p.stockQuantity <= p.minStockAlert)
            .toArray()
        : [],
    [bid]
  );

  const myTasks = useLiveQuery(
    () =>
      bid && currentCashier?.id
        ? db.tasks
            .where('businessId')
            .equals(bid)
            .filter((t: TaskItem) => {
              try {
                const ids = JSON.parse(t.assigneeCashierIdsJson || '[]') as string[];
                return Array.isArray(ids) && ids.includes(currentCashier.id!);
              } catch {
                return false;
              }
            })
            .toArray()
        : [],
    [bid, currentCashier?.id]
  ) as TaskItem[] | undefined;

  const columns = useLiveQuery(
    () => (bid ? db.taskColumns.where('businessId').equals(bid).toArray() : []),
    [bid]
  ) as TaskColumn[] | undefined;

  const sortedColumns = useMemo(() => {
    const list = [...(columns ?? [])];
    list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return list;
  }, [columns]);

  const firstColumnId = sortedColumns[0]?.id;

  useEffect(() => {
    if (!bid || !currentBusiness?.tenantId) return;
    if (columns === undefined) return;
    if (columns.length > 0) return;
    void (async () => {
      const now = new Date();
      const base = [
        { title: 'To do', sortOrder: 10 },
        { title: 'Process', sortOrder: 20 },
        { title: 'Done', sortOrder: 30 },
      ];
      for (const c of base) {
        await db.taskColumns.add({
          id: crypto.randomUUID(),
          tenantId: currentBusiness.tenantId,
          businessId: bid,
          title: c.title,
          sortOrder: c.sortOrder,
          kind: 'DEFAULT',
          createdAt: now,
          updatedAt: now,
        });
      }
    })();
  }, [bid, columns, currentBusiness?.tenantId]);

  const omzet = useMemo(() => (txToday ?? []).reduce((s, t) => s + t.total, 0), [txToday]);
  const cashSales = useMemo(
    () => (txToday ?? []).filter((t) => t.paymentMethod === 'CASH').reduce((s, t) => s + t.total, 0),
    [txToday]
  );
  const expectedDrawer = (storeDay?.status === 'OPEN' ? storeDay.openingCash + cashSales : undefined);
  const lastActualCash = storeDay?.status === 'CLOSED' ? storeDay.actualCash : undefined;
  const lastVariance = storeDay?.status === 'CLOSED' ? storeDay.variance : undefined;
  const workMs = storeDay?.status === 'OPEN' ? Math.max(0, nowTs - new Date(storeDay.openedAt).getTime()) : 0;
  const workH = Math.floor(workMs / 3_600_000);
  const workM = Math.floor((workMs % 3_600_000) / 60_000);
  const workTimerText = storeDay?.status === 'OPEN' ? `${workH}j ${String(workM).padStart(2, '0')}m` : '—';

  const [openStoreOpen, setOpenStoreOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [closeStoreOpen, setCloseStoreOpen] = useState(false);
  const [closingCash, setClosingCash] = useState('');
  const [closeSummary, setCloseSummary] = useState<Awaited<ReturnType<typeof computeDayCloseSummary>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [waDraft, setWaDraft] = useState('');
  const [postCloseOpnameOpen, setPostCloseOpnameOpen] = useState(false);

  const moveTask = async (taskId: string, columnId: string) => {
    await db.tasks.update(taskId, { columnId, updatedAt: new Date() });
  };

  useEffect(() => {
    if (!bid) return;
    if (storeDay === undefined) return;
    setOpenStoreOpen(!storeDay);
  }, [bid, storeDay]);

  useEffect(() => {
    if (storeDay?.status !== 'OPEN') return;
    const t = setInterval(() => setNowTs(Date.now()), 1_000);
    return () => clearInterval(t);
  }, [storeDay?.status]);

  const storeDayLogs = useLiveQuery(
    () =>
      bid
        ? db.activityLogs
            .where('businessId')
            .equals(bid)
            .filter((a: ActivityLog) => {
              if (a.action !== 'STORE_OPEN' && a.action !== 'STORE_CLOSE') return false;
              const dateYmd = (a.metadata as any)?.dateYmd;
              return dateYmd === todayYmd;
            })
            .toArray()
        : [],
    [bid, todayYmd]
  ) as ActivityLog[] | undefined;

  const storeDayLogsSorted = useMemo(() => {
    const list = [...(storeDayLogs ?? [])];
    list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return list.slice(0, 10);
  }, [storeDayLogs]);

  useEffect(() => {
    setWaDraft(currentCashier?.whatsapp ?? '');
  }, [currentCashier?.whatsapp]);

  const saveProfile = async () => {
    if (!currentCashier?.id) return;
    setBusy(true);
    setErr('');
    try {
      await db.cashiers.update(currentCashier.id, { whatsapp: waDraft.trim() || undefined });
      setEditProfileOpen(false);
    } catch (e: any) {
      setErr(e?.message || 'Gagal simpan profil.');
    } finally {
      setBusy(false);
    }
  };

  const openStore = async () => {
    if (!bid || !currentBusiness?.tenantId || !currentCashier?.id) return;
    setBusy(true);
    setErr('');
    try {
      const cash = Number(String(openingCash).replace(/\./g, '')) || 0;
      if (!Number.isFinite(cash) || cash < 0) throw new Error('Modal awal tidak valid.');
      const openedAt = new Date();
      await db.storeDays.add({
        id: crypto.randomUUID(),
        tenantId: currentBusiness.tenantId,
        businessId: bid,
        dateYmd: todayYmd,
        status: 'OPEN',
        openedAt,
        openedByOwnerId: currentCashier.id,
        openingCash: cash,
        updatedAt: new Date(),
      });
      await logActivity({
        tenantId: currentBusiness.tenantId,
        businessId: bid,
        actorType: 'CASHIER',
        actorId: currentCashier.id,
        action: 'STORE_OPEN',
        entityType: 'STORE_DAY',
        entityId: todayYmd,
        description: `Buka toko — modal awal ${formatCurrency(cash)}`,
        metadata: { dateYmd: todayYmd, openingCash: cash },
      });
      setOpenStoreOpen(false);
      setOpeningCash('');
      onGoToPOS();
    } catch (e: any) {
      setErr(e?.message || 'Gagal buka toko.');
    } finally {
      setBusy(false);
    }
  };

  const openClose = async () => {
    if (!bid || !storeDay || storeDay.status !== 'OPEN') return;
    setCloseStoreOpen(true);
    setBusy(true);
    setErr('');
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      const summary = await computeDayCloseSummary(bid, start, end, storeDay.openingCash);
      setCloseSummary(summary);
    } catch (e: any) {
      setErr(e?.message || 'Gagal hitung ringkasan.');
    } finally {
      setBusy(false);
    }
  };

  const closeStore = async () => {
    if (!bid || !storeDay?.id || storeDay.status !== 'OPEN' || !closeSummary || !currentCashier?.id) return;
    setBusy(true);
    setErr('');
    try {
      const cash = Number(String(closingCash).replace(/\./g, '')) || 0;
      if (!Number.isFinite(cash) || cash < 0) throw new Error('Kas fisik tidak valid.');
      const variance = cash - closeSummary.expectedDrawerCash;
      const closedAt = new Date();
      await db.storeDays.update(storeDay.id, {
        status: 'CLOSED',
        closedAt,
        closedByOwnerId: currentCashier.id,
        actualCash: cash,
        expectedCash: closeSummary.expectedDrawerCash,
        variance,
        summaryJson: JSON.stringify(closeSummary),
        updatedAt: new Date(),
      });
      await logActivity({
        tenantId: currentBusiness!.tenantId,
        businessId: bid,
        actorType: 'CASHIER',
        actorId: currentCashier.id,
        action: 'STORE_CLOSE',
        entityType: 'STORE_DAY',
        entityId: storeDay.id,
        description: `Tutup toko — selisih kas ${formatCurrency(variance)}`,
        metadata: {
          dateYmd: todayYmd,
          expectedDrawerCash: closeSummary.expectedDrawerCash,
          actualCash: cash,
          variance,
          closedAt: closedAt.toISOString(),
        },
      });
      setCloseStoreOpen(false);
      setClosingCash('');
      setCloseSummary(null);
      if (currentBusiness?.requireStockOpnameAfterClose) {
        setPostCloseOpnameOpen(true);
      }
    } catch (e: any) {
      setErr(e?.message || 'Gagal tutup toko.');
    } finally {
      setBusy(false);
    }
  };

  if (!currentBusiness?.id || !currentCashier?.id) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <p className="text-sm text-gray-500">Kasir belum dipilih.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Store className="w-6 h-6 text-brand-600" />
              Dashboard Kasir
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentBusiness.name} • {currentCashier.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onSwitchCashier}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-white/60 dark:hover:bg-gray-800/60"
            title="Ganti kasir"
          >
            <LogOut className="w-4 h-4" />
            Ganti Kasir
          </button>
        </div>

        <div className="mt-6">
          <div className="rounded-3xl border-2 border-brand-200 dark:border-brand-900/40 bg-gradient-to-br from-brand-600 to-emerald-600 text-white p-5 md:p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white/80 text-sm">Kontrol Operasional</p>
                <p className="mt-1 font-extrabold text-xl md:text-2xl">
                  {storeDay?.status === 'OPEN' ? 'Toko Sedang Buka' : storeDay?.status === 'CLOSED' ? 'Toko Sudah Tutup' : 'Toko Belum Dibuka'}
                </p>
                <p className="mt-2 text-sm text-white/85">
                  Jam kerja (sejak buka): <span className="font-bold">{workTimerText}</span>
                </p>
                <p className="mt-1 text-[12px] text-white/80">
                  {storeDay?.openedAt ? `Buka: ${new Date(storeDay.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Buka: —'}{' '}
                  {storeDay?.closedAt ? `• Tutup: ${new Date(storeDay.closedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/75 text-xs">Kas laci (expected)</p>
                <p className="text-xl font-extrabold">{expectedDrawer === undefined ? '—' : formatCurrency(expectedDrawer)}</p>
                {typeof lastVariance === 'number' ? (
                  <p className="mt-1 text-xs text-white/80">Variance terakhir: {formatCurrency(lastVariance)}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              {storeDay?.status === 'OPEN' ? (
                <button
                  type="button"
                  onClick={() => void openClose()}
                  className="flex-1 py-3 rounded-2xl bg-white text-gray-900 font-extrabold hover:bg-white/90"
                >
                  Tutup Toko
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenStoreOpen(true)}
                  className="flex-1 py-3 rounded-2xl bg-white text-gray-900 font-extrabold hover:bg-white/90"
                  disabled={!!storeDay}
                  title={storeDay ? 'Toko sudah ada record hari ini' : 'Buka toko'}
                >
                  Buka Toko
                </button>
              )}

              <button
                type="button"
                onClick={onGoToPOS}
                disabled={!isStoreOpen}
                className="flex-1 py-3 rounded-2xl border border-white/30 bg-white/10 text-white font-extrabold hover:bg-white/15 disabled:opacity-50"
              >
                Masuk POS
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-bold text-white/85">Log buka/tutup toko</p>
              <div className="mt-2 space-y-1">
                {storeDayLogsSorted.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 text-[12px] text-white/85">
                    <span className="font-semibold">{a.action === 'STORE_OPEN' ? 'Buka' : 'Tutup'}</span>
                    <span className="text-white/80">{new Date(a.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
                {storeDayLogsSorted.length === 0 ? (
                  <p className="text-[12px] text-white/75">Belum ada log.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <KpiCard icon={Wallet} label="Omzet Hari Ini" value={formatCurrency(omzet)} sub={`${(txToday ?? []).length} transaksi`} />
          <KpiCard icon={Wallet} label="Total Cash Sales" value={formatCurrency(cashSales)} sub="Tunai (hari ini)" />
          <KpiCard
            icon={Wallet}
            label="Kas Laci (expected)"
            value={expectedDrawer === undefined ? '—' : formatCurrency(expectedDrawer)}
            sub={storeDay?.status === 'OPEN' ? 'Modal + cash sales' : 'Buka toko dulu'}
          />
          <KpiCard
            icon={AlertTriangle}
            label="Alert Stok"
            value={String((lowStock ?? []).length)}
            sub={(lowStock ?? []).length > 0 ? `Contoh: ${(lowStock ?? [])[0]?.name ?? ''}` : 'Aman'}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400">Toko Hari Ini</p>
            <p className={cn('mt-2 text-lg font-bold', isStoreOpen ? 'text-emerald-600' : 'text-gray-900 dark:text-white')}>
              {storeDay ? storeDay.status : 'BELUM DIBUKA'}
            </p>
            <div className="mt-4 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Modal awal</span>
                <span className="font-semibold text-gray-900 dark:text-white">{storeDay ? formatCurrency(storeDay.openingCash) : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Kas fisik terakhir (C)</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {typeof lastActualCash === 'number' ? formatCurrency(lastActualCash) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Variance terakhir</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {typeof lastVariance === 'number' ? formatCurrency(lastVariance) : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400">Shortcut</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditProfileOpen(true)}
                className="py-3 rounded-xl border border-gray-200 dark:border-gray-800 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Profil
              </button>
              <button
                type="button"
                onClick={onGoToPOS}
                disabled={!isStoreOpen}
                className="py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <Store className="w-4 h-4" />
                POS
              </button>
              <button
                type="button"
                onClick={() => void openClose()}
                disabled={!isStoreOpen}
                className="py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Tutup Toko
              </button>
            </div>
            <button
              type="button"
              disabled
              className="mt-3 w-full py-3 rounded-xl border border-gray-200 dark:border-gray-800 font-bold opacity-60 inline-flex items-center justify-center gap-2"
              title="Integrasi koneksi printer akan dihubungkan ke modul POS Settings berikutnya"
            >
              <Printer className="w-4 h-4" />
              Koneksi Printer (next)
            </button>
            {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Tugas Saya</p>
              <p className="text-xs text-gray-500 mt-1">Ditag oleh owner di Kanban.</p>
            </div>
            <span className="text-xs text-gray-500">{(myTasks ?? []).length} item</span>
          </div>
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
            {sortedColumns.map((col) => (
              <div key={col.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{col.title}</p>
                </div>
                <div className="p-2 space-y-2">
                  {(myTasks ?? [])
                    .filter((t) => (t.columnId || firstColumnId) === col.id)
                    .slice(0, 8)
                    .map((t) => (
                      <div key={t.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
                        <p className="font-semibold text-gray-900 dark:text-white">{t.title}</p>
                        {t.description ? (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">{t.description}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sortedColumns
                            .filter((c) => c.id && c.id !== col.id)
                            .slice(0, 2)
                            .map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => t.id && c.id && void moveTask(t.id, c.id)}
                                className="text-[11px] px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                → {c.title}
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  {(myTasks ?? []).filter((t) => (t.columnId || firstColumnId) === col.id).length === 0 ? (
                    <div className="p-3 text-xs text-gray-500">Kosong.</div>
                  ) : null}
                </div>
              </div>
            ))}
            {(myTasks ?? []).length === 0 ? <p className="text-sm text-gray-500">Belum ada tugas.</p> : null}
          </div>
        </div>
      </div>

      {openStoreOpen && !storeDay && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Buka Toko</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Masukkan modal uang receh untuk kembalian.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpenStoreOpen(false);
                  setErr('');
                }}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Modal awal (Rp)</label>
              <input
                inputMode="numeric"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0"
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-right text-lg font-bold"
              />
              {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
            </div>

            <button
              type="button"
              onClick={() => void openStore()}
              disabled={busy}
              className="mt-6 w-full py-3 rounded-2xl bg-brand-600 text-white font-bold hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? 'Memproses...' : 'Mulai Jualan'}
            </button>
          </div>
        </div>
      )}

      {closeStoreOpen && storeDay && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tutup Toko</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Hitung kas fisik di laci.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCloseStoreOpen(false);
                  setClosingCash('');
                  setCloseSummary(null);
                  setErr('');
                }}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Modal awal</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(storeDay.openingCash)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Expected cash sales</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {closeSummary ? formatCurrency(closeSummary.expectedCash) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Expected laci</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {closeSummary ? formatCurrency(closeSummary.expectedDrawerCash) : '—'}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Kas fisik (Rp)</label>
              <input
                inputMode="numeric"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="0"
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-right text-lg font-bold"
              />
              {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
            </div>

            <button
              type="button"
              onClick={() => void closeStore()}
              disabled={busy || !closeSummary}
              className="mt-6 w-full py-3 rounded-2xl bg-gray-900 text-white font-bold hover:bg-black disabled:opacity-50"
            >
              {busy ? 'Memproses...' : (
                <span className="inline-flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5" />
                  Tutup Toko Sekarang
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {editProfileOpen && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Profil Kasir</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{currentCashier?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="mt-5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">No WhatsApp</label>
              <input
                value={waDraft}
                onChange={(e) => setWaDraft(e.target.value)}
                placeholder="contoh: 62812xxxxxxx"
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
            </div>
            {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
            <button
              type="button"
              onClick={() => void saveProfile()}
              disabled={busy}
              className="mt-6 w-full py-3 rounded-2xl bg-brand-600 text-white font-bold hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      {postCloseOpnameOpen && (
        <div className="fixed inset-0 z-[85] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mulai Stock Opname?</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {currentBusiness?.requireStockOpnameAfterClose
                ? 'Stock opname diwajibkan setelah tutup toko.'
                : 'Kamu bisa mulai stock opname sekarang.'}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (currentBusiness?.requireStockOpnameAfterClose) return;
                  setPostCloseOpnameOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800"
                disabled={!!currentBusiness?.requireStockOpnameAfterClose}
              >
                Nanti
              </button>
              <button
                type="button"
                onClick={() => {
                  setPostCloseOpnameOpen(false);
                  // Route-based opname is owner dashboard; cashier flow will be implemented in Stock Opname UI next.
                  window.location.href = `/dashboard/stock-opname?fromClose=1&storeDayId=${encodeURIComponent(storeDay?.id ?? '')}`;
                }}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700"
              >
                Mulai Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{value}</p>
          {sub ? <p className="mt-1 text-xs text-gray-500">{sub}</p> : null}
        </div>
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-600" />
        </div>
      </div>
    </div>
  );
}

