import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, MoreVertical, Edit2, Trash2, Eye, EyeOff,
  Package, Grid, List, ArrowUpDown
} from 'lucide-react';
import { db, Material } from '../../lib/db';
import { useAuthStore } from '../../lib/store';
import { formatCurrency } from '../../lib/utils';

interface MaterialListProps {
  onAddMaterial: () => void;
  onEditMaterial: (material: Material) => void;
}

type SortField = 'name' | 'pricePerUnit' | 'stockQuantity' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export const MaterialList: React.FC<MaterialListProps> = ({
  onAddMaterial,
  onEditMaterial
}) => {
  const { currentBusiness, currentTenant } = useAuthStore();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'low'>('all');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    loadData();
  }, [currentBusiness?.id]);

  const loadData = async () => {
    if (!currentBusiness?.id || !currentTenant?.id) return;
    setLoading(true);
    try {
      const mats = await db.materials
        .where({ businessId: currentBusiness.id, tenantId: currentTenant.id })
        .toArray();
      setMaterials(mats);
    } catch (error) {
      console.error('Failed to load materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedMaterials = useMemo(() => {
    let filtered = materials.filter(m => {
      const matchesSearch = searchQuery === '' || 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.supplierName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && m.isActive) ||
        (statusFilter === 'low' && m.stockQuantity <= m.minStockAlert);

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'pricePerUnit':
          comparison = a.pricePerUnit - b.pricePerUnit;
          break;
        case 'stockQuantity':
          comparison = a.stockQuantity - b.stockQuantity;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [materials, searchQuery, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteMaterial = async (material: Material) => {
    // Check if material is used in any product
    const usedInProducts = await db.productMaterials
      .where({ materialId: material.id })
      .count();
    
    if (usedInProducts > 0) {
      if (!window.confirm(`Bahan "${material.name}" digunakan di ${usedInProducts} produk. Hapus akan menghilangkan bahan dari resep produk tersebut. Lanjutkan?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Hapus bahan "${material.name}"?`)) return;
    }

    try {
      await db.materials.delete(material.id!);
      await db.productMaterials.where({ materialId: material.id }).delete();
      await loadData();
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };

  const handleToggleStatus = async (material: Material) => {
    try {
      await db.materials.update(material.id!, { isActive: !material.isActive });
      await loadData();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const getStockBadge = (material: Material) => {
    if (material.stockQuantity === 0) {
      return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Habis</span>;
    }
    if (material.stockQuantity <= material.minStockAlert) {
      return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Menipis</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Tersedia</span>;
  };

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bahan Baku</h2>
          <p className="text-sm text-gray-500">{materials.length} bahan terdaftar</p>
        </div>
        <button
          onClick={onAddMaterial}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Bahan
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama bahan atau supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="low">Stok Menipis</option>
          </select>

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
      </div>

      {/* Material List */}
      {filteredAndSortedMaterials.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Package className="mx-auto text-gray-300 mb-3" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada bahan</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery 
              ? 'Tidak ada bahan yang sesuai dengan pencarian' 
              : 'Mulai tambahkan bahan baku untuk menghitung HPP produk'}
          </p>
          {!searchQuery && (
            <button
              onClick={onAddMaterial}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Tambah Bahan
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
                    >
                      Nama Bahan
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('pricePerUnit')}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
                    >
                      Harga/Unit
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
                    Supplier
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
                {filteredAndSortedMaterials.map(material => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{material.name}</p>
                        <p className="text-xs text-gray-500">Satuan: {material.unit}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(material.pricePerUnit)} / {material.unit}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{material.stockQuantity} {material.unit}</span>
                        {getStockBadge(material)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {material.supplierName || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(material)}
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          material.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {material.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === material.id ? null : material.id!)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {actionMenuOpen === material.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActionMenuOpen(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={() => { onEditMaterial(material); setActionMenuOpen(null); }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit2 size={14} /> Edit
                              </button>
                              <button
                                onClick={() => { handleToggleStatus(material); setActionMenuOpen(null); }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                {material.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                                {material.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                              </button>
                              <button
                                onClick={() => { handleDeleteMaterial(material); setActionMenuOpen(null); }}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedMaterials.map(material => (
            <div 
              key={material.id} 
              className={`bg-white rounded-xl border border-gray-200 p-4 ${
                !material.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package size={20} className="text-blue-600" />
                </div>
                {getStockBadge(material)}
              </div>
              <h3 className="font-medium text-gray-900 truncate">{material.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{material.unit}</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(material.pricePerUnit)}</p>
              <p className="text-xs text-gray-500">Stok: {material.stockQuantity} {material.unit}</p>
              
              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onEditMaterial(material)}
                  className="flex-1 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMaterial(material)}
                  className="py-1.5 px-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
