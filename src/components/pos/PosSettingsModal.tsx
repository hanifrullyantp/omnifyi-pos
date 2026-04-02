import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Grid3x3, LayoutGrid, List, Bluetooth, BluetoothOff, Settings } from 'lucide-react';
import { useUIStore } from '../../lib/store';
import { cn } from '../../lib/utils';
import {
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  isBluetoothPrinterConnected,
  isWebBluetoothAvailable,
  printTextToBluetooth,
} from '../../lib/bluetoothReceiptPrinter';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function PosSettingsModal({ isOpen, onClose }: Props) {
  const { viewMode, setViewMode } = useUIStore();
  const [btConnected, setBtConnected] = useState(false);
  const [btBusy, setBtBusy] = useState(false);
  const [btError, setBtError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setBtConnected(isBluetoothPrinterConnected());
  }, [isOpen]);

  const gridOptions = [
    { id: 'grid-2' as const, label: 'Besar', sub: '2 kolom', icon: Grid3x3 },
    { id: 'grid-3' as const, label: 'Sedang', sub: '3 kolom', icon: LayoutGrid },
    { id: 'grid-4' as const, label: 'Kecil', sub: '4 kolom', icon: LayoutGrid },
    { id: 'list' as const, label: 'Daftar', sub: 'satu kolom', icon: List },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute left-3 right-3 top-[10vh] md:left-auto md:right-6 md:top-20 md:w-96 max-h-[80vh] overflow-y-auto 
                       rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-gray-900 dark:text-white">Pengaturan POS</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tampilan produk</p>
                <div className="grid grid-cols-2 gap-2">
                  {gridOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = viewMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setViewMode(opt.id)}
                        className={cn(
                          'flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-colors',
                          active
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/80'
                        )}
                      >
                        <Icon className={cn('w-4 h-4', active ? 'text-emerald-600' : 'text-gray-400')} />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{opt.label}</span>
                        <span className="text-[11px] text-gray-500">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Printer struk Bluetooth</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Gunakan Chrome atau Edge di HTTPS (atau localhost). Pilih printer thermal BLE saat diminta. Jika gagal,
                  tetap bisa cetak lewat dialog browser (Print).
                </p>
                <div
                  className={cn(
                    'flex items-center gap-2 text-sm mb-3 px-3 py-2 rounded-lg',
                    btConnected
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  )}
                >
                  {btConnected ? <Bluetooth className="w-4 h-4 shrink-0" /> : <BluetoothOff className="w-4 h-4 shrink-0" />}
                  {btConnected ? 'Printer terhubung' : 'Belum terhubung'}
                </div>
                {!isWebBluetoothAvailable() && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                    Peramban ini tidak mendukung Web Bluetooth — gunakan Chrome/Edge.
                  </p>
                )}
                {btError && <p className="text-xs text-red-600 mb-2">{btError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={btBusy || !isWebBluetoothAvailable()}
                    onClick={async () => {
                      setBtError('');
                      setBtBusy(true);
                      try {
                        await connectBluetoothPrinter();
                        setBtConnected(true);
                      } catch (e) {
                        setBtError(e instanceof Error ? e.message : 'Gagal menyambung');
                        setBtConnected(false);
                      } finally {
                        setBtBusy(false);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {btBusy ? 'Menyambung…' : 'Hubungkan printer'}
                  </button>
                  <button
                    type="button"
                    disabled={btBusy || !btConnected}
                    onClick={async () => {
                      setBtBusy(true);
                      try {
                        await disconnectBluetoothPrinter();
                        setBtConnected(false);
                      } finally {
                        setBtBusy(false);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium"
                  >
                    Putus
                  </button>
                </div>
                <button
                  type="button"
                  disabled={btBusy || !btConnected}
                  onClick={async () => {
                    setBtError('');
                    setBtBusy(true);
                    try {
                      await printTextToBluetooth(
                        [
                          'OMNIFYI POS',
                          '=============================',
                          'TEST PRINT',
                          `Waktu: ${new Date().toLocaleString('id-ID')}`,
                          '=============================',
                          'Jika struk keluar, printer OK.',
                          '',
                        ].join('\n')
                      );
                    } catch (e) {
                      setBtError(e instanceof Error ? e.message : 'Gagal test print');
                    } finally {
                      setBtBusy(false);
                    }
                  }}
                  className="mt-2 w-full py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold disabled:opacity-50"
                >
                  {btBusy ? 'Mencetak…' : 'Test Print'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
