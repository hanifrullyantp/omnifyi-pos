import { useState } from 'react';
import { X, Package, Plus, History, TrendingUp } from 'lucide-react';
import { db, Material, MaterialRestockHistory } from '../../lib/db';
import { generateId, formatCurrency } from '../../lib/utils';

interface RestockModalProps {
  material: Material;
  onClose: () => void;
  onRestocked: () => void;
}

export function RestockModal({ material, onClose, onRestocked }: RestockModalProps) {
  const [addedStock, setAddedStock] = useState<number>(0);
  const [pricePerUnit, setPricePerUnit] = useState<number>(material.pricePerUnit);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<MaterialRestockHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = async () => {
    const records = await db.materialRestockHistory
      .where('materialId')
      .equals(material.id!)
      .reverse()
      .limit(10)
      .toArray();
    setHistory(records);
    setShowHistory(true);
  };

  const handleRestock = async () => {
    if (addedStock <= 0) return;

    setSaving(true);
    try {
      const now = new Date();
      const newStock = material.stockQuantity + addedStock;

      // Update material stock
      await db.materials.update(material.id!, {
        stockQuantity: newStock,
        pricePerUnit: pricePerUnit,
        updatedAt: now,
      });

      // Add restock history
      await db.materialRestockHistory.add({
        id: generateId(),
        materialId: material.id!,
        businessId: material.businessId,
        tenantId: material.tenantId,
        previousStock: material.stockQuantity,
        addedStock: addedStock,
        newStock: newStock,
        pricePerUnit: pricePerUnit,
        totalCost: addedStock * pricePerUnit,
        notes: notes,
        createdAt: now,
      });

      onRestocked();
    } catch (error) {
      console.error('Error restocking material:', error);
    } finally {
      setSaving(false);
    }
  };

  const totalCost = addedStock * pricePerUnit;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Restock Bahan
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Material Info */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{material.name}</h3>
                <p className="text-sm text-gray-500">
                  Stok saat ini: <span className="font-medium text-gray-700">{material.stockQuantity} {material.unit}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Restock Form */}
          {!showHistory ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Tambahan
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={addedStock || ''}
                    onChange={(e) => setAddedStock(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    {material.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga per {material.unit}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                  <input
                    type="number"
                    value={pricePerUnit || ''}
                    onChange={(e) => setPricePerUnit(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
                {pricePerUnit !== material.pricePerUnit && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Harga berbeda dari sebelumnya ({formatCurrency(material.pricePerUnit)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan (opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Contoh: Beli dari supplier ABC"
                />
              </div>

              {/* Summary */}
              {addedStock > 0 && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Stok Sekarang</span>
                    <span className="font-medium">{material.stockQuantity} {material.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Ditambahkan</span>
                    <span className="font-medium text-green-600">+{addedStock} {material.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t border-green-200 pt-2">
                    <span className="text-green-800">Stok Baru</span>
                    <span className="text-green-600">{material.stockQuantity + addedStock} {material.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-green-200">
                    <span className="text-green-700">Total Biaya Pembelian</span>
                    <span className="font-bold text-green-800">{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={loadHistory}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
              >
                <History className="w-4 h-4" />
                Lihat Riwayat Restock
              </button>
            </>
          ) : (
            <>
              {/* History View */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Riwayat Restock
                </h3>
                
                {history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>Belum ada riwayat restock</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.map((record) => (
                      <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +{record.addedStock} {material.unit}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(record.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{record.previousStock} → {record.newStock} {material.unit}</span>
                          <span className="font-medium">{formatCurrency(record.totalCost)}</span>
                        </div>
                        {record.notes && (
                          <p className="text-xs text-gray-500 mt-1">📝 {record.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowHistory(false)}
                  className="w-full py-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Kembali ke Form Restock
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!showHistory && (
          <div className="p-4 border-t bg-gray-50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
            >
              Batal
            </button>
            <button
              onClick={handleRestock}
              disabled={saving || addedStock <= 0}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {saving ? 'Menyimpan...' : 'Restock'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
