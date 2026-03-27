import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Grid, List, LayoutGrid, Camera, X, 
  Package, AlertTriangle 
} from 'lucide-react';
import { Product, Category } from '../../lib/db';
import { useCartStore, useUIStore } from '../../lib/store';
import { cn, formatCurrency } from '../../lib/utils';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  onScanBarcode: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  categories, 
  onScanBarcode 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { items, addItem } = useCartStore();
  const { viewMode: viewModeRaw, setViewMode } = useUIStore();
  const viewMode =
    viewModeRaw === 'grid-2' || viewModeRaw === 'grid-3' || viewModeRaw === 'grid-4' || viewModeRaw === 'list'
      ? viewModeRaw
      : 'grid-2';
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (mobileSearchOpen) {
      // Focus search input after animation frame.
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [mobileSearchOpen]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = debouncedSearch === '' || 
        product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.sku?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
      
      return matchesSearch && matchesCategory && product.isActive;
    });
  }, [products, debouncedSearch, selectedCategory]);

  // Get quantity in cart
  const getCartQuantity = useCallback((productId: string) => {
    const item = items.find(i => i.productId === productId);
    return item?.quantity || 0;
  }, [items]);

  // Handle add to cart with haptic feedback
  const handleAddToCart = useCallback(
    (product: Product) => {
      if ('vibrate' in navigator) navigator.vibrate(50);
      const ok = addItem(product);
      if (!ok) {
        alert('Stok tidak mencukupi atau produk sudah habis.');
      }
    },
    [addItem]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      {/* Desktop Search Bar */}
      <div className="hidden md:block p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk, SKU, atau barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                       transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={onScanBarcode}
            className="p-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 
                     transition-colors shadow-lg shadow-emerald-500/30"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Toggle (Desktop) */}
        <div className="hidden md:flex items-center gap-2 mt-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">Tampilan:</span>
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid-2')}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'grid-2' 
                  ? "bg-white dark:bg-gray-600 shadow text-emerald-600" 
                  : "text-gray-500"
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid-3')}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'grid-3' 
                  ? "bg-white dark:bg-gray-600 shadow text-emerald-600" 
                  : "text-gray-500"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid-4')}
              className={cn(
                "p-2 rounded-md transition-colors text-[10px] font-bold",
                viewMode === 'grid-4'
                  ? "bg-white dark:bg-gray-600 shadow text-emerald-600"
                  : "text-gray-500"
              )}
              title="4 kolom"
            >
              4×
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'list' 
                  ? "bg-white dark:bg-gray-600 shadow text-emerald-600" 
                  : "text-gray-500"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search (Animated Expand) */}
      <div className="md:hidden sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors",
              mobileSearchOpen
                ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            )}
          >
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Cari</span>
          </button>
          <button
            onClick={onScanBarcode}
            className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {mobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="px-3 pb-3"
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-600 
                             bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                             transition-all duration-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full
                               hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                <button
                  onClick={onScanBarcode}
                  className="p-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 
                           transition-colors shadow-lg shadow-emerald-500/30"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile size toggle (Big/Small icons) */}
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid-2')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold border transition-colors",
                      viewMode === 'grid-2'
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                    )}
                  >
                    Besar
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid-3')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold border transition-colors",
                      viewMode === 'grid-3'
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                    )}
                  >
                    Sedang
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid-4')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold border transition-colors",
                      viewMode === 'grid-4'
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                    )}
                  >
                    4 kolom
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setMobileSearchOpen(false);
            }}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
              !selectedCategory
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            )}
          >
            Semua
          </button>
          {categories.filter(c => c.isActive).map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id!);
                setMobileSearchOpen(false);
              }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                selectedCategory === category.id
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
              )}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 md:pb-4 bg-gray-50 dark:bg-gray-900">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Tidak ada produk</p>
            <p className="text-sm">Coba kata kunci lain atau pilih kategori</p>
          </div>
        ) : (
          <div className={cn(
            "grid",
            viewMode === 'grid-3' || viewMode === 'grid-4' ? "gap-2" : "gap-3",
            viewMode === 'grid-2' && "grid-cols-2",
            viewMode === 'grid-3' && "grid-cols-3",
            viewMode === 'grid-4' && "grid-cols-4",
            viewMode === 'list' && "grid-cols-1"
          )}>
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={getCartQuantity(product.id!)}
                  onAdd={() => handleAddToCart(product)}
                  viewMode={viewMode}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

// Product Card Component
interface ProductCardProps {
  product: Product;
  cartQuantity: number;
  onAdd: () => void;
  viewMode: 'grid-2' | 'grid-3' | 'grid-4' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  cartQuantity, 
  onAdd, 
  viewMode 
}) => {
  const isLowStock = product.stockQuantity <= product.minStockAlert;
  const isOutOfStock = product.stockQuantity <= 0;
  const atCartStockLimit = cartQuantity >= product.stockQuantity && product.stockQuantity > 0;
  const canAddMore = !isOutOfStock && !atCartStockLimit;

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => canAddMore && onAdd()}
        className={cn(
          "relative flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800",
          "border border-gray-100 dark:border-gray-700 shadow-sm",
          "cursor-pointer transition-all duration-200",
          !canAddMore && "opacity-60 cursor-not-allowed",
          canAddMore && "hover:shadow-md hover:border-emerald-200 active:scale-98"
        )}
      >
        {/* Image */}
        <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover object-center aspect-square" />
          ) : (
            <Package className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">{product.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            {formatCurrency(product.sellingPrice)}
          </p>
        </div>

        {/* Stock Warning */}
        {isLowStock && !isOutOfStock && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              Stok: {product.stockQuantity}
            </span>
          </div>
        )}

        {isOutOfStock && (
          <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            Habis
          </span>
        )}
        {atCartStockLimit && (
          <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
            Stok penuh di keranjang
          </span>
        )}

        {/* Cart Badge */}
        {cartQuantity > 0 && (
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
            {cartQuantity}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => canAddMore && onAdd()}
      className={cn(
        "relative flex flex-col rounded-xl bg-white dark:bg-gray-800 overflow-hidden",
        "border border-gray-100 dark:border-gray-700 shadow-sm",
        "cursor-pointer transition-all duration-200",
        !canAddMore && "opacity-60 cursor-not-allowed",
        canAddMore && "hover:shadow-lg hover:border-emerald-200 active:scale-95"
      )}
    >
      {/* Cart Badge */}
      {cartQuantity > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-emerald-500 text-white 
                   flex items-center justify-center font-bold text-sm shadow-lg"
        >
          {cartQuantity}
        </motion.div>
      )}

      {/* Low Stock Warning */}
      {isLowStock && !isOutOfStock && (
        <div className="absolute top-2 left-2 z-10">
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            {product.stockQuantity}
          </span>
        </div>
      )}

      {/* Out of Stock Overlay */}
      {isOutOfStock && (
        <div className="absolute inset-0 z-10 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center">
          <span className="px-3 py-1 text-sm font-medium bg-red-500 text-white rounded-full">
            Stok Habis
          </span>
        </div>
      )}
      {atCartStockLimit && !isOutOfStock && (
        <div className="absolute inset-0 z-10 bg-amber-50/90 dark:bg-gray-900/80 flex items-center justify-center px-1">
          <span className="px-2 py-1 text-[10px] font-medium bg-amber-500 text-white rounded-full text-center leading-tight">
            Max stok di keranjang
          </span>
        </div>
      )}

      {/* Image */}
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover object-center aspect-square"
            loading="lazy"
          />
        ) : (
          <Package className="w-12 h-12 text-gray-400" />
        )}
      </div>

      {/* Info */}
      <div className={cn('flex-1 flex flex-col', viewMode === 'grid-4' ? 'p-1.5' : 'p-3')}>
        <h3
          className={cn(
            'font-medium text-gray-900 dark:text-white line-clamp-2 mb-1',
            viewMode === 'grid-4' ? 'text-[10px] leading-tight' : 'text-sm'
          )}
        >
          {product.name}
        </h3>
        <p
          className={cn(
            'text-emerald-600 dark:text-emerald-400 font-bold mt-auto',
            viewMode === 'grid-4' ? 'text-[11px]' : ''
          )}
        >
          {formatCurrency(product.sellingPrice)}
        </p>
      </div>
    </motion.div>
  );
};

export default ProductGrid;
