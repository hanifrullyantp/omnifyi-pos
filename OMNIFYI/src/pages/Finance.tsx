import { useState } from 'react';
import {
  Plus, Download,
  ArrowDownRight, ArrowUpRight,
  Wallet, TrendingUp, CreditCard, PiggyBank,
  X, Filter, Search,
  Users, Briefcase, ChevronRight, DollarSign,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useData } from '../store/dataStore';
import { useNavigate } from 'react-router-dom';

// Payroll Summary Widget for Finance Integration
function PayrollSummaryWidget() {
  const navigate = useNavigate();
  const { getPayrollSummary, getPayrollTransactions, currentUser } = useData();
  
  // Only show for Admin, HR, Finance
  if (!currentUser || !['Admin', 'HR', 'Finance'].includes(currentUser.role)) {
    return null;
  }
  
  const summary = getPayrollSummary();
  const payrollTrx = getPayrollTransactions();
  
  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)}K`;
    return `Rp ${n.toLocaleString('id-ID')}`;
  };
  
  const percentChange = summary.lastMonth > 0 
    ? Math.round(((summary.thisMonth - summary.lastMonth) / summary.lastMonth) * 100)
    : 0;

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 rounded-2xl border border-indigo-100/50 p-4 animate-fade-in-up stagger-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Payroll & Gaji</h3>
            <p className="text-[10px] text-gray-500">Terintegrasi dengan keuangan</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/payroll')}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-all"
        >
          Kelola <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div className="bg-white/80 rounded-xl p-2.5 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3 h-3 text-emerald-500" />
            <span className="text-[9px] text-gray-500 uppercase font-medium">Bulan Ini</span>
          </div>
          <p className="font-bold text-sm text-gray-900">{formatCurrency(summary.thisMonth)}</p>
          {percentChange !== 0 && (
            <span className={cn("text-[9px] font-medium", percentChange > 0 ? 'text-rose-500' : 'text-emerald-500')}>
              {percentChange > 0 ? '↑' : '↓'} {Math.abs(percentChange)}% vs bulan lalu
            </span>
          )}
        </div>
        
        <div className="bg-white/80 rounded-xl p-2.5 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Briefcase className="w-3 h-3 text-violet-500" />
            <span className="text-[9px] text-gray-500 uppercase font-medium">Labor Project</span>
          </div>
          <p className="font-bold text-sm text-gray-900">{formatCurrency(summary.projectLabor)}</p>
          <span className="text-[9px] text-gray-400">Dibebankan ke project</span>
        </div>
        
        <div className="bg-white/80 rounded-xl p-2.5 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet className="w-3 h-3 text-blue-500" />
            <span className="text-[9px] text-gray-500 uppercase font-medium">Operasional</span>
          </div>
          <p className="font-bold text-sm text-gray-900">{formatCurrency(summary.operationalPayroll)}</p>
          <span className="text-[9px] text-gray-400">Gaji umum</span>
        </div>
        
        <div className="bg-white/80 rounded-xl p-2.5 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3 h-3 text-amber-500" />
            <span className="text-[9px] text-gray-500 uppercase font-medium">Menunggu</span>
          </div>
          <p className="font-bold text-sm text-gray-900">{formatCurrency(summary.totalPending)}</p>
          <span className="text-[9px] text-gray-400">Belum dibayar</span>
        </div>
      </div>
      
      {/* Recent Payroll Transactions */}
      {payrollTrx.length > 0 && (
        <div className="bg-white/60 rounded-xl border border-gray-100">
          <div className="px-3 py-2 border-b border-gray-100">
            <span className="text-[10px] font-semibold text-gray-600">Transaksi Gaji Terbaru</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[120px] overflow-y-auto">
            {payrollTrx.slice(0, 5).map(trx => (
              <div key={trx.id} className="px-3 py-2 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{trx.desc}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-gray-400">{trx.date}</span>
                    <span className={cn("text-[8px] px-1.5 py-0.5 rounded font-medium",
                      trx.category.includes('Weekly') ? 'bg-amber-50 text-amber-600' :
                      trx.category === 'Labor' ? 'bg-violet-50 text-violet-600' :
                      'bg-blue-50 text-blue-600'
                    )}>
                      {trx.category.includes('Weekly') ? 'Mingguan' : 
                       trx.category === 'Labor' ? 'Project' : 'Bulanan'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-600 flex-shrink-0">
                  -{formatCurrency(trx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Finance() {
  const data = useData();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual entry form
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryDesc, setEntryDesc] = useState('');
  const [entryType, setEntryType] = useState<'Income' | 'Expense'>('Expense');
  const [entryCategory, setEntryCategory] = useState('Material');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryProjectId, setEntryProjectId] = useState('');

  const totalIncome = data.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = data.transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const cashBalance = totalIncome - totalExpense;

  const formatRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  const formatShort = (n: number) => {
    if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)}K`;
    return formatRp(n);
  };

  const filteredTrx = data.transactions.filter(t => {
    if (filterType !== 'All' && t.type !== filterType) return false;
    if (searchQuery && !t.desc.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleManualSubmit = () => {
    if (!entryDesc.trim() || !entryAmount) return;
    data.addTransaction({
      date: entryDate,
      desc: entryDesc,
      type: entryType,
      category: entryCategory,
      amount: parseFloat(entryAmount),
      projectId: entryProjectId || null,
      supplierId: null,
      status: 'Completed',
    });
    setShowManualEntry(false);
    setEntryDesc('');
    setEntryAmount('');
    setEntryProjectId('');
  };

  const expenseCategories = ['Material', 'Labor', 'Equipment', 'Overhead', 'Transport', 'Account Payable', 'Payroll Monthly', 'Payroll Weekly', 'Other'];
  const incomeCategories = ['Client Payment', 'Down Payment', 'Other Income'];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md"><Wallet className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Finance</h1>
            <p className="text-gray-400 text-xs">Financial management & tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 transition-all active:scale-95"><Download className="w-3.5 h-3.5" />Export</button>
          <button onClick={() => setShowManualEntry(true)} className="flex items-center gap-1.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:shadow-lg transition-all active:scale-95"><Plus className="w-3.5 h-3.5" />New Entry</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          { label: 'Cash Balance', value: formatShort(cashBalance > 0 ? cashBalance : 86400000), icon: Wallet, color: 'bg-blue-50 text-brand-600', trend: '+8.2%', up: true },
          { label: 'Revenue', value: formatShort(totalIncome || 45200000), icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600', trend: '+15.3%', up: true },
          { label: 'Expenses', value: formatShort(totalExpense || 12800000), icon: CreditCard, color: 'bg-rose-50 text-rose-600', trend: '-4.1%', up: false },
          { label: 'Net Profit', value: formatShort(netProfit > 0 ? netProfit : 32400000), icon: PiggyBank, color: 'bg-indigo-50 text-indigo-600', trend: '+22.5%', up: true },
        ].map((s, i) => (
          <div key={s.label} className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 card-hover animate-fade-in-up stagger-${i + 1}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg", s.color)}><s.icon className="w-3.5 h-3.5" /></div>
              <span className="text-[10px] font-medium text-gray-400">{s.label}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{s.value}</p>
            <span className={cn("text-[10px] font-semibold flex items-center gap-0.5 mt-0.5", s.up ? 'text-emerald-600' : 'text-rose-500')}>
              {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{s.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Payroll Summary Section */}
      <PayrollSummaryWidget />

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col animate-fade-in-up stagger-4">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-sm text-gray-900">Recent Transactions</h2>
              <p className="text-[10px] text-gray-400">{filteredTrx.length} entries</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:bg-white"
                />
              </div>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {(['All', 'Income', 'Expense'] as const).map(f => (
                  <button key={f} onClick={() => setFilterType(f)}
                    className={cn("px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all",
                      filterType === f ? "bg-white shadow-sm text-brand-700" : "text-gray-500"
                    )}>{f}</button>
                ))}
              </div>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"><Filter className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y divide-gray-50 flex-1 overflow-y-auto max-h-[55vh]">
          {filteredTrx.map(trx => {
            const proj = trx.projectId ? data.getProject(trx.projectId) : null;
            return (
              <div key={trx.id} className="p-3 flex items-center gap-3 active:bg-gray-50 transition-colors">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", trx.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500')}>
                  {trx.type === 'Income' ? <ArrowDownRight className="w-4 h-4 rotate-180" /> : <ArrowUpRight className="w-4 h-4 rotate-180" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{trx.desc}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400">{trx.date}</span>
                    {proj && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-50 text-blue-600 font-medium truncate max-w-[100px]">{proj.name}</span>}
                  </div>
                </div>
                <span className={cn("text-xs font-bold flex-shrink-0", trx.type === 'Income' ? 'text-emerald-600' : 'text-gray-800')}>
                  {trx.type === 'Income' ? '+' : '-'}{formatShort(trx.amount)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Desktop */}
        <div className="overflow-x-auto hidden sm:block flex-1">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-gray-50/80 text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-100">
                <th className="p-3 pl-4 font-semibold">Date</th>
                <th className="p-3 font-semibold">Description</th>
                <th className="p-3 font-semibold">Project</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {filteredTrx.map(trx => {
                const proj = trx.projectId ? data.getProject(trx.projectId) : null;
                return (
                  <tr key={trx.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-3 pl-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{trx.date}</div>
                      <div className="text-[10px] text-gray-400">{trx.id}</div>
                    </td>
                    <td className="p-3 font-medium text-gray-800 line-clamp-1">{trx.desc}</td>
                    <td className="p-3">
                      {proj ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{proj.name}</span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-medium">{trx.category}</span></td>
                    <td className="p-3 text-right">
                      <span className={cn("font-bold", trx.type === 'Income' ? 'text-emerald-600' : 'text-gray-900')}>
                        {trx.type === 'Income' ? '+' : '-'}{formatRp(trx.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-gray-100 text-center">
          <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">View All →</button>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowManualEntry(false)} />
          <div className="relative bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-3xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white md:rounded-t-2xl rounded-t-3xl border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-md"><Plus className="w-4 h-4" /></div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">New Transaction</h2>
                  <p className="text-[10px] text-gray-400">Manual entry</p>
                </div>
              </div>
              <button onClick={() => setShowManualEntry(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Type toggle */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type</label>
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button onClick={() => { setEntryType('Expense'); setEntryCategory('Material'); }}
                    className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                      entryType === 'Expense' ? "bg-white shadow-sm text-rose-600" : "text-gray-500"
                    )}>Expense</button>
                  <button onClick={() => { setEntryType('Income'); setEntryCategory('Client Payment'); }}
                    className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                      entryType === 'Income' ? "bg-white shadow-sm text-emerald-600" : "text-gray-500"
                    )}>Income</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select value={entryCategory} onChange={e => setEntryCategory(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none">
                    {(entryType === 'Expense' ? expenseCategories : incomeCategories).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <input type="text" value={entryDesc} onChange={e => setEntryDesc(e.target.value)}
                  placeholder="e.g. Beli semen 50 sak"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (Rp)</label>
                <input type="number" value={entryAmount} onChange={e => setEntryAmount(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Link to Project (optional)</label>
                <select value={entryProjectId} onChange={e => setEntryProjectId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none">
                  <option value="">-- No Project --</option>
                  {data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-end gap-2">
              <button onClick={() => setShowManualEntry(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
              <button onClick={handleManualSubmit}
                disabled={!entryDesc.trim() || !entryAmount}
                className="px-5 py-2 bg-gradient-to-r from-brand-700 to-brand-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-brand-500/25 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                Save Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
