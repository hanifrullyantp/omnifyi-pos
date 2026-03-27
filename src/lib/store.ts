import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Tenant, Business, Cashier, Product, Transaction } from './db';
import { backoffMs, MAX_RETRY_COUNT, syncPendingBatch } from './syncAdapter';

// --- AUTH STORE ---

interface AuthState {
  currentUser: User | null;
  currentTenant: Tenant | null;
  currentBusiness: Business | null;
  currentCashier: Cashier | null;
  businesses: Business[];
  setAuth: (user: User, tenant: Tenant, business: Business, businesses?: Business[]) => void;
  setBusiness: (business: Business) => void;
  setBusinesses: (businesses: Business[]) => void;
  setCashier: (cashier: Cashier | null) => void;
  logout: () => void;
  logoutCashier: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      currentTenant: null,
      currentBusiness: null,
      currentCashier: null,
      businesses: [],
      setAuth: (user, tenant, business, businesses = []) => set({ 
        currentUser: user, 
        currentTenant: tenant, 
        currentBusiness: business,
        businesses: businesses.length ? businesses : [business]
      }),
      setBusiness: (business) => set({ currentBusiness: business }),
      setBusinesses: (businesses) => set({ businesses }),
      setCashier: (cashier) => set({ currentCashier: cashier }),
      logout: () => set({ 
        currentUser: null, 
        currentTenant: null, 
        currentBusiness: null,
        currentCashier: null,
        businesses: []
      }),
      logoutCashier: () => set({ currentCashier: null })
    }),
    { name: 'pos-auth-storage' }
  )
);

// --- CART STORE ---

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  notes?: string;
  discount: number;
  discountType: 'PERCENT' | 'NOMINAL';
}

interface CartState {
  items: CartItem[];
  transactionDiscount: number;
  transactionDiscountType: 'PERCENT' | 'NOMINAL';
  pendingTransactions: { id: string; items: CartItem[]; customerName?: string; createdAt: Date }[];
  /** @returns false jika stok tidak cukup atau produk habis */
  addItem: (product: Product) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  updateItemDiscount: (productId: string, discount: number, discountType: 'PERCENT' | 'NOMINAL') => void;
  setTransactionDiscount: (discount: number, discountType: 'PERCENT' | 'NOMINAL') => void;
  clearCart: () => void;
  holdTransaction: (customerName?: string) => void;
  resumeTransaction: (id: string) => void;
  deletePendingTransaction: (id: string) => void;
  getSubtotal: () => number;
  getItemDiscount: () => number;
  getTransactionDiscountAmount: () => number;
  getTotalDiscount: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      transactionDiscount: 0,
      transactionDiscountType: 'NOMINAL',
      pendingTransactions: [],
      
      addItem: (product) => {
        if (!product.id || product.stockQuantity <= 0) return false;
        const state = get();
        const existingItem = state.items.find((i) => i.productId === product.id);
        const nextQty = existingItem ? existingItem.quantity + 1 : 1;
        if (nextQty > product.stockQuantity) return false;
        set((s) => {
          const ex = s.items.find((i) => i.productId === product.id);
          if (ex) {
            return {
              items: s.items.map((i) =>
                i.productId === product.id ? { ...i, quantity: i.quantity + 1, product } : i
              ),
            };
          }
          return {
            items: [
              ...s.items,
              {
                productId: product.id!,
                product,
                quantity: 1,
                discount: 0,
                discountType: 'NOMINAL' as const,
              },
            ],
          };
        });
        return true;
      },
      
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(i => i.productId !== productId)
      })),
      
      updateQuantity: (productId, quantity) => set((state) => ({
        items: quantity > 0 
          ? state.items.map(i => i.productId === productId ? { ...i, quantity } : i)
          : state.items.filter(i => i.productId !== productId)
      })),
      
      updateNotes: (productId, notes) => set((state) => ({
        items: state.items.map(i => i.productId === productId ? { ...i, notes } : i)
      })),
      
      updateItemDiscount: (productId, discount, discountType) => set((state) => ({
        items: state.items.map(i => 
          i.productId === productId ? { ...i, discount, discountType } : i
        )
      })),
      
      setTransactionDiscount: (discount, discountType) => set({
        transactionDiscount: discount,
        transactionDiscountType: discountType
      }),
      
      clearCart: () => set({ 
        items: [], 
        transactionDiscount: 0, 
        transactionDiscountType: 'NOMINAL' 
      }),
      
      holdTransaction: (customerName) => set((state) => {
        if (state.items.length === 0) return state;
        return {
          pendingTransactions: [
            ...state.pendingTransactions,
            {
              id: crypto.randomUUID(),
              items: state.items,
              customerName,
              createdAt: new Date()
            }
          ],
          items: [],
          transactionDiscount: 0,
          transactionDiscountType: 'NOMINAL'
        };
      }),
      
      resumeTransaction: (id) => set((state) => {
        const pending = state.pendingTransactions.find(p => p.id === id);
        if (!pending) return state;
        return {
          items: pending.items,
          pendingTransactions: state.pendingTransactions.filter(p => p.id !== id)
        };
      }),
      
      deletePendingTransaction: (id) => set((state) => ({
        pendingTransactions: state.pendingTransactions.filter(p => p.id !== id)
      })),
      
      getSubtotal: () => {
        const items = get().items;
        return items.reduce((sum, item) => {
          return sum + (item.product.sellingPrice * item.quantity);
        }, 0);
      },
      
      getItemDiscount: () => {
        const items = get().items;
        return items.reduce((sum, item) => {
          const itemTotal = item.product.sellingPrice * item.quantity;
          if (item.discountType === 'PERCENT') {
            return sum + (itemTotal * item.discount / 100);
          }
          return sum + item.discount;
        }, 0);
      },
      
      getTransactionDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const itemDiscount = get().getItemDiscount();
        const afterItemDiscount = subtotal - itemDiscount;
        const { transactionDiscount, transactionDiscountType } = get();
        
        if (transactionDiscountType === 'PERCENT') {
          return afterItemDiscount * transactionDiscount / 100;
        }
        return transactionDiscount;
      },
      
      getTotalDiscount: () => {
        return get().getItemDiscount() + get().getTransactionDiscountAmount();
      },
      
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      }
    }),
    { name: 'pos-cart-storage' }
  )
);

