import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, ArrowDownRight, Wallet, Users,
  Briefcase, AlertCircle, Calculator,
  Settings, Receipt, UserPlus, ChevronRight,
  Plus, FilePlus, ClipboardList, BarChart3,
  Banknote, FolderKanban, UserCheck, Package, FileText,
  Clock, TrendingDown, PackageX, UserX,
  UserCog, CalendarCheck, Timer, TrendingUp, CheckCircle2,
  Target, Coins,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useData } from '../store/dataStore';

const chartData = [
  { name: 'Jan', revenue: 4000, profit: 2400 },
  { name: 'Feb', revenue: 3000, profit: 1398 },
  { name: 'Mar', revenue: 5200, profit: 3800 },
  { name: 'Apr', revenue: 4780, profit: 3208 },
  { name: 'May', revenue: 5890, profit: 4800 },
  { name: 'Jun', revenue: 6390, profit: 4200 },
  { name: 'Jul', revenue: 7490, profit: 5300 },
];

const shortcuts = [
  { icon: Plus, label: 'New Project', desc: 'Buat project', path: '/projects', color: 'from-brand-600 to-brand-700', bg: 'bg-teal-50' },
  { icon: Calculator, label: 'Estimasi', desc: 'Hitung RAB', path: '/estimator', color: 'from-brand-500 to-emerald-600', bg: 'bg-emerald-50' },
  { icon: UserPlus, label: 'New Client', desc: 'Tambah klien', path: '/crm', color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50' },
  { icon: FilePlus, label: 'Catat Pemasukan', desc: 'Income baru', path: '/finance', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50/70' },
  { icon: Receipt, label: 'Catat Pengeluaran', desc: 'Expense baru', path: '/finance', color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50' },
  { icon: ClipboardList, label: 'Stok Masuk', desc: 'Update stok', path: '/inventory', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
  { icon: BarChart3, label: 'Laporan', desc: 'Lihat report', path: '/finance', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
  { icon: Settings, label: 'Pengaturan', desc: 'Kelola app', path: '/admin', color: 'from-gray-500 to-gray-600', bg: 'bg-gray-100' },
];

export function Dashboard() {
  const navigate = useNavigate();
  const data = useData();

  const activeProjects = data.projects.filter(p => p.status === 'Active').length;
  const totalCustomers = data.customers.length;
  const totalRevenue = data.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = data.transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);

  // Enhanced KPI computations
  const allProjects = data.projects.length;
  const overdueProjects = data.projects.filter(p => p.status === 'Overdue').length;
  const completedProjects = data.projects.filter(p => p.status === 'Completed').length;
  const activeClients = data.customers.filter(c => c.status === 'Active').length;
  const leadClients = data.customers.filter(c => c.status === 'Lead').length;
  const netProfit = (totalRevenue || 124500000) - (totalExpenses || 82300000);
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 34;
  const outstandingAmount = data.transactions
    .filter(t => t.type === 'Expense' && !t.projectId)
    .reduce((s, t) => s + t.amount, 0) || 18200000;
  const overdueInvoices = data.transactions.filter(t => t.type === 'Expense' && t.amount > 5000000).length || 3;
  const pendingFollowUps = leadClients;

  const categoryMeta = {
    finance:   { label: 'Finance',   icon: Banknote,     color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500', path: '/finance' },
    project:   { label: 'Project',   icon: FolderKanban, color: 'text-brand-600',   bg: 'bg-teal-50',    dot: 'bg-brand-500',   path: '/projects' },
    crm:       { label: 'CRM',       icon: UserCheck,    color: 'text-indigo-600',  bg: 'bg-indigo-50',  dot: 'bg-indigo-500',  path: '/crm' },
    inventory: { label: 'Inventory', icon: Package,      color: 'text-amber-600',   bg: 'bg-amber-50',   dot: 'bg-amber-500',   path: '/inventory' },
    estimate:  { label: 'Estimasi',  icon: FileText,     color: 'text-violet-600',  bg: 'bg-violet-50',  dot: 'bg-violet-500',  path: '/estimator' },
    system:    { label: 'System',    icon: Settings,     color: 'text-gray-500',    bg: 'bg-gray-50',    dot: 'bg-gray-400',    path: '/admin' },
  } as const;
  type CatKey = keyof typeof categoryMeta;

  const mapLogType = (t: string): CatKey => {
    if (t === 'finance') return 'finance';
    if (t === 'project' || t === 'task' || t === 'milestone') return 'project';
    if (t === 'crm') return 'crm';
    if (t === 'inventory') return 'inventory';
    if (t === 'estimate') return 'estimate';
    return 'system';
  };

  const recentActivities = [
    ...data.transactions.slice(0, 3).map(t => ({
      title: t.type === 'Income' ? 'Pembayaran Diterima' : 'Pengeluaran Dicatat',
      desc: t.desc,
      time: t.date,
      type: t.type === 'Income' ? 'success' as const : 'neutral' as const,
      category: 'finance' as CatKey,
      context: t.projectId ? data.projects.find(p => p.id === t.projectId)?.name : undefined,
    })),
    ...data.activityLog.slice(0, 2).map(a => ({
      title: a.action,
      desc: a.detail,
      time: new Date(a.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      type: 'info' as const,
      category: mapLogType(a.type) as CatKey,
      context: a.entityId ? (data.projects.find(p => p.id === a.entityId)?.name || a.entityId) : undefined,
    })),
  ].slice(0, 5);

  const defaultActivities: { title: string; desc: string; time: string; type: 'success' | 'info' | 'neutral' | 'warning'; category: CatKey; context?: string; action?: string; amount?: string }[] = [
    { title: 'Pembayaran Diterima', desc: 'Invoice #INV-2024-001 lunas dari klien', time: '2 jam lalu', type: 'success', category: 'finance', context: 'Renovasi Rumah Modern', action: 'Lihat invoice', amount: '+Rp 45M' },
    { title: 'Milestone Selesai', desc: 'Demolition phase selesai 100%', time: '5 jam lalu', type: 'info', category: 'project', context: 'Villa Bali Premium', action: 'Review milestone' },
    { title: 'Lead Baru Masuk', desc: 'Budi Santoso — perlu follow-up', time: '1 hari lalu', type: 'neutral', category: 'crm', action: 'Hubungi klien' },
    { title: 'Stok Menipis', desc: 'Cat Dulux Weathershield dibawah minimum', time: '1 hari lalu', type: 'warning', category: 'inventory', action: 'Restock sekarang' },
    { title: 'Estimasi Dikirim', desc: 'RAB Kitchen Set terkirim via WhatsApp', time: '2 hari lalu', type: 'info', category: 'estimate', context: 'Kitchen Set Fitra', action: 'Lihat estimasi' },
  ];

  const activities = recentActivities.length > 0 ? recentActivities : defaultActivities;

  const formatRpShort = (n: number) => {
    if (n >= 1000000000) return `Rp ${(n / 1000000000).toFixed(1)}B`;
    if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)}K`;
    return `Rp ${n}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in-up">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">
              {(() => {
                const h = new Date().getHours();
                return h < 12 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam';
              })()}, Admin
            </h1>
            <span className="text-[9px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full hidden md:inline-block border border-brand-100">
              Owner
            </span>
          </div>
          <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">
            <span className="text-gray-500 font-medium">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {activeProjects > 0 && (
              <span className="hidden sm:inline"> · {activeProjects} project aktif{overdueProjects > 0 ? `, ${overdueProjects} perlu perhatian` : ''}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-white border border-gray-200 text-[11px] rounded-xl px-2.5 py-1.5 shadow-sm focus:ring-2 focus:ring-brand-500/30 outline-none cursor-pointer font-medium text-gray-600 w-fit">
            <option>7 hari terakhir</option>
            <option>30 hari terakhir</option>
            <option>Bulan ini</option>
            <option>Kuartal ini</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Revenue Bulan Ini"
          value={formatRpShort(totalRevenue || 124500000)}
          trend="+12.5% vs bulan lalu"
          up={true}
          icon={<Wallet className="w-4 h-4" />}
          color="brand"
          d={1}
          period="Juli 2024 · semua project"
          helper="total masuk"
          subInfo={`Profit ${profitMargin}% · ${formatRpShort(netProfit)}`}
        />
        <StatCard
          title="Project Aktif"
          value={`${activeProjects} / ${allProjects}`}
          trend={overdueProjects > 0 ? `${overdueProjects} terlambat` : `${completedProjects} selesai`}
          up={overdueProjects === 0}
          icon={<Briefcase className="w-4 h-4" />}
          color={overdueProjects > 0 ? 'rose' : 'blue'}
          d={2}
          period="Aktif saat ini"
          helper="aktif / total"
          subInfo={`${completedProjects} selesai · ${overdueProjects} terlambat`}
        />
        <StatCard
          title="Klien"
          value={`${activeClients} aktif`}
          trend={pendingFollowUps > 0 ? `${pendingFollowUps} perlu follow-up` : '+5.2% vs bulan lalu'}
          up={pendingFollowUps === 0}
          icon={<Users className="w-4 h-4" />}
          color={pendingFollowUps > 0 ? 'amber' : 'indigo'}
          d={3}
          period="Dari total database"
          helper="klien aktif"
          subInfo={`${totalCustomers} total · ${pendingFollowUps} leads perlu tindakan`}
        />
        <StatCard
          title="Piutang"
          value={formatRpShort(outstandingAmount)}
          trend={overdueInvoices > 0 ? `${overdueInvoices} jatuh tempo` : 'Semua terbayar'}
          up={overdueInvoices === 0}
          icon={<AlertCircle className="w-4 h-4" />}
          color="rose"
          d={4}
          period="Belum tertagih"
          helper="sisa tagihan"
          subInfo={`${overdueInvoices} invoice jatuh tempo · perlu tindakan`}
        />
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-up stagger-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aksi Cepat</h2>
          <span className="text-[9px] text-gray-300 hidden md:block">Klik untuk aksi langsung</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:grid md:grid-cols-8 md:overflow-visible md:pb-0">
          {shortcuts.map((item, i) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 md:p-3 rounded-2xl ${item.bg} hover:shadow-md transition-all duration-300 active:scale-95 group animate-fade-in-up stagger-${Math.min(i + 1, 8)} flex-shrink-0 w-[72px] md:w-auto`}
            >
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all group-hover:-translate-y-0.5`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] md:text-[11px] font-bold text-gray-700 text-center leading-tight">{item.label}</span>
              <span className="text-[8px] md:text-[9px] text-gray-400 text-center leading-tight hidden md:block">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Attention Needed */}
      <AttentionWidget
        projects={data.projects}
        customers={data.customers}
        transactions={data.transactions}
        navigate={navigate}
        formatRp={formatRpShort}
        overdueInvoices={overdueInvoices}
        pendingFollowUps={pendingFollowUps}
      />

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartSection chartData={chartData} formatRp={formatRpShort} />

        {/* Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 md:p-5 card-hover animate-fade-in-up stagger-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Aktivitas Terkini</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Update real-time bisnis Anda</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-semibold text-gray-400">LIVE</span>
            </div>
          </div>

          {/* Category summary strip */}
          <div className="flex items-center gap-1 mb-2.5 overflow-x-auto scrollbar-hide">
            {(() => {
              const counts: Record<string, number> = {};
              activities.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1; });
              return Object.entries(counts).map(([key, count]) => {
                const cat = categoryMeta[key as CatKey] || categoryMeta.system;
                return (
                  <span key={key} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md ${cat.bg} flex-shrink-0`}>
                    <div className={`w-1 h-1 rounded-full ${cat.dot}`} />
                    <span className={`text-[8px] font-bold ${cat.color}`}>{count}</span>
                    <span className="text-[8px] text-gray-400">{cat.label}</span>
                  </span>
                );
              });
            })()}
          </div>

          <div className="flex-1 space-y-0.5">
            {activities.map((a, i) => {
              const cat = categoryMeta[a.category] || categoryMeta.system;
              const CatIcon = cat.icon;
              const statusDot = a.type === 'success' ? 'bg-emerald-400' : a.type === 'warning' ? 'bg-amber-400' : 'bg-gray-300';
              return (
                <div
                  key={i}
                  onClick={() => navigate(cat.path)}
                  className="flex items-start gap-2 p-1.5 md:p-2 -mx-1 rounded-xl cursor-pointer hover:bg-gray-50/80 transition-all group active:scale-[0.99]"
                >
                  {/* Timeline icon + connector */}
                  <div className="relative flex flex-col items-center pt-0.5 flex-shrink-0">
                    <div className={`w-7 h-7 rounded-lg ${cat.bg} flex items-center justify-center transition-transform group-hover:scale-110 relative`}>
                      <CatIcon className={`w-3.5 h-3.5 ${cat.color}`} />
                      <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${statusDot} border border-white`} />
                    </div>
                    {i < activities.length - 1 && (
                      <div className="w-px flex-1 bg-gray-100 mt-1 min-h-[8px]" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[11px] font-semibold text-gray-800 truncate">{a.title}</p>
                      {(a as typeof defaultActivities[0]).amount && (
                        <span className={`text-[9px] font-bold flex-shrink-0 ${a.type === 'success' ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {(a as typeof defaultActivities[0]).amount}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 truncate leading-tight">{a.desc}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-gray-300 font-medium">{a.time}</span>
                      {a.context && (
                        <>
                          <span className="text-[9px] text-gray-200">·</span>
                          <span className="text-[9px] text-brand-600 font-medium truncate">{a.context}</span>
                        </>
                      )}
                      {(a as typeof defaultActivities[0]).action && (
                        <>
                          <span className="text-[9px] text-gray-200 hidden sm:inline">·</span>
                          <span className="text-[9px] text-brand-500 font-semibold hidden sm:inline group-hover:underline">{(a as typeof defaultActivities[0]).action}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Arrow */}
                  <ChevronRight className="w-3.5 h-3.5 text-gray-200 group-hover:text-brand-400 transition-colors flex-shrink-0 mt-1" />
                </div>
              );
            })}
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="w-full mt-2.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
          >
            Lihat Semua Aktivitas <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pipeline */}
      {(() => {
        const pipelineData = [
          { label: 'Perencanaan', status: 'Planning', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', barColor: 'bg-blue-400' },
          { label: 'Berjalan', status: 'Active', color: 'bg-brand-500', bg: 'bg-teal-50', text: 'text-brand-700', barColor: 'bg-brand-400' },
          { label: 'Tertunda', status: 'On Hold', color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', barColor: 'bg-amber-400' },
          { label: 'Terlambat', status: 'Overdue', color: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', barColor: 'bg-rose-400' },
          { label: 'Selesai', status: 'Completed', color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', barColor: 'bg-emerald-400' },
        ].map(s => ({
          ...s,
          projects: data.projects.filter(p => p.status === s.status),
          count: data.projects.filter(p => p.status === s.status).length,
          budget: data.projects.filter(p => p.status === s.status).reduce((sum, p) => sum + p.budget, 0),
        }));
        const totalProjects = data.projects.length || 1;

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 md:p-5 card-hover animate-fade-in-up stagger-7">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Pipeline Project</h2>
                <p className="text-[10px] text-gray-400">Distribusi & status {data.projects.length} project</p>
              </div>
              <button onClick={() => navigate('/projects')} className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-0.5">
                Semua Project <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Distribution bar */}
            <div className="flex h-2 rounded-full overflow-hidden mb-3 bg-gray-100">
              {pipelineData.filter(s => s.count > 0).map(s => (
                <div
                  key={s.status}
                  className={`${s.barColor} transition-all duration-500`}
                  style={{ width: `${(s.count / totalProjects) * 100}%` }}
                  title={`${s.label}: ${s.count}`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {pipelineData.map(s => (
                <div
                  key={s.label}
                  onClick={() => navigate('/projects')}
                  className={`${s.bg} rounded-xl p-2.5 transition-all hover:shadow-md cursor-pointer active:scale-[0.98] ${s.count === 0 ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className={`text-[9px] font-bold ${s.text} uppercase tracking-wide`}>{s.label}</span>
                  </div>
                  <p className="text-lg md:text-xl font-bold text-gray-900 leading-tight">{s.count}</p>
                  {/* Sub-info: project names or budget */}
                  {s.count > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {s.projects.slice(0, 2).map(p => (
                        <p key={p.id} className="text-[8px] text-gray-500 truncate leading-tight" title={p.name}>
                          • {p.name}
                        </p>
                      ))}
                      {s.count > 2 && (
                        <p className="text-[8px] text-gray-400">+{s.count - 2} lainnya</p>
                      )}
                      {s.budget > 0 && (
                        <p className={`text-[8px] font-semibold ${s.text} mt-0.5`}>
                          {formatRpShort(s.budget)}
                        </p>
                      )}
                    </div>
                  )}
                  {s.count === 0 && (
                    <p className="text-[9px] text-gray-400 mt-0.5">—</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Employee Monitoring Widget - Only for Admin/HR */}
      <EmployeeMonitoringWidget 
        navigate={navigate}
        formatRp={formatRpShort}
      />
    </div>
  );
}

function EmployeeMonitoringWidget({ navigate, formatRp }: {
  navigate: (p: string) => void;
  formatRp: (n: number) => string;
}) {
  const data = useData();
  const { employees, attendance, projects, currentUser, users, getPayroll } = data;
  
  // Only show for Admin, HR, or Finance
  if (!currentUser || !['Admin', 'HR', 'Finance'].includes(currentUser.role)) return null;
  
  // Get payroll data
  const payrollRecords = getPayroll();
  
  // Helper to get user name from userId
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };
  
  // Attendance Stats (last 30 days)
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentAttendance = attendance.filter(a => new Date(a.date) >= thirtyDaysAgo);
  
  const presentCount = recentAttendance.filter(a => a.status === 'Present').length;
  const lateCount = recentAttendance.filter(a => a.status === 'Late').length;
  const leaveCount = recentAttendance.filter(a => ['Leave', 'Sick'].includes(a.status)).length;
  
  // Today's attendance
  const todayAttendance = attendance.filter(a => a.date === today);
  const checkedInToday = todayAttendance.filter(a => a.checkInTime).length;
  const lateToday = todayAttendance.filter(a => a.status === 'Late').length;
  
  // Work hours calculation
  const totalWorkHours = recentAttendance.reduce((sum, a) => {
    if (a.checkInTime && a.checkOutTime) {
      const start = new Date(`2024-01-01 ${a.checkInTime}`);
      const end = new Date(`2024-01-01 ${a.checkOutTime}`);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    return sum;
  }, 0);
  const avgWorkHoursPerDay = presentCount > 0 ? (totalWorkHours / presentCount) : 0;
  const totalOvertime = Math.max(0, totalWorkHours - (presentCount * 8));
  
  // Payroll stats
  const pendingPayroll = payrollRecords.filter((p: { status: string }) => p.status === 'Draft' || p.status === 'Processed');
  const paidThisMonth = payrollRecords
    .filter((p: { status: string; period: string }) => p.status === 'Paid' && p.period.includes(new Date().toLocaleString('id-ID', { month: 'long' })))
    .reduce((sum: number, p: { netPay: number }) => sum + p.netPay, 0);
  const totalPendingAmount = pendingPayroll.reduce((sum: number, p: { netPay: number }) => sum + p.netPay, 0);
  
  // Task stats per employee
  const allTasks = projects.flatMap(p => p.tasks || []);
  const assignedTasks = allTasks.filter(t => t.assignees?.length > 0);
  const completedTasks = assignedTasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = assignedTasks.filter(t => t.status === 'In Progress').length;
  const overdueTasks = assignedTasks.filter(t => {
    if (!t.dueDate || t.status === 'Done') return false;
    return new Date(t.dueDate) < new Date();
  }).length;
  
  // Employee productivity (simplified)
  const employeeStats = employees.filter(e => e.status === 'Active').map(emp => {
    const empName = getUserName(emp.userId);
    const empInitials = empName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const empAttendance = recentAttendance.filter(a => a.userId === emp.userId);
    const present = empAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const late = empAttendance.filter(a => a.status === 'Late').length;
    // Match tasks by checking if any assignee avatar matches employee initials
    const empTasks = allTasks.filter(t => t.assignees?.some(a => a.avatar === empInitials));
    const done = empTasks.filter(t => t.status === 'Done').length;
    const total = empTasks.length;
    return {
      ...emp,
      name: empName,
      attendanceRate: empAttendance.length > 0 ? Math.round((present / Math.max(empAttendance.length, 1)) * 100) : 0,
      lateCount: late,
      tasksDone: done,
      tasksTotal: total,
      productivity: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });
  
  const attendanceRate = recentAttendance.length > 0 
    ? Math.round((presentCount / recentAttendance.length) * 100) 
    : 0;
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 md:p-5 card-hover animate-fade-in-up stagger-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
            <UserCog className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Monitoring Karyawan</h2>
            <p className="text-[10px] text-gray-400">{employees.filter(e => e.status === 'Active').length} karyawan aktif · Data 30 hari terakhir</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/payroll')}
          className="text-[11px] text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-0.5"
        >
          Kelola <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Today's Status - Quick Overview */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-3 mb-4 border border-violet-100">
        <div className="flex items-center gap-2 mb-2">
          <CalendarCheck className="w-4 h-4 text-violet-600" />
          <span className="text-xs font-semibold text-violet-800">Status Hari Ini</span>
          <span className="text-[9px] bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-full font-medium ml-auto">
            {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{checkedInToday}</p>
            <p className="text-[9px] text-gray-500">Check-in</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-600">{lateToday}</p>
            <p className="text-[9px] text-gray-500">Terlambat</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-400">{employees.filter(e => e.status === 'Active').length - checkedInToday}</p>
            <p className="text-[9px] text-gray-500">Belum Absen</p>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {/* Attendance Rate */}
        <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[9px] font-bold text-emerald-700 uppercase">Kehadiran</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{attendanceRate}%</p>
          <p className="text-[9px] text-gray-500">{presentCount} hadir · {lateCount} telat</p>
        </div>
        
        {/* Work Hours */}
        <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Timer className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[9px] font-bold text-blue-700 uppercase">Jam Kerja</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{Math.round(totalWorkHours)}h</p>
          <p className="text-[9px] text-gray-500">Avg {avgWorkHoursPerDay.toFixed(1)}h/hari</p>
        </div>
        
        {/* Overtime */}
        <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-100">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[9px] font-bold text-amber-700 uppercase">Lembur</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{Math.round(totalOvertime)}h</p>
          <p className="text-[9px] text-gray-500">{leaveCount} cuti/izin</p>
        </div>
        
        {/* Tasks */}
        <div className="bg-violet-50 rounded-xl p-2.5 border border-violet-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-[9px] font-bold text-violet-700 uppercase">Tugas</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{completedTasks}/{assignedTasks.length}</p>
          <p className="text-[9px] text-gray-500">{overdueTasks > 0 ? `${overdueTasks} overdue` : `${inProgressTasks} berjalan`}</p>
        </div>
      </div>
      
      {/* Payroll Summary */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-semibold text-gray-700">Ringkasan Payroll</span>
          </div>
          <button onClick={() => navigate('/payroll')} className="text-[10px] text-brand-600 hover:underline font-medium">
            Lihat Detail →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wide">Dibayar Bulan Ini</p>
            <p className="text-sm font-bold text-emerald-600">{formatRp(paidThisMonth)}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wide">Menunggu Proses</p>
            <p className="text-sm font-bold text-amber-600">{formatRp(totalPendingAmount)}</p>
            {pendingPayroll.length > 0 && (
              <p className="text-[9px] text-gray-500">{pendingPayroll.length} karyawan</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Employee Productivity List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Performa Karyawan</span>
          <span className="text-[9px] text-gray-300">30 hari terakhir</span>
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {employeeStats.slice(0, 5).map((emp) => (
            <div 
              key={emp.id}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
              onClick={() => navigate('/payroll')}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-gray-800 truncate">{emp.name}</p>
                  <span className="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{emp.position}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`text-[9px] font-medium ${emp.attendanceRate >= 90 ? 'text-emerald-600' : emp.attendanceRate >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {emp.attendanceRate}% hadir
                  </span>
                  {emp.lateCount > 0 && (
                    <span className="text-[9px] text-amber-500">{emp.lateCount}x telat</span>
                  )}
                  <span className="text-[9px] text-gray-400">{emp.tasksDone}/{emp.tasksTotal} tugas</span>
                </div>
              </div>
              
              {/* Productivity */}
              <div className="flex flex-col items-end flex-shrink-0">
                <div className={`text-xs font-bold ${emp.productivity >= 80 ? 'text-emerald-600' : emp.productivity >= 50 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {emp.productivity}%
                </div>
                <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                  <div 
                    className={`h-full rounded-full transition-all ${emp.productivity >= 80 ? 'bg-emerald-500' : emp.productivity >= 50 ? 'bg-amber-500' : 'bg-gray-300'}`}
                    style={{ width: `${emp.productivity}%` }}
                  />
                </div>
              </div>
              
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
            </div>
          ))}
        </div>
        
        {employees.filter(e => e.status === 'Active').length > 5 && (
          <button 
            onClick={() => navigate('/payroll')}
            className="w-full mt-2 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
          >
            Lihat Semua Karyawan <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AttentionWidget({ projects, customers, transactions, navigate, formatRp, overdueInvoices, pendingFollowUps }: {
  projects: { id: string; name: string; status: string; endDate: string; budget: number; spent: number }[];
  customers: { id: string; name: string; status: string }[];
  transactions: { type: string; amount: number; desc: string; projectId?: string | null }[];
  navigate: (p: string) => void;
  formatRp: (n: number) => string;
  overdueInvoices: number;
  pendingFollowUps: number;
}) {
  const overdueProjects = projects.filter(p => p.status === 'Overdue');
  const overBudgetProjects = projects.filter(p => p.budget > 0 && p.spent > p.budget * 0.9);
  const lowStockCount = 3; // would come from inventory in production
  const inactiveClients = customers.filter(c => c.status === 'Inactive');

  const items: { icon: React.ElementType; label: string; detail: string; severity: 'red' | 'amber' | 'blue'; path: string; count: number }[] = [];

  if (overdueInvoices > 0) {
    items.push({
      icon: Clock,
      label: 'Invoice Jatuh Tempo',
      detail: `${overdueInvoices} invoice · ${formatRp(transactions.filter(t => t.type === 'Expense' && t.amount > 5000000).reduce((s, t) => s + t.amount, 0) || 18200000)}`,
      severity: 'red',
      path: '/finance',
      count: overdueInvoices,
    });
  }

  if (overdueProjects.length > 0) {
    items.push({
      icon: TrendingDown,
      label: 'Project Terlambat',
      detail: overdueProjects.map(p => p.name).slice(0, 2).join(', '),
      severity: 'red',
      path: '/projects',
      count: overdueProjects.length,
    });
  }

  if (pendingFollowUps > 0) {
    items.push({
      icon: UserX,
      label: 'Follow-up Pending',
      detail: `${pendingFollowUps} lead belum ditindaklanjuti`,
      severity: 'amber',
      path: '/crm',
      count: pendingFollowUps,
    });
  }

  if (overBudgetProjects.length > 0) {
    items.push({
      icon: AlertCircle,
      label: 'Budget Hampir Habis',
      detail: overBudgetProjects.map(p => `${p.name} (${Math.round((p.spent / p.budget) * 100)}%)`).slice(0, 2).join(', '),
      severity: 'amber',
      path: '/projects',
      count: overBudgetProjects.length,
    });
  }

  if (lowStockCount > 0) {
    items.push({
      icon: PackageX,
      label: 'Stok Menipis',
      detail: `${lowStockCount} item dibawah batas minimum`,
      severity: 'blue',
      path: '/inventory',
      count: lowStockCount,
    });
  }

  if (inactiveClients.length > 0) {
    items.push({
      icon: UserCheck,
      label: 'Klien Tidak Aktif',
      detail: `${inactiveClients.length} klien tanpa project aktif`,
      severity: 'blue',
      path: '/crm',
      count: inactiveClients.length,
    });
  }

  if (items.length === 0) return null;

  const sevColors = {
    red: { bg: 'bg-rose-50', border: 'border-rose-200/60', text: 'text-rose-600', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200/60', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200/60', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  };

  const totalIssues = items.reduce((s, i) => s + i.count, 0);
  const hasUrgent = items.some(i => i.severity === 'red');

  return (
    <div className={`rounded-2xl border p-3 md:p-4 animate-fade-in-up stagger-5 ${
      hasUrgent ? 'bg-rose-50/40 border-rose-200/50' : 'bg-amber-50/40 border-amber-200/50'
    }`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center ${hasUrgent ? 'bg-rose-100' : 'bg-amber-100'}`}>
            <AlertCircle className={`w-3 h-3 md:w-3.5 md:h-3.5 ${hasUrgent ? 'text-rose-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <h2 className="text-[11px] md:text-xs font-bold text-gray-900">Perlu Perhatian</h2>
            <p className="text-[9px] text-gray-400">{totalIssues} hal perlu ditindaklanjuti</p>
          </div>
        </div>
        {hasUrgent && (
          <span className="text-[8px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
            Urgent
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map((item, i) => {
          const sc = sevColors[item.severity];
          return (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${sc.bg} ${sc.border} hover:shadow-md transition-all text-left group active:scale-[0.98]`}
            >
              <div className={`w-8 h-8 rounded-lg ${sc.badge} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-bold text-gray-800 truncate">{item.label}</p>
                  <span className={`text-[9px] font-bold ${sc.badge} px-1.5 py-0.5 rounded-full flex-shrink-0`}>
                    {item.count}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate leading-tight">{item.detail}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-100 p-3 min-w-[160px]">
      <p className="text-[11px] font-bold text-gray-800 mb-1.5 border-b border-gray-100 pb-1.5">{label} 2024</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[10px] text-gray-500 capitalize">{p.dataKey === 'revenue' ? 'Pemasukan' : 'Profit'}</span>
          </div>
          <span className="text-[11px] font-bold text-gray-800">
            Rp {(p.value / 1000).toFixed(0)}K
          </span>
        </div>
      ))}
      {payload.length >= 2 && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[9px] text-gray-400">Margin</span>
          <span className="text-[10px] font-bold text-emerald-600">
            {Math.round((payload[1].value / payload[0].value) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const chartPeriods = [
  { id: '6m', label: '6 Bulan' },
  { id: '12m', label: '12 Bulan' },
  { id: 'ytd', label: 'Tahun Ini' },
];

const chartData12m = [
  { name: 'Aug', revenue: 3200, profit: 1800 },
  { name: 'Sep', revenue: 3800, profit: 2100 },
  { name: 'Oct', revenue: 4100, profit: 2600 },
  { name: 'Nov', revenue: 3600, profit: 2000 },
  { name: 'Dec', revenue: 5500, profit: 3900 },
  { name: 'Jan', revenue: 4000, profit: 2400 },
  { name: 'Feb', revenue: 3000, profit: 1398 },
  { name: 'Mar', revenue: 5200, profit: 3800 },
  { name: 'Apr', revenue: 4780, profit: 3208 },
  { name: 'May', revenue: 5890, profit: 4800 },
  { name: 'Jun', revenue: 6390, profit: 4200 },
  { name: 'Jul', revenue: 7490, profit: 5300 },
];

function ChartSection({ chartData, formatRp }: { chartData: { name: string; revenue: number; profit: number }[]; formatRp: (n: number) => string }) {
  const [period, setPeriod] = useState<string>('6m');
  const activeData = period === '12m' ? chartData12m : period === 'ytd' ? chartData12m.slice(5) : chartData;
  const totalRev = activeData.reduce((s: number, d: { revenue: number }) => s + d.revenue, 0);
  const totalProfit = activeData.reduce((s: number, d: { profit: number }) => s + d.profit, 0);
  const avgMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 100) : 0;

  return (
    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 md:p-5 card-hover animate-fade-in-up stagger-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Pemasukan & Profit</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Tren performa keuangan bisnis</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {chartPeriods.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`text-[9px] md:text-[10px] font-semibold px-2 md:px-2.5 py-1 rounded-md transition-all ${
                period === p.id ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 mt-2">
        <div className="flex items-center gap-1.5 text-[10px]">
          <div className="w-2 h-2 rounded-full bg-brand-500" />
          <span className="text-gray-400">Pemasukan</span>
          <span className="font-bold text-gray-700">{formatRp(totalRev * 1000)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-gray-400">Profit</span>
          <span className="font-bold text-gray-700">{formatRp(totalProfit * 1000)}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">
          <span className="text-emerald-600 font-bold">{avgMargin}%</span>
          <span className="text-emerald-500">margin</span>
        </div>
      </div>

      <div className="h-[220px] md:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activeData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gProf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dx={-5} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#gRev)" dot={false} activeDot={{ r: 5, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }} />
            <Area type="monotone" dataKey="profit" stroke="#818CF8" strokeWidth={2.5} fillOpacity={1} fill="url(#gProf)" dot={false} activeDot={{ r: 5, fill: '#818CF8', stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, up, icon, color, d, subInfo, period, helper }: {
  title: string; value: string; trend: string; up: boolean; icon: React.ReactNode; color: string; d: number; subInfo?: string; period?: string; helper?: string;
}) {
  const colors: Record<string, { bg: string; text: string }> = {
    brand: { bg: 'bg-teal-50', text: 'text-brand-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  };
  const c = colors[color] || colors.brand;
  return (
    <div className={`bg-white p-3.5 md:p-4 rounded-2xl shadow-sm border border-gray-100/80 card-hover animate-fade-in-up stagger-${d} group relative`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 text-[11px] font-medium">{title}</p>
          {period && (
            <p className="text-[9px] text-gray-300 font-medium mt-0.5 tracking-wide">{period}</p>
          )}
        </div>
        <div className={`p-1.5 ${c.bg} rounded-lg ${c.text} flex-shrink-0`}>{icon}</div>
      </div>
      <div className="mt-2">
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-lg md:text-xl font-bold text-gray-900">{value}</h3>
          {helper && (
            <span className="text-[9px] text-gray-300 font-medium hidden md:inline">{helper}</span>
          )}
        </div>
        <span className={`flex items-center text-[10px] font-semibold mt-0.5 ${up ? 'text-emerald-600' : 'text-rose-500'}`}>
          {up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}{trend}
        </span>
        {subInfo && (
          <p className="text-[10px] text-gray-400 mt-1.5 leading-tight border-t border-gray-100 pt-1.5">{subInfo}</p>
        )}
      </div>
    </div>
  );
}
