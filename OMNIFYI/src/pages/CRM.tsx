import { useState } from 'react';
import { Search, Plus, Phone, Mail, Building, ChevronRight, Star, X, Briefcase, Calculator, Link2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useData } from '../store/dataStore';

export function CRM() {
  const data = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const filtered = data.customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const selectedCustomer = selectedCustomerId ? data.getCustomer(selectedCustomerId) : null;
  const customerProjects = selectedCustomerId ? data.getProjectsByCustomer(selectedCustomerId) : [];
  const customerEstimates = selectedCustomerId ? data.getEstimatesByCustomer(selectedCustomerId) : [];
  const customerTransactions = selectedCustomerId ? data.transactions.filter(t => {
    const proj = t.projectId ? data.getProject(t.projectId) : null;
    return proj?.customerId === selectedCustomerId;
  }) : [];

  const handleAdd = () => {
    if (!newName.trim()) return;
    data.addCustomer({ name: newName, company: newCompany, phone: newPhone, email: newEmail, address: newAddress, status: 'Lead', starred: false, tags: [] });
    setShowAddForm(false);
    setNewName(''); setNewCompany(''); setNewPhone(''); setNewEmail(''); setNewAddress('');
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md"><Building className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">CRM</h1>
            <p className="text-gray-400 text-xs">Manage customers & relationships</p>
          </div>
        </div>
        <button onClick={() => setShowAddForm(true)} className="flex items-center gap-1.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-brand-500/25 transition-all active:scale-95">
          <Plus className="w-3.5 h-3.5" />Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 animate-fade-in-up stagger-1">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center card-hover">
          <p className="text-xl font-bold text-gray-900">{data.customers.length}</p>
          <p className="text-[10px] text-gray-400 font-medium">Total</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center card-hover">
          <p className="text-xl font-bold text-brand-600">{data.customers.filter(c => c.status === 'Active').length}</p>
          <p className="text-[10px] text-gray-400 font-medium">Active</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center card-hover">
          <p className="text-xl font-bold text-blue-600">{data.customers.filter(c => c.status === 'Lead').length}</p>
          <p className="text-[10px] text-gray-400 font-medium">Leads</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Customer List */}
        <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up stagger-2 flex flex-col", selectedCustomerId ? 'lg:w-1/2' : 'w-full')}>
          <div className="p-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200/60 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:bg-white transition-all" />
            </div>
            <div className="flex items-center gap-1.5">
              {['All', 'Active', 'Lead', 'Inactive'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all", statusFilter === s ? 'bg-brand-50 text-brand-700' : 'text-gray-400 hover:bg-gray-50')}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[60vh]">
            {filtered.map(customer => {
              const projCount = data.getProjectsByCustomer(customer.id).length;
              const totalValue = data.getProjectsByCustomer(customer.id).reduce((s, p) => s + p.budget, 0);
              return (
                <button key={customer.id} onClick={() => setSelectedCustomerId(customer.id === selectedCustomerId ? null : customer.id)} className={cn("w-full p-3 text-left hover:bg-gray-50/60 transition-colors flex items-center gap-3 active:bg-gray-100", selectedCustomerId === customer.id && 'bg-brand-50/50 border-l-2 border-brand-500')}>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0">
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-gray-900 truncate">{customer.name}</span>
                      {customer.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 truncate">{customer.company}</span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold", customer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : customer.status === 'Lead' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500')}>{customer.status}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-xs font-bold text-gray-700">{projCount} proj</p>
                    <p className="text-[10px] text-gray-400">{totalValue > 0 ? `Rp ${(totalValue / 1000000).toFixed(0)}M` : '-'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              );
            })}
          </div>
          <div className="p-3 border-t border-gray-100 text-[10px] text-gray-400">
            {filtered.length} of {data.customers.length} customers
          </div>
        </div>

        {/* Customer Detail Panel */}
        {selectedCustomer && (
          <div className="lg:w-1/2 space-y-3 animate-fade-in-up">
            {/* Customer card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-lg">{selectedCustomer.name.split(' ').map(n => n[0]).join('')}</div>
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedCustomer.name}</h3>
                    <p className="text-xs text-gray-400">{selectedCustomer.company}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomerId(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-500"><Phone className="w-3.5 h-3.5" />{selectedCustomer.phone}</div>
                <div className="flex items-center gap-2 text-gray-500"><Mail className="w-3.5 h-3.5" />{selectedCustomer.email}</div>
                <div className="flex items-center gap-2 text-gray-500"><Building className="w-3.5 h-3.5" />{selectedCustomer.address}</div>
              </div>
              {selectedCustomer.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3">
                  {selectedCustomer.tags.map(t => <span key={t} className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-[10px] font-bold">{t}</span>)}
                </div>
              )}
            </div>

            {/* Connected Projects */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-blue-500" />
                <h4 className="font-bold text-sm text-gray-900">Projects ({customerProjects.length})</h4>
              </div>
              {customerProjects.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No projects yet</p>
              ) : (
                <div className="space-y-2">
                  {customerProjects.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-gray-400">{p.id}</span>
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold", p.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : p.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500')}>{p.status}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-700">{p.progress}%</p>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-0.5">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Connected Estimates */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-brand-500" />
                <h4 className="font-bold text-sm text-gray-900">Estimates ({customerEstimates.length})</h4>
              </div>
              {customerEstimates.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No estimates</p>
              ) : (
                <div className="space-y-2">
                  {customerEstimates.map(e => {
                    const total = e.items.reduce((s, i) => s + i.qty * i.sellPrice, 0);
                    return (
                      <div key={e.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{e.title}</p>
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold", e.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : e.status === 'Sent' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500')}>{e.status}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-700">Rp {(total / 1000000).toFixed(0)}M</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-emerald-500" />
                <h4 className="font-bold text-sm text-gray-900">Transactions ({customerTransactions.length})</h4>
              </div>
              {customerTransactions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No transactions</p>
              ) : (
                <div className="space-y-1.5">
                  {customerTransactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-700 truncate">{t.desc}</p>
                        <p className="text-[10px] text-gray-400">{t.date}</p>
                      </div>
                      <span className={cn("font-bold", t.type === 'Income' ? 'text-emerald-600' : 'text-gray-800')}>
                        {t.type === 'Income' ? '+' : '-'}Rp {(t.amount / 1000).toFixed(0)}K
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">New Customer</h3>
              <button onClick={() => setShowAddForm(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Name</label><input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none" placeholder="Full name" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Company</label><input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none" placeholder="Company" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Phone</label><input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none" placeholder="+62..." /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Email</label><input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none" placeholder="email" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Address</label><input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none" placeholder="Address" /></div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleAdd} className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all active:scale-[0.98]">Save</button>
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
