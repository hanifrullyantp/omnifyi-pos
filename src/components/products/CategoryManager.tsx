import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, GripVertical, Check, Tag } from 'lucide-react';
import { db, Category } from '../../lib/db';
import { useAuthStore } from '../../lib/store';
import { generateId } from '../../lib/utils';

interface CategoryManagerProps {
  onClose: () => void;
}

// Icon options for categories
const CATEGORY_ICONS = [
  '🍔', '🍕', '🍜', '🍱', '🍣', '🥗', '🍦', '☕', '🧃', '🍺',
  '🍪', '🎂', '🧁', '🍩', '🌮', '🥪', '🍟', '🌯', '🥙', '🍝',
  '📦', '🛒', '🎁', '💼', '👕', '👟', '💄', '🧴', '📱', '💻',
  '🏠', '🔧', '🎮', '📚', '✂️', '🖊️', '🎨', '🪴', '🧸', '⭐'
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
  const { currentBusiness, currentTenant } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');
  const [showIconPicker, setShowIconPicker] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, [currentBusiness?.id]);

  const loadCategories = async () => {
    if (!currentBusiness?.id || !currentTenant?.id) return;
    setLoading(true);
    try {
      const cats = await db.categories
        .where({ businessId: currentBusiness.id, tenantId: currentTenant.id })
        .sortBy('sortOrder');
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newName.trim() || !currentBusiness?.id || !currentTenant?.id) return;

    try {
      const newCategory: Category = {
        id: generateId(),
        businessId: currentBusiness.id,
        tenantId: currentTenant.id,
        name: newName.trim(),
        icon: newIcon,
        sortOrder: categories.length,
        isActive: true
      };
      await db.categories.add(newCategory);
      setNewName('');
      setNewIcon('📦');
      setShowNewForm(false);
      await loadCategories();
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id!);
    setEditName(category.name);
    setEditIcon(category.icon || '📦');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    try {
      await db.categories.update(editingId, { name: editName.trim(), icon: editIcon });
      setEditingId(null);
      await loadCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDelete = async (category: Category) => {
    // Check if category has products
    const productsCount = await db.products
      .where({ categoryId: category.id, businessId: currentBusiness?.id })
      .count();

    if (productsCount > 0) {
      const confirmed = window.confirm(
        `Kategori "${category.name}" memiliki ${productsCount} produk. Hapus kategori akan membuat produk tersebut tidak memiliki kategori. Lanjutkan?`
      );
      if (!confirmed) return;
    } else {
      if (!window.confirm(`Hapus kategori "${category.name}"?`)) return;
    }

    try {
      await db.categories.delete(category.id!);
      // Update products to remove category
      await db.products
        .where({ categoryId: category.id })
        .modify({ categoryId: undefined });
      await loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await db.categories.update(category.id!, { isActive: !category.isActive });
      await loadCategories();
    } catch (error) {
      console.error('Failed to toggle category:', error);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (categoryId: string) => {
    setDraggedId(categoryId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = categories.findIndex(c => c.id === draggedId);
    const targetIndex = categories.findIndex(c => c.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newCategories = [...categories];
    const [draggedItem] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedItem);
    
    setCategories(newCategories);
  };

  const handleDragEnd = async () => {
    if (!draggedId) return;

    // Save new sort order
    try {
      for (let i = 0; i < categories.length; i++) {
        await db.categories.update(categories[i].id!, { sortOrder: i });
      }
    } catch (error) {
      console.error('Failed to save sort order:', error);
    }
    setDraggedId(null);
  };

  const selectIcon = (icon: string) => {
    if (showIconPicker === 'new') {
      setNewIcon(icon);
    } else if (showIconPicker === editingId) {
      setEditIcon(icon);
    }
    setShowIconPicker(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Tag size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Kelola Kategori</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {categories.length === 0 && !showNewForm ? (
                <div className="text-center py-8">
                  <Tag className="mx-auto text-gray-300 mb-2" size={40} />
                  <p className="text-gray-500 mb-4">Belum ada kategori</p>
                  <button
                    onClick={() => setShowNewForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    Tambah Kategori
                  </button>
                </div>
              ) : (
                <>
                  {categories.map(category => (
                    <div
                      key={category.id}
                      draggable
                      onDragStart={() => handleDragStart(category.id!)}
                      onDragOver={(e) => handleDragOver(e, category.id!)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border ${
                        draggedId === category.id ? 'border-blue-300 opacity-50' : 'border-transparent'
                      } ${!category.isActive ? 'opacity-60' : ''}`}
                    >
                      {/* Drag Handle */}
                      <div className="cursor-grab text-gray-400 hover:text-gray-600">
                        <GripVertical size={16} />
                      </div>

                      {editingId === category.id ? (
                        /* Edit Mode */
                        <>
                          <div className="relative">
                            <button
                              onClick={() => setShowIconPicker(category.id!)}
                              className="text-2xl hover:bg-white p-1 rounded"
                            >
                              {editIcon}
                            </button>
                            {showIconPicker === category.id && (
                              <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-xl border border-gray-200 grid grid-cols-10 gap-1 z-10 w-64">
                                {CATEGORY_ICONS.map(icon => (
                                  <button
                                    key={icon}
                                    onClick={() => selectIcon(icon)}
                                    className="p-1 hover:bg-gray-100 rounded text-lg"
                                  >
                                    {icon}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        /* View Mode */
                        <>
                          <span className="text-xl">{category.icon || '📦'}</span>
                          <span className="flex-1 font-medium text-gray-900">{category.name}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            category.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-200 text-gray-500'
                          }`}>
                            {category.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                          <button
                            onClick={() => handleToggleActive(category)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg"
                            title={category.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {category.isActive ? '👁️' : '👁️‍🗨️'}
                          </button>
                          <button
                            onClick={() => handleStartEdit(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* New Category Form */}
              {showNewForm && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="relative">
                    <button
                      onClick={() => setShowIconPicker('new')}
                      className="text-2xl hover:bg-white p-1 rounded"
                    >
                      {newIcon}
                    </button>
                    {showIconPicker === 'new' && (
                      <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-xl border border-gray-200 grid grid-cols-10 gap-1 z-10 w-64">
                        {CATEGORY_ICONS.map(icon => (
                          <button
                            key={icon}
                            onClick={() => selectIcon(icon)}
                            className="p-1 hover:bg-gray-100 rounded text-lg"
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nama kategori baru"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                      if (e.key === 'Escape') {
                        setShowNewForm(false);
                        setNewName('');
                      }
                    }}
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={!newName.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => { setShowNewForm(false); setNewName(''); }}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between">
          {!showNewForm && categories.length > 0 && (
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <Plus size={16} />
              Tambah Kategori
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Click outside to close icon picker */}
      {showIconPicker && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowIconPicker(null)} 
        />
      )}
    </div>
  );
};
