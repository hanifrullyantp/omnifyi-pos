import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, ClipboardList, Search, X } from 'lucide-react';
import { db, type Business, type Material, type Product, type StockOpnameLine, type StockOpnameSession } from '../lib/db';
import { useAuthStore } from '../lib/store';
import { cn, formatCurrency } from '../lib/utils';
import { logActivity } from '../lib/activityLog';

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function StockOpnamePage() {
  const { currentBusiness, currentTenant, currentUser, currentCashier } = useAuthStore();
  const bid = currentBusiness?.id;
  const tid = currentTenant?.id;
  const location = useLocation();
  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const storeDayIdFromQuery = qs.get('storeDayId') || undefined;

  const actorType = currentUser?.role === 'OWNER' ? 'OWNER' : 'CASHIER';
  const actorId = actorType === 'OWNER' ? currentUser?.id : currentCashier?.id;
  const canApprove = currentUser?.role === 'OWNER' && !!currentUser?.id;

  const [q, setQ] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const products = useLiveQuery(
    () => (bid ? db.products.where('businessId').equals(bid).toArray() : []),
    [bid]
  );

  const materials = useLiveQuery(
    () => (bid ? db.materials.where('businessId').equals(bid).toArray() : []),
    [bid]
  );

  const draftSession = useLiveQuery(
    () =>
      bid
        ? db.stockOpnameSessions
            .where('businessId')
            .equals(bid)
            .filter((s) => s.status === 'DRAFT' && s.createdByActorType === actorType && s.createdByActorId === actorId)
            .first()
        : undefined,
    [bid, actorType, actorId]
  ) as StockOpnameSession | undefined;

  const lines = useLiveQuery(
    () => (draftSession?.id ? db.stockOpnameLines.where('sessionId').equals(draftSession.id).toArray() : []),
    [draftSession?.id]
  ) as StockOpnameLine[] | undefined;

  const lineByKey = useMemo(() => {
    const m = new Map<string, StockOpnameLine>();
    (lines ?? []).forEach((l) => m.set(`${l.itemType}:${l.itemId}`, l));
    return m;
  }, [lines]);

  const filtered = useMemo(() => {
    const prod = (products ?? []).filter((p) => p.isActive).map((p) => ({ type: 'PRODUCT' as const, id: p.id!, name: p.name, sku: p.sku, barcode: p.barcode, systemQty: p.stockQuantity, unit: p.unit, raw: p }));
    const mat = (materials ?? []).filter((m) => m.isActive).map((m) => ({ type: 'MATERIAL' as const, id: m.id!, name: m.name, sku: undefined, barcode: undefined, systemQty: m.stockQuantity, unit: m.unit, raw: m }));
    const list = [...prod, ...mat].filter((x) => !!x.id);
    const qq = q.trim().toLowerCase();
    if (!qq) return list;
    return list.filter((p) => {
      const hay = `${p.name} ${p.sku ?? ''} ${p.barcode ?? ''}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [products, materials, q]);

  const missingCount = useMemo(() => {
    const prod = (products ?? []).filter((p) => p.isActive && p.id).map((p) => `PRODUCT:${p.id}`);
    const mat = (materials ?? []).filter((m) => m.isActive && m.id).map((m) => `MATERIAL:${m.id}`);
    const list = [...prod, ...mat];
    if (!draftSession?.id) return 0;
    let miss = 0;
    for (const key of list) {
      if (!lineByKey.has(key)) miss++;
    }
    return miss;
  }, [products, materials, lineByKey, draftSession?.id]);

  const startOpname = async () => {
    if (!bid || !tid || !actorId) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const id = crypto.randomUUID();
      await db.stockOpnameSessions.add({
        id,
        tenantId: tid,
        businessId: bid,
        status: 'DRAFT',
        startedAt: new Date(),
        createdByActorType: actorType,
        createdByActorId: actorId,
        notes: notes.trim() || undefined,
        storeDayId: storeDayIdFromQuery,
      });
      setSuccess('Opname dimulai.');
    } catch (e: any) {
      setError(e?.message || 'Gagal memulai opname.');
    } finally {
      setBusy(false);
    }
  };

  const cancelDraft = async () => {
    if (!draftSession?.id) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await db.stockOpnameLines.where('sessionId').equals(draftSession.id).delete();
      await db.stockOpnameSessions.delete(draftSession.id);
      setSuccess('Draft opname dibatalkan.');
    } catch (e: any) {
      setError(e?.message || 'Gagal membatalkan draft.');
    } finally {
      setBusy(false);
    }
  };

  const upsertCount = async (
    item: { type: 'PRODUCT' | 'MATERIAL'; id: string; systemQty: number },
    countedRaw: string
  ) => {
    if (!draftSession?.id || !bid || !tid || !item.id) return;
    setError('');
    setSuccess('');
    const counted = Number(countedRaw);
    if (!Number.isFinite(counted) || counted < 0) {
      setError('Qty hitung harus angka >= 0.');
      return;
    }
    const systemQty = Number(item.systemQty ?? 0) || 0;
    const diffQty = counted - systemQty;
    const existing = lineByKey.get(`${item.type}:${item.id}`);
    if (existing?.id) {
      await db.stockOpnameLines.update(existing.id, { countedQty: counted, systemQty, diffQty });
    } else {
      await db.stockOpnameLines.add({
        id: crypto.randomUUID(),
        tenantId: tid,
        businessId: bid,
        sessionId: draftSession.id,
        itemType: item.type,
        itemId: item.id,
        systemQty,
        countedQty: counted,
        diffQty,
      });
    }
  };

  const approveSession = async (sessionId: string) => {
    if (!bid || !tid) return;
    const approverId = currentUser?.id ?? 'SYSTEM';
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const sess = await db.stockOpnameSessions.get(sessionId);
      if (!sess?.id) throw new Error('Session tidak ditemukan.');
      const sessLines = await db.stockOpnameLines.where('sessionId').equals(sessionId).toArray();
      const now = new Date();
      for (const line of sessLines) {
        if (!line.diffQty) continue;
        if (line.itemType === 'PRODUCT') {
          await db.stockAdjustments.add({
            id: crypto.randomUUID(),
            tenantId: tid,
            businessId: bid,
            productId: line.itemId,
            qtyDelta: line.diffQty,
            reason: 'OPNAME',
            refId: sessionId,
            createdAt: now,
            createdByOwnerId: approverId,
          });
          await db.products.update(line.itemId, { stockQuantity: line.countedQty });
        } else {
          await db.materialStockAdjustments.add({
            id: crypto.randomUUID(),
            tenantId: tid,
            businessId: bid,
            materialId: line.itemId,
            qtyDelta: line.diffQty,
            reason: 'OPNAME',
            refId: sessionId,
            createdAt: now,
            createdByOwnerId: approverId,
          });
          await db.materials.update(line.itemId, { stockQuantity: line.countedQty });
        }
      }
      await db.stockOpnameSessions.update(sessionId, {
        status: 'APPROVED',
        approvedAt: now,
        approvedByOwnerId: approverId,
        endedAt: sess.endedAt ?? now,
      });
      await logActivity({
        tenantId: tid,
        businessId: bid,
        actorType: currentUser?.role === 'OWNER' ? 'OWNER' : 'SYSTEM',
        actorId: approverId,
        action: 'STOCK_OPNAME_APPROVE',
        entityType: 'STOCK_OPNAME',
        entityId: sessionId,
        description: 'Stock opname disetujui dan stok diperbarui',
      });
      setSuccess('Disetujui. Stok sudah diperbarui.');
    } catch (e: any) {
      setError(e?.message || 'Gagal approve.');
    } finally {
      setBusy(false);
    }
  };

  const submitDraft = async () => {
    if (!draftSession?.id || !bid || !tid || !actorId) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const activeProducts = (products ?? []).filter((p) => p.isActive && p.id);
      const activeMaterials = (materials ?? []).filter((m) => m.isActive && m.id);
      if (activeProducts.length + activeMaterials.length === 0) throw new Error('Tidak ada item aktif.');
      if (missingCount > 0) throw new Error(`Masih ada ${missingCount} item belum dihitung.`);

      const now = new Date();
      await db.stockOpnameSessions.update(draftSession.id, { status: 'SUBMITTED', submittedAt: now, endedAt: now });
      await logActivity({
        tenantId: tid,
        businessId: bid,
        actorType: actorType as any,
        actorId: actorId,
        action: 'STOCK_OPNAME_SUBMIT',
        entityType: 'STOCK_OPNAME',
        entityId: draftSession.id,
        description: 'Stock opname disubmit untuk persetujuan',
      });

      const biz = (await db.businesses.get(bid)) as Business | undefined;
      if (biz?.stockOpnameAutoApprove) {
        await approveSession(draftSession.id);
      } else {
        setSuccess('Opname disubmit. Menunggu persetujuan owner.');
      }
    } catch (e: any) {
      setError(e?.message || 'Gagal submit.');
    } finally {
      setBusy(false);
    }
  };

  const submittedSessions = useLiveQuery(
    () =>
      bid
        ? db.stockOpnameSessions
            .where('businessId')
            .equals(bid)
            .filter((s) => s.status === 'SUBMITTED' && s.createdByActorType === 'CASHIER')
            .toArray()
        : [],
    [bid]
  ) as StockOpnameSession[] | undefined;

  if (!bid || !tid || !actorId) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-500">Pilih bisnis terlebih dulu.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-600" />
            Stock Opname (Full)
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Kasir mengisi opname (produk + bahan). Owner menyetujui untuk mengubah stok (kecuali auto-approve).
          </p>
        </div>
        {draftSession?.id ? (
          <button
            type="button"
            onClick={() => void cancelDraft()}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Batalkan
          </button>
        ) : null}
      </div>

      {canApprove && submittedSessions && submittedSessions.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-bold text-amber-900">Menunggu persetujuan</p>
          <div className="mt-3 space-y-2">
            {submittedSessions.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-white border border-amber-200 p-3">
                <div>
                  <p className="font-semibold text-gray-900">Session {s.id?.slice(0, 6)}</p>
                  <p className="text-xs text-gray-600">
                    Submit: {s.submittedAt ? new Date(s.submittedAt).toLocaleString('id-ID') : '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => s.id && void approveSession(s.id)}
                  disabled={busy}
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari produk / SKU / barcode..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm"
              />
            </div>
            {draftSession?.id ? (
              <div className="text-xs text-gray-500">
                Sisa belum dihitung: <span className="font-semibold">{missingCount}</span>
              </div>
            ) : null}
          </div>

          {!draftSession?.id ? (
            <div className="p-6 text-sm text-gray-600 dark:text-gray-400">
              Mulai sesi opname untuk bisa input hasil hitung.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((p) => {
                const line = p.id ? lineByKey.get(`${p.type}:${p.id}`) : undefined;
                const counted = line ? String(line.countedQty) : '';
                const diff = line ? line.diffQty : 0;
                return (
                  <div key={p.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {p.name}{' '}
                        <span className="text-xs font-medium text-gray-500">
                          ({p.type === 'PRODUCT' ? 'Produk' : 'Bahan'})
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        SKU: {p.sku || '—'} • Sistem: <span className="font-semibold">{p.systemQty}</span> {p.unit}
                      </p>
                    </div>
                    <div className="w-28">
                      <input
                        inputMode="numeric"
                        value={counted}
                        onChange={(e) => void upsertCount({ type: p.type, id: p.id, systemQty: p.systemQty }, e.target.value)}
                        placeholder="Qty"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-right text-sm font-semibold"
                      />
                      <p
                        className={cn(
                          'mt-1 text-[11px] text-right',
                          diff === 0 ? 'text-gray-400' : diff > 0 ? 'text-emerald-600' : 'text-red-600'
                        )}
                      >
                        {line ? `Selisih: ${diff > 0 ? '+' : ''}${diff}` : 'Belum dihitung'}
                      </p>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="p-6 text-sm text-gray-600 dark:text-gray-400">Tidak ada produk cocok.</div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h2 className="font-bold text-gray-900 dark:text-white">Kontrol</h2>

          {!draftSession?.id ? (
            <>
              <label className="block mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Catatan</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opsional: alasan, area, dll."
                className="mt-2 w-full min-h-[90px] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm"
              />
              <button
                type="button"
                onClick={() => void startOpname()}
                disabled={busy}
                className="mt-4 w-full py-2.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 disabled:opacity-50"
              >
                {busy ? 'Memproses...' : 'Mulai Opname'}
              </button>
            </>
          ) : (
            <>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <span className="font-semibold text-gray-900 dark:text-white">Tanggal:</span> {ymdLocal(new Date(draftSession.startedAt))}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-gray-900 dark:text-white">Status:</span> DRAFT
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-gray-900 dark:text-white">Belum dihitung:</span> {missingCount}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void submitDraft()}
                disabled={busy || missingCount > 0}
                className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? 'Memproses...' : (
                  <span className="inline-flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Submit (Minta Approve)
                  </span>
                )}
              </button>

              <p className="mt-3 text-xs text-gray-500">
                Finalisasi akan membuat audit trail penyesuaian stok dan mengubah stok sistem menjadi hasil hitung.
              </p>
            </>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-4 text-sm text-emerald-600">{success}</p>}

          {draftSession?.id && lines ? (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4 text-xs text-gray-500">
              Lines tersimpan: <span className="font-semibold">{lines.length}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

