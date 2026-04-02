import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Building2,
  User,
  Users,
  Package,
  Bell,
  Printer,
  Database,
  CreditCard,
  Shield,
  RefreshCw,
  X,
} from 'lucide-react';
import { db, type Business, type Cashier, type PaymentManualAccount, type User as OwnerUser } from '../lib/db';
import { useAuthStore, useSyncStore } from '../lib/store';
import { formatCurrency } from '../lib/utils';
import { logActivity } from '../lib/activityLog';

const SECTIONS = [
  { id: 'account', label: 'Akun', icon: User },
  { id: 'business', label: 'Bisnis', icon: Building2 },
  { id: 'cashiers', label: 'Kasir', icon: Users },
  { id: 'products', label: 'Produk', icon: Package },
  { id: 'notify', label: 'Notifikasi', icon: Bell },
  { id: 'printer', label: 'Printer', icon: Printer },
  { id: 'data', label: 'Data & backup', icon: Database },
  { id: 'sync', label: 'Sync', icon: RefreshCw },
  { id: 'billing', label: 'Langganan', icon: CreditCard },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

export default function SettingsPage({ initialSection }: { initialSection?: SectionId } = {}) {
  const { currentUser, currentBusiness, currentTenant, setAuth, businesses } = useAuthStore();
  const [section, setSection] = useState<SectionId>(initialSection ?? 'account');
  const bid = currentBusiness?.id;
  const tid = currentTenant?.id;
  const pendingSyncs = useSyncStore((s) => s.pendingSyncs);
  const isSyncing = useSyncStore((s) => s.isSyncing);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const lastSyncError = useSyncStore((s) => s.lastSyncError);
  const lastSyncErrorCode = useSyncStore((s) => s.lastSyncErrorCode);
  const processSyncQueue = useSyncStore((s) => s.processSyncQueue);
  const clearSyncs = useSyncStore((s) => s.clearSyncs);

  const cashiers = useLiveQuery(
    () => (bid ? db.cashiers.where('businessId').equals(bid).toArray() : []),
    [bid]
  );

  const [ownerForm, setOwnerForm] = useState({
    name: '',
    email: '',
    password: '',
    twoFactor: false,
  });

  const [bizForm, setBizForm] = useState<Partial<Business>>({});
  const [manualAccountsOpen, setManualAccountsOpen] = useState(false);
  const [manualAccountDraft, setManualAccountDraft] = useState<Partial<PaymentManualAccount>>({
    type: 'EWALLET',
    provider: 'DANA',
    label: '',
    ownerName: '',
    accountNumber: '',
    instructions: '',
    isActive: true,
  });

  const manualAccounts = useLiveQuery(
    () =>
      bid
        ? db.paymentManualAccounts
            .where('businessId')
            .equals(bid)
            .toArray()
            .then((xs) =>
              xs.sort(
                (a, b) =>
                  Number(b.isActive) - Number(a.isActive) ||
                  (b.updatedAt?.getTime?.() ?? 0) - (a.updatedAt?.getTime?.() ?? 0),
              ),
            )
        : [],
    [bid],
  );

  useEffect(() => {
    if (currentUser) {
      setOwnerForm((f) => ({
        ...f,
        name: currentUser.name,
        email: currentUser.email,
        password: '',
        twoFactor: false,
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentBusiness) {
      setBizForm({
        ...currentBusiness,
        taxEnabled: currentBusiness.taxEnabled ?? true,
        serviceChargeEnabled: currentBusiness.serviceChargeEnabled ?? true,
        receiptShowTax: currentBusiness.receiptShowTax ?? true,
        notifyLowStock: currentBusiness.notifyLowStock ?? true,
        notifyDebtDue: currentBusiness.notifyDebtDue ?? true,
        emailDailySummary: currentBusiness.emailDailySummary ?? false,
        defaultProductTaxPercent: currentBusiness.defaultProductTaxPercent ?? currentBusiness.taxPercentage,
        skuAutoPrefix: currentBusiness.skuAutoPrefix ?? 'SKU',
        defaultUnit: currentBusiness.defaultUnit ?? 'pcs',
        printerPaperMm: currentBusiness.printerPaperMm ?? 58,
        requireStockOpnameAfterClose: currentBusiness.requireStockOpnameAfterClose ?? false,
        stockOpnameAutoApprove: currentBusiness.stockOpnameAutoApprove ?? false,
        manualPaymentEnabled: currentBusiness.manualPaymentEnabled ?? false,
        manualPaymentProofRequired: currentBusiness.manualPaymentProofRequired ?? false,
      });
    }
  }, [currentBusiness]);

  const saveOwner = async () => {
    if (!currentUser?.id) return;
    const patch: Partial<OwnerUser> = {
      name: ownerForm.name.trim(),
      email: ownerForm.email.trim(),
    };
    if (ownerForm.password.trim()) patch.passwordHash = ownerForm.password.trim();
    await db.users.update(currentUser.id, patch);
    const fresh = await db.users.get(currentUser.id);
    if (fresh && currentTenant && currentBusiness) {
      setAuth(fresh, currentTenant, currentBusiness, businesses);
    }
    await logActivity({
      tenantId: tid!,
      businessId: bid!,
      actorType: 'OWNER',
      actorId: currentUser.id,
      action: 'SETTINGS_UPDATE',
      entityType: 'USER',
      entityId: currentUser.id,
      description: 'Profil owner diperbarui',
    });
  };

  const saveBusiness = async () => {
    if (!currentBusiness?.id) return;
    await db.businesses.update(currentBusiness.id, {
      name: bizForm.name?.trim(),
      address: bizForm.address,
      phone: bizForm.phone,
      logoUrl: bizForm.logoUrl,
      taxPercentage: Number(bizForm.taxPercentage) || 0,
      serviceChargePercentage: Number(bizForm.serviceChargePercentage) || 0,
      receiptHeader: bizForm.receiptHeader,
      receiptFooter: bizForm.receiptFooter,
      taxEnabled: bizForm.taxEnabled,
      serviceChargeEnabled: bizForm.serviceChargeEnabled,
      receiptShowTax: bizForm.receiptShowTax,
      notifyLowStock: bizForm.notifyLowStock,
      notifyDebtDue: bizForm.notifyDebtDue,
      emailDailySummary: bizForm.emailDailySummary,
      defaultProductTaxPercent: Number(bizForm.defaultProductTaxPercent) || 0,
      skuAutoPrefix: bizForm.skuAutoPrefix,
      defaultUnit: bizForm.defaultUnit,
      printerPaperMm: bizForm.printerPaperMm,
      requireStockOpnameAfterClose: !!bizForm.requireStockOpnameAfterClose,
      stockOpnameAutoApprove: !!bizForm.stockOpnameAutoApprove,
      manualPaymentEnabled: !!bizForm.manualPaymentEnabled,
      manualPaymentProofRequired: !!bizForm.manualPaymentProofRequired,
    });
    const b = await db.businesses.get(currentBusiness.id);
    if (b && currentUser && currentTenant) setAuth(currentUser, currentTenant, b, businesses);
    await logActivity({
      tenantId: tid!,
      businessId: bid!,
      actorType: 'OWNER',
      actorId: currentUser!.id!,
      action: 'SETTINGS_UPDATE',
      entityType: 'BUSINESS',
      entityId: currentBusiness.id,
      description: 'Pengaturan bisnis diperbarui',
    });
  };

  const exportAll = async () => {
    if (!bid) return;
    const payload: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      businessId: bid,
    };
    const [products, categories, transactions, cashiersList, materials, activityLogs] = await Promise.all([
      db.products.where('businessId').equals(bid).toArray(),
      db.categories.where('businessId').equals(bid).toArray(),
      db.transactions.where('businessId').equals(bid).toArray(),
      db.cashiers.where('businessId').equals(bid).toArray(),
      db.materials.where('businessId').equals(bid).toArray(),
      db.activityLogs.where('businessId').equals(bid).toArray(),
    ]);
    payload.products = products;
    payload.categories = categories;
    payload.transactions = transactions;
    payload.cashiers = cashiersList;
    payload.materials = materials;
    payload.activityLogs = activityLogs;
    const txIds = transactions.map((x) => x.id!).filter(Boolean);
    if (txIds.length) {
      const allItems = await db.transactionItems.toArray();
      payload.transactionItems = allItems.filter((i) => txIds.includes(i.transactionId));
    } else {
      payload.transactionItems = [];
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup-${bid}.json`;
    a.click();
  };

  const dangerClear = async () => {
    if (!bid || !confirm('Hapus semua transaksi & item terkait untuk bisnis ini? Tidak bisa dibatalkan.')) return;
    const txs = await db.transactions.where('businessId').equals(bid).toArray();
    const ids = txs.map((t) => t.id!).filter(Boolean);
    if (ids.length) {
      await db.transactionItems.where('transactionId').anyOf(ids).delete();
    }
    await db.transactions.where('businessId').equals(bid).delete();
    await logActivity({
      tenantId: tid!,
      businessId: bid,
      actorType: 'OWNER',
      actorId: currentUser!.id!,
      action: 'SETTINGS_UPDATE',
      entityType: 'BUSINESS',
      description: 'Data transaksi bisnis dikosongkan (danger zone)',
    });
  };

  if (!bid || !currentUser) {
    return (
      <div className="p-8">
        <Link to="/dashboard" className="text-brand-600">
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#111827] text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-10 bg-white dark:bg-[#1F2937] border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5 text-brand-600" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Pengaturan</h1>
      </header>

      <div className="max-w-5xl mx-auto p-4 lg:p-8 flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-56 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                section === s.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-[#1F2937] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <s.icon className="w-4 h-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 space-y-6">
          {section === 'account' && (
            <Panel title="Pengaturan akun" icon={User}>
              <Field label="Nama">
                <input
                  value={ownerForm.name}
                  onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 dark:bg-gray-900"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={ownerForm.email}
                  onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 dark:bg-gray-900"
                />
              </Field>
              <Field label="Password baru (opsional)">
                <input
                  type="password"
                  value={ownerForm.password}
                  onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 dark:bg-gray-900"
                  placeholder="••••••••"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input type="checkbox" checked={ownerForm.twoFactor} disabled />
                Two-factor auth (belum tersedia offline-first)
              </label>
              <button
                type="button"
                onClick={() => void saveOwner()}
                className="px-4 py-3 rounded-lg bg-brand-600 text-white font-semibold min-h-[44px]"
              >
                Simpan akun
              </button>
            </Panel>
          )}

          {section === 'business' && (
            <Panel title="Pengaturan bisnis" icon={Building2}>
              <Field label="Nama usaha">
                <input
                  value={bizForm.name ?? ''}
                  onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                />
              </Field>
              <Field label="Alamat">
                <textarea
                  value={bizForm.address ?? ''}
                  onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600 min-h-[80px]"
                />
              </Field>
              <Field label="Telepon">
                <input
                  value={bizForm.phone ?? ''}
                  onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                />
              </Field>
              <Field label="Logo URL">
                <input
                  value={bizForm.logoUrl ?? ''}
                  onChange={(e) => setBizForm({ ...bizForm, logoUrl: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!bizForm.taxEnabled}
                    onChange={(e) => setBizForm({ ...bizForm, taxEnabled: e.target.checked })}
                  />
                  PPN aktif
                </label>
                <Field label="PPN %">
                  <input
                    type="number"
                    value={bizForm.taxPercentage ?? 0}
                    onChange={(e) => setBizForm({ ...bizForm, taxPercentage: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!bizForm.serviceChargeEnabled}
                    onChange={(e) => setBizForm({ ...bizForm, serviceChargeEnabled: e.target.checked })}
                  />
                  Service charge aktif
                </label>
                <Field label="Service charge %">
                  <input
                    type="number"
                    value={bizForm.serviceChargePercentage ?? 0}
                    onChange={(e) =>
                      setBizForm({ ...bizForm, serviceChargePercentage: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!bizForm.receiptShowTax}
                  onChange={(e) => setBizForm({ ...bizForm, receiptShowTax: e.target.checked })}
                />
                Tampilkan pajak di struk
              </label>
              <Field label="Header struk">
                <input
                  value={bizForm.receiptHeader ?? ''}
                  onChange={(e) => setBizForm({ ...bizForm, receiptHeader: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                />
              </Field>
              <Field label="Footer struk">
                <input
                  value={bizForm.receiptFooter ?? ''}
                  onChange={(e) => setBizForm({ ...bizForm, receiptFooter: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                />
              </Field>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="font-bold text-gray-900 dark:text-white mb-2">Stock opname</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!bizForm.requireStockOpnameAfterClose}
                    onChange={(e) => setBizForm({ ...bizForm, requireStockOpnameAfterClose: e.target.checked })}
                  />
                  Wajib stock opname setelah tutup toko (kasir)
                </label>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!bizForm.stockOpnameAutoApprove}
                    onChange={(e) => setBizForm({ ...bizForm, stockOpnameAutoApprove: e.target.checked })}
                  />
                  Auto-approve (tanpa persetujuan owner)
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  Jika auto-approve aktif, hasil opname kasir langsung mengubah stok setelah submit.
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="font-bold text-gray-900 dark:text-white mb-2">Pembayaran non-tunai (manual)</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!bizForm.manualPaymentEnabled}
                    onChange={(e) => setBizForm({ ...bizForm, manualPaymentEnabled: e.target.checked })}
                  />
                  Aktifkan Transfer/E-Wallet manual di kasir
                </label>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!bizForm.manualPaymentProofRequired}
                    onChange={(e) => setBizForm({ ...bizForm, manualPaymentProofRequired: e.target.checked })}
                    disabled={!bizForm.manualPaymentEnabled}
                  />
                  Bukti bayar wajib (foto/screenshot)
                </label>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">Akun tujuan yang ditampilkan di kasir.</div>
                  <button
                    type="button"
                    onClick={() => setManualAccountsOpen(true)}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold"
                    disabled={!bizForm.manualPaymentEnabled}
                  >
                    Kelola akun
                  </button>
                </div>

                {bizForm.manualPaymentEnabled && (manualAccounts ?? []).length === 0 && (
                  <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    Belum ada akun manual. Tambahkan minimal 1 akun agar kasir bisa memilih Transfer/E-Wallet.
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium text-gray-900 dark:text-white mb-2">Preview struk</p>
                <pre className="font-mono text-xs whitespace-pre-wrap bg-white dark:bg-gray-900 p-3 rounded-lg">
                  {bizForm.receiptHeader || '[Header]'}
                  {'\n'}— — — —{'\n'}Item … {formatCurrency(85000)}
                  {bizForm.receiptShowTax
                    ? `\nPPN ${bizForm.taxPercentage}% …`
                    : ''}
                  {'\n'}— — — —{'\n'}
                  {bizForm.receiptFooter || '[Footer]'}
                </pre>
              </div>
              <button
                type="button"
                onClick={() => void saveBusiness()}
                className="px-4 py-3 rounded-lg bg-brand-600 text-white font-semibold"
              >
                Simpan bisnis
              </button>
            </Panel>
          )}

          {manualAccountsOpen && (
            <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4">
              <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <p className="font-bold text-gray-900 dark:text-white">Kelola akun pembayaran manual</p>
                  <button
                    type="button"
                    onClick={() => setManualAccountsOpen(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 grid md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                    <p className="font-semibold text-gray-900 dark:text-white mb-3">Tambah akun</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Tipe">
                        <select
                          value={manualAccountDraft.type ?? 'EWALLET'}
                          onChange={(e) => setManualAccountDraft({ ...manualAccountDraft, type: e.target.value as any })}
                          className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                        >
                          <option value="BANK">BANK</option>
                          <option value="EWALLET">EWALLET</option>
                        </select>
                      </Field>
                      <Field label="Provider">
                        <select
                          value={manualAccountDraft.provider ?? 'OTHER'}
                          onChange={(e) => setManualAccountDraft({ ...manualAccountDraft, provider: e.target.value as any })}
                          className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                        >
                          {['BCA', 'BRI', 'BNI', 'MANDIRI', 'PERMATA', 'DANA', 'OVO', 'GOPAY', 'LINKAJA', 'SHOPEEPAY', 'OTHER'].map(
                            (p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ),
                          )}
                        </select>
                      </Field>
                    </div>
                    <Field label="Label">
                      <input
                        value={manualAccountDraft.label ?? ''}
                        onChange={(e) => setManualAccountDraft({ ...manualAccountDraft, label: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                        placeholder="Mis. BCA - Toko A / DANA - Pak Budi"
                      />
                    </Field>
                    <Field label="Nama pemilik (opsional)">
                      <input
                        value={manualAccountDraft.ownerName ?? ''}
                        onChange={(e) => setManualAccountDraft({ ...manualAccountDraft, ownerName: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                        placeholder="Nama pemilik rekening/ewallet"
                      />
                    </Field>
                    <Field label="Nomor akun (rekening / no HP e-wallet)">
                      <input
                        value={manualAccountDraft.accountNumber ?? ''}
                        onChange={(e) => setManualAccountDraft({ ...manualAccountDraft, accountNumber: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                        placeholder="Contoh: 1234567890 / 0812xxxx"
                      />
                    </Field>
                    <Field label="Instruksi (opsional)">
                      <input
                        value={manualAccountDraft.instructions ?? ''}
                        onChange={(e) => setManualAccountDraft({ ...manualAccountDraft, instructions: e.target.value })}
                        className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                        placeholder="Mis. Tulis catatan: INV-xxxx"
                      />
                    </Field>
                    <label className="mt-2 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={manualAccountDraft.isActive ?? true}
                        onChange={(e) => setManualAccountDraft({ ...manualAccountDraft, isActive: e.target.checked })}
                      />
                      Aktif
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!bid || !tid) return;
                        const label = String(manualAccountDraft.label ?? '').trim();
                        const accountNumber = String(manualAccountDraft.accountNumber ?? '').trim();
                        if (!label || !accountNumber) return;
                        const now = new Date();
                        const existingId = typeof manualAccountDraft.id === 'string' && manualAccountDraft.id ? manualAccountDraft.id : null;
                        if (existingId) {
                          await db.paymentManualAccounts.update(existingId, {
                            type: (manualAccountDraft.type ?? 'EWALLET') as any,
                            provider: (manualAccountDraft.provider ?? 'OTHER') as any,
                            label,
                            ownerName: String(manualAccountDraft.ownerName ?? '').trim() || undefined,
                            accountNumber,
                            instructions: String(manualAccountDraft.instructions ?? '').trim() || undefined,
                            isActive: manualAccountDraft.isActive ?? true,
                            updatedAt: now,
                          });
                        } else {
                          await db.paymentManualAccounts.add({
                            id: crypto.randomUUID(),
                          tenantId: tid,
                          businessId: bid,
                          type: (manualAccountDraft.type ?? 'EWALLET') as any,
                          provider: (manualAccountDraft.provider ?? 'OTHER') as any,
                          label,
                          ownerName: String(manualAccountDraft.ownerName ?? '').trim() || undefined,
                          accountNumber,
                          instructions: String(manualAccountDraft.instructions ?? '').trim() || undefined,
                          isActive: manualAccountDraft.isActive ?? true,
                          createdAt: now,
                          updatedAt: now,
                          } as PaymentManualAccount);
                        }
                        setManualAccountDraft({
                          type: manualAccountDraft.type ?? 'EWALLET',
                          provider: manualAccountDraft.provider ?? 'OTHER',
                          id: undefined,
                          label: '',
                          ownerName: '',
                          accountNumber: '',
                          instructions: '',
                          isActive: true,
                        });
                      }}
                      className="mt-4 w-full px-4 py-3 rounded-xl bg-brand-600 text-white font-semibold"
                    >
                      Simpan akun
                    </button>
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                    <p className="font-semibold text-gray-900 dark:text-white mb-3">Daftar akun</p>
                    <div className="space-y-2">
                      {(manualAccounts ?? []).map((a) => (
                        <div
                          key={a.id}
                          className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {a.label} <span className="text-xs font-medium text-gray-500">({a.provider})</span>
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {a.ownerName ? `${a.ownerName} • ` : ''}
                              {a.accountNumber}
                            </p>
                            {a.instructions ? <p className="text-xs text-gray-500 mt-1">{a.instructions}</p> : null}
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!a.id) return;
                                await db.paymentManualAccounts.update(a.id, { isActive: !a.isActive, updatedAt: new Date() });
                              }}
                              className="px-3 py-1.5 rounded-lg border text-xs"
                            >
                              {a.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setManualAccountDraft({
                                  ...a,
                                  ownerName: a.ownerName ?? '',
                                  instructions: a.instructions ?? '',
                                });
                              }}
                              className="px-3 py-1.5 rounded-lg border text-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!a.id) return;
                                await db.paymentManualAccounts.delete(a.id);
                              }}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                      {(manualAccounts ?? []).length === 0 ? <p className="text-sm text-gray-500">Belum ada akun.</p> : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'cashiers' && (
            <Panel title="Kasir & izin" icon={Users}>
              <CashierEditorList cashiers={cashiers ?? []} businessId={bid} tenantId={tid!} />
            </Panel>
          )}

          {section === 'products' && (
            <Panel title="Produk default" icon={Package}>
              <Field label="Pajak default per produk (%)">
                <input
                  type="number"
                  value={bizForm.defaultProductTaxPercent ?? 0}
                  onChange={(e) =>
                    setBizForm({
                      ...bizForm,
                      defaultProductTaxPercent: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                />
              </Field>
              <Field label="Prefix auto SKU">
                <input
                  value={bizForm.skuAutoPrefix ?? ''}
                  onChange={(e) => setBizForm({ ...bizForm, skuAutoPrefix: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                />
              </Field>
              <Field label="Satuan default">
                <input
                  value={bizForm.defaultUnit ?? ''}
                  onChange={(e) => setBizForm({ ...bizForm, defaultUnit: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                />
              </Field>
              <button
                type="button"
                onClick={() => void saveBusiness()}
                className="px-4 py-3 rounded-lg bg-brand-600 text-white font-semibold"
              >
                Simpan
              </button>
            </Panel>
          )}

          {section === 'notify' && (
            <Panel title="Notifikasi" icon={Bell}>
              <label className="flex items-center gap-2 text-sm py-2">
                <input
                  type="checkbox"
                  checked={!!bizForm.notifyLowStock}
                  onChange={(e) => setBizForm({ ...bizForm, notifyLowStock: e.target.checked })}
                />
                Alert stok minimum
              </label>
              <label className="flex items-center gap-2 text-sm py-2">
                <input
                  type="checkbox"
                  checked={!!bizForm.notifyDebtDue}
                  onChange={(e) => setBizForm({ ...bizForm, notifyDebtDue: e.target.checked })}
                />
                Alert hutang jatuh tempo
              </label>
              <label className="flex items-center gap-2 text-sm py-2">
                <input
                  type="checkbox"
                  checked={!!bizForm.emailDailySummary}
                  onChange={(e) => setBizForm({ ...bizForm, emailDailySummary: e.target.checked })}
                />
                Ringkasan harian via email (butuh backend)
              </label>
              <button
                type="button"
                onClick={() => void saveBusiness()}
                className="px-4 py-3 rounded-lg bg-brand-600 text-white font-semibold"
              >
                Simpan
              </button>
            </Panel>
          )}

          {section === 'printer' && (
            <Panel title="Printer thermal" icon={Printer}>
              <Field label="Lebar kertas (mm)">
                <select
                  value={bizForm.printerPaperMm ?? 58}
                  onChange={(e) =>
                    setBizForm({ ...bizForm, printerPaperMm: Number(e.target.value) as 58 | 80 })
                  }
                  className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                >
                  <option value={58}>58mm</option>
                  <option value={80}>80mm</option>
                </select>
              </Field>
              <p className="text-sm text-gray-500">
                Bluetooth / driver perangkat: hubungkan dari OS perangkat. Di sini hanya preferensi lebar.
              </p>
              <button
                type="button"
                onClick={() => alert('Test print: gunakan dialog cetak browser (Ctrl+P) pada layar struk')}
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 font-medium"
              >
                Test print (petunjuk)
              </button>
              <button
                type="button"
                onClick={() => void saveBusiness()}
                className="ml-2 px-4 py-3 rounded-lg bg-brand-600 text-white font-semibold"
              >
                Simpan
              </button>
            </Panel>
          )}

          {section === 'data' && (
            <Panel title="Data & backup" icon={Database}>
              <button
                type="button"
                onClick={() => void exportAll()}
                className="px-4 py-3 rounded-lg bg-brand-600 text-white font-semibold"
              >
                Export semua data (JSON)
              </button>
              <p className="text-sm text-gray-500 mt-3">
                Import: gunakan file JSON dari backup. Fitur lanjutan merge per tabel dapat ditambahkan.
              </p>
              <div className="mt-8 rounded-xl border-2 border-[#DC2626]/40 bg-red-50 dark:bg-red-950/30 p-4">
                <p className="font-semibold text-[#DC2626] flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Danger zone
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Hapus semua transaksi untuk bisnis ini (produk tetap).
                </p>
                <button
                  type="button"
                  onClick={() => void dangerClear()}
                  className="mt-3 px-4 py-3 rounded-lg bg-[#DC2626] text-white font-semibold"
                >
                  Hapus data transaksi
                </button>
              </div>
            </Panel>
          )}

          {section === 'sync' && (
            <Panel title="Sync (offline queue)" icon={RefreshCw}>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ini adalah antrean perubahan lokal yang akan dikirim ke server saat online (bila endpoint sync tersedia).
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white/50 dark:bg-gray-900/30">
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-2xl font-extrabold tabular-nums">{pendingSyncs.length}</p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white/50 dark:bg-gray-900/30">
                  <p className="text-xs text-gray-500">Last synced</p>
                  <p className="text-sm font-semibold mt-1">
                    {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('id-ID') : '—'}
                  </p>
                  {lastSyncError && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      {lastSyncErrorCode ? `[${lastSyncErrorCode}] ` : ''}
                      {lastSyncError}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  disabled={pendingSyncs.length === 0 || isSyncing}
                  onClick={() => void processSyncQueue()}
                  className="px-4 py-3 rounded-lg bg-brand-600 text-white font-semibold min-h-[44px] disabled:opacity-50"
                >
                  {isSyncing ? 'Syncing…' : 'Sync sekarang'}
                </button>
                <button
                  type="button"
                  disabled={pendingSyncs.length === 0}
                  onClick={() => clearSyncs()}
                  className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 font-semibold min-h-[44px] disabled:opacity-50"
                >
                  Clear antrean
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold">Ringkasan per tabel</p>
                </div>
                <div className="p-4">
                  {pendingSyncs.length === 0 ? (
                    <p className="text-sm text-gray-500">Tidak ada pending.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        pendingSyncs.reduce((m, it) => {
                          m.set(it.table, (m.get(it.table) ?? 0) + 1);
                          return m;
                        }, new Map<string, number>())
                      )
                        .sort((a, b) => b[1] - a[1])
                        .map(([table, count]) => (
                          <span
                            key={table}
                            className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                          >
                            {table}: {count}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold">Detail (maks 50 item)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-500">
                      <tr>
                        <th className="p-3">Tabel</th>
                        <th className="p-3">Op</th>
                        <th className="p-3">ID</th>
                        <th className="p-3">Waktu</th>
                        <th className="p-3 text-right">Retry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingSyncs.slice(0, 50).map((it) => (
                        <tr key={it.id} className="border-t border-gray-100 dark:border-gray-700">
                          <td className="p-3 font-mono text-xs">{it.table}</td>
                          <td className="p-3">{it.op}</td>
                          <td className="p-3 font-mono text-xs">{String((it.row as any)?.id ?? '').slice(0, 18)}</td>
                          <td className="p-3 text-xs text-gray-500">
                            {new Date(it.createdAt).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-right tabular-nums">{it.retryCount ?? 0}</td>
                        </tr>
                      ))}
                      {pendingSyncs.length === 0 && (
                        <tr>
                          <td className="p-6 text-center text-gray-500" colSpan={5}>
                            Tidak ada pending.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Panel>
          )}

          {section === 'billing' && currentTenant && (
            <Panel title="Langganan" icon={CreditCard}>
              <p className="text-sm">
                Plan saat ini:{' '}
                <span className="font-bold text-brand-600">{currentTenant.subscriptionPlan}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Upgrade / downgrade dan riwayat tagihan memerlukan backend pembayaran. Ini mode offline-first
                lokal.
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white dark:bg-[#1F2937] rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h2 className="font-bold text-lg flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
        <Icon className="w-5 h-5 text-brand-600" />
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function CashierEditorList({
  cashiers,
  businessId,
  tenantId,
}: {
  cashiers: Cashier[];
  businessId: string;
  tenantId: string;
}) {
  const [editing, setEditing] = useState<Cashier | null>(null);
  const [newPin, setNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const buildCashierLink = (cashierId: string) => {
    const origin = window.location.origin;
    return `${origin}/?mode=cashier&business=${encodeURIComponent(businessId)}&cashier=${encodeURIComponent(cashierId)}`;
  };

  const save = async () => {
    if (!editing?.id) return;
    await db.cashiers.update(editing.id, {
      name: editing.name,
      whatsapp: editing.whatsapp?.trim() || undefined,
      isActive: editing.isActive,
      canVoid: editing.canVoid ?? true,
      canDiscount: editing.canDiscount ?? true,
      maxDiscountPercent: Number(editing.maxDiscountPercent) || 100,
      canViewReports: editing.canViewReports ?? false,
      ...(newPin.length === 6 ? { pinHash: newPin } : {}),
    });
    setEditing(null);
    setNewPin('');
    setShowPin(false);
  };

  return (
    <>
      <div className="space-y-3">
        {cashiers.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 dark:border-gray-600 p-3"
          >
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-gray-500">{c.isActive ? 'Aktif' : 'Nonaktif'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!c.id) return;
                  const link = buildCashierLink(c.id);
                  await navigator.clipboard.writeText(link);
                  alert('Link kasir disalin ke clipboard');
                }}
                className="text-sm text-gray-600 font-medium min-h-[44px] px-2"
              >
                Copy link
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!c.id) return;
                  const link = buildCashierLink(c.id);
                  const text = encodeURIComponent(`Link login kasir ${c.name}: ${link}`);
                  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
                }}
                className="text-sm text-emerald-600 font-medium min-h-[44px] px-2"
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setEditing({ ...c })}
                className="text-sm text-brand-600 font-medium min-h-[44px] px-2"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={async () => {
            await db.cashiers.add({
              id: crypto.randomUUID(),
              businessId,
              tenantId,
              name: `Kasir ${Date.now().toString().slice(-4)}`,
              pinHash: '123456',
              isActive: true,
              createdAt: new Date(),
              canVoid: true,
              canDiscount: true,
              maxDiscountPercent: 50,
              canViewReports: false,
            });
          }}
          className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-brand-600 font-medium"
        >
          + Tambah kasir
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-6 max-w-md w-full space-y-3 border border-gray-200 dark:border-gray-600">
            <h3 className="font-bold">Kasir: {editing.name}</h3>
            <Field label="Nama">
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
              />
              Aktif
            </label>
            <Field label="No WhatsApp (opsional)">
              <input
                value={editing.whatsapp ?? ''}
                onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
                placeholder="contoh: 62812xxxxxxx"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.canVoid ?? true}
                onChange={(e) => setEditing({ ...editing, canVoid: e.target.checked })}
              />
              Boleh void transaksi
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.canDiscount ?? true}
                onChange={(e) => setEditing({ ...editing, canDiscount: e.target.checked })}
              />
              Boleh diskon (max % di bawah)
            </label>
            <Field label="Max diskon %">
              <input
                type="number"
                value={editing.maxDiscountPercent ?? 50}
                onChange={(e) =>
                  setEditing({ ...editing, maxDiscountPercent: Number(e.target.value) })
                }
                className="w-full rounded-lg border px-3 py-2 dark:bg-gray-900 dark:border-gray-600"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.canViewReports ?? false}
                onChange={(e) => setEditing({ ...editing, canViewReports: e.target.checked })}
              />
              Boleh lihat laporan
            </label>
            <Field label="Reset PIN (6 digit)">
              <div className="flex gap-2">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="flex-1 rounded-lg border px-3 py-2 font-mono dark:bg-gray-900 dark:border-gray-600"
                  placeholder="Kosongkan jika tidak diubah"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="px-3 rounded-lg border dark:border-gray-600 text-sm"
                >
                  {showPin ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setNewPin('');
                }}
                className="flex-1 py-2 border rounded-xl"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => void save()}
                className="flex-1 py-2 bg-brand-600 text-white rounded-xl font-bold"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
