import { useState } from 'react';
import {
  Plus, Trash2, Download, Share2, FileText,
  UserPlus, Briefcase, ChevronDown, ChevronUp, Calculator,
  CheckCircle2, X, Copy, Link2, Eye,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useData, type EstimateItem } from '../store/dataStore';

const categories = ['Flooring', 'Painting', 'Ceiling', 'Plumbing', 'Electrical', 'Structural', 'Finishing', 'Furniture', 'Other'];

export function Estimator() {
  const data = useData();
  const [items, setItems] = useState<EstimateItem[]>([
    { id: 'ei-d1', category: 'Flooring', description: 'Pasang Keramik 60x60 Ruang Tamu', qty: 24, unit: 'm²', hpp: 85000, sellPrice: 125000 },
    { id: 'ei-d2', category: 'Painting', description: 'Cat Dinding 3 Kamar', qty: 45, unit: 'm²', hpp: 25000, sellPrice: 40000 },
    { id: 'ei-d3', category: 'Ceiling', description: 'Plafon Gypsum Ruang Keluarga', qty: 18, unit: 'm²', hpp: 65000, sellPrice: 95000 },
  ]);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [contingency, setContingency] = useState(5);
  const [showSummary, setShowSummary] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [estimateTitle, setEstimateTitle] = useState('New Estimation');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [newCustName, setNewCustName] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const [newProjName, setNewProjName] = useState('');
  const [newProjCustomerId, setNewProjCustomerId] = useState('');
  const [newProjCategory, setNewProjCategory] = useState('Renovation');
  const [newProjStartDate, setNewProjStartDate] = useState('');
  const [newProjEndDate, setNewProjEndDate] = useState('');
  const [newProjBudget, setNewProjBudget] = useState('');
  const [newProjLocation, setNewProjLocation] = useState('');

  const selectedProject = selectedProjectId ? data.getProject(selectedProjectId) : null;
  const selectedCustomer = selectedCustomerId ? data.getCustomer(selectedCustomerId) : null;

  const totalHpp = items.reduce((s, i) => s + i.qty * i.hpp, 0);
  const totalSell = items.reduce((s, i) => s + i.qty * i.sellPrice, 0);
  const totalMargin = totalSell - totalHpp;
  const marginPct = totalHpp > 0 ? (totalMargin / totalHpp) * 100 : 0;
  const contingencyAmt = totalSell * (contingency / 100);
  const tax = taxEnabled ? (totalSell + contingencyAmt) * 0.11 : 0;
  const grandTotal = totalSell + contingencyAmt + tax;

  const formatRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  const handleProjectChange = (pid: string) => {
    setSelectedProjectId(pid || null);
    if (pid) {
      const proj = data.getProject(pid);
      if (proj) setSelectedCustomerId(proj.customerId);
    }
  };

  const customerProjects = selectedCustomerId ? data.getProjectsByCustomer(selectedCustomerId) : [];

  const addRow = () => {
    setItems([...items, { id: `new-${Date.now()}`, category: 'Other', description: '', qty: 1, unit: 'pcs', hpp: 0, sellPrice: 0 }]);
  };

  const removeRow = (id: string) => setItems(items.filter(i => i.id !== id));

  const updateItem = (id: string, field: keyof EstimateItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSaveEstimate = () => {
    data.addEstimate({
      projectId: selectedProjectId,
      customerId: selectedCustomerId,
      title: estimateTitle,
      items: [...items],
      contingency,
      taxEnabled,
      status: 'Draft',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCreateCustomer = () => {
    if (!newCustName.trim()) return;
    const c = data.addCustomer({
      name: newCustName, company: newCustCompany, phone: newCustPhone,
      email: newCustEmail, address: newCustAddress, status: 'Active',
      starred: false, tags: [],
    });
    setSelectedCustomerId(c.id);
    setShowNewCustomer(false);
    setNewCustName(''); setNewCustCompany(''); setNewCustPhone(''); setNewCustEmail(''); setNewCustAddress('');
  };

  const handleCreateProject = () => {
    if (!newProjName.trim()) return;
    const p = data.addProject({
      name: newProjName,
      customerId: newProjCustomerId || selectedCustomerId || '',
      category: newProjCategory,
      status: 'Planning',
      priority: 'Medium',
      progress: 0,
      budget: parseFloat(newProjBudget) || grandTotal,
      spent: 0,
      startDate: newProjStartDate,
      endDate: newProjEndDate,
      location: newProjLocation,
      description: '',
      team: [],
    });
    setSelectedProjectId(p.id);
    if (p.customerId) setSelectedCustomerId(p.customerId);
    setShowNewProject(false);
    setNewProjName(''); setNewProjBudget(''); setNewProjLocation('');
  };

  const handleConvertToProject = () => {
    if (selectedProjectId) return;
    setNewProjBudget(String(grandTotal));
    setNewProjName(estimateTitle);
    setNewProjCustomerId(selectedCustomerId || '');
    setShowNewProject(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Estimator</h1>
              <p className="text-gray-400 text-xs">Manual estimation connected to projects & clients</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowSavedList(!showSavedList)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all active:scale-95">
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saved ({data.estimates.length})</span>
            </button>
            <button onClick={handleSaveEstimate} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-brand-500/25 transition-all active:scale-95">
              <Download className="w-3.5 h-3.5" />Save
            </button>
          </div>
        </div>

        {/* Estimate title + Project/Customer links */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Estimate Title</label>
              <input value={estimateTitle} onChange={(e) => setEstimateTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 focus:bg-white outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Customer
              </label>
              <div className="flex gap-1.5">
                <select value={selectedCustomerId || ''} onChange={(e) => { setSelectedCustomerId(e.target.value || null); setSelectedProjectId(null); }}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none cursor-pointer">
                  <option value="">-- Select Customer --</option>
                  {data.customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.company}</option>)}
                </select>
                <button onClick={() => setShowNewCustomer(true)} className="px-2.5 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all" title="New Customer">
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Project
              </label>
              <div className="flex gap-1.5">
                <select value={selectedProjectId || ''} onChange={(e) => handleProjectChange(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none cursor-pointer">
                  <option value="">-- Select Project --</option>
                  {(selectedCustomerId ? customerProjects : data.projects).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button onClick={() => { setNewProjCustomerId(selectedCustomerId || ''); setShowNewProject(true); }} className="px-2.5 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all" title="New Project">
                  <Briefcase className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {(selectedCustomer || selectedProject) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {selectedCustomer && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-xl text-xs">
                  <div className="w-5 h-5 rounded-md bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold">{selectedCustomer.name.split(' ').map(n => n[0]).join('')}</div>
                  <span className="font-semibold text-indigo-700">{selectedCustomer.name}</span>
                  <button onClick={() => setSelectedCustomerId(null)} className="ml-1 text-indigo-300 hover:text-indigo-600"><X className="w-3 h-3" /></button>
                </div>
              )}
              {selectedProject && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl text-xs">
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-semibold text-blue-700">{selectedProject.name}</span>
                  <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold",
                    selectedProject.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  )}>{selectedProject.status}</span>
                  <button onClick={() => setSelectedProjectId(null)} className="ml-1 text-blue-300 hover:text-blue-600"><X className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          )}
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium animate-fade-in-up">
            <CheckCircle2 className="w-4 h-4" /> Estimate saved successfully!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Summary + Actions */}
        <div className="lg:col-span-1 space-y-4 animate-fade-in-up stagger-1">
          {/* Financial Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
            <button onClick={() => setShowSummary(!showSummary)} className="flex items-center justify-between w-full">
              <h3 className="font-bold text-gray-900 text-sm">Financial Summary</h3>
              {showSummary ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showSummary && (
              <div className="mt-3 space-y-2.5 text-xs animate-fade-in">
                <SRow label="Total HPP" value={formatRp(totalHpp)} />
                <SRow label="Total Sell" value={formatRp(totalSell)} />
                <SRow label="Margin" value={formatRp(totalMargin)} className="text-emerald-600 font-bold" />
                <SRow label="Margin %" value={`${marginPct.toFixed(1)}%`} className="text-emerald-600" />
                <div className="border-t border-gray-100 pt-2.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Contingency</span>
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={contingency} onChange={(e) => setContingency(Number(e.target.value))} className="w-12 text-right bg-gray-50 rounded-lg px-1.5 py-0.5 border border-gray-200 text-xs font-medium focus:ring-1 focus:ring-brand-400 outline-none" />
                      <span className="text-gray-400">%</span>
                      <span className="font-semibold text-gray-700 ml-1">{formatRp(contingencyAmt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">PPN 11%</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={taxEnabled} onChange={() => setTaxEnabled(!taxEnabled)} className="sr-only peer" />
                      <div className="w-8 h-4.5 bg-gray-200 peer-checked:bg-brand-500 rounded-full transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-3.5" />
                    </label>
                  </div>
                  {taxEnabled && <SRow label="Tax (PPN)" value={formatRp(tax)} />}
                </div>
                <div className="border-t border-gray-200 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm">Grand Total</span>
                    <span className="font-bold text-lg gradient-text">{formatRp(grandTotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 space-y-1.5 card-hover">
            {[
              { icon: FileText, label: 'Generate PDF', sub: 'Professional quotation', color: 'bg-blue-50 text-blue-600', onClick: () => {} },
              { icon: Share2, label: 'Send WhatsApp', sub: 'Share with client', color: 'bg-emerald-50 text-emerald-600', onClick: () => {} },
              { icon: Briefcase, label: selectedProjectId ? 'Linked to Project' : 'Convert to Project', sub: selectedProjectId ? selectedProject?.name || '' : 'Create from estimate', color: 'bg-brand-50 text-brand-600', onClick: handleConvertToProject },
              { icon: Copy, label: 'Duplicate', sub: 'New version', color: 'bg-purple-50 text-purple-600', onClick: () => {} },
            ].map(a => (
              <button key={a.label} onClick={a.onClick} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all text-left active:scale-[0.98]">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", a.color)}><a.icon className="w-3.5 h-3.5" /></div>
                <div><p className="text-xs font-semibold text-gray-900">{a.label}</p><p className="text-[10px] text-gray-400">{a.sub}</p></div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Table */}
        <div className="lg:col-span-2 animate-fade-in-up stagger-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Estimation Items</h2>
                <p className="text-[11px] text-gray-400">{items.length} items • Click cells to edit</p>
              </div>
              <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-semibold hover:bg-brand-100 transition-all active:scale-95">
                <Plus className="w-3.5 h-3.5" />Add Item
              </button>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-50">
              {items.map((item, idx) => {
                const sub = item.qty * item.sellPrice;
                const margin = item.qty * (item.sellPrice - item.hpp);
                return (
                  <div key={item.id} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold">{idx + 1}</span>
                          <select value={item.category} onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 font-medium border-0 cursor-pointer">
                            {categories.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="w-full text-sm font-medium text-gray-900 bg-transparent border-0 p-0 focus:ring-0" placeholder="Description..." />
                      </div>
                      <button onClick={() => removeRow(item.id)} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-400 uppercase">Qty</label>
                        <input type="number" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))} className="w-full text-xs font-medium bg-gray-50 rounded-lg px-2 py-1.5 border-0 focus:ring-1 focus:ring-brand-400" />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 uppercase">Unit</label>
                        <input type="text" value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} className="w-full text-xs bg-gray-50 rounded-lg px-2 py-1.5 border-0 focus:ring-1 focus:ring-brand-400" />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 uppercase">HPP</label>
                        <input type="number" value={item.hpp} onChange={(e) => updateItem(item.id, 'hpp', Number(e.target.value))} className="w-full text-xs bg-gray-50 rounded-lg px-2 py-1.5 border-0 focus:ring-1 focus:ring-brand-400" />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 uppercase">Sell</label>
                        <input type="number" value={item.sellPrice} onChange={(e) => updateItem(item.id, 'sellPrice', Number(e.target.value))} className="w-full text-xs bg-gray-50 rounded-lg px-2 py-1.5 border-0 focus:ring-1 focus:ring-brand-400" />
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1">
                      <span className="text-gray-400">Subtotal: <span className="font-bold text-gray-700">{formatRp(sub)}</span></span>
                      <span className="text-emerald-600 font-semibold">Margin: {formatRp(margin)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-100">
                    <th className="p-3 pl-4 font-semibold w-8">#</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold">Description</th>
                    <th className="p-3 font-semibold text-right">Qty</th>
                    <th className="p-3 font-semibold">Unit</th>
                    <th className="p-3 font-semibold text-right">HPP</th>
                    <th className="p-3 font-semibold text-right">Sell</th>
                    <th className="p-3 font-semibold text-right">Subtotal</th>
                    <th className="p-3 font-semibold text-right">Margin</th>
                    <th className="p-3 pr-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {items.map((item, idx) => {
                    const sub = item.qty * item.sellPrice;
                    const margin = item.qty * (item.sellPrice - item.hpp);
                    const mp = item.hpp > 0 ? ((item.sellPrice - item.hpp) / item.hpp * 100) : 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors group">
                        <td className="p-3 pl-4 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="p-3">
                          <select value={item.category} onChange={(e) => updateItem(item.id, 'category', e.target.value)} className="bg-transparent border-0 text-xs text-gray-700 focus:ring-0 p-0 font-medium cursor-pointer">
                            {categories.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="p-3"><input type="text" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="Item..." className="w-full bg-transparent border-0 text-xs text-gray-900 focus:ring-0 p-0 font-medium placeholder:text-gray-300" /></td>
                        <td className="p-3"><input type="number" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))} className="w-14 text-right bg-transparent border-0 text-xs focus:ring-0 p-0 font-medium" /></td>
                        <td className="p-3"><input type="text" value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} className="w-10 bg-transparent border-0 text-xs text-gray-500 focus:ring-0 p-0" /></td>
                        <td className="p-3"><input type="number" value={item.hpp} onChange={(e) => updateItem(item.id, 'hpp', Number(e.target.value))} className="w-20 text-right bg-transparent border-0 text-xs focus:ring-0 p-0 text-gray-600" /></td>
                        <td className="p-3"><input type="number" value={item.sellPrice} onChange={(e) => updateItem(item.id, 'sellPrice', Number(e.target.value))} className="w-20 text-right bg-transparent border-0 text-xs focus:ring-0 p-0 text-gray-900 font-medium" /></td>
                        <td className="p-3 text-right font-bold text-gray-900 text-xs whitespace-nowrap">{formatRp(sub)}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <span className="text-emerald-600 font-semibold text-xs">{formatRp(margin)}</span>
                          <span className="text-[9px] text-gray-400 block">{mp.toFixed(0)}%</span>
                        </td>
                        <td className="p-3 pr-4">
                          <button onClick={() => removeRow(item.id)} className="p-1 text-gray-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td colSpan={7} className="p-3 pl-4 font-bold text-gray-700 text-xs">TOTAL</td>
                    <td className="p-3 text-right font-bold text-gray-900 text-sm">{formatRp(totalSell)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 text-sm">{formatRp(totalMargin)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Saved Estimates List */}
          {showSavedList && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 overflow-hidden animate-fade-in-up">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">Saved Estimates</h3>
                <button onClick={() => setShowSavedList(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="divide-y divide-gray-50">
                {data.estimates.map(est => {
                  const cust = est.customerId ? data.getCustomer(est.customerId) : null;
                  const proj = est.projectId ? data.getProject(est.projectId) : null;
                  const total = est.items.reduce((s, i) => s + i.qty * i.sellPrice, 0);
                  return (
                    <div key={est.id} className="p-3 hover:bg-gray-50/60 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{est.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] text-gray-400">{est.id}</span>
                            {cust && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">{cust.name}</span>}
                            {proj && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{proj.name}</span>}
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold",
                              est.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                              est.status === 'Sent' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'
                            )}>{est.status}</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{formatRp(total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomer && (
        <Modal title="Add New Customer" onClose={() => setShowNewCustomer(false)}>
          <div className="space-y-3">
            <FField label="Full Name" value={newCustName} onChange={setNewCustName} placeholder="e.g. Budi Santoso" />
            <FField label="Company" value={newCustCompany} onChange={setNewCustCompany} placeholder="e.g. PT Maju Jaya" />
            <div className="grid grid-cols-2 gap-3">
              <FField label="Phone" value={newCustPhone} onChange={setNewCustPhone} placeholder="+62 812..." />
              <FField label="Email" value={newCustEmail} onChange={setNewCustEmail} placeholder="email@co.com" />
            </div>
            <FField label="Address" value={newCustAddress} onChange={setNewCustAddress} placeholder="Full address" />
            <div className="flex gap-2 pt-2">
              <button onClick={handleCreateCustomer} className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all active:scale-[0.98]">Save Customer</button>
              <button onClick={() => setShowNewCustomer(false)} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <Modal title="Create New Project" onClose={() => setShowNewProject(false)}>
          <div className="space-y-3">
            <FField label="Project Name" value={newProjName} onChange={setNewProjName} placeholder="e.g. Renovasi Rumah" />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer</label>
              <select value={newProjCustomerId} onChange={(e) => setNewProjCustomerId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none">
                <option value="">Select customer...</option>
                {data.customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.company}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select value={newProjCategory} onChange={(e) => setNewProjCategory(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none">
                  {['Renovation', 'Construction', 'Interior', 'Furniture', 'Landscape', 'Maintenance'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <FField label="Location" value={newProjLocation} onChange={setNewProjLocation} placeholder="City..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FField label="Start Date" value={newProjStartDate} onChange={setNewProjStartDate} type="date" />
              <FField label="End Date" value={newProjEndDate} onChange={setNewProjEndDate} type="date" />
            </div>
            <FField label="Budget (Rp)" value={newProjBudget} onChange={setNewProjBudget} placeholder={String(grandTotal)} />
            <div className="flex gap-2 pt-2">
              <button onClick={handleCreateProject} className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all active:scale-[0.98]">Create Project</button>
              <button onClick={() => setShowNewProject(false)} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={cn("font-semibold text-gray-900", className)}>{value}</span>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function FField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all" />
    </div>
  );
}
