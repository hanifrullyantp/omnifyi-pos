import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Filter, MoreVertical, Edit2, Trash2, Eye, EyeOff,
  Package, AlertTriangle, ChevronDown, ChevronUp, Grid, List,
  ArrowUpDown, CheckSquare, Square, Image as ImageIcon
} from 'lucide-react';
import { db, Product, Category } from '../../lib/db';
import { useAuthStore } from '../../lib/store';
import { formatCurrency } from '../../lib/utils';

interface ProductListProps {
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onManageCategories: () => void;
}

type SortField = 'name' | 'sellingPrice' | 'stockQuantity' | 'margin' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

export const ProductList: React.FC<ProductListProps> = ({
  onAddProduct,
  onEditProduct,
  onManageCategories
}) => {
  const { currentBusiness, currentTenant } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [currentBusiness?.id]);

  const loadData = async () => {
    if (!currentBusiness?.id || !currentTenant?.id) return;
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        db.products.where({ businessId: currentBusiness.id, tenantId: currentTenant.id }).toArray(),
        db.categories.where({ businessId: currentBusiness.id, tenantId: currentTenant.id }).toArray()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(p => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && p.isActive) ||
        (statusFilter === 'inactive' && !p.isActive);
      
      // Stock filter
      const matchesStock = stockFilter === 'all' ||
        (stockFilter === 'low' && p.stockQuantity <= p.minStockAlert && p.stockQuantity > 0) ||
        (stockFilter === 'out' && p.stockQuantity === 0);

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'sellingPrice':
          comparison = a.sellingPrice - b.sellingPrice;
          break;
        case 'stockQuantity':
          comparison = a.stockQuantity - b.stockQuantity;
          break;
        case 'margin':
          const marginA = a.sellingPrice > 0 ? ((a.sellingPrice - a.hpp) / a.sellingPrice) * 100 : 0;
          const marginB = b.sellingPrice > 0 ? ((b.sellingPrice - b.hpp) / b.sellingPrice) * 100 : 0;
          comparison = marginA - marginB;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [products, searchQuery, selectedCategory, statusFilter, stockFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredAndSortedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredAndSortedProducts.map(p => p.id!)));
    }
  };

  const toggleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedProducts.size === 0) return;
    
    const confirmed = action === 'delete' 
      ? window.confirm(`Hapus ${selectedProducts.size} produk? Tindakan ini tidak dapat dibatalkan.`)
      : window.confirm(`${action === 'activate' ? 'Aktifkan' : 'Nonaktifkan'} ${selectedProducts.size} produk?`);
    
    if (!confirmed) return;

    try {
      for (const productId of selectedProducts) {
        if (action === 'delete') {
          await db.products.delete(productId);
          // Also delete product materials
          await db.productMaterials.where({ productId }).delete();
        } else {
          await db.products.update(productId, { isActive: action === 'activate' });
        }
      }
      setSelectedProducts(new Set());
      await loadData();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return;
    try {
      await db.products.delete(product.id!);
      await db.productMaterials.where({ productId: product.id }).delete();
      await loadData();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await db.products.update(product.id!, { isActive: !product.isActive });
      await loadData();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '-';
  };

  const getMargin = (product: Product) => {
    if (product.sellingPrice === 0) return 0;
    return ((product.sellingPrice - product.hpp) / product.sellingPrice) * 100;
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 40) return 'text-green-600';
    if (margin >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStockBadge = (product: Product) => {
    if (product.stockQuantity === 0) {
      return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Habis</span>;
    }
    if (product.stockQuantity <= product.minStockAlert) {
      return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Menipis</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Tersedia</span>;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0 max-w-full w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Produk</h2>
          <p className="text-sm text-gray-500">{products.length} produk terdaftar</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onManageCategories}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Kategori
          </button>
          <button
            onClick={onAddProduct}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row gap-3 min-w-0">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama, SKU, atau barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
          >
            <option value="all">Semua Kategori</option>
            {categories.filter(c => c.isActive).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-700'
            }`}
          >
            <Filter size={18} />
            Filter
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* View Toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 ${viewMode === 'table' ? 'bg-gray-100 text-blue-600' : 'text-gray-500'}`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-blue-600' : 'text-gray-500'}`}
            >
              <Grid size={18} />
            </button>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
              >
                <option value="all">Semua</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stok</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
              >
                <option value="all">Semua</option>
                <option value="low">Menipis</option>
                <option value="out">Habis</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-blue-700">{selectedProducts.size} produk dipilih</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
            >
              Aktifkan
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200"
            >
              Nonaktifkan
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
            >
              Hapus
            </button>
          </div>
        </div>
      )}

      {/* Product List */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Package className="mx-auto text-gray-300 mb-3" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada produk</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Tidak ada produk yang sesuai dengan filter' 
              : 'Mulai tambahkan produk pertama Anda'}
          </p>
          {!searchQuery && selectedCategory === 'all' && (
            <button
              onClick={onAddProduct}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Tambah Produk
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-w-full">
          <div className="overflow-x-auto overscroll-x-contain max-w-full touch-pan-x">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {selectedProducts.size === filteredAndSortedProducts.length ? (
                        <CheckSquare size={18} />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Produk
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('sellingPrice')}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
                    >
                      Harga Jual
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    HPP
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('margin')}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
                    >
                      Margin
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('stockQuantity')}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
                    >
                      Stok
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedProducts.map(product => {
                  const margin = getMargin(product);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onEditProduct(product)}>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectProduct(product.id!);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {selectedProducts.has(product.id!) ? (
                            <CheckSquare size={18} className="text-blue-600" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover object-center aspect-square" />
                            ) : (
                              <ImageIcon size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">SKU: {product.sku || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getCategoryName(product.categoryId)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(product.sellingPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatCurrency(product.hpp)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${getMarginColor(margin)}`}>
                          {margin.toFixed(1)}%
                        </span>
                        {margin < 30 && (
                          <AlertTriangle size={14} className="inline ml-1 text-yellow-500" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">{product.stockQuantity} {product.unit}</span>
                          {getStockBadge(product)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(product);
                          }}
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            product.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {product.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuOpen(actionMenuOpen === product.id ? null : product.id!);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            <MoreVertical size={18} />
                          </button>
                          {actionMenuOpen === product.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActionMenuOpen(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={(e) => { e.stopPropagation(); onEditProduct(product); setActionMenuOpen(null); }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit2 size={14} /> Edit
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleStatus(product); setActionMenuOpen(null); }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  {product.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                                  {product.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product); setActionMenuOpen(null); }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 size={14} /> Hapus
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View (Mobile Friendly) */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedProducts.map(product => {
            const margin = getMargin(product);
            return (
              <div
                key={product.id} 
                className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${
                  !product.isActive ? 'opacity-60' : ''
                } cursor-pointer`}
                onClick={() => onEditProduct(product)}
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 relative">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover object-center aspect-square" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={32} className="text-gray-300" />
                    </div>
                  )}
                  {/* Stock Badge */}
                  <div className="absolute top-2 left-2">
                    {getStockBadge(product)}
                  </div>
                  {/* Select Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectProduct(product.id!);
                    }}
                    className="absolute top-2 right-2 p-1 bg-white rounded shadow"
                  >
                    {selectedProducts.has(product.id!) ? (
                      <CheckSquare size={18} className="text-blue-600" />
                    ) : (
                      <Square size={18} className="text-gray-400" />
                    )}
                  </button>
                </div>
                
                {/* Info */}
                <div className="p-3">
                  <p className="font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 mb-2">{getCategoryName(product.categoryId)}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-600">{formatCurrency(product.sellingPrice)}</span>
                    <span className={`text-xs font-medium ${getMarginColor(margin)}`}>
                      {margin.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Stok: {product.stockQuantity} {product.unit}
                  </p>
                  
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProduct(product);
                      }}
                      className="flex-1 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProduct(product);
                      }}
                      className="py-1.5 px-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