// --- DASHBOARD FILTER STORE ---

export type DateRange = 'today' | '7days' | '30days' | 'custom';

interface DashboardFilterState {
  dateRange: DateRange;
  startDate: Date;
  endDate: Date;
  setDateRange: (range: DateRange) => void;
  setCustomRange: (start: Date, end: Date) => void;
}

export const useDashboardFilterStore = create<DashboardFilterState>((set) => ({
  dateRange: 'today',
  startDate: new Date(),
  endDate: new Date(),
  setDateRange: (range) => {
    const now = new Date();
    let startDate = new Date();
    const endDate = new Date();
    
    switch (range) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case '7days':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
    }
    
    set({ dateRange: range, startDate, endDate });
  },
  setCustomRange: (start, end) => set({ 
    dateRange: 'custom', 
    startDate: start, 
    endDate: end 
  })
}));

// --- UI STORE ---

type ViewMode = 'grid-2' | 'grid-3' | 'grid-4' | 'list';

interface UIState {
  isSidebarOpen: boolean;
  isCartOpen: boolean;
  isOnline: boolean;
  viewMode: ViewMode;
  toggleSidebar: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  setOnline: (online: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isCartOpen: false,
      isOnline: navigator.onLine,
      viewMode: 'grid-2',
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      setCartOpen: (open) => set({ isCartOpen: open }),
      setOnline: (online) => set({ isOnline: online }),
      setViewMode: (mode) => set({ viewMode: mode })
    }),
    { name: 'pos-ui-storage' }
  )
);

// --- OFFLINE SYNC STORE ---

interface PendingSync {
  id: string;
  type: 'transaction' | 'product' | 'stock';
  data: Transaction | Product | Record<string, unknown>;
  createdAt: Date;
  retryCount: number;
  nextRetryAt?: Date;
}

interface SyncState {
  pendingSyncs: PendingSync[];
  isSyncing: boolean;
  lastSyncedAt?: Date;
  addPendingSync: (type: PendingSync['type'], data: PendingSync['data']) => void;
  removePendingSync: (id: string) => void;
  clearSyncs: () => void;
  processSyncQueue: () => Promise<void>;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      pendingSyncs: [],
      isSyncing: false,
      lastSyncedAt: undefined,
      addPendingSync: (type, data) => set((state) => ({
        pendingSyncs: [
          ...state.pendingSyncs,
          {
            id: crypto.randomUUID(),
            type,
            data,
            createdAt: new Date(),
            retryCount: 0,
            nextRetryAt: new Date(),
          }
        ]
      })),
      removePendingSync: (id) => set((state) => ({
        pendingSyncs: state.pendingSyncs.filter(s => s.id !== id)
      })),
      clearSyncs: () => set({ pendingSyncs: [] }),
      processSyncQueue: async () => {
        if (get().isSyncing) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;
        const state = get();
        const now = Date.now();
        const due = state.pendingSyncs.filter((it) => {
          const t = it.nextRetryAt ? new Date(it.nextRetryAt).getTime() : 0;
          return t <= now;
        });
        if (!due.length) return;

        set({ isSyncing: true });
        try {
          const result = await syncPendingBatch(due);
          const succeeded = new Set(result.succeeded);
          const retry = new Set(result.retry);
          set((prev) => ({
            pendingSyncs: prev.pendingSyncs
              .filter((it) => !succeeded.has(it.id))
              .map((it) => {
                if (!retry.has(it.id)) return it;
                const nextCount = Math.min(MAX_RETRY_COUNT, (it.retryCount ?? 0) + 1);
                return {
                  ...it,
                  retryCount: nextCount,
                  nextRetryAt: new Date(Date.now() + backoffMs(nextCount)),
                };
              }),
            lastSyncedAt: new Date(),
          }));
        } finally {
          set({ isSyncing: false });
        }
      }
    }),
    { name: 'pos-sync-storage' }
  )
);

// --- TODAY TRANSACTIONS STORE ---

interface TodayTransactionsState {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  voidTransaction: (id: string) => void;
}

export const useTodayTransactionsStore = create<TodayTransactionsState>((set) => ({
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) => set((state) => ({
    transactions: [transaction, ...state.transactions]
  })),
  voidTransaction: (id) => set((state) => ({
    transactions: state.transactions.map(t => 
      t.id === id ? { ...t, status: 'VOIDED' as const } : t
    )
  }))
}));
