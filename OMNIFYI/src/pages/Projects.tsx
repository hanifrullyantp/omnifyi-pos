import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, LayoutGrid, List, SlidersHorizontal,
  Users, TrendingUp, CheckCircle2, AlertTriangle,
  Pause, MoreHorizontal, FolderKanban,
  MapPin, DollarSign, X, Briefcase, Columns3,
  GanttChartSquare, ChevronRight, ChevronDown,
  GripVertical, Camera, Loader2, Check,
  Clock, Shield, CalendarDays, ArrowRight, UserPlus,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useData } from '../store/dataStore';

// ─── Types ──────────────────────────────────────────────
type ProjectTask = {
  id: string; name: string; startDay: number; duration: number;
  status: 'done' | 'in-progress' | 'upcoming'; group: string;
};

type Project = {
  id: string; name: string; client: string; status: string;
  statusLabel: string; priority: string; progress: number;
  startDate: string; endDate: string; startDay: number; durationDays: number;
  budget: number; spent: number;
  tasksTotal: number; tasksDone: number;
  team: { name: string; color: string }[];
  location: string; category: string; description: string;
  milestones: number; milestonesDone: number; lastUpdate: string;
  gallery: string[]; // emoji placeholders for gallery
  tasks: ProjectTask[];
};

// ─── Data ──────────────────────────────────────────────
const projects: Project[] = [
  {
    id: 'PRJ-001', name: 'Renovasi Rumah Pak Budi', client: 'Budi Santoso',
    status: 'active', statusLabel: 'In Progress', priority: 'high', progress: 68,
    startDate: '10 Jan 2025', endDate: '15 Apr 2025', startDay: 10, durationDays: 95,
    budget: 185000000, spent: 126000000, tasksTotal: 24, tasksDone: 16,
    team: [{ name: 'Adi', color: 'bg-brand-500' }, { name: 'Jon', color: 'bg-indigo-500' }, { name: 'Sar', color: 'bg-rose-500' }, { name: 'Rin', color: 'bg-amber-500' }],
    location: 'Jakarta Selatan', category: 'Renovation', description: 'Full interior renovation.',
    milestones: 6, milestonesDone: 4, lastUpdate: '2 hours ago',
    gallery: ['🏠', '🔨', '🧱', '🎨'],
    tasks: [
      { id: 'T1', name: 'Bongkar keramik', startDay: 10, duration: 12, status: 'done', group: 'Demo' },
      { id: 'T2', name: 'Struktur dinding', startDay: 22, duration: 20, status: 'done', group: 'Structure' },
      { id: 'T3', name: 'Plumbing rough-in', startDay: 42, duration: 15, status: 'in-progress', group: 'MEP' },
      { id: 'T4', name: 'Electrical wiring', startDay: 48, duration: 18, status: 'in-progress', group: 'MEP' },
      { id: 'T5', name: 'Keramik lantai', startDay: 65, duration: 14, status: 'upcoming', group: 'Finish' },
      { id: 'T6', name: 'Cat & finishing', startDay: 80, duration: 20, status: 'upcoming', group: 'Finish' },
    ],
  },
  {
    id: 'PRJ-002', name: 'Pembangunan Ruko 3 Lantai', client: 'PT Maju Bersama',
    status: 'active', statusLabel: 'In Progress', priority: 'urgent', progress: 42,
    startDate: '01 Feb 2025', endDate: '30 Aug 2025', startDay: 32, durationDays: 210,
    budget: 750000000, spent: 320000000, tasksTotal: 48, tasksDone: 20,
    team: [{ name: 'Bam', color: 'bg-brand-500' }, { name: 'Fer', color: 'bg-purple-500' }, { name: 'Adi', color: 'bg-indigo-500' }],
    location: 'Tangerang', category: 'Construction', description: 'New 3-story commercial building.',
    milestones: 10, milestonesDone: 3, lastUpdate: '30 min ago',
    gallery: ['🏗️', '🧱', '🪨'],
    tasks: [
      { id: 'T1', name: 'Pondasi', startDay: 32, duration: 30, status: 'done', group: 'Foundation' },
      { id: 'T2', name: 'Kolom lt.1', startDay: 62, duration: 25, status: 'done', group: 'Structure' },
      { id: 'T3', name: 'Dak lt.2', startDay: 87, duration: 20, status: 'in-progress', group: 'Structure' },
      { id: 'T4', name: 'Dinding lt.1-2', startDay: 100, duration: 30, status: 'upcoming', group: 'Masonry' },
      { id: 'T5', name: 'Finishing', startDay: 180, duration: 40, status: 'upcoming', group: 'Finish' },
    ],
  },
  {
    id: 'PRJ-003', name: 'Interior Design Apartment', client: 'Lisa Anggraini',
    status: 'active', statusLabel: 'In Progress', priority: 'medium', progress: 85,
    startDate: '15 Dec 2024', endDate: '28 Mar 2025', startDay: -16, durationDays: 103,
    budget: 95000000, spent: 82000000, tasksTotal: 18, tasksDone: 15,
    team: [{ name: 'Sar', color: 'bg-rose-500' }, { name: 'Min', color: 'bg-sky-500' }],
    location: 'BSD City', category: 'Interior', description: 'Modern minimalist apartment interior.',
    milestones: 5, milestonesDone: 4, lastUpdate: '1 day ago',
    gallery: ['🏢', '🛋️', '💡'],
    tasks: [
      { id: 'T1', name: 'Design final', startDay: -16, duration: 15, status: 'done', group: 'Design' },
      { id: 'T2', name: 'Kitchen set', startDay: 10, duration: 25, status: 'done', group: 'Furniture' },
      { id: 'T3', name: 'Wardrobes', startDay: 35, duration: 20, status: 'done', group: 'Furniture' },
      { id: 'T4', name: 'Lighting & decor', startDay: 60, duration: 20, status: 'in-progress', group: 'Finish' },
    ],
  },
  {
    id: 'PRJ-004', name: 'Kitchen Set Custom Bu Diana', client: 'Diana Putri',
    status: 'completed', statusLabel: 'Completed', priority: 'low', progress: 100,
    startDate: '01 Nov 2024', endDate: '15 Jan 2025', startDay: -60, durationDays: 76,
    budget: 45000000, spent: 42500000, tasksTotal: 12, tasksDone: 12,
    team: [{ name: 'Jon', color: 'bg-indigo-500' }, { name: 'Adi', color: 'bg-brand-500' }],
    location: 'Depok', category: 'Furniture', description: 'Custom kitchen set with marble countertop.',
    milestones: 4, milestonesDone: 4, lastUpdate: '2 weeks ago',
    gallery: ['🍳', '✅'],
    tasks: [
      { id: 'T1', name: 'Design & order', startDay: -60, duration: 20, status: 'done', group: 'Prep' },
      { id: 'T2', name: 'Fabrication', startDay: -40, duration: 35, status: 'done', group: 'Production' },
      { id: 'T3', name: 'Install', startDay: -5, duration: 10, status: 'done', group: 'Install' },
    ],
  },
  {
    id: 'PRJ-005', name: 'Renovasi Kantor Startup', client: 'PT Tech Indo',
    status: 'on-hold', statusLabel: 'On Hold', priority: 'medium', progress: 25,
    startDate: '20 Jan 2025', endDate: '15 May 2025', startDay: 20, durationDays: 115,
    budget: 220000000, spent: 55000000, tasksTotal: 30, tasksDone: 7,
    team: [{ name: 'Fer', color: 'bg-purple-500' }, { name: 'Bam', color: 'bg-brand-500' }, { name: 'Rin', color: 'bg-amber-500' }],
    location: 'Jakarta Pusat', category: 'Commercial', description: 'Modern co-working space renovation.',
    milestones: 8, milestonesDone: 2, lastUpdate: '5 days ago',
    gallery: ['🏢', '💼'],
    tasks: [
      { id: 'T1', name: 'Demo existing', startDay: 20, duration: 15, status: 'done', group: 'Demo' },
      { id: 'T2', name: 'Partisi & layout', startDay: 35, duration: 25, status: 'in-progress', group: 'Build' },
      { id: 'T3', name: 'MEP work', startDay: 60, duration: 30, status: 'upcoming', group: 'MEP' },
      { id: 'T4', name: 'Finishing', startDay: 100, duration: 35, status: 'upcoming', group: 'Finish' },
    ],
  },
  {
    id: 'PRJ-006', name: 'Taman & Landscape Villa', client: 'Hendro Wijaya',
    status: 'active', statusLabel: 'In Progress', priority: 'medium', progress: 55,
    startDate: '05 Feb 2025', endDate: '20 Apr 2025', startDay: 36, durationDays: 74,
    budget: 120000000, spent: 68000000, tasksTotal: 20, tasksDone: 11,
    team: [{ name: 'Min', color: 'bg-sky-500' }, { name: 'Sar', color: 'bg-rose-500' }],
    location: 'Bogor', category: 'Landscape', description: 'Complete garden landscaping with pool.',
    milestones: 6, milestonesDone: 3, lastUpdate: '4 hours ago',
    gallery: ['🌿', '🏊', '🌺'],
    tasks: [
      { id: 'T1', name: 'Land clearing', startDay: 36, duration: 10, status: 'done', group: 'Prep' },
      { id: 'T2', name: 'Pool excavation', startDay: 46, duration: 20, status: 'done', group: 'Pool' },
      { id: 'T3', name: 'Planting', startDay: 70, duration: 15, status: 'in-progress', group: 'Garden' },
      { id: 'T4', name: 'Lighting & path', startDay: 90, duration: 14, status: 'upcoming', group: 'Finish' },
    ],
  },
  {
    id: 'PRJ-007', name: 'Pembangunan Gudang', client: 'CV Abadi Jaya',
    status: 'overdue', statusLabel: 'Overdue', priority: 'urgent', progress: 60,
    startDate: '01 Dec 2024', endDate: '28 Feb 2025', startDay: -30, durationDays: 90,
    budget: 350000000, spent: 280000000, tasksTotal: 35, tasksDone: 21,
    team: [{ name: 'Adi', color: 'bg-brand-500' }, { name: 'Bam', color: 'bg-indigo-500' }, { name: 'Fer', color: 'bg-purple-500' }],
    location: 'Cikarang', category: 'Industrial', description: 'Warehouse construction 2000sqm.',
    milestones: 8, milestonesDone: 5, lastUpdate: '1 hour ago',
    gallery: ['🏭', '🔩', '🪜', '📦'],
    tasks: [
      { id: 'T1', name: 'Foundation', startDay: -30, duration: 20, status: 'done', group: 'Foundation' },
      { id: 'T2', name: 'Steel structure', startDay: -10, duration: 30, status: 'done', group: 'Structure' },
      { id: 'T3', name: 'Roofing', startDay: 20, duration: 15, status: 'in-progress', group: 'Structure' },
      { id: 'T4', name: 'Floor & finishing', startDay: 35, duration: 25, status: 'upcoming', group: 'Finish' },
    ],
  },
];

