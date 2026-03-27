import React, { useState } from 'react';
import { Product } from '../lib/db';
import { ProductList, ProductForm, CategoryManager } from '../components/products';

interface ProductsPageProps {
  onBack?: () => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = () => {
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setView('add');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setView('edit');
  };

  const handleSaveProduct = () => {
    setView('list');
    setEditingProduct(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleCloseForm = () => {
    setView('list');
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pb-36 lg:pb-6 w-full min-w-0 max-w-full overflow-x-clip">
      <div className="max-w-7xl mx-auto p-4 md:p-6 min-w-0 max-w-full">
        {/* Product List - always rendered but may trigger overlays */}
        <ProductList
          key={refreshKey}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onManageCategories={() => setShowCategoryManager(true)}
        />

        {/* Product Form Modal */}
        {(view === 'add' || view === 'edit') && (
          <ProductForm
            product={editingProduct}
            onClose={handleCloseForm}
            onSave={handleSaveProduct}
          />
        )}

        {/* Category Manager Modal */}
        {showCategoryManager && (
          <CategoryManager
            onClose={() => {
              setShowCategoryManager(false);
              setRefreshKey(prev => prev + 1);
            }}
          />
        )}
      </div>
    </div>
  );
};
