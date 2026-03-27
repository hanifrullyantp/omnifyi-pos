import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      const scanner = new Html5Qrcode('scanner-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777778
        },
        (decodedText) => {
          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(100);
          }
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        () => {
          // Ignore errors during scanning
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.log('Scanner already stopped');
      }
      setIsScanning(false);
    }
  };

  const handleClose = () => {
    stopScanner();
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
          className="absolute inset-0 bg-black"
        />

        {/* Scanner UI */}
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white">
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-medium">Scan Barcode</h2>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Scanner Container */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative w-full max-w-sm">
              {/* Scanner View */}
              <div 
                id="scanner-container" 
                className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-900"
              />

              {/* Scan Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-40">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />
                  
                  {/* Scan line animation */}
                  <motion.div
                    className="absolute left-4 right-4 h-0.5 bg-emerald-500 shadow-lg shadow-emerald-500"
                    initial={{ top: '10%' }}
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl"
                >
                  <div className="text-center p-6">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-white mb-4">{error}</p>
                    <button
                      onClick={startScanner}
                      className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="p-6 text-center text-white">
            <p className="text-gray-300 mb-2">
              Arahkan kamera ke barcode produk
            </p>
            <p className="text-sm text-gray-500">
              Barcode akan terdeteksi secara otomatis
            </p>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default BarcodeScanner;
