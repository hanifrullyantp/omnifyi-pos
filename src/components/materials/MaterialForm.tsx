import { useState, useEffect } from 'react';
import { X, Package, AlertTriangle, Truck, FileText, Save } from 'lucide-react';
import { db, Material } from '../../lib/db';
import { generateId, formatCurrency } from '../../lib/utils';

interface MaterialFormProps {
  material?: Material | null;
  tenantId: string;
  businessId: string;
  onClose: () => void;
  onSaved: () => void;
}

const UNITS = [
  { value: 'gram', label: 'Gram (g)', conversion: { to: 'kg', factor: 0.001 } },
  { value: 'kg', label: 'Kilogram (kg)', conversion: { to: 'gram', factor: 1000 } },
  { value: 'ml', label: 'Mililiter (ml)', conversion: { to: 'liter', factor: 0.001 } },
  { value: 'liter', label: 'Liter (L)', conversion: { to: 'ml', factor: 1000 } },
  { value: 'butir', label: 'Butir', conversion: null },
  { value: 'lembar', label: 'Lembar', conversion: null },
  { value: 'buah', label: 'Buah', conversion: null },
  { value: 'bungkus', label: 'Bungkus', conversion: null },
  { value: 'botol', label: 'Botol', conversion: null },
  { value: 'kaleng', label: 'Kaleng', conversion: null },
  { value: 'sachet', label: 'Sachet', conversion: null },
  { value: 'dus', label: 'Dus/Box', conversion: null },
];

export function MaterialForm({ material, tenantId, businessId, onClose, onSaved }: MaterialFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    unit: 'gram',
    pricePerUnit: 0,
    stockQuantity: 0,
    minStockAlert: 0,
    supplierName: '',
    supplierContact: '',
    notes: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        unit: material.unit,
        pricePerUnit: material.pricePerUnit,
        stockQuantity: material.stockQuantity,
        minStockAlert: material.minStockAlert || 0,
        supplierName: material.supplierName || '',
        supplierContact: material.supplierContact || '',
        notes: material.notes || '',
        isActive: material.isActive,
      });
    }
  }, [material]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nama bahan wajib diisi';
    if (!formData.unit) newErrors.unit = 'Satuan wajib dipilih';
    if (formData.pricePerUnit < 0) newErrors.pricePerUnit = 'Harga tidak boleh negatif';
    if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Stok tidak boleh negatif';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const now = new Date();
      
      if (material) {
        await db.materials.update(material.id!, {
          ...formData,
          updatedAt: now,
        });
      } else {
        await db.materials.add({
          id: generateId(),
          tenantId,
          businessId,
          ...formData,
          createdAt: now,
          updatedAt: now,
        });
      }
      
      onSaved();
    } catch (error) {
      console.error('Error saving material:', error);
      setErrors({ submit: 'Gagal menyimpan bahan' });
    } finally {
      setSaving(false);
    }
  };

  const selectedUnit = UNITS.find(u => u.value === formData.unit);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <h2 className="text-lg font-bold">
            {material ? 'Edit Bahan' : 'Tambah Bahan Baru'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-gray-900 dark:text-gray-100">
          {/* Nama Bahan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nama Bahan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-gray-800 ${
                  errors.name ? 'border-red-500' : 'border-gray-200'
                } focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:border-gray-600`}
                placeholder="Contoh: Tepung Terigu Segitiga Biru"
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Satuan & Harga */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Satuan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
              {selectedUnit?.conversion && (
                <p className="text-xs text-gray-500 mt-1">
                  1 {selectedUnit.conversion.to} = {selectedUnit.conversion.factor} {formData.unit}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Harga per {formData.unit} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">Rp</span>
                <input
                  type="number"
                  value={formData.pricePerUnit || ''}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: Number(e.target.value) })}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white dark:bg-gray-800 ${
                    errors.pricePerUnit ? 'border-red-500' : 'border-gray-200'
                  } focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:border-gray-600`}
                  placeholder="0"
                  min="0"
                />
              </div>
              {errors.pricePerUnit && <p className="text-red-500 text-sm mt-1">{errors.pricePerUnit}</p>}
            </div>
          </div>

          {/* Stok */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stok Saat Ini <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.stockQuantity || ''}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                  className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 ${
                    errors.stockQuantity ? 'border-red-500' : 'border-gray-200'
                  } focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:border-gray-600`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  {formData.unit}
                </span>
              </div>
              {errors.stockQuantity && <p className="text-red-500 text-sm mt-1">{errors.stockQuantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimal Stok (Alert)
              </label>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                <input
                  type="number"
                  value={formData.minStockAlert || ''}
                  onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                  className="w-full pl-10 pr-16 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  {formData.unit}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Alert muncul jika stok di bawah nilai ini</p>
            </div>
          </div>

          {/* Info Supplier */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Informasi Supplier
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Supplier
                </label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Contoh: Toko Bahan Kue ABC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kontak Supplier
                </label>
                <input
                  type="text"
                  value={formData.supplierContact}
                  onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="08123456789"
                />
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              Catatan
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Catatan tambahan tentang bahan ini..."
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bahan {formData.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>

          {/* Preview Info */}
          {formData.pricePerUnit > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/40">
              <h4 className="font-medium text-amber-800 mb-2">📊 Ringkasan</h4>
              <div className="space-y-1 text-sm">
                <p className="text-amber-700">
                  Harga: <span className="font-bold">{formatCurrency(formData.pricePerUnit)}</span> per {formData.unit}
                </p>
                <p className="text-amber-700">
                  Total Nilai Stok: <span className="font-bold">{formatCurrency(formData.pricePerUnit * formData.stockQuantity)}</span>
                </p>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
