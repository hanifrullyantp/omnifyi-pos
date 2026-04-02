import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSwipeable } from 'react-swipeable';
import { 
  ShoppingCart, Trash2, X, Plus, Minus, 
  MessageSquare, ChevronUp,
  Percent, Clock, Pause
} from 'lucide-react';
import { useAuthStore, useCartStore, useUIStore } from '../../lib/store';
import type { CartItem } from '../../lib/store';
import { cn, formatCurrency } from '../../lib/utils';
import { db } from '../../lib/db';

interface CartProps {
  onCheckout: () => void;
  taxPercentage: number;
  serviceChargePercentage: number;
}

export const Cart: React.FC<CartProps> = ({ 
  onCheckout, 
  taxPercentage, 
  serviceChargePercentage 
}) => {
  const bid = useAuthStore((s) => s.currentBusiness?.id);
  const currentCashier = useAuthStore((s) => s.currentCashier);
  const canApplyDiscount = !!currentCashier?.canDiscount;
  const maxDiscountPercent = currentCashier?.maxDiscountPercent ?? 100;
  const liveProducts = useLiveQuery(
    () => (bid ? db.products.where('businessId').equals(bid).toArray() : Promise.resolve([])),
    [bid]
  );
  const stockById = useMemo(() => {
    const m: Record<string, number> = {};
    (liveProducts ?? []).forEach((p) => {
      if (p.id) m[p.id] = p.stockQuantity;
    });
    return m;
  }, [liveProducts]);

  const { 
    items, 
    removeItem, 
    updateQuantity, 
    updateNotes,
    updateItemDiscount,
    transactionDiscount,
    transactionDiscountType,
    setTransactionDiscount,
    clearCart,
    pendingTransactions,
    holdTransaction,
    resumeTransaction,
    deletePendingTransaction,
    getSubtotal,
    getTotalDiscount,
    getTotalItems
  } = useCartStore();
  
  const { isCartOpen, setCartOpen } = useUIStore();
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [holdName, setHoldName] = useState('');
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [cartToggleLockUntil, setCartToggleLockUntil] = useState(0);

  // If cashier permission changes (or cashier role without permission), close discount UI.
  useEffect(() => {
    if (!canApplyDiscount && showDiscount) setShowDiscount(false);
  }, [canApplyDiscount, showDiscount]);

  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const afterDiscount = subtotal - totalDiscount;
  const taxAmount = Math.round(afterDiscount * taxPercentage / 100);
  const serviceCharge = Math.round(afterDiscount * serviceChargePercentage / 100);
  const total = afterDiscount + taxAmount + serviceCharge;
  const totalItems = getTotalItems();

  const handleHoldTransaction = () => {
    holdTransaction(holdName || undefined);
    setShowHoldModal(false);
    setHoldName('');
  };

  const openCartSheet = () => {
    if (Date.now() < cartToggleLockUntil) return;
    setCartOpen(true);
  };

  const closeCartSheet = () => {
    setCartOpen(false);
    // Prevent immediate re-open caused by click/touch passthrough.
    setCartToggleLockUntil(Date.now() + 420);
  };

  // Cart Bottom Sheet (Mobile)
  const MobileCartSheet = () => (
    <>
      {/* Bottom Bar - Always visible on mobile */}
      <div
        className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg safe-area-bottom',
          isCartOpen && 'hidden'
        )}
      >
        <button
          onClick={openCartSheet}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-emerald-600" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white 
                               rounded-full text-xs flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {totalItems} item
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-emerald-600">
              {formatCurrency(total)}
            </span>
            <ChevronUp className="w-5 h-5 text-gray-400" />
          </div>
        </button>
      </div>

      {/* Bottom Sheet */}
      {isCartOpen && (
        <>
            {/* Backdrop */}
            <div
              onClick={closeCartSheet}
              className="md:hidden fixed inset-0 z-50 bg-black/50"
            />
            
            {/* Sheet */}
            <div
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 
                       rounded-t-3xl max-h-[85vh] flex flex-col safe-area-bottom"
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Keranjang ({totalItems})
                </h2>
                <div className="flex items-center gap-2">
                  {pendingTransactions.length > 0 && (
                    <button
                      onClick={() => setShowPending(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-full"
                    >
                      <Pause className="w-4 h-4" />
                      {pendingTransactions.length}
                    </button>
                  )}
                  <button
                    onClick={closeCartSheet}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <CartContent 
                items={items}
                stockById={stockById}
                removeItem={removeItem}
                updateQuantity={updateQuantity}
                updateNotes={updateNotes}
                updateItemDiscount={updateItemDiscount}
                editingNotes={editingNotes}
                setEditingNotes={setEditingNotes}
                editingQuantity={editingQuantity}
                setEditingQuantity={setEditingQuantity}
              />

              <CartFooter
                subtotal={subtotal}
                totalDiscount={totalDiscount}
                taxAmount={taxAmount}
                taxPercentage={taxPercentage}
                serviceCharge={serviceCharge}
                serviceChargePercentage={serviceChargePercentage}
                total={total}
                transactionDiscount={transactionDiscount}
                transactionDiscountType={transactionDiscountType}
                setTransactionDiscount={setTransactionDiscount}
                showDiscount={showDiscount}
                setShowDiscount={setShowDiscount}
                canApplyDiscount={canApplyDiscount}
                maxDiscountPercent={maxDiscountPercent}
                clearCart={clearCart}
                onHold={() => setShowHoldModal(true)}
                onCheckout={onCheckout}
                disabled={items.length === 0}
              />
            </div>
        </>
      )}
    </>
  );

  // Desktop Sidebar Cart
  const DesktopCart = () => (
    <div className="hidden md:flex flex-col w-[400px] border-l border-gray-200 dark:border-gray-700 
                  bg-white dark:bg-gray-800 h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-emerald-600" />
          Keranjang ({totalItems})
        </h2>
        <div className="flex items-center gap-2">
          {pendingTransactions.length > 0 && (
            <button
              onClick={() => setShowPending(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-full"
            >
              <Pause className="w-4 h-4" />
              {pendingTransactions.length} pending
            </button>
          )}
        </div>
      </div>

      <CartContent 
        items={items}
        stockById={stockById}
        removeItem={removeItem}
        updateQuantity={updateQuantity}
        updateNotes={updateNotes}
        updateItemDiscount={updateItemDiscount}
        editingNotes={editingNotes}
        setEditingNotes={setEditingNotes}
        editingQuantity={editingQuantity}
        setEditingQuantity={setEditingQuantity}
      />

      <CartFooter
        subtotal={subtotal}
        totalDiscount={totalDiscount}
        taxAmount={taxAmount}
        taxPercentage={taxPercentage}
        serviceCharge={serviceCharge}
        serviceChargePercentage={serviceChargePercentage}
        total={total}
        transactionDiscount={transactionDiscount}
        transactionDiscountType={transactionDiscountType}
        setTransactionDiscount={setTransactionDiscount}
        showDiscount={showDiscount}
        setShowDiscount={setShowDiscount}
        canApplyDiscount={canApplyDiscount}
        maxDiscountPercent={maxDiscountPercent}
        clearCart={clearCart}
        onHold={() => setShowHoldModal(true)}
        onCheckout={onCheckout}
        disabled={items.length === 0}
      />
    </div>
  );

  return (
    <>
      <MobileCartSheet />
      <DesktopCart />

      {/* Hold Transaction Modal */}
      {showHoldModal && (
        <Modal onClose={() => setShowHoldModal(false)}>
          <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Tahan Transaksi
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Simpan transaksi ini untuk dilanjutkan nanti.
              </p>
              <input
                type="text"
                placeholder="Nama pelanggan (opsional)"
                value={holdName}
                onChange={(e) => setHoldName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHoldModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                           text-gray-700 dark:text-gray-300 font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleHoldTransaction}
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-medium"
                >
                  Simpan
                </button>
              </div>
          </div>
        </Modal>
      )}

      {/* Pending Transactions Modal */}
      {showPending && (
        <Modal onClose={() => setShowPending(false)}>
          <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Transaksi Tertahan
              </h3>
              {pendingTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Tidak ada transaksi tertahan</p>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {pendingTransactions.map((pending) => (
                    <div
                      key={pending.id}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 
                               bg-gray-50 dark:bg-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {pending.customerName || 'Tanpa Nama'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(pending.createdAt).toLocaleTimeString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {pending.items.length} item • {formatCurrency(
                          pending.items.reduce((sum, item) => 
                            sum + item.product.sellingPrice * item.quantity, 0
                          )
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            resumeTransaction(pending.id);
                            setShowPending(false);
                          }}
                          className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium"
                        >
                          Lanjutkan
                        </button>
                        <button
                          onClick={() => deletePendingTransaction(pending.id)}
                          className="p-2 rounded-lg border border-red-200 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </Modal>
      )}
    </>
  );
};

// Cart Content Component
interface CartContentProps {
  items: CartItem[];
  stockById: Record<string, number>;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  updateNotes: (id: string, notes: string) => void;
  updateItemDiscount: (id: string, discount: number, type: 'PERCENT' | 'NOMINAL') => void;
  editingNotes: string | null;
  setEditingNotes: (id: string | null) => void;
  editingQuantity: string | null;
  setEditingQuantity: (id: string | null) => void;
}

const CartContent: React.FC<CartContentProps> = ({
  items,
  stockById,
  removeItem,
  updateQuantity,
  updateNotes,
  editingNotes,
  setEditingNotes,
}) => {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
        <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium">Keranjang kosong</p>
        <p className="text-sm">Tambahkan produk untuk memulai</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {items.map((item: CartItem) => {
        const maxQty = stockById[item.productId] ?? item.product.stockQuantity;
        return (
          <CartItemCard
            key={item.productId}
            item={item}
            maxQty={maxQty}
            onRemove={() => removeItem(item.productId)}
            onQuantityChange={(qty) => {
              const clamped = Math.max(0, Math.min(qty, maxQty));
              if (clamped <= 0) removeItem(item.productId);
              else updateQuantity(item.productId, clamped);
            }}
            onNotesChange={(notes) => updateNotes(item.productId, notes)}
            isEditingNotes={editingNotes === item.productId}
            onEditNotes={() => setEditingNotes(editingNotes === item.productId ? null : item.productId)}
          />
        );
      })}
    </div>
  );
};

// Cart Item Component with Swipe to Delete
interface CartItemCardProps {
  item: CartItem;
  maxQty: number;
  onRemove: () => void;
  onQuantityChange: (qty: number) => void;
  onNotesChange: (notes: string) => void;
  isEditingNotes: boolean;
  onEditNotes: () => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  maxQty,
  onRemove,
  onQuantityChange,
  onNotesChange,
  isEditingNotes,
  onEditNotes
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [localNotes, setLocalNotes] = useState(item.notes || '');
  
  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      if (e.dir === 'Left') {
        setSwipeOffset(Math.min(80, Math.abs(e.deltaX)));
      }
    },
    onSwipedLeft: () => {
      if (swipeOffset > 60) {
        onRemove();
      }
      setSwipeOffset(0);
    },
    onSwipedRight: () => setSwipeOffset(0),
    trackMouse: false
  });

  const itemSubtotal = item.product.sellingPrice * item.quantity;

  return (
    <div className="relative" {...swipeHandlers}>
      {/* Delete Background */}
      <div 
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 
                 bg-red-500 rounded-xl"
        style={{ width: swipeOffset + 20 }}
      >
        <Trash2 className="w-5 h-5 text-white" />
      </div>

      {/* Item Card */}
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-100 
                 dark:border-gray-700 p-3 transition-transform"
        style={{ transform: `translateX(-${swipeOffset}px)` }}
      >
        <div className="flex gap-3">
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
              {item.product.name}
            </h4>
            <p className="text-emerald-600 text-sm font-medium">
              {formatCurrency(item.product.sellingPrice)}
            </p>
            {item.notes && !isEditingNotes && (
              <p className="text-xs text-gray-500 mt-1 truncate">📝 {item.notes}</p>
            )}
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onQuantityChange(item.quantity - 1)}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 
                       flex items-center justify-center text-gray-600 dark:text-gray-400
                       hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-gray-900 dark:text-white">
              {item.quantity}
            </span>
            <button
              type="button"
              disabled={item.quantity >= maxQty}
              onClick={() => onQuantityChange(item.quantity + 1)}
              className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 
                       flex items-center justify-center text-emerald-600
                       hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors
                       disabled:opacity-40 disabled:pointer-events-none"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Subtotal */}
          <div className="text-right min-w-[80px]">
            <p className="font-bold text-gray-900 dark:text-white">
              {formatCurrency(itemSubtotal)}
            </p>
            {item.discount > 0 && (
              <p className="text-xs text-red-500">
                -{item.discountType === 'PERCENT' ? `${item.discount}%` : formatCurrency(item.discount)}
              </p>
            )}
          </div>
        </div>

        {/* Notes Input */}
        {isEditingNotes && (
          <div className="overflow-hidden">
            <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  placeholder="Catatan item..."
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 
                           dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                />
                <button
                  onClick={() => {
                    onNotesChange(localNotes);
                    onEditNotes();
                  }}
                  className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
                >
                  Simpan
                </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onEditNotes}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
              isEditingNotes 
                ? "bg-emerald-100 text-emerald-700" 
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            <MessageSquare className="w-3 h-3" />
            Catatan
          </button>
          <button
            onClick={onRemove}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-red-500 
                     hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
          >
            <Trash2 className="w-3 h-3" />
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

// Cart Footer Component
interface CartFooterProps {
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  taxPercentage: number;
  serviceCharge: number;
  serviceChargePercentage: number;
  total: number;
  transactionDiscount: number;
  transactionDiscountType: 'PERCENT' | 'NOMINAL';
  setTransactionDiscount: (discount: number, type: 'PERCENT' | 'NOMINAL') => void;
  showDiscount: boolean;
  setShowDiscount: (show: boolean) => void;
  canApplyDiscount: boolean;
  maxDiscountPercent: number;
  clearCart: () => void;
  onHold: () => void;
  onCheckout: () => void;
  disabled: boolean;
}

const CartFooter: React.FC<CartFooterProps> = ({
  subtotal,
  totalDiscount,
  taxAmount,
  taxPercentage,
  serviceCharge,
  serviceChargePercentage,
  total,
  transactionDiscount,
  transactionDiscountType,
  setTransactionDiscount,
  showDiscount,
  setShowDiscount,
  canApplyDiscount,
  maxDiscountPercent,
  clearCart,
  onHold,
  onCheckout,
  disabled
}) => {
  const [discountInput, setDiscountInput] = useState(transactionDiscount.toString());
  const [discountType, setDiscountType] = useState<'PERCENT' | 'NOMINAL'>(transactionDiscountType);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [discountError, setDiscountError] = useState('');

  const quickDiscounts = [5, 10, 15, 20];

  const applyDiscount = () => {
    const raw = parseFloat(discountInput) || 0;
    if (discountType === 'PERCENT') {
      const max = Number.isFinite(maxDiscountPercent) ? maxDiscountPercent : 100;
      if (raw > max) {
        setDiscountError(`Maks diskon untuk kasir ini: ${max}%`);
        return;
      }
      if (raw < 0) {
        setDiscountError('Diskon tidak boleh negatif.');
        return;
      }
    }
    setDiscountError('');
    setTransactionDiscount(raw, discountType);
    setShowDiscount(false);
  };

  const handleCheckoutClick = () => {
    if (checkoutBusy || disabled) return;
    setCheckoutBusy(true);
    onCheckout();
    // Guard against accidental double tap that can reopen modal.
    setTimeout(() => setCheckoutBusy(false), 700);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
      {/* Summary */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
          <span className="text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
        </div>
        
        {totalDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-red-500">Diskon</span>
            <span className="text-red-500">-{formatCurrency(totalDiscount)}</span>
          </div>
        )}
        
        {taxPercentage > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Pajak ({taxPercentage}%)</span>
            <span className="text-gray-900 dark:text-white">{formatCurrency(taxAmount)}</span>
          </div>
        )}
        
        {serviceChargePercentage > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Service ({serviceChargePercentage}%)</span>
            <span className="text-gray-900 dark:text-white">{formatCurrency(serviceCharge)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-gray-900 dark:text-white">Total</span>
          <span className="text-emerald-600">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Discount Section */}
      {showDiscount && (
        <div className="overflow-hidden mb-4">
          <div className="p-4 bg-white dark:bg-gray-700 rounded-xl space-y-3">
              <div className="flex gap-2">
                {quickDiscounts.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDiscountError('');
                      setDiscountInput(d.toString());
                      setDiscountType('PERCENT');
                    }}
                    disabled={d > maxDiscountPercent}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                      d > maxDiscountPercent
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : discountInput === d.toString() && discountType === 'PERCENT'
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {d}%
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                             bg-gray-50 dark:bg-gray-800 text-right pr-12"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'PERCENT' | 'NOMINAL')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent text-gray-500"
                  >
                    <option value="PERCENT">%</option>
                    <option value="NOMINAL">Rp</option>
                  </select>
                </div>
                <button
                  onClick={applyDiscount}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium"
                >
                  Terapkan
                </button>
              </div>
              {discountType === 'PERCENT' && maxDiscountPercent < 100 && (
                <p className="text-xs text-gray-500">
                  Batas diskon kasir: <span className="font-semibold">{maxDiscountPercent}%</span>
                </p>
              )}
              {discountError && <p className="text-xs text-red-600">{discountError}</p>}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setShowDiscount(!showDiscount)}
          disabled={disabled || !canApplyDiscount}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl 
                   border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300
                   disabled:opacity-50 disabled:cursor-not-allowed"
          title={!canApplyDiscount ? 'Diskon terkunci untuk kasir ini' : undefined}
        >
          <Percent className="w-4 h-4" />
          Diskon
        </button>
        <button
          onClick={onHold}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl 
                   border border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-900/20
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Clock className="w-4 h-4" />
          Tahan
        </button>
        <button
          onClick={clearCart}
          disabled={disabled}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl 
                   border border-red-200 text-red-500
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckoutClick}
        disabled={disabled || checkoutBusy}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 
                 text-white font-bold text-lg shadow-lg shadow-emerald-500/30
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200
                 active:scale-[0.98]"
      >
        {checkoutBusy ? 'Memproses...' : `BAYAR • ${formatCurrency(total)}`}
      </button>
    </div>
  );
};

// Modal Component
const Modal: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ 
  children, 
  onClose 
}) => (
  <>
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50"
    />
    <div
      className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md 
               bg-white dark:bg-gray-800 rounded-2xl shadow-xl"
    >
      {children}
    </div>
  </>
);

export default Cart;