const formatCurrency = (val: number) => {
  if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)}B`;
  if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(0)}jt`;
  return `Rp ${val.toLocaleString('id-ID')}`;
};

// Status colors now handled by healthConfig

const priorityStyles: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-50 text-blue-700',
  high: 'bg-amber-50 text-amber-700', urgent: 'bg-red-50 text-red-700',
};

// ─── Health Assessment ──────────────────────────────────────────────
type HealthStatus = 'on-track' | 'at-risk' | 'delayed' | 'completed' | 'paused';

const healthConfig: Record<HealthStatus, { label: string; color: string; bg: string; dot: string; barColor: string }> = {
  'on-track': { label: 'On Track', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', barColor: 'from-emerald-500 to-emerald-400' },
  'at-risk': { label: 'At Risk', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', barColor: 'from-amber-500 to-amber-400' },
  'delayed': { label: 'Terlambat', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500', barColor: 'from-red-500 to-red-400' },
  'completed': { label: 'Selesai', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500', barColor: 'from-blue-500 to-blue-400' },
  'paused': { label: 'Ditunda', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400', barColor: 'from-gray-400 to-gray-300' },
};

function getProjectHealth(p: Project): HealthStatus {
  if (p.status === 'completed') return 'completed';
  if (p.status === 'on-hold') return 'paused';
  if (p.status === 'overdue') return 'delayed';
  const budgetUsed = p.budget > 0 ? (p.spent / p.budget) * 100 : 0;
  const expectedProgress = p.durationDays > 0
    ? Math.min(100, Math.max(0, ((p.durationDays - (p.startDay > 0 ? p.startDay : 0)) / p.durationDays) * 100))
    : 50;
  if (budgetUsed > 90 && p.progress < 80) return 'at-risk';
  if (p.progress < expectedProgress - 20) return 'at-risk';
  return 'on-track';
}

function getDaysToDeadline(endDate: string): { days: number; label: string; urgent: boolean } {
  // Simple parse from "DD Mon YYYY" format
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const parts = endDate.split(' ');
  if (parts.length < 3) return { days: 999, label: '-', urgent: false };
  const d = parseInt(parts[0]), m = months[parts[1]] ?? 0, y = parseInt(parts[2]);
  const end = new Date(y, m, d);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { days: diff, label: `${Math.abs(diff)}h terlambat`, urgent: true };
  if (diff === 0) return { days: 0, label: 'Hari ini', urgent: true };
  if (diff <= 7) return { days: diff, label: `${diff} hari lagi`, urgent: true };
  if (diff <= 30) return { days: diff, label: `${diff} hari lagi`, urgent: false };
  return { days: diff, label: `${Math.ceil(diff / 7)} minggu lagi`, urgent: false };
}

type ViewMode = 'grid' | 'kanban' | 'timeline' | 'list';

const viewModes: { id: ViewMode; label: string; icon: any }[] = [
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
  { id: 'kanban', label: 'Kanban', icon: Columns3 },
  { id: 'timeline', label: 'Gantt', icon: GanttChartSquare },
  { id: 'list', label: 'List', icon: List },
];

// ─── Main Component ──────────────────────────────────────────────
export function Projects() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewProject, setShowNewProject] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [projectList, setProjectList] = useState(projects);

  const filtered = projectList.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    let matchStatus = false;
    if (statusFilter === 'all') matchStatus = true;
    else if (statusFilter === 'due-soon') {
      if (p.status === 'completed' || p.status === 'on-hold') matchStatus = false;
      else { const dl = getDaysToDeadline(p.endDate); matchStatus = dl.days >= 0 && dl.days <= 14; }
    } else if (statusFilter === 'at-risk') {
      matchStatus = getProjectHealth(p) === 'at-risk';
    } else matchStatus = p.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    if (sortBy === 'progress') return b.progress - a.progress;
    if (sortBy === 'budget') return b.budget - a.budget;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'deadline') return getDaysToDeadline(a.endDate).days - getDaysToDeadline(b.endDate).days;
    return 0;
  });

  const dueSoonCount = projectList.filter(p => {
    if (p.status === 'completed' || p.status === 'on-hold') return false;
    const dl = getDaysToDeadline(p.endDate);
    return dl.days >= 0 && dl.days <= 14;
  }).length;

  const atRiskCount = projectList.filter(p => getProjectHealth(p) === 'at-risk').length;

  const stats = [
    { label: 'Semua', value: projectList.length, filter: 'all', color: 'text-brand-600', bg: 'bg-brand-50', icon: FolderKanban },
    { label: 'Berjalan', value: projectList.filter(p => p.status === 'active').length, filter: 'active', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: TrendingUp },
    { label: 'Segera', value: dueSoonCount, filter: 'due-soon', color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
    { label: 'Berisiko', value: atRiskCount, filter: 'at-risk', color: 'text-amber-600', bg: 'bg-amber-50', icon: Shield },
    { label: 'Selesai', value: projectList.filter(p => p.status === 'completed').length, filter: 'completed', color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle2 },
    { label: 'Tertunda', value: projectList.filter(p => p.status === 'on-hold').length, filter: 'on-hold', color: 'text-gray-600', bg: 'bg-gray-100', icon: Pause },
    { label: 'Terlambat', value: projectList.filter(p => p.status === 'overdue').length, filter: 'overdue', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
  ];

  const handleDrop = useCallback((projectId: string, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      active: 'In Progress', completed: 'Completed', 'on-hold': 'On Hold', overdue: 'Overdue'
    };
    setProjectList(prev => prev.map(p =>
      p.id === projectId ? { ...p, status: newStatus, statusLabel: statusLabels[newStatus] || newStatus } : p
    ));
  }, []);

  return (
    <div className="min-h-full pb-4">
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-2">
        <div className="flex items-center justify-between gap-3 animate-fade-in-up">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 flex-shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 truncate">Projects</h1>
              <p className="text-gray-500 text-xs hidden sm:block">Kelola dan pantau semua project Anda</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-brand-700 to-brand-500 text-white px-4 py-2.5 rounded-2xl text-sm font-bold hover:shadow-xl hover:shadow-brand-500/25 transition-all active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 md:px-6 py-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar animate-fade-in-up stagger-1">
          {stats.map(s => (
            <button key={s.filter} onClick={() => setStatusFilter(s.filter)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all active:scale-95 flex-shrink-0",
                statusFilter === s.filter
                  ? "bg-white border-brand-200 shadow-sm ring-1 ring-brand-100 text-gray-900"
                  : "bg-white/50 border-gray-100 text-gray-500 hover:bg-white"
              )}
            >
              <s.icon className={cn("w-4 h-4", s.color)} />
              <span className={cn("font-extrabold", s.color)}>{s.value}</span>
              <span className="text-xs">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search + View Toggle */}
      <div className="px-4 md:px-6 py-2 animate-fade-in-up stagger-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..." className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
          <div className="flex bg-white border border-gray-200 rounded-xl p-0.5">
            {viewModes.map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)} title={v.label}
                className={cn("p-2 rounded-lg transition-all", viewMode === v.id ? "bg-brand-50 text-brand-600 shadow-sm" : "text-gray-400 hover:text-gray-600")}>
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("p-2.5 rounded-xl border transition-all",
              showFilters ? "bg-brand-50 border-brand-200 text-brand-600" : "bg-white border-gray-200 text-gray-400 hover:text-gray-600"
            )}>
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-2 animate-fade-in-up">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
              <option value="recent">Urut: Terbaru</option>
              <option value="name">Urut: Nama</option>
              <option value="progress">Urut: Progress</option>
              <option value="budget">Urut: Budget</option>
              <option value="deadline">Urut: Deadline</option>
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] text-gray-400 font-medium">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''} ditampilkan
            {statusFilter !== 'all' && <span className="text-brand-500 ml-1">· {stats.find(s => s.filter === statusFilter)?.label}</span>}
            {searchQuery && <span className="text-brand-500 ml-1">· "{searchQuery}"</span>}
          </p>
          {filtered.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />On Track</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />At Risk</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Delayed</span>
            </div>
          )}
        </div>
        {viewMode === 'grid' && <GridView projects={filtered} navigate={navigate} />}
        {viewMode === 'kanban' && <KanbanView projects={filtered} navigate={navigate} onDrop={handleDrop} />}
        {viewMode === 'timeline' && <GanttView projects={filtered} />}
        {viewMode === 'list' && <ListView projects={filtered} navigate={navigate} />}
      </div>

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onSuccess={(projectId) => {
        setShowNewProject(false);
        navigate(`/projects/${projectId}`);
      }} />}
    </div>
  );
}

