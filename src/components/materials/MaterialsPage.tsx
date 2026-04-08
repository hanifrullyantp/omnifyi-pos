import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Grid3X3,
  Rows3,
  AlertTriangle,
  Edit2,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  MoreVertical,
  ChevronDown,
  Phone,
  Truck,
  Check,
  Archive,
} from 'lucide-react';
import { db, Material } from '../../lib/db';
import { formatCurrency } from '../../lib/utils';
import { MaterialForm } from './MaterialForm';
import { RestockModal } from './RestockModal';
import { ImportExcelModal } from './ImportExcelModal';

interface MaterialsPageProps {
  tenantId: string;
  businessId: string;
}

type FilterStatus = 'all' | 'active' | 'inactive' | 'low_stock';
type SortField = 'name' | 'stock' | 'price' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export function MaterialsPage({ tenantId, businessId }: MaterialsPageProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  
  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [restockMaterial, setRestockMaterial] = useState<Material | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Material | null>(null);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  useEffect(() => {
    loadMaterials();
  }, [businessId]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await db.materials
        .where('businessId')
        .equals(businessId)
        .toArray();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort materials
  const filteredMaterials = useMemo(() => {
    let result = [...materials];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.supplierName?.toLowerCase().includes(query)
      );
    }

    // Status filter
    switch (filterStatus) {
      case 'active':
        result = result.filter((m) => m.isActive);
        break;
      case 'inactive':
        result = result.filter((m) => !m.isActive);
        break;
      case 'low_stock':
        result = result.filter((m) => m.stockQuantity <= m.minStockAlert);
        break;
    }

    // Sort
    result.sort((a, b) => {
      let compareValue = 0;
      switch (sortField) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'stock':
          compareValue = a.stockQuantity - b.stockQuantity;
          break;
        case 'price':
          compareValue = a.pricePerUnit - b.pricePerUnit;
          break;
        case 'createdAt':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return result;
  }, [materials, searchQuery, filterStatus, sortField, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const lowStock = materials.filter((m) => m.stockQuantity <= m.minStockAlert && m.isActive).length;
    const totalValue = materials.reduce((sum, m) => sum + m.stockQuantity * m.pricePerUnit, 0);
    const activeCount = materials.filter((m) => m.isActive).length;
    return { lowStock, totalValue, activeCount, total: materials.length };
  }, [materials]);

  const handleDelete = async (material: Material) => {
    try {
      await db.materials.delete(material.id!);
      loadMaterials();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    const ids = Array.from(selectedMaterials);
    try {
      if (action === 'delete') {
        await db.materials.bulkDelete(ids);
      } else {
        await Promise.all(
          ids.map((id) =>
            db.materials.update(id, { isActive: action === 'activate' })
          )
        );
      }
      loadMaterials();
      setSelectedMaterials(new Set());
      setShowBulkMenu(false);
    } catch (error) {
      console.error('Error bulk action:', error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedMaterials.size === filteredMaterials.length) {
      setSelectedMaterials(new Set());
    } else {
      setSelectedMaterials(new Set(filteredMaterials.map((m) => m.id!)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedMaterials);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedMaterials(newSet);
  };

  const exportToCSV = () => {
    const headers = ['Nama', 'Satuan', 'Harga/Unit', 'Stok', 'Min Stok', 'Supplier', 'Status'];
    const rows = filteredMaterials.map((m) => [
      m.name,
      m.unit,
      m.pricePerUnit,
      m.stockQuantity,
      m.minStockAlert,
      m.supplierName || '-',
      m.isActive ? 'Aktif' : 'Nonaktif',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bahan_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="materials-theme ui-page text-sm md:text-base text-[var(--app-text)] w-full min-w-0 max-w-full overflow-x-clip">
      {/* Header */}
      <div className="bg-[var(--app-surface)] border-b border-[var(--app-border)] sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bahan Baku</h1>
              <p className="text-sm text-gray-500">Kelola stok bahan baku usahamu</p>
            </div>
            <button
              onClick={() => {
                setEditingMaterial(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Tambah Bahan</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-600 font-medium">Total Bahan</p>
              <p className="text-xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3">
              <p className="text-xs text-green-600 font-medium">Aktif</p>
              <p className="text-xl font-bold text-green-900">{stats.activeCount}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-600 font-medium">Stok Menipis</p>
              <p className="text-xl font-bold text-amber-900">{stats.lowStock}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3">
              <p className="text-xs text-purple-600 font-medium">Nilai Stok</p>
              <p className="text-lg font-bold text-purple-900">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2 min-w-0">
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari bahan atau supplier..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition ${
                showFilters || filterStatus !== 'all'
                  ? 'bg-amber-50 border-amber-500 text-amber-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              <ChevronDown className={`w-4 h-4 transition ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-2"
              title="Export CSV"
            >
              <Download className="w-5 h-5" />
            </button>
            <div className="flex border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3 py-2 ${viewMode === 'card' ? 'bg-amber-100 text-amber-700' : 'bg-white text-gray-600'}`}
                title="View card"
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 ${viewMode === 'table' ? 'bg-amber-100 text-amber-700' : 'bg-white text-gray-600'}`}
                title="View tabel"
              >
                <Rows3 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'Semua' },
                    { value: 'active', label: 'Aktif' },
                    { value: 'inactive', label: 'Nonaktif' },
                    { value: 'low_stock', label: '⚠️ Stok Menipis' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilterStatus(opt.value as FilterStatus)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        filterStatus === opt.value
                          ? 'bg-amber-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Urutkan</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'name', label: 'Nama' },
                    { value: 'stock', label: 'Stok' },
                    { value: 'price', label: 'Harga' },
                    { value: 'createdAt', label: 'Terbaru' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (sortField === opt.value) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField(opt.value as SortField);
                          setSortOrder('asc');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                        sortField === opt.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                      {sortField === opt.value && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedMaterials.size > 0 && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between">
            <span className="text-sm font-medium text-amber-800">
              {selectedMaterials.size} bahan dipilih
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedMaterials(new Set())}
                className="text-sm text-amber-600 hover:text-amber-800"
              >
                Batal
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium"
                >
                  Aksi <ChevronDown className="w-4 h-4" />
                </button>
                {showBulkMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 min-w-[150px] z-20">
                    <button
                      onClick={() => handleBulkAction('activate')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4 text-green-500" />
                      Aktifkan
                    </button>
                    <button
                      onClick={() => handleBulkAction('deactivate')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4 text-gray-500" />
                      Nonaktifkan
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Materials List */}
      <div className="p-4">
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {searchQuery || filterStatus !== 'all'
                ? 'Tidak ada bahan ditemukan'
                : 'Belum ada bahan'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || filterStatus !== 'all'
                ? 'Coba ubah filter atau kata kunci pencarian'
                : 'Mulai tambahkan bahan baku untuk usahamu'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-medium"
              >
                <Plus className="w-5 h-5" />
                Tambah Bahan Pertama
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table View */}
            {viewMode === 'table' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden max-w-full">
                <div className="overflow-x-auto overscroll-x-contain max-w-full touch-pan-x">
                  <table className="w-full min-w-[960px] text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-12 p-4">
                      <input
                        type="checkbox"
                        checked={selectedMaterials.size === filteredMaterials.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                      />
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Bahan</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Satuan</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-600">Harga/Unit</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-600">Stok</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Supplier</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMaterials.map((material) => (
                    <tr key={material.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setEditingMaterial(material); setShowForm(true); }}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedMaterials.has(material.id!)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelect(material.id!);
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{material.name}</p>
                            {material.notes && (
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{material.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{material.unit}</td>
                      <td className="p-4 text-right font-medium">{formatCurrency(material.pricePerUnit)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {material.stockQuantity <= material.minStockAlert && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                          <span
                            className={`font-medium ${
                              material.stockQuantity <= material.minStockAlert
                                ? 'text-amber-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {material.stockQuantity}
                          </span>
                          <span className="text-gray-500 text-sm">{material.unit}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {material.supplierName ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Truck className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{material.supplierName}</span>
                            {material.supplierContact && (
                              <a
                                href={`tel:${material.supplierContact}`}
                                className="text-blue-500 hover:text-blue-600"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            material.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {material.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRestockMaterial(material);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Restock"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMaterial(material);
                              setShowForm(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(material);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Card View */}
            {viewMode === 'card' && (
              <div className="space-y-3">
                {filteredMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    selected={selectedMaterials.has(material.id!)}
                    onSelect={() => toggleSelect(material.id!)}
                    onEdit={() => {
                      setEditingMaterial(material);
                      setShowForm(true);
                    }}
                    onRestock={() => setRestockMaterial(material)}
                    onDelete={() => setDeleteConfirm(material)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <MaterialForm
          material={editingMaterial}
          tenantId={tenantId}
          businessId={businessId}
          onClose={() => {
            setShowForm(false);
            setEditingMaterial(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingMaterial(null);
            loadMaterials();
          }}
        />
      )}

      {/* Restock Modal */}
      {restockMaterial && (
        <RestockModal
          material={restockMaterial}
          onClose={() => setRestockMaterial(null)}
          onRestocked={() => {
            setRestockMaterial(null);
            loadMaterials();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Bahan?</h3>
              <p className="text-gray-500 mb-6">
                Bahan "{deleteConfirm.name}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile Material Card Component
function MaterialCard({
  material,
  selected,
  onSelect,
  onEdit,
  onRestock,
  onDelete,
}: {
  material: Material;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRestock: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isLowStock = material.stockQuantity <= material.minStockAlert;

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm border-2 transition ${
        selected ? 'border-amber-500' : 'border-transparent'
      } cursor-pointer`}
      onClick={onEdit}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500 mt-1"
        />

        {/* Icon */}
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Package className="w-6 h-6 text-amber-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">{material.name}</h3>
              <p className="text-sm text-gray-500">{formatCurrency(material.pricePerUnit)} / {material.unit}</p>
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 min-w-[140px] z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onRestock();
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 text-green-500" />
                      Restock
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onEdit();
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete();
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stock & Status */}
          <div className="flex items-center gap-3 mt-2">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${
                isLowStock ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isLowStock && <AlertTriangle className="w-3.5 h-3.5" />}
              <span className="font-medium">{material.stockQuantity}</span>
              <span>{material.unit}</span>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                material.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {material.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>

          {/* Supplier */}
          {material.supplierName && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <Truck className="w-4 h-4" />
              <span>{material.supplierName}</span>
              {material.supplierContact && (
                <a
                  href={`tel:${material.supplierContact}`}
                  className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRestock();
          }}
          className="flex-1 py-2 px-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-green-100 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Restock
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="flex-1 py-2 px-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-blue-100 transition"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
      </div>
    </div>
  );
}
