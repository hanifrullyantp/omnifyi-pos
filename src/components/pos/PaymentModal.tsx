import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  X, Banknote, QrCode, CreditCard, Wallet,
  Check, Printer, Share2, Plus,
  ArrowLeft, User, MessageSquare
} from 'lucide-react';
import { PaymentMethod, Transaction, TransactionItem, db, type PaymentManualAccount } from '../../lib/db';
import { useCartStore, useAuthStore, useTodayTransactionsStore, useSyncStore } from '../../lib/store';
import { cn, formatCurrency } from '../../lib/utils';
import { applySaleStockDeduction } from '../../lib/posStockLedger';
import { isBluetoothPrinterConnected, printTextToBluetooth } from '../../lib/bluetoothReceiptPrinter';
import type { CartItem } from '../../lib/store';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
}

type PaymentStep = 'method' | 'amount' | 'success';

type QrisPaymentState =
  | { phase: 'idle' }
  | { phase: 'creating' }
  | { phase: 'pending'; orderId: string; transactionId?: string | null; qrUrl?: string | null; qrString?: string | null }
  | { phase: 'paid'; orderId: string; transactionId?: string | null }
  | { phase: 'failed'; message: string };

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'CASH', label: 'Tunai', icon: <Banknote className="w-6 h-6" />, color: 'bg-green-500' },
  { id: 'QRIS', label: 'QRIS', icon: <QrCode className="w-6 h-6" />, color: 'bg-purple-500' },
  { id: 'TRANSFER', label: 'Transfer', icon: <CreditCard className="w-6 h-6" />, color: 'bg-blue-500' },
  { id: 'EWALLET', label: 'E-Wallet', icon: <Wallet className="w-6 h-6" />, color: 'bg-orange-500' },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  subtotal,
  taxAmount,
  serviceCharge,
  discountAmount
}) => {
  const [step, setStep] = useState<PaymentStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [completedLineItems, setCompletedLineItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qris, setQris] = useState<QrisPaymentState>({ phase: 'idle' });
  const [manualAccounts, setManualAccounts] = useState<PaymentManualAccount[]>([]);
  const [selectedManualAccountId, setSelectedManualAccountId] = useState<string>('');
  const [manualProofDataUrl, setManualProofDataUrl] = useState<string>('');
  const [confirmSeenProof, setConfirmSeenProof] = useState(false);
  const [confirmAmountOk, setConfirmAmountOk] = useState(false);

  const { items, clearCart } = useCartStore();
  const { currentBusiness, currentTenant, currentCashier } = useAuthStore();
  const { addTransaction } = useTodayTransactionsStore();
  const addPendingSync = useSyncStore((s) => s.addPendingSync);

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setSelectedMethod('CASH');
      setCashReceived('');
      setCustomerName('');
      setNotes('');
      setTransaction(null);
      setCompletedLineItems([]);
      setQris({ phase: 'idle' });
      setSelectedManualAccountId('');
      setManualProofDataUrl('');
      setConfirmSeenProof(false);
      setConfirmAmountOk(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!currentBusiness?.id) return;
    if (!currentBusiness.manualPaymentEnabled) {
      setManualAccounts([]);
      return;
    }
    void db.paymentManualAccounts
      .where('businessId')
      .equals(currentBusiness.id)
      .toArray()
      .then((xs) => xs.filter((x) => x.isActive).sort((a, b) => a.label.localeCompare(b.label)))
      .then((xs) => {
        setManualAccounts(xs);
        if (!selectedManualAccountId && xs[0]?.id) setSelectedManualAccountId(xs[0].id);
      });
  }, [isOpen, currentBusiness?.id, currentBusiness?.manualPaymentEnabled, selectedManualAccountId]);

  const selectedManualAccount = manualAccounts.find((a) => a.id === selectedManualAccountId) ?? null;

  const manualProofRequired = !!currentBusiness?.manualPaymentEnabled && !!currentBusiness?.manualPaymentProofRequired;

  const canConfirmManualNonCash =
    !!selectedManualAccountId &&
    confirmSeenProof &&
    confirmAmountOk &&
    (!manualProofRequired || !!manualProofDataUrl);

  async function onPickProofFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    const p = new Promise<string>((resolve, reject) => {
      reader.onerror = () => reject(new Error('Gagal baca file.'));
      reader.onload = () => resolve(String(reader.result ?? ''));
    });
    reader.readAsDataURL(file);
    const dataUrl = await p;
    setManualProofDataUrl(dataUrl);
  }

  useEffect(() => {
    if (!isOpen) return;
    if (selectedMethod !== 'QRIS') return;
    if (qris.phase !== 'pending') return;
    let cancelled = false;
    const run = async () => {
      const start = Date.now();
      while (!cancelled && Date.now() - start < 5 * 60 * 1000) {
        try {
          const res = await fetch(`/api/pos/qris/status?orderId=${encodeURIComponent(qris.orderId)}`);
          if (res.ok) {
            const data = (await res.json()) as { paid: boolean; transaction_status?: string };
            if (data.paid) {
              setQris({ phase: 'paid', orderId: qris.orderId, transactionId: qris.transactionId ?? null });
              return;
            }
            if (String(data.transaction_status ?? '').toLowerCase() === 'expire') {
              setQris({ phase: 'failed', message: 'Pembayaran QRIS expired. Silakan buat QR baru.' });
              return;
            }
          }
        } catch {
          // ignore transient network errors; keep polling
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
      if (!cancelled) setQris({ phase: 'failed', message: 'Timeout menunggu pembayaran QRIS.' });
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedMethod, qris]);

  const change = selectedMethod === 'CASH' 
    ? Math.max(0, parseFloat(cashReceived || '0') - total)
    : 0;

  const quickAmounts = [
    total, // Uang pas
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total).slice(0, 4);

  const generateInvoiceNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${dateStr}-${random}`;
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    if ((method === 'TRANSFER' || method === 'EWALLET') && currentBusiness?.manualPaymentEnabled) {
      if (manualAccounts.length === 0) {
        alert('Belum ada akun manual yang aktif. Owner perlu mengaturnya di Settings → Bisnis.');
        return;
      }
    }
    setSelectedMethod(method);
    if (method !== 'CASH') {
      setCashReceived(total.toString());
    } else {
      setCashReceived('');
    }
    setStep('amount');
  };

  const handleProcessPayment = async () => {
    if (!currentBusiness || !currentTenant || !currentCashier) return;
    if (selectedMethod === 'CASH' && parseFloat(cashReceived || '0') < total) return;

    setIsProcessing(true);

    try {
      if ((selectedMethod === 'TRANSFER' || selectedMethod === 'EWALLET') && currentBusiness.manualPaymentEnabled) {
        if (!canConfirmManualNonCash) {
          alert(
            manualProofRequired
              ? 'Lengkapi checklist dan upload bukti bayar terlebih dulu.'
              : 'Lengkapi checklist dan pilih akun tujuan terlebih dulu.',
          );
          return;
        }
      }

      if (selectedMethod === 'QRIS') {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          alert('QRIS butuh koneksi internet.');
          return;
        }
        if (qris.phase !== 'paid') {
          setQris({ phase: 'creating' });
          const invoiceNumber = generateInvoiceNumber();
          const r = await fetch('/api/pos/qris/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId: currentBusiness.id,
              tenantId: currentTenant.id,
              cashierId: currentCashier.id,
              invoiceNumber,
              grossAmount: total,
            }),
          });
          const txt = await r.text();
          if (!r.ok) {
            setQris({ phase: 'failed', message: `Gagal buat QRIS (HTTP ${r.status})` });
            alert(`Gagal buat QRIS: ${txt.slice(0, 200)}`);
            return;
          }
          const parsed = JSON.parse(txt) as { orderId: string; transactionId?: string; qrUrl?: string | null; qrString?: string | null };
          setQris({ phase: 'pending', orderId: parsed.orderId, transactionId: parsed.transactionId ?? null, qrUrl: parsed.qrUrl ?? null, qrString: parsed.qrString ?? null });
          return; // wait polling, user will hit Pay again after paid (or we could auto-finalize on paid)
        }
      }

      for (const item of items) {
        const fresh = await db.products.get(item.productId);
        if (!fresh) {
          alert(`Produk "${item.product.name}" tidak ditemukan. Hapus dari keranjang dan coba lagi.`);
          setIsProcessing(false);
          return;
        }
        if (fresh.stockQuantity < item.quantity) {
          alert(
            `Stok tidak cukup untuk "${fresh.name}". Tersedia: ${fresh.stockQuantity}, diminta: ${item.quantity}. Sesuaikan keranjang lalu coba lagi.`
          );
          setIsProcessing(false);
          return;
        }
      }

      const txId = crypto.randomUUID();
      const invoiceNumber = generateInvoiceNumber();
      const cashReceivedNum = parseFloat(cashReceived || total.toString());
      const changeAmount = selectedMethod === 'CASH' ? cashReceivedNum - total : 0;

      const newTransaction: Transaction = {
        id: txId,
        businessId: currentBusiness.id!,
        tenantId: currentTenant.id!,
        cashierId: currentCashier.id!,
        invoiceNumber,
        subtotal,
        discountAmount,
        discountType: 'NOMINAL',
        taxAmount,
        serviceCharge,
        total,
        paymentMethod: selectedMethod,
        cashReceived: cashReceivedNum,
        changeAmount,
        customerName: customerName || undefined,
        notes: notes || undefined,
        status: 'COMPLETED',
        createdAt: new Date(),
        manualPaymentAccountId:
          (selectedMethod === 'TRANSFER' || selectedMethod === 'EWALLET') && currentBusiness.manualPaymentEnabled
            ? selectedManualAccountId || undefined
            : undefined,
        manualPaymentProofDataUrl:
          (selectedMethod === 'TRANSFER' || selectedMethod === 'EWALLET') && currentBusiness.manualPaymentEnabled
            ? manualProofDataUrl || undefined
            : undefined,
        manualPaymentConfirmedAt:
          (selectedMethod === 'TRANSFER' || selectedMethod === 'EWALLET') && currentBusiness.manualPaymentEnabled
            ? new Date()
            : undefined,
      };

      // Save transaction
      await db.transactions.add(newTransaction);

      // Save transaction items
      const txItems: TransactionItem[] = items.map(item => ({
        id: crypto.randomUUID(),
        transactionId: txId,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice,
        discount: item.discountType === 'PERCENT' 
          ? Math.round(item.product.sellingPrice * item.quantity * item.discount / 100)
          : item.discount,
        subtotal: item.product.sellingPrice * item.quantity,
        notes: item.notes
      }));

      await db.transactionItems.bulkAdd(txItems);

      await applySaleStockDeduction(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));

      // Add activity log
      await db.activityLogs.add({
        id: crypto.randomUUID(),
        tenantId: currentTenant.id!,
        businessId: currentBusiness.id!,
        actorType: 'CASHIER',
        actorId: currentCashier.id!,
        action: 'CREATE_TRANSACTION',
        entityType: 'TRANSACTION',
        entityId: txId,
        description: `Menyelesaikan transaksi ${invoiceNumber}`,
        metadata: {
          invoiceNumber,
          total,
          paymentMethod: selectedMethod,
        },
        createdAt: new Date()
      });

      // Update today transactions store
      addTransaction(newTransaction);

      // Offline-first queue for backend sync.
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        addPendingSync('transaction', {
          transaction: newTransaction,
          items: txItems,
        });
      }

      setCompletedLineItems(items.map((i) => ({ ...i })));
      setTransaction(newTransaction);
      clearCart();

      // Show success with confetti
      setStep('success');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (error) {
      console.error('Payment error:', error);
      alert('Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  const buildReceiptText = () => {
    if (!transaction) return '';
    const lines = completedLineItems.map(
      (item) =>
        `${item.product.name} x${item.quantity}\n  ${formatCurrency(item.product.sellingPrice * item.quantity)}`
    );
    return `
${currentBusiness?.name || 'Omnifyi POS'}
================================
No: ${transaction.invoiceNumber}
Tanggal: ${new Date(transaction.createdAt).toLocaleString('id-ID')}
Kasir: ${currentCashier?.name}
--------------------------------
${lines.join('\n')}
--------------------------------
Subtotal: ${formatCurrency(transaction.subtotal)}
${transaction.discountAmount > 0 ? `Diskon: -${formatCurrency(transaction.discountAmount)}` : ''}
Pajak: ${formatCurrency(transaction.taxAmount)}
${transaction.serviceCharge > 0 ? `Service: ${formatCurrency(transaction.serviceCharge)}` : ''}
================================
TOTAL: ${formatCurrency(transaction.total)}
Bayar: ${formatCurrency(transaction.cashReceived)}
${transaction.changeAmount > 0 ? `Kembalian: ${formatCurrency(transaction.changeAmount)}` : ''}
================================
Terima kasih!
    `.trim();
  };

  const handlePrint = async () => {
    const receiptText = buildReceiptText();
    if (!receiptText) return;
    if (isBluetoothPrinterConnected()) {
      try {
        await printTextToBluetooth(receiptText);
        return;
      } catch (e) {
        console.warn(e);
        alert('Gagal cetak Bluetooth. Mencoba cetak browser.');
      }
    }
    window.print();
  };

  const handleShare = async () => {
    if (!transaction) return;
    const receiptText = buildReceiptText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Struk ${transaction.invoiceNumber}`,
          text: receiptText,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await copyText(receiptText);
      alert('Struk disalin ke clipboard!');
    }
  };

  const handleNewTransaction = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={step !== 'success' ? onClose : undefined}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="absolute inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 
                   md:-translate-y-1/2 md:w-full md:max-w-lg bg-white dark:bg-gray-800 
                   rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Step: Select Payment Method */}
          {step === 'method' && (
            <>
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Pilih Pembayaran
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                {/* Total Display */}
                <div className="text-center mb-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Total Pembayaran</p>
                  <p className="text-4xl font-bold text-emerald-600">
                    {formatCurrency(total)}
                  </p>
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handleSelectMethod(method.id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl",
                        "border-2 border-gray-100 dark:border-gray-700",
                        "hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
                        "transition-all duration-200"
                      )}
                    >
                      <div className={cn("p-4 rounded-full text-white", method.color)}>
                        {method.icon}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {method.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step: Enter Amount */}
          {step === 'amount' && (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setStep('method')}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                  {paymentMethods.find(m => m.id === selectedMethod)?.label}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {/* Total */}
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Total</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {formatCurrency(total)}
                  </p>
                </div>

                {/* Cash Amount (only for cash) */}
                {selectedMethod === 'CASH' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Jumlah Uang Diterima
                    </label>
                    
                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {quickAmounts.map((amount, idx) => (
                        <button
                          key={amount}
                          onClick={() => setCashReceived(amount.toString())}
                          className={cn(
                            "py-3 px-4 rounded-xl text-sm font-medium transition-all",
                            cashReceived === amount.toString()
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                          )}
                        >
                          {idx === 0 ? 'Uang Pas' : formatCurrency(amount)}
                        </button>
                      ))}
                    </div>

                    {/* Manual Input */}
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                      <input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-4 text-2xl font-bold text-right rounded-xl 
                                 border border-gray-200 dark:border-gray-600 
                                 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>

                    {/* Change */}
                    {parseFloat(cashReceived || '0') >= total && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center"
                      >
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Kembalian</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(change)}
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* QRIS Display */}
                {selectedMethod === 'QRIS' && (
                  <div className="flex flex-col items-center py-4">
                    {qris.phase === 'idle' || qris.phase === 'creating' ? (
                      <div className="w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-2xl flex flex-col items-center justify-center mb-4 gap-2">
                        <QrCode className="w-16 h-16 text-gray-400" />
                        <p className="text-xs text-gray-500 px-6 text-center">
                          Tekan “Selesaikan Pembayaran” untuk membuat QRIS.
                        </p>
                      </div>
                    ) : qris.phase === 'pending' ? (
                      <div className="w-56 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
                        <div className="w-full aspect-square rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                          {qris.qrUrl ? (
                            <img src={qris.qrUrl} alt="QRIS" className="w-full h-full object-contain" />
                          ) : (
                            <div className="p-6 text-center">
                              <QrCode className="w-16 h-16 text-gray-400 mx-auto" />
                              <p className="mt-2 text-xs text-gray-500">QR siap. Silakan scan di bank/e-wallet.</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                          <p className="font-semibold">Menunggu pembayaran…</p>
                          <p className="text-gray-500">Order: {qris.orderId.slice(0, 22)}…</p>
                        </div>
                      </div>
                    ) : qris.phase === 'paid' ? (
                      <div className="w-56 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4 mb-4 text-center">
                        <p className="font-bold text-emerald-700 dark:text-emerald-300">QRIS sudah dibayar</p>
                        <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                          Tekan “Selesaikan Pembayaran” untuk menyimpan transaksi.
                        </p>
                      </div>
                    ) : (
                      <div className="w-56 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-4 mb-4 text-center">
                        <p className="font-bold text-red-700 dark:text-red-300">QRIS gagal</p>
                        <p className="mt-1 text-xs text-red-700/80 dark:text-red-300/80">{qris.message}</p>
                      </div>
                    )}

                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Scan QR code dengan aplikasi e-wallet atau mobile banking
                    </p>
                  </div>
                )}

                {/* Customer Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4" />
                    Nama Pelanggan (opsional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Masukkan nama..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 
                             bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    Catatan (opsional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tambahkan catatan..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 
                             bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                {/* Manual Non-cash account display */}
                {(selectedMethod === 'TRANSFER' || selectedMethod === 'EWALLET') && currentBusiness?.manualPaymentEnabled && (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                    <p className="font-bold text-gray-900 dark:text-white">Akun tujuan pembayaran</p>
                    {manualAccounts.length === 0 ? (
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        Belum ada akun manual yang aktif. Owner perlu menambahkannya di Settings → Bisnis.
                      </p>
                    ) : (
                      <>
                        <select
                          value={selectedManualAccountId}
                          onChange={(e) => setSelectedManualAccountId(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-3 bg-gray-50 dark:bg-gray-700"
                        >
                          {manualAccounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.label} ({a.provider})
                            </option>
                          ))}
                        </select>

                        {selectedManualAccount && (
                          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {selectedManualAccount.label}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {selectedManualAccount.ownerName ? `${selectedManualAccount.ownerName} • ` : ''}
                              {selectedManualAccount.type}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                                {selectedManualAccount.accountNumber}
                              </p>
                              <button
                                type="button"
                                onClick={async () => {
                                  await copyText(selectedManualAccount.accountNumber);
                                }}
                                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold"
                              >
                                Copy
                              </button>
                            </div>
                            {selectedManualAccount.instructions ? (
                              <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{selectedManualAccount.instructions}</p>
                            ) : null}
                          </div>
                        )}
                      </>
                    )}

                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-3 space-y-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Bukti bayar {manualProofRequired ? <span className="text-red-600">*</span> : <span className="text-gray-500">(opsional)</span>}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => void onPickProofFile(e.target.files?.[0] ?? null)}
                        className="block w-full text-sm"
                      />
                      {manualProofDataUrl ? (
                        <img src={manualProofDataUrl} alt="Bukti bayar" className="w-full rounded-xl border border-gray-200 dark:border-gray-700" />
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input type="checkbox" checked={confirmSeenProof} onChange={(e) => setConfirmSeenProof(e.target.checked)} />
                        Saya sudah lihat bukti pembayaran berhasil
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input type="checkbox" checked={confirmAmountOk} onChange={(e) => setConfirmAmountOk(e.target.checked)} />
                        Nominal sesuai dengan total
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Process Button */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleProcessPayment}
                  disabled={
                    isProcessing ||
                    (selectedMethod === 'CASH' && parseFloat(cashReceived || '0') < total) ||
                    ((selectedMethod === 'TRANSFER' || selectedMethod === 'EWALLET') &&
                      currentBusiness?.manualPaymentEnabled &&
                      !canConfirmManualNonCash)
                  }
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 
                           text-white font-bold text-lg shadow-lg shadow-emerald-500/30
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                           hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200
                           flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {(selectedMethod === 'TRANSFER' || selectedMethod === 'EWALLET') && currentBusiness?.manualPaymentEnabled
                        ? 'Konfirmasi sudah dibayar'
                        : 'Selesaikan Pembayaran'}
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Step: Success */}
          {step === 'success' && transaction && (
            <div className="flex flex-col items-center p-8 text-center">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/50 
                         flex items-center justify-center mb-6"
              >
                <Check className="w-12 h-12 text-emerald-600" />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Pembayaran Berhasil!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {transaction.invoiceNumber}
              </p>

              {/* Transaction Summary */}
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 mb-6 text-left">
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-400">Total</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(transaction.total)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-400">Bayar ({selectedMethod})</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(transaction.cashReceived)}
                  </span>
                </div>
                {transaction.changeAmount > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-400">Kembalian</span>
                    <span className="font-bold text-blue-600">{formatCurrency(transaction.changeAmount)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="w-full grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl
                           border border-gray-200 dark:border-gray-600 
                           text-gray-700 dark:text-gray-300 font-medium
                           hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  Print
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl
                           border border-gray-200 dark:border-gray-600 
                           text-gray-700 dark:text-gray-300 font-medium
                           hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>

              <button
                onClick={handleNewTransaction}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 
                         text-white font-bold text-lg shadow-lg shadow-emerald-500/30
                         hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200
                         flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Transaksi Baru
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentModal;
