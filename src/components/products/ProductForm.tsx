import React, { useState, useEffect } from 'react';
import {
  X, Camera, Plus, Trash2, Calculator, AlertTriangle, Lightbulb,
  ChevronDown, ChevronUp, Package, Save, RotateCcw
} from 'lucide-react';
import { db, Product, Category, Material } from '../../lib/db';
import { useAuthStore } from '../../lib/store';
import { formatCurrency, generateId } from '../../lib/utils';

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSave: () => void;
}

interface MaterialComposition {
  id: string;
  materialId: string;
  materialName: string;
  quantityUsed: number;
  unit: string;
  pricePerUnit: number;
  cost: number;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onClose, onSave }) => {
  const { currentBusiness, currentTenant } = useAuthStore();
  const isEdit = !!product;

  // Form State
  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || '');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice || 0);
  const [stockQuantity, setStockQuantity] = useState(product?.stockQuantity || 0);
  const [minStockAlert, setMinStockAlert] = useState(product?.minStockAlert || 5);
  const [unit, setUnit] = useState(product?.unit || 'pcs');
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  // HPP Calculator State
  const [showHppCalculator, setShowHppCalculator] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [compositions, setCompositions] = useState<MaterialComposition[]>([]);
  const [manualHpp, setManualHpp] = useState(product?.hpp || 0);
  const [useManualHpp, setUseManualHpp] = useState(true);

  // UI State
  const [loading, setLoading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Common units
  const unitOptions = ['pcs', 'porsi', 'cup', 'botol', 'kg', 'gram', 'liter', 'ml', 'pack', 'box', 'lusin'];

  useEffect(() => {
    loadData();
  }, [currentBusiness?.id]);

  const loadData = async () => {
    if (!currentBusiness?.id || !currentTenant?.id) return;
    try {
      const [mats, cats] = await Promise.all([
        db.materials
          .where('businessId')
          .equals(currentBusiness.id)
          .filter((m) => m.tenantId === currentTenant.id && m.isActive)
          .toArray(),
        db.categories
          .where('businessId')
          .equals(currentBusiness.id)
          .filter((c) => c.tenantId === currentTenant.id)
          .toArray(),
      ]);
      setMaterials(mats);
      setCategories(cats.filter(c => c.isActive));

      // Load existing compositions if editing
      if (product?.id) {
        const existingComps = await db.productMaterials.where({ productId: product.id }).toArray();
        if (existingComps.length > 0) {
          const compData: MaterialComposition[] = existingComps.map(pc => {
            const mat = mats.find(m => m.id === pc.materialId);
            return {
              id: pc.id!,
              materialId: pc.materialId,
              materialName: mat?.name || 'Unknown',
              quantityUsed: pc.quantityUsed,
              unit: pc.unit,
              pricePerUnit: mat?.pricePerUnit || 0,
              cost: pc.cost
            };
          });
          setCompositions(compData);
          setUseManualHpp(false);
          setShowHppCalculator(true);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const generateSku = () => {
    const prefix = name.substring(0, 3).toUpperCase() || 'PRD';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setSku(`${prefix}-${random}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress and convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setImageUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // HPP Calculator Functions
  const addComposition = () => {
    setCompositions([...compositions, {
      id: generateId(),
      materialId: '',
      materialName: '',
      quantityUsed: 0,
      unit: '',
      pricePerUnit: 0,
      cost: 0
    }]);
  };

  const updateComposition = (id: string, field: keyof MaterialComposition, value: string | number) => {
    setCompositions(prev => prev.map(comp => {
      if (comp.id !== id) return comp;
      
      const updated = { ...comp, [field]: value };
      
      // If material changed, update related fields
      if (field === 'materialId') {
        const mat = materials.find(m => m.id === value);
        if (mat) {
          updated.materialName = mat.name;
          updated.unit = mat.unit;
          updated.pricePerUnit = mat.pricePerUnit;
          updated.cost = updated.quantityUsed * mat.pricePerUnit;
        }
      }
      
      // If quantity changed, recalculate cost
      if (field === 'quantityUsed') {
        updated.cost = (value as number) * updated.pricePerUnit;
      }
      
      return updated;
    }));
  };

  const removeComposition = (id: string) => {
    setCompositions(prev => prev.filter(c => c.id !== id));
  };

  const calculatedHpp = compositions.reduce((sum, c) => sum + c.cost, 0);
  const effectiveHpp = useManualHpp ? manualHpp : calculatedHpp;
  const margin = sellingPrice > 0 ? ((sellingPrice - effectiveHpp) / sellingPrice) * 100 : 0;
  const profit = sellingPrice - effectiveHpp;

  const getSuggestedPrice = (targetMargin: number) => {
    if (effectiveHpp === 0) return 0;
    return Math.ceil(effectiveHpp / (1 - targetMargin / 100) / 1000) * 1000;
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !currentBusiness?.id || !currentTenant?.id) return;
    
    try {
      const newCat: Category = {
        id: generateId(),
        businessId: currentBusiness.id,
        tenantId: currentTenant.id,
        name: newCategoryName.trim(),
        sortOrder: categories.length,
        isActive: true
      };
      await db.categories.add(newCat);
      setCategories([...categories, newCat]);
      setCategoryId(newCat.id!);
      setNewCategoryName('');
      setShowNewCategory(false);
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Nama produk wajib diisi';
    if (sellingPrice <= 0) newErrors.sellingPrice = 'Harga jual harus lebih dari 0';
    if (stockQuantity < 0) newErrors.stockQuantity = 'Stok tidak boleh negatif';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Product
  const handleSave = async () => {
    if (!validate() || !currentBusiness?.id || !currentTenant?.id) return;
    
    setLoading(true);
    try {
      const productData: Product = {
        id: product?.id || generateId(),
        businessId: currentBusiness.id,
        tenantId: currentTenant.id,
        categoryId: categoryId || undefined,
        name: name.trim(),
        sku: sku || undefined,
        barcode: barcode || undefined,
        imageUrl: imageUrl || undefined,
        sellingPrice,
        hpp: effectiveHpp,
        stockQuantity,
        minStockAlert,
        unit,
        isActive,
        createdAt: product?.createdAt || new Date()
      };

      if (isEdit) {
        await db.products.update(product!.id!, productData);
      } else {
        await db.products.add(productData);
      }

      // Save compositions if using HPP calculator
      if (!useManualHpp && compositions.length > 0) {
        // Delete existing compositions
        if (isEdit) {
          await db.productMaterials.where({ productId: product!.id }).delete();
        }
        
        // Add new compositions
        for (const comp of compositions) {
          if (comp.materialId && comp.quantityUsed > 0) {
            await db.productMaterials.add({
              id: generateId(),
              productId: productData.id!,
              materialId: comp.materialId,
              quantityUsed: comp.quantityUsed,
              unit: comp.unit,
              cost: comp.cost
            });
          }
        }
      }

      onSave();
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl mx-4 my-auto shadow-xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Produk' : 'Tambah Produk'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto text-gray-900 dark:text-gray-100">
          {/* Image Upload */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt="Product" className="w-full h-full object-cover object-center aspect-square" />
              ) : (
                <Package size={32} className="text-gray-400" />
              )}
            </div>
            <div>
              <label className="block">
                <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100">
                  <Camera size={16} />
                  Upload Foto
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG max 2MB</p>
            </div>
            {imageUrl && (
              <button
                onClick={() => setImageUrl('')}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Produk <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Nasi Goreng Spesial"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Auto / Manual"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={generateSku}
                  className="px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* Barcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan atau ketik manual"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              {showNewCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nama kategori baru"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewCategory(true)}
                    className="px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga Jual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                <input
                  type="number"
                  value={sellingPrice || ''}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  placeholder="0"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.sellingPrice ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.sellingPrice && <p className="text-xs text-red-500 mt-1">{errors.sellingPrice}</p>}
            </div>

            {/* Stock & Unit */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {unitOptions.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Min Stock Alert */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimal Stok (Alert)</label>
              <input
                type="number"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm text-gray-700">Produk Aktif</span>
            </div>
          </div>

          {/* HPP Calculator Section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowHppCalculator(!showHppCalculator)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-blue-600" />
                <span className="font-medium text-gray-900">Kalkulator HPP</span>
              </div>
              {showHppCalculator ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showHppCalculator && (
              <div className="p-4 space-y-4">
                {/* Toggle Manual/Auto HPP */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setUseManualHpp(true)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg ${
                      useManualHpp 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Input Manual
                  </button>
                  <button
                    onClick={() => setUseManualHpp(false)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg ${
                      !useManualHpp 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Hitung dari Bahan
                  </button>
                </div>

                {useManualHpp ? (
                  /* Manual HPP Input */
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HPP (Manual)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                      <input
                        type="number"
                        value={manualHpp || ''}
                        onChange={(e) => setManualHpp(Number(e.target.value))}
                        placeholder="0"
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  /* Composition Table */
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">Komposisi Bahan</div>
                    
                    {materials.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <AlertTriangle className="mx-auto text-yellow-500 mb-2" size={24} />
                        <p className="text-sm text-yellow-700">Belum ada bahan terdaftar.</p>
                        <p className="text-xs text-yellow-600">Tambahkan bahan baku di menu Bahan terlebih dahulu.</p>
                      </div>
                    ) : (
                      <>
                        {compositions.map((comp) => (
                          <div key={comp.id} className="flex gap-2 items-start">
                            <div className="flex-1">
                              <select
                                value={comp.materialId}
                                onChange={(e) => updateComposition(comp.id, 'materialId', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Pilih Bahan</option>
                                {materials.map(mat => (
                                  <option key={mat.id} value={mat.id}>
                                    {mat.name} ({formatCurrency(mat.pricePerUnit)}/{mat.unit})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="w-24">
                              <input
                                type="number"
                                value={comp.quantityUsed || ''}
                                onChange={(e) => updateComposition(comp.id, 'quantityUsed', Number(e.target.value))}
                                placeholder="Qty"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="w-20 py-2 text-sm text-gray-500 text-center">
                              {comp.unit || '-'}
                            </div>
                            <div className="w-28 py-2 text-sm font-medium text-right">
                              {formatCurrency(comp.cost)}
                            </div>
                            <button
                              onClick={() => removeComposition(comp.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={addComposition}
                          className="w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          Tambah Bahan
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* HPP Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total HPP per Produk:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(effectiveHpp)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Harga Jual:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(sellingPrice)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="text-gray-600">Margin:</span>
                    <span className={`font-bold ${
                      margin >= 40 ? 'text-green-600' : 
                      margin >= 20 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(profit)} ({margin.toFixed(1)}%)
                    </span>
                  </div>

                  {/* Margin Warning */}
                  {margin < 30 && sellingPrice > 0 && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-700">
                        Margin di bawah 30%. Pertimbangkan untuk menaikkan harga jual.
                      </p>
                    </div>
                  )}

                  {/* Price Suggestions */}
                  {effectiveHpp > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Lightbulb size={14} />
                        Saran harga jual:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[40, 50, 60].map(targetMargin => (
                          <button
                            key={targetMargin}
                            onClick={() => setSellingPrice(getSuggestedPrice(targetMargin))}
                            className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-full hover:border-blue-300 hover:bg-blue-50"
                          >
                            {formatCurrency(getSuggestedPrice(targetMargin))} ({targetMargin}%)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={16} />
                {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
