import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Clock, Receipt, Ban, ChevronRight,
  Banknote, QrCode, CreditCard, Wallet,
  AlertTriangle, FileText
} from 'lucide-react';
import { Transaction, TransactionItem, db, PaymentMethod } from '../../lib/db';
import { useAuthStore, useTodayTransactionsStore } from '../../lib/store';
import { cn, formatCurrency } from '../../lib/utils';
import { restoreSaleStockFromItems } from '../../lib/posStockLedger';

interface TodayTransactionsProps {
  isOpen: boolean;
  onClose: () => void;
}

const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  CASH: <Banknote className="w-4 h-4" />,
  QRIS: <QrCode className="w-4 h-4" />,
  TRANSFER: <CreditCard className="w-4 h-4" />,
  EWALLET: <Wallet className="w-4 h-4" />
};

export const TodayTransactions: React.FC<TodayTransactionsProps> = ({
  isOpen,
  onClose
}) => {
  const { transactions, setTransactions, voidTransaction } = useTodayTransactionsStore();
  const { currentBusiness, currentCashier, currentTenant } = useAuthStore();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [txItems, setTxItems] = useState<TransactionItem[]>([]);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  // Load today's transactions
  useEffect(() => {
    if (isOpen && currentBusiness) {
      loadTransactions();
    }
  }, [isOpen, currentBusiness]);

  const loadTransactions = async () => {
    if (!currentBusiness) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const txs = await db.transactions
      .where('businessId')
      .equals(currentBusiness.id!)
      .filter(tx => new Date(tx.createdAt) >= today)
      .reverse()
      .sortBy('createdAt');

    setTransactions(txs);
  };

  const loadTransactionItems = async (txId: string) => {
    const items = await db.transactionItems
      .where('transactionId')
      .equals(txId)
      .toArray();
    setTxItems(items);
  };

  const handleSelectTransaction = (tx: Transaction) => {
    setSelectedTx(tx);
    loadTransactionItems(tx.id!);
  };

  const handleVoidTransaction = async () => {
    if (!selectedTx || !currentTenant || !currentBusiness || !currentCashier) return;

    setIsVoiding(true);
    try {
      await db.transactions.update(selectedTx.id!, { status: 'VOIDED' });
      
      // Restore stock
      const items = await db.transactionItems
        .where('transactionId')
        .equals(selectedTx.id!)
        .toArray();

      await restoreSaleStockFromItems(items);

      // Log activity
      await db.activityLogs.add({
        id: crypto.randomUUID(),
        tenantId: currentTenant.id!,
        businessId: currentBusiness.id!,
        actorType: 'CASHIER',
        actorId: currentCashier.id!,
        action: 'VOID_TRANSACTION',
        entityType: 'TRANSACTION',
        entityId: selectedTx.id,
        description: `Void transaksi ${selectedTx.invoiceNumber}: ${voidReason}`,
        metadata: { reason: voidReason },
        createdAt: new Date()
      });

      voidTransaction(selectedTx.id!);
      setSelectedTx(prev => prev ? { ...prev, status: 'VOIDED' } : null);
      setShowVoidConfirm(false);
      setVoidReason('');
    } catch (error) {
      console.error('Void error:', error);
      alert('Gagal membatalkan transaksi');
    } finally {
      setIsVoiding(false);
    }
  };

  const completedTxs = transactions.filter(tx => tx.status === 'COMPLETED');
  const totalRevenue = completedTxs.reduce((sum, tx) => sum + tx.total, 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-800 
                   shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Transaksi Hari Ini
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {completedTxs.length} transaksi • {formatCurrency(totalRevenue)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Transaction List or Detail */}
          {selectedTx ? (
            // Transaction Detail
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedTx(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedTx.invoiceNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedTx.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                {selectedTx.status === 'VOIDED' && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                    VOID
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {txItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.productName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span>{formatCurrency(selectedTx.subtotal)}</span>
                  </div>
                  {selectedTx.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-500">Diskon</span>
                      <span className="text-red-500">-{formatCurrency(selectedTx.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Pajak</span>
                    <span>{formatCurrency(selectedTx.taxAmount)}</span>
                  </div>
                  {selectedTx.serviceCharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Service</span>
                      <span>{formatCurrency(selectedTx.serviceCharge)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span>Total</span>
                    <span className="text-emerald-600">{formatCurrency(selectedTx.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Bayar ({selectedTx.paymentMethod})</span>
                    <span>{formatCurrency(selectedTx.cashReceived)}</span>
                  </div>
                  {selectedTx.changeAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Kembalian</span>
                      <span className="text-blue-600">{formatCurrency(selectedTx.changeAmount)}</span>
                    </div>
                  )}
                </div>

                {selectedTx.customerName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Pelanggan:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedTx.customerName}
                    </span>
                  </div>
                )}

                {selectedTx.notes && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FileText className="w-4 h-4 mt-0.5" />
                    <span>{selectedTx.notes}</span>
                  </div>
                )}
              </div>

              {/* Void Button */}
              {selectedTx.status === 'COMPLETED' && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowVoidConfirm(true)}
                    className="w-full py-3 rounded-xl border-2 border-red-500 text-red-500 
                             font-medium flex items-center justify-center gap-2
                             hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Ban className="w-5 h-5" />
                    Void Transaksi
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Transaction List
            <div className="flex-1 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Receipt className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Belum ada transaksi</p>
                  <p className="text-sm">Transaksi hari ini akan muncul di sini</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {transactions.map((tx) => (
                    <button
                      key={tx.id}
                      onClick={() => handleSelectTransaction(tx)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 
                               dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        tx.status === 'VOIDED' 
                          ? "bg-red-100 text-red-600" 
                          : "bg-emerald-100 text-emerald-600"
                      )}>
                        {tx.status === 'VOIDED' 
                          ? <Ban className="w-5 h-5" />
                          : paymentIcons[tx.paymentMethod]
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-medium truncate",
                            tx.status === 'VOIDED' 
                              ? "text-gray-400 line-through" 
                              : "text-gray-900 dark:text-white"
                          )}>
                            {tx.invoiceNumber}
                          </p>
                          {tx.status === 'VOIDED' && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                              VOID
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          {new Date(tx.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {tx.customerName && (
                            <>
                              <span>•</span>
                              <span>{tx.customerName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-bold",
                          tx.status === 'VOIDED' 
                            ? "text-gray-400 line-through" 
                            : "text-emerald-600"
                        )}>
                          {formatCurrency(tx.total)}
                        </p>
                        <p className="text-xs text-gray-500">{tx.paymentMethod}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Void Confirmation Modal */}
        <AnimatePresence>
          {showVoidConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowVoidConfirm(false)}
                className="fixed inset-0 z-60 bg-black/50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-60 mx-auto max-w-sm
                         bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Void Transaksi?
                    </h3>
                    <p className="text-sm text-gray-500">
                      Tindakan ini tidak dapat dibatalkan
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alasan Void *
                  </label>
                  <textarea
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Masukkan alasan void..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 
                             bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowVoidConfirm(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                             text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleVoidTransaction}
                    disabled={!voidReason.trim() || isVoiding}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                  >
                    {isVoiding ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Ban className="w-4 h-4" />
                        Void
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

export default TodayTransactions;
