import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LogOut, User, Clock, Wifi, WifiOff, Receipt, Store, Settings2, X } from 'lucide-react';
import { Category, db, type StoreDay } from '../../lib/db';
import { useAuthStore, useCartStore, useUIStore } from '../../lib/store';
import { cn } from '../../lib/utils';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import PaymentModal from './PaymentModal';
import BarcodeScanner from './BarcodeScanner';
import TodayTransactions from './TodayTransactions';
import { PosSettingsModal } from './PosSettingsModal';

interface POSScreenProps {
  onLogout: () => void;
  onGoToCashierDashboard: () => void;
}

export const POSScreen: React.FC<POSScreenProps> = ({ onLogout, onGoToCashierDashboard }) => {
  const { currentBusiness, currentCashier } = useAuthStore();
  const { items, addItem, getSubtotal, getTotalDiscount } = useCartStore();
  const { isOnline, setOnline } = useUIStore();
  
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

  const productsRaw = useLiveQuery(
    () => (bid ? db.products.where('businessId').equals(bid).toArray() : Promise.resolve([])),
    [bid]
  );
  const categoriesRaw = useLiveQuery(
    () => (bid ? db.categories.where('businessId').equals(bid).toArray() : Promise.resolve([])),
    [bid]
  );
  const products = useMemo(
    () => (productsRaw ?? []).filter((p) => p.isActive),
    [productsRaw]
  );
  const categories = useMemo(
    () =>
      (categoriesRaw ?? [])
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categoriesRaw]
  );
  const isLoading = productsRaw === undefined || categoriesRaw === undefined;

  const [showPayment, setShowPayment] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showPosSettings, setShowPosSettings] = useState(false);
  const [checkoutLockUntil, setCheckoutLockUntil] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openStoreOpen, setOpenStoreOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  // Close store moved to cashier dashboard (kasir yang menutup toko).
  const [busyStoreOp, setBusyStoreOp] = useState(false);
  const [storeOpError, setStoreOpError] = useState('');

  useEffect(() => {
    if (!bid) return;
    if (storeDay === undefined) return;
    if (!storeDay) setOpenStoreOpen(true);
    if (storeDay && storeDay.status === 'CLOSED') setOpenStoreOpen(false);
  }, [bid, storeDay]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTypingField =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          (target as HTMLElement).isContentEditable);

      if (e.key === 'Enter' && items.length > 0 && !showPayment && !showScanner && !showTransactions && !isTypingField) {
        e.preventDefault();
        setShowPayment(true);
      }
      if (e.key === 'F2') {
        // Focus search
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
      if (e.key === 'Escape') {
        setShowPayment(false);
        setShowScanner(false);
        setShowTransactions(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, showPayment, showScanner, showTransactions]);

  const handleBarcodeScan = useCallback(
    (code: string) => {
      if (!isStoreOpen) return;
      const product = products.find((p) => p.barcode === code || p.sku === code);
      if (product) {
        const ok = addItem(product);
        if (!ok) alert('Stok tidak mencukupi atau produk habis.');
      } else {
        alert(`Produk tidak ditemukan: ${code}`);
      }
    },
    [products, addItem, isStoreOpen]
  );

  const handleCheckout = () => {
    if (!isStoreOpen) return;
    if (Date.now() < checkoutLockUntil) return;
    if (items.length > 0 && !showPayment) {
      setShowPayment(true);
    }
  };

  const openStore = async () => {
    if (!bid || !currentBusiness?.tenantId || !currentCashier?.id) return;
    setBusyStoreOp(true);
    setStoreOpError('');
    try {
      const cash = Number(String(openingCash).replace(/\./g, '')) || 0;
      if (!Number.isFinite(cash) || cash < 0) throw new Error('Modal awal tidak valid.');
      await db.storeDays.add({
        id: crypto.randomUUID(),
        tenantId: currentBusiness.tenantId,
        businessId: bid,
        dateYmd: todayYmd,
        status: 'OPEN',
        openedAt: new Date(),
        openedByOwnerId: currentCashier.id,
        openingCash: cash,
        updatedAt: new Date(),
      });
      setOpenStoreOpen(false);
      setOpeningCash('');
    } catch (e: any) {
      setStoreOpError(e?.message || 'Gagal buka toko.');
    } finally {
      setBusyStoreOp(false);
    }
  };


  // Calculate totals
  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const afterDiscount = subtotal - totalDiscount;
  const taxPercentage = currentBusiness?.taxPercentage || 0;
  const serviceChargePercentage = currentBusiness?.serviceChargePercentage || 0;
  const taxAmount = Math.round(afterDiscount * taxPercentage / 100);
  const serviceCharge = Math.round(afterDiscount * serviceChargePercentage / 100);
  const total = afterDiscount + taxAmount + serviceCharge;

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 
                        rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 
                       px-4 py-3 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 
                        flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-sm md:text-base truncate max-w-[120px] md:max-w-none">
              {currentBusiness?.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <User className="w-3 h-3" />
              <span>{currentCashier?.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Online Status */}
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
            isOnline 
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" 
              : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
          )}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Clock */}
          <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Today Transactions */}
          <button
            onClick={() => setShowTransactions(true)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400
                     hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Receipt className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowPosSettings(true)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400
                     hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Pengaturan POS"
          >
            <Settings2 className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onGoToCashierDashboard}
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Dashboard Kasir"
          >
            <Store className="w-4 h-4" />
            Dashboard Kasir
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400
                     hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Product Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ProductGrid
            products={products}
            categories={categories}
            onScanBarcode={() => setShowScanner(true)}
          />
        </div>

        {/* Desktop Cart */}
        <Cart
          onCheckout={handleCheckout}
          taxPercentage={taxPercentage}
          serviceChargePercentage={serviceChargePercentage}
        />
      </div>

      {/* Mobile Cart Bottom Bar */}
      <div className="md:hidden h-20" /> {/* Spacer for mobile cart bar */}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => {
          setShowPayment(false);
          // Prevent immediate reopen from accidental double-tap/click-through on mobile.
          setCheckoutLockUntil(Date.now() + 450);
        }}
        total={total}
        subtotal={subtotal}
        taxAmount={taxAmount}
        serviceCharge={serviceCharge}
        discountAmount={totalDiscount}
      />

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />

      {/* Today Transactions */}
      <TodayTransactions
        isOpen={showTransactions}
        onClose={() => setShowTransactions(false)}
      />

      <PosSettingsModal isOpen={showPosSettings} onClose={() => setShowPosSettings(false)} />

      {/* Open Store Gate */}
      {openStoreOpen && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Buka Toko</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Masukkan modal uang receh untuk kembalian hari ini.
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Ganti kasir / keluar"
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
              {storeOpError && <p className="mt-2 text-sm text-red-600">{storeOpError}</p>}
            </div>

            <button
              type="button"
              onClick={() => void openStore()}
              disabled={busyStoreOp}
              className="mt-6 w-full py-3 rounded-2xl bg-brand-600 text-white font-bold hover:bg-brand-700 disabled:opacity-50"
            >
              {busyStoreOp ? 'Memproses...' : 'Mulai Jualan'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default POSScreen;