// ─── Gallery Thumbnail ──────────────────────────────────────────────
function GalleryThumb({ gallery, size = 'md' }: { gallery: string[]; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-11 h-11 text-lg';
  return (
    <div className={cn("rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border border-brand-100 flex items-center justify-center flex-shrink-0 relative", s)}>
      <span>{gallery[0]}</span>
      {gallery.length > 1 && (
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white border border-gray-200 rounded-md flex items-center justify-center">
          <Camera className="w-2.5 h-2.5 text-gray-400" />
        </span>
      )}
    </div>
  );
}

// ─── GRID VIEW ──────────────────────────────────────────────
function GridView({ projects, navigate }: { projects: Project[]; navigate: any }) {
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden space-y-1.5">
        {projects.map((p, idx) => {
          const health = getProjectHealth(p);
          const hc = healthConfig[health];
          const dl = getDaysToDeadline(p.endDate);
          return (
            <button key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
              className={cn("w-full flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-gray-100 active:scale-[0.98] transition-all text-left animate-fade-in-up", `stagger-${Math.min(idx + 1, 8)}`)}>
              <div className="relative flex-shrink-0">
                <GalleryThumb gallery={p.gallery} size="sm" />
                <span className={cn("absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white", hc.dot)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900 truncate">{p.name}</span>
                  {p.priority === 'urgent' && <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1 rounded flex-shrink-0">!</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-gray-400 truncate">{p.client}</span>
                  <span className="text-[10px] text-gray-300">·</span>
                  {p.status !== 'completed' && (
                    <span className={cn("text-[10px] font-medium", dl.urgent ? 'text-red-500' : 'text-gray-400')}>{dl.label}</span>
                  )}
                  {p.status === 'completed' && <span className="text-[10px] text-blue-500 font-medium">Selesai</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-9 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full bg-gradient-to-r", hc.barColor)} style={{ width: `${p.progress}%` }} />
                </div>
                <span className={cn("text-[10px] font-extrabold w-7 text-right", hc.color)}>{p.progress}%</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Desktop Cards */}
      <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project, idx) => {
          const health = getProjectHealth(project);
          const hc = healthConfig[health];
          const dl = getDaysToDeadline(project.endDate);
          const budgetPct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
          return (
            <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)}
              className={cn("bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer group card-hover animate-fade-in-up", `stagger-${Math.min(idx + 1, 8)}`)}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <GalleryThumb gallery={project.gallery} />
                    <span className={cn("absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white", hc.dot)} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-gray-400">{project.id}</span>
                      <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md", priorityStyles[project.priority])}>{project.priority}</span>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md", hc.bg, hc.color)}>{hc.label}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-brand-700 transition-colors truncate">{project.name}</h3>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Client + Deadline */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex items-center gap-1 truncate"><Users className="w-3 h-3" /> {project.client}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {project.location}</span>
                </div>
                {project.status !== 'completed' && (
                  <span className={cn("flex items-center gap-1 flex-shrink-0 font-semibold", dl.urgent ? 'text-red-500' : 'text-gray-400')}>
                    <CalendarDays className="w-3 h-3" /> {dl.label}
                  </span>
                )}
              </div>

              {/* Progress bar — health colored */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full bg-gradient-to-r transition-all", hc.barColor)} style={{ width: `${project.progress}%` }} />
                </div>
                <span className={cn("text-xs font-extrabold", hc.color)}>{project.progress}%</span>
              </div>

              {/* Stats row: Tasks + Budget usage + Milestones */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span className="font-bold">{project.tasksDone}/{project.tasksTotal}</span>
                  <span className="text-gray-400">task</span>
                </div>
                <div className={cn("flex-1 flex items-center gap-1 text-[10px] rounded-lg px-2 py-1.5",
                  budgetPct > 90 ? 'bg-red-50 text-red-600' : budgetPct > 75 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500')}>
                  <DollarSign className="w-3 h-3" />
                  <span className="font-bold">{budgetPct}%</span>
                  <span className="text-gray-400">budget</span>
                </div>
                <div className="flex-1 flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5">
                  <span className="font-bold">{project.milestonesDone}/{project.milestones}</span>
                  <span className="text-gray-400">milestone</span>
                </div>
              </div>

              {/* Footer: Team + Action */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {project.team.slice(0, 4).map((m, i) => (
                    <div key={i} className={cn("w-6 h-6 rounded-lg border-2 border-white flex items-center justify-center text-[8px] font-bold text-white", m.color)}>{m.name.slice(0, 2)}</div>
                  ))}
                  {project.team.length > 4 && <div className="w-6 h-6 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">+{project.team.length - 4}</div>}
                </div>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Detail <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── KANBAN VIEW ──────────────────────────────────────────────
function KanbanView({ projects, navigate, onDrop }: { projects: Project[]; navigate: any; onDrop: (id: string, status: string) => void }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const counterRef = useRef<Record<string, number>>({});

  const columns = [
    { id: 'active', title: 'In Progress', color: 'bg-brand-500', projects: projects.filter(p => p.status === 'active') },
    { id: 'on-hold', title: 'On Hold', color: 'bg-amber-500', projects: projects.filter(p => p.status === 'on-hold') },
    { id: 'overdue', title: 'Overdue', color: 'bg-red-500', projects: projects.filter(p => p.status === 'overdue') },
    { id: 'completed', title: 'Completed', color: 'bg-blue-500', projects: projects.filter(p => p.status === 'completed') },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4" style={{ minHeight: 400 }}>
      {columns.map(col => (
        <div key={col.id}
          onDragOver={(e) => { e.preventDefault(); }}
          onDragEnter={(e) => {
            e.preventDefault();
            counterRef.current[col.id] = (counterRef.current[col.id] || 0) + 1;
            setOverCol(col.id);
          }}
          onDragLeave={() => {
            counterRef.current[col.id] = (counterRef.current[col.id] || 1) - 1;
            if (counterRef.current[col.id] <= 0) { counterRef.current[col.id] = 0; setOverCol(ov => ov === col.id ? null : ov); }
          }}
          onDrop={(e) => {
            e.preventDefault();
            counterRef.current[col.id] = 0;
            setOverCol(null);
            if (dragId) { onDrop(dragId, col.id); setDragId(null); }
          }}
          className={cn(
            "flex-shrink-0 w-[280px] md:flex-1 md:min-w-[240px] bg-gray-50/50 rounded-2xl border transition-all",
            overCol === col.id && dragId ? "border-brand-300 bg-brand-50/30 ring-2 ring-brand-200" : "border-gray-100"
          )}>
          <div className="px-3 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", col.color)} />
              <span className="text-xs font-bold text-gray-700">{col.title}</span>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{col.projects.length}</span>
            </div>
          </div>
          <div className="px-2 pb-2 space-y-2 min-h-[100px]">
            {col.projects.map(p => {
              const health = getProjectHealth(p);
              const hc = healthConfig[health];
              const dl = getDaysToDeadline(p.endDate);
              return (
                <div key={p.id} draggable
                  onDragStart={() => setDragId(p.id)}
                  onDragEnd={() => { setDragId(null); setOverCol(null); counterRef.current = {}; }}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className={cn(
                    "bg-white rounded-xl border border-gray-100 p-3 cursor-pointer group hover:shadow-md transition-all",
                    dragId === p.id && "opacity-50 scale-95"
                  )}>
                  <div className="flex items-center gap-2 mb-2">
                    <GripVertical className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" />
                    <div className="relative">
                      <GalleryThumb gallery={p.gallery} size="sm" />
                      <span className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white", hc.dot)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{p.client}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full bg-gradient-to-r", hc.barColor)} style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className={cn("text-[10px] font-extrabold", hc.color)}>{p.progress}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1">
                      {p.team.slice(0, 3).map((m, i) => (
                        <div key={i} className={cn("w-5 h-5 rounded-md border border-white flex items-center justify-center text-[8px] font-bold text-white", m.color)}>{m.name.slice(0, 1)}</div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {p.status !== 'completed' && (
                        <span className={cn("text-[9px] font-medium", dl.urgent ? 'text-red-500' : 'text-gray-400')}>{dl.label}</span>
                      )}
                      <span className="text-[10px] text-gray-400 font-semibold">{formatCurrency(p.budget)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {col.projects.length === 0 && (
              <div className={cn("flex flex-col items-center justify-center py-8 text-gray-300 border-2 border-dashed rounded-xl transition-all",
                overCol === col.id && dragId ? "border-brand-300 bg-brand-50/50" : "border-gray-200"
              )}>
                <FolderKanban className="w-6 h-6 mb-1" />
                <span className="text-xs">Drop here</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── INTERACTIVE GANTT VIEW ──────────────────────────────────────
// Full drag-to-move & resize with date tooltip
const GANTT_TOTAL_DAYS = 270; // ~9 months (Nov 2024 - Jul 2025)
const GANTT_START_OFFSET = -60; // starts from Nov 1 2024
const GANTT_MONTHS = [
  { label: 'Nov', days: 30 }, { label: 'Dec', days: 31 },
  { label: 'Jan', days: 31 }, { label: 'Feb', days: 28 },
  { label: 'Mar', days: 31 }, { label: 'Apr', days: 30 },
  { label: 'May', days: 31 }, { label: 'Jun', days: 30 },
  { label: 'Jul', days: 31 },
];

function dayToDate(day: number): string {
  const base = new Date(2024, 10, 1); // Nov 1 2024
  const d = new Date(base);
  d.setDate(d.getDate() + (day - GANTT_START_OFFSET));
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
}

function dayToPercent(day: number): number {
  return ((day - GANTT_START_OFFSET) / GANTT_TOTAL_DAYS) * 100;
}

// percentToDay helper: Math.round((pct / 100) * GANTT_TOTAL_DAYS + GANTT_START_OFFSET)

function GanttBar({ startDay, duration, status, label, progress, onUpdate }: {
  startDay: number; duration: number; status: string; label: string;
  progress: number; onUpdate?: (newStart: number, newDuration: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number } | null>(null);
  const dragState = useRef<{
    type: 'move' | 'resize-left' | 'resize-right';
    startX: number; origStart: number; origDur: number;
  } | null>(null);

  const left = dayToPercent(startDay);
  const width = (duration / GANTT_TOTAL_DAYS) * 100;

  const barColor = status === 'done' ? 'bg-blue-400' :
    status === 'in-progress' ? 'bg-gradient-to-r from-brand-600 to-brand-400' :
    status === 'overdue' ? 'bg-red-400' :
    status === 'on-hold' ? 'bg-amber-400' : 'bg-gray-300';

  const handlePointerDown = (e: React.PointerEvent, type: 'move' | 'resize-left' | 'resize-right') => {
    if (!onUpdate) return;
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    containerRef.current = barRef.current?.closest('.gantt-track') as HTMLDivElement;
    dragState.current = { type, startX: e.clientX, origStart: startDay, origDur: duration };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current || !containerRef.current || !onUpdate) return;
    const { type, startX, origStart, origDur } = dragState.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const dx = e.clientX - startX;
    const dxPct = (dx / rect.width) * 100;
    const dDays = Math.round((dxPct / 100) * GANTT_TOTAL_DAYS);

    if (type === 'move') {
      const ns = origStart + dDays;
      onUpdate(ns, origDur);
      setTooltip({ text: `${dayToDate(ns)} → ${dayToDate(ns + origDur)}`, x: e.clientX - rect.left });
    } else if (type === 'resize-right') {
      const nd = Math.max(3, origDur + dDays);
      onUpdate(origStart, nd);
      setTooltip({ text: `${nd} days → ${dayToDate(origStart + nd)}`, x: e.clientX - rect.left });
    } else if (type === 'resize-left') {
      const ns = origStart + dDays;
      const nd = Math.max(3, origDur - dDays);
      onUpdate(ns, nd);
      setTooltip({ text: `${dayToDate(ns)} → ${nd} days`, x: e.clientX - rect.left });
    }
  };

  const handlePointerUp = () => {
    dragState.current = null;
    setTooltip(null);
  };

  return (
    <div ref={barRef} className="absolute top-1/2 -translate-y-1/2 group/bar" style={{ left: `${Math.max(0, left)}%`, width: `${Math.max(1, width)}%` }}>
      {/* Tooltip */}
      {tooltip && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-30 pointer-events-none animate-fade-in"
          style={{ left: `${Math.min(90, Math.max(10, (tooltip.x / (barRef.current?.parentElement?.clientWidth || 1)) * 100))}%` }}>
          {tooltip.text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}

      {/* Left resize handle */}
      {onUpdate && (
        <div className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-20 group-hover/bar:bg-white/30 rounded-l-lg transition-colors"
          onPointerDown={(e) => handlePointerDown(e, 'resize-left')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp} />
      )}

      {/* Bar body */}
      <div className={cn(
        "h-7 rounded-lg flex items-center px-2 overflow-hidden transition-shadow cursor-grab active:cursor-grabbing select-none",
        barColor,
        onUpdate && "hover:shadow-lg hover:ring-2 hover:ring-white/50"
      )}
        onPointerDown={(e) => handlePointerDown(e, 'move')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}>
        {progress > 0 && <div className="absolute inset-y-0 left-0 bg-white/20 rounded-l-lg" style={{ width: `${progress}%` }} />}
        <span className="text-[10px] font-bold text-white relative z-10 truncate">{label}</span>
      </div>

      {/* Right resize handle */}
      {onUpdate && (
        <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-20 group-hover/bar:bg-white/30 rounded-r-lg transition-colors"
          onPointerDown={(e) => handlePointerDown(e, 'resize-right')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp} />
      )}
    </div>
  );
}

function GanttView({ projects: initialProjects }: { projects: Project[] }) {
  const navigate = useNavigate();
  const [projectsState, setProjectsState] = useState(initialProjects);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { setProjectsState(initialProjects); }, [initialProjects]);

  const todayPct = dayToPercent(75); // ~Mar 15 2025

  const updateProject = useCallback((projectId: string, newStart: number, newDur: number) => {
    setProjectsState(prev => prev.map(p =>
      p.id === projectId ? { ...p, startDay: newStart, durationDays: newDur } : p
    ));
  }, []);

  const updateTask = useCallback((projectId: string, taskId: string, newStart: number, newDur: number) => {
    setProjectsState(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, startDay: newStart, duration: newDur } : t) }
        : p
    ));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-fade-in-up">
      {/* Mobile */}
      <div className="md:hidden">
        {projectsState.map((p, idx) => {
          const isExpanded = expandedId === p.id;
          return (
            <div key={p.id} className={cn("border-b border-gray-50 animate-fade-in-up", `stagger-${Math.min(idx + 1, 8)}`)}>
              <button onClick={() => setExpandedId(isExpanded ? null : p.id)}
                className="w-full text-left px-4 py-3 active:bg-gray-50 transition-all">
                <div className="flex items-center gap-2 mb-1.5">
                  <GalleryThumb gallery={p.gallery} size="sm" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-gray-900 truncate block">{p.name}</span>
                    <span className="text-[11px] text-gray-400">{p.startDate} → {p.endDate}</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isExpanded && "rotate-180")} />
                </div>
                <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden gantt-track">
                  <GanttBar startDay={p.startDay} duration={p.durationDays} status={p.status}
                    label={`${p.progress}%`} progress={p.progress} />
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-3 space-y-1.5 animate-fade-in-up">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tasks — drag to reschedule</p>
                  {p.tasks.map(t => (
                    <div key={t.id} className="relative h-6 bg-gray-50 rounded-lg overflow-hidden gantt-track">
                      <GanttBar startDay={t.startDay} duration={t.duration} status={t.status}
                        label={t.name} progress={t.status === 'done' ? 100 : t.status === 'in-progress' ? 50 : 0}
                        onUpdate={(ns, nd) => updateTask(p.id, t.id, ns, nd)} />
                    </div>
                  ))}
                  <button onClick={() => navigate(`/projects/${p.id}`)}
                    className="text-[11px] text-brand-600 font-semibold flex items-center gap-1 mt-1 hover:underline">
                    Open project detail <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop full Gantt */}
      <div className="hidden md:block">
        {/* Month headers */}
        <div className="flex border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="w-[280px] flex-shrink-0 px-4 py-3 border-r border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase">Project</span>
          </div>
          <div className="flex-1 flex">
            {GANTT_MONTHS.map((m, i) => (
              <div key={i} style={{ width: `${(m.days / GANTT_TOTAL_DAYS) * 100}%` }}
                className="text-center py-3 text-xs font-bold border-r border-gray-50 text-gray-500">
                {m.label}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {projectsState.map((p, idx) => {
          const isExpanded = expandedId === p.id;
          return (
            <div key={p.id} className={cn("animate-fade-in-up", `stagger-${Math.min(idx + 1, 8)}`)}>
              {/* Project row */}
              <div className={cn("flex border-b border-gray-50 hover:bg-gray-50/50 transition-colors",
                isExpanded && "bg-brand-50/30")}>
                <div className="w-[280px] flex-shrink-0 px-4 py-3 border-r border-gray-100 flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0", isExpanded && "rotate-180")} />
                  <GalleryThumb gallery={p.gallery} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{p.client}</p>
                  </div>
                  <span className="text-[11px] font-extrabold text-gray-500 flex-shrink-0">{p.progress}%</span>
                </div>
                <div className="flex-1 relative py-3 px-1 gantt-track">
                  {/* Grid */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {GANTT_MONTHS.map((m, i) => <div key={i} style={{ width: `${(m.days / GANTT_TOTAL_DAYS) * 100}%` }} className="border-r border-gray-50" />)}
                  </div>
                  {/* Today */}
                  <div className="absolute top-0 bottom-0 w-px bg-red-300 z-10 pointer-events-none" style={{ left: `${todayPct}%` }}>
                    {idx === 0 && <span className="absolute -top-0.5 left-1 text-[8px] font-bold text-red-400 bg-white px-1 rounded">TODAY</span>}
                  </div>
                  {/* Bar */}
                  <GanttBar startDay={p.startDay} duration={p.durationDays} status={p.status}
                    label={p.name} progress={p.progress}
                    onUpdate={(ns, nd) => updateProject(p.id, ns, nd)} />
                </div>
              </div>

              {/* Expanded tasks */}
              {isExpanded && (
                <div className="border-b border-gray-200 bg-gray-50/30">
                  {p.tasks.map(t => (
                    <div key={t.id} className="flex hover:bg-white/50 transition-colors">
                      <div className="w-[280px] flex-shrink-0 px-4 py-2 border-r border-gray-100 flex items-center gap-3 pl-14">
                        <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
                          t.status === 'done' ? 'bg-blue-500' : t.status === 'in-progress' ? 'bg-brand-500' : 'bg-gray-300')} />
                        <span className="text-xs text-gray-600 truncate">{t.name}</span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{t.duration}d</span>
                      </div>
                      <div className="flex-1 relative py-2 px-1 gantt-track">
                        <div className="absolute inset-0 flex pointer-events-none">
                          {GANTT_MONTHS.map((m, i) => <div key={i} style={{ width: `${(m.days / GANTT_TOTAL_DAYS) * 100}%` }} className="border-r border-gray-50/50" />)}
                        </div>
                        <div className="absolute top-0 bottom-0 w-px bg-red-200 z-10 pointer-events-none" style={{ left: `${todayPct}%` }} />
                        <GanttBar startDay={t.startDay} duration={t.duration} status={t.status}
                          label={t.name}
                          progress={t.status === 'done' ? 100 : t.status === 'in-progress' ? 50 : 0}
                          onUpdate={(ns, nd) => updateTask(p.id, t.id, ns, nd)} />
                      </div>
                    </div>
                  ))}
                  <div className="flex px-4 py-2 pl-14">
                    <button onClick={() => navigate(`/projects/${p.id}`)}
                      className="text-[11px] text-brand-600 font-semibold flex items-center gap-1 hover:underline">
                      Open full project <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Legend */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4 flex-wrap">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Legend:</span>
          {[{ label: 'Done', c: 'bg-blue-400' }, { label: 'In Progress', c: 'bg-brand-500' }, { label: 'Upcoming', c: 'bg-gray-300' }, { label: 'Overdue', c: 'bg-red-400' }].map(l => (
            <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className={cn("w-3 h-1.5 rounded-full", l.c)} /> {l.label}
            </span>
          ))}
          <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-1">
            <GripVertical className="w-3 h-3" /> Drag to move • Edge to resize
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── LIST VIEW ──────────────────────────────────────────────
function ListView({ projects, navigate }: { projects: Project[]; navigate: any }) {
  return (
    <>
      <div className="md:hidden space-y-1.5">
        {projects.map((p, idx) => {
          const health = getProjectHealth(p);
          const hc = healthConfig[health];
          const dl = getDaysToDeadline(p.endDate);
          return (
            <button key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
              className={cn("w-full flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-gray-100 active:scale-[0.98] transition-all text-left animate-fade-in-up", `stagger-${Math.min(idx + 1, 8)}`)}>
              <div className="relative flex-shrink-0">
                <GalleryThumb gallery={p.gallery} size="sm" />
                <span className={cn("absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white", hc.dot)} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-gray-900 truncate block">{p.name}</span>
                <span className="text-[10px] text-gray-400">
                  {p.client} · {formatCurrency(p.budget)}
                  {p.status !== 'completed' && <span className={cn("ml-1", dl.urgent ? 'text-red-500 font-medium' : '')}> · {dl.label}</span>}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full bg-gradient-to-r", hc.barColor)} style={{ width: `${p.progress}%` }} />
                </div>
                <span className={cn("text-[10px] font-extrabold w-7 text-right", hc.color)}>{p.progress}%</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Project</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold text-gray-400 uppercase">Client</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold text-gray-400 uppercase">Health</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold text-gray-400 uppercase">Progress</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold text-gray-400 uppercase">Budget</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold text-gray-400 uppercase">Team</th>
                <th className="text-left px-3 py-3 text-[11px] font-bold text-gray-400 uppercase">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const health = getProjectHealth(p);
                const hc = healthConfig[health];
                const dl = getDaysToDeadline(p.endDate);
                const budgetPct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
                return (
                  <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer group transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <GalleryThumb gallery={p.gallery} size="sm" />
                          <span className={cn("absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white", hc.dot)} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block">{p.id}</span>
                          <span className="text-sm font-bold text-gray-900 group-hover:text-brand-700 transition-colors">{p.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{p.client}</td>
                    <td className="px-3 py-3">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1", hc.bg, hc.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", hc.dot)} />
                        {hc.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 w-28">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full bg-gradient-to-r", hc.barColor)} style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className={cn("text-[10px] font-bold", hc.color)}>{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-semibold text-gray-700">{formatCurrency(p.budget)}</div>
                      <div className={cn("text-[9px] font-medium", budgetPct > 90 ? 'text-red-500' : budgetPct > 75 ? 'text-amber-500' : 'text-gray-400')}>
                        {budgetPct}% terpakai
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex -space-x-1.5">
                        {p.team.slice(0, 3).map((m, i) => (
                          <div key={i} className={cn("w-5 h-5 rounded-md border border-white flex items-center justify-center text-[8px] font-bold text-white", m.color)}>{m.name.slice(0, 2)}</div>
                        ))}
                        {p.team.length > 3 && <div className="w-5 h-5 rounded-md border border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">+{p.team.length - 3}</div>}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-500">{p.endDate}</div>
                      {p.status !== 'completed' && (
                        <div className={cn("text-[9px] font-semibold", dl.urgent ? 'text-red-500' : 'text-gray-400')}>{dl.label}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── NEW PROJECT MODAL ──────────────────────────────────────────────
function NewProjectModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (projectId: string) => void }) {
  const { customers, employees, users, addProject, addCustomer } = useData();
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    clientId: '',
    category: 'Renovation',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    location: '',
    description: '',
  });
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Inline add client
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', company: '' });
  
  // Categories
  const categories = ['Renovation', 'Construction', 'Interior', 'Landscape', 'Kitchen Set', 'Furniture', 'Commercial', 'Maintenance'];
  
  // Active employees with names from users
  const activeEmployees = employees
    .filter(e => e.status === 'Active')
    .map(e => {
      const user = users.find(u => u.id === e.userId);
      return { ...e, name: user?.name || 'Unknown' };
    });
  
  // Validation
  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!form.name.trim()) errs.name = 'Nama project wajib diisi';
    if (!form.clientId) errs.clientId = 'Pilih client';
    if (!form.startDate) errs.startDate = 'Tanggal mulai wajib diisi';
    if (!form.endDate) errs.endDate = 'Tanggal selesai wajib diisi';
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      errs.endDate = 'Tanggal selesai harus setelah tanggal mulai';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  
  // Handle add new client inline
  const handleAddClient = () => {
    if (!newClient.name.trim()) return;
    const newCustomer = addCustomer({
      name: newClient.name,
      phone: newClient.phone,
      email: newClient.email,
      company: newClient.company,
      address: '',
      status: 'Active',
      starred: false,
      tags: [],
      pipelineStage: 'new-lead',
    });
    setForm(f => ({ ...f, clientId: newCustomer.id }));
    setNewClient({ name: '', phone: '', email: '', company: '' });
    setShowAddClient(false);
  };
  
  // Toggle team member
  const toggleTeamMember = (empId: string) => {
    setSelectedTeam(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };
  
  // Handle submit
  const handleSubmit = () => {
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    // Simulate slight delay for UX
    setTimeout(() => {
      try {
        // Format dates for display
        const formatDate = (dateStr: string) => {
          const d = new Date(dateStr);
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        };
        
        // Get client name
        const client = customers.find(c => c.id === form.clientId);
        
        // Build team array (Project.team is string[])
        const team = selectedTeam.map(empId => {
          const emp = activeEmployees.find(e => e.id === empId);
          return emp?.name?.substring(0, 3) || empId;
        });
        
        // Parse budget
        const budget = parseInt(form.budget.replace(/[^0-9]/g, '')) || 0;
        
        // Create project
        const newProject = addProject({
          name: form.name,
          customerId: form.clientId,
          status: 'Active',
          priority: form.priority as 'Low' | 'Medium' | 'High' | 'Urgent',
          progress: 0,
          startDate: formatDate(form.startDate),
          endDate: formatDate(form.endDate),
          budget,
          spent: 0,
          description: form.description || `Project ${form.category} untuk ${client?.name || 'Client'}`,
          team,
          category: form.category,
          location: form.location,
        });
        
        setIsSubmitting(false);
        setSubmitStatus('success');
        
        // Wait a bit then close and navigate
        setTimeout(() => {
          onSuccess(newProject.id);
        }, 1200);
        
      } catch (err) {
        console.error('Error creating project:', err);
        setIsSubmitting(false);
        setSubmitStatus('error');
      }
    }, 500);
  };
  
  // Success state
  if (submitStatus === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-white rounded-3xl shadow-2xl p-8 text-center animate-scale-in max-w-sm mx-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Project Berhasil Dibuat!</h3>
          <p className="text-sm text-gray-500">Mengalihkan ke halaman project...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto animate-fade-in-up">
        {/* Header */}
        <div className="sticky top-0 bg-white md:rounded-t-3xl rounded-t-3xl border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center text-white">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">New Project</h2>
              <p className="text-[11px] text-gray-500">Buat workspace project baru</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Project Name */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Nama Project *</label>
            <input 
              type="text" 
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Renovasi Rumah Pak Budi" 
              className={cn(
                "w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:bg-white transition-all",
                errors.name ? "border-red-300 bg-red-50/50" : "border-gray-200"
              )}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          
          {/* Client & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Client *</label>
              <select 
                value={form.clientId}
                onChange={e => {
                  if (e.target.value === '__add__') {
                    setShowAddClient(true);
                  } else {
                    setForm(f => ({ ...f, clientId: e.target.value }));
                  }
                }}
                className={cn(
                  "w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all",
                  errors.clientId ? "border-red-300 bg-red-50/50" : "border-gray-200"
                )}
              >
                <option value="">Pilih client...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                ))}
                <option value="__add__">➕ Tambah Client Baru...</option>
              </select>
              {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId}</p>}
              
              {/* Inline Add Client */}
              {showAddClient && (
                <div className="mt-2 p-3 bg-brand-50 border border-brand-200 rounded-xl space-y-2 animate-fade-in">
                  <p className="text-xs font-semibold text-brand-700 flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> Tambah Client Baru
                  </p>
                  <input
                    type="text"
                    placeholder="Nama client *"
                    value={newClient.name}
                    onChange={e => setNewClient(c => ({ ...c, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-brand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                  />
                  <input
                    type="text"
                    placeholder="No. HP / WhatsApp"
                    value={newClient.phone}
                    onChange={e => setNewClient(c => ({ ...c, phone: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-brand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAddClient(false)}
                      className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleAddClient}
                      disabled={!newClient.name.trim()}
                      className="flex-1 px-3 py-2 text-xs font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Kategori</label>
              <select 
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          
          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Tanggal Mulai *</label>
              <input 
                type="date" 
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className={cn(
                  "w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all",
                  errors.startDate ? "border-red-300" : "border-gray-200"
                )}
              />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Tanggal Selesai *</label>
              <input 
                type="date" 
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className={cn(
                  "w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all",
                  errors.endDate ? "border-red-300" : "border-gray-200"
                )}
              />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>
          
          {/* Budget & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Budget</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
                <input 
                  type="text" 
                  value={form.budget}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    const formatted = val ? parseInt(val).toLocaleString('id-ID') : '';
                    setForm(f => ({ ...f, budget: formatted }));
                  }}
                  placeholder="150.000.000" 
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all" 
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Prioritas</label>
              <select 
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as typeof form.priority }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          {/* Location */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Lokasi</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Jakarta Selatan" 
                className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all" 
              />
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Deskripsi</label>
            <textarea 
              rows={2} 
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Jelaskan scope pekerjaan project..." 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none transition-all" 
            />
          </div>
          
          {/* Team - From Employee Data */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              Tim Project 
              <span className="text-xs font-normal text-gray-400 ml-1">({selectedTeam.length} dipilih)</span>
            </label>
            {activeEmployees.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Belum ada karyawan aktif</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeEmployees.map(emp => {
                  const isSelected = selectedTeam.includes(emp.id);
                  const initials = emp.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleTeamMember(emp.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 border rounded-xl text-sm transition-all",
                        isSelected 
                          ? "bg-brand-50 border-brand-400 text-brand-700" 
                          : "border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                        isSelected ? "bg-gradient-to-br from-brand-600 to-brand-400" : "bg-gray-300"
                      )}>
                        {initials}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-xs leading-tight">{emp.name}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">{emp.position}</p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-brand-600 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            * Wajib diisi
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-brand-700 to-brand-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-brand-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Membuat...
                </>
              ) : (
                'Buat Project'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
