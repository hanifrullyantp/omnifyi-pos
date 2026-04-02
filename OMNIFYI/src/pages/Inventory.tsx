import { useState } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MoreVertical,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
} from 'lucide-react';
import { cn } from '../lib/utils';

const stockItems = [
  { id: 'SKU-001', name: 'Besi Hollow 15x30', category: 'Steel', stock: 150, unit: 'pcs', minStock: 50, price: 45000, value: 6750000, movement: 'up' },
  { id: 'SKU-002', name: 'Semen Portland 50kg', category: 'Cement', stock: 12, unit: 'sak', minStock: 30, price: 65000, value: 780000, movement: 'down' },
  { id: 'SKU-003', name: 'Keramik 60x60 Roman', category: 'Flooring', stock: 200, unit: 'm²', minStock: 50, price: 85000, value: 17000000, movement: 'up' },
  { id: 'SKU-004', name: 'Cat Dulux Weathershield', category: 'Paint', stock: 45, unit: 'pail', minStock: 20, price: 350000, value: 15750000, movement: 'stable' },
  { id: 'SKU-005', name: 'Pipa PVC 3/4"', category: 'Plumbing', stock: 8, unit: 'btg', minStock: 15, price: 45000, value: 360000, movement: 'down' },
  { id: 'SKU-006', name: 'Gypsum Board 9mm', category: 'Ceiling', stock: 75, unit: 'lbr', minStock: 25, price: 95000, value: 7125000, movement: 'up' },
];

export function Inventory() {
  const [search, setSearch] = useState('');
  const filtered = stockItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const lowStock = stockItems.filter(i => i.stock <= i.minStock);
  const totalValue = stockItems.reduce((s, i) => s + i.value, 0);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
              <Package className="w-5 h-5" />
            </div>
            Inventory
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track stock levels, movements, and valuations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-brand-500/25 transition-all active:scale-95">
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 card-hover animate-fade-in-up stagger-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-brand-50 rounded-xl text-brand-600"><Package className="w-4 h-4" /></div>
            <span className="text-xs font-medium text-gray-500">Total Items</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stockItems.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 card-hover animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><BarChart3 className="w-4 h-4" /></div>
            <span className="text-xs font-medium text-gray-500">Total Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">Rp {(totalValue / 1000000).toFixed(1)}M</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 card-hover animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-50 rounded-xl text-red-600"><AlertTriangle className="w-4 h-4" /></div>
            <span className="text-xs font-medium text-gray-500">Low Stock</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{lowStock.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 card-hover animate-fade-in-up stagger-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><ArrowDownToLine className="w-4 h-4" /></div>
            <span className="text-xs font-medium text-gray-500">This Month IN</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">248</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up stagger-5">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:bg-white transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-semibold hover:bg-brand-100 transition-all">
              <ArrowUpFromLine className="w-4 h-4" /> Stock OUT
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-semibold hover:bg-brand-100 transition-all">
              <ArrowDownToLine className="w-4 h-4" /> Stock IN
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-100">
                <th className="p-3 pl-5 font-semibold">Item</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold text-right">Stock</th>
                <th className="p-3 font-semibold text-right">Min Stock</th>
                <th className="p-3 font-semibold text-right">Unit Price</th>
                <th className="p-3 font-semibold text-right">Value</th>
                <th className="p-3 font-semibold text-center">Status</th>
                <th className="p-3 pr-5 font-semibold w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors group">
                  <td className="p-3 pl-5">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.id}</p>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">{item.category}</span>
                  </td>
                  <td className="p-3 text-right font-bold text-gray-900">
                    <div className="flex items-center justify-end gap-1">
                      {item.stock}
                      {item.movement === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                      {item.movement === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                    </div>
                    <span className="text-xs text-gray-400">{item.unit}</span>
                  </td>
                  <td className="p-3 text-right text-gray-500">{item.minStock} {item.unit}</td>
                  <td className="p-3 text-right text-gray-700">Rp {item.price.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-right font-semibold text-gray-900">Rp {item.value.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-center">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-bold",
                      item.stock <= item.minStock
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}>
                      {item.stock <= item.minStock ? 'Low Stock' : 'Normal'}
                    </span>
                  </td>
                  <td className="p-3 pr-5">
                    <button className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
