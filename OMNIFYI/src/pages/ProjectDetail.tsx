import { useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, MoreHorizontal, Calendar, MessageSquare,
  CheckSquare, Search, LayoutGrid, List, Clock, Users, MapPin,
  ChevronRight, Flag, Target, Trash2,
  DollarSign, X, Activity, BarChart3, GanttChartSquare,
  Timer, Send, GripVertical, Image, Upload, ChevronLeft,
  CheckCircle2, AlertCircle, TrendingUp, TrendingDown,
  Wallet, PieChart, ArrowUpRight, ArrowDownRight, FileText, ExternalLink,
  Receipt, Edit3, Archive, RotateCcw, AlertTriangle, Save, Loader2, Download,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useData, type Task as TaskType, type Milestone, type BudgetCategory, type ProjectFinancialReport, type ProjectBudgetLine, type Project } from '../store/dataStore';

const formatCurrency = (val: number) => {
  if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)}B`;
  if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(0)}jt`;
  if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}rb`;
  return `Rp ${val.toLocaleString('id-ID')}`;
};
const formatFull = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

// Health & Deadline helpers
type HealthStatus = 'on-track' | 'at-risk' | 'delayed' | 'completed' | 'paused';
const healthMeta: Record<HealthStatus, { label: string; color: string; dot: string; bg: string }> = {
  'on-track': { label: 'On Track', color: 'text-emerald-700', dot: 'bg-emerald-500', bg: 'bg-emerald-50' },
  'at-risk': { label: 'At Risk', color: 'text-amber-700', dot: 'bg-amber-500', bg: 'bg-amber-50' },
  'delayed': { label: 'Terlambat', color: 'text-red-700', dot: 'bg-red-500', bg: 'bg-red-50' },
  'completed': { label: 'Selesai', color: 'text-emerald-700', dot: 'bg-emerald-500', bg: 'bg-emerald-50' },
  'paused': { label: 'Tertunda', color: 'text-gray-600', dot: 'bg-gray-400', bg: 'bg-gray-50' },
};

function getHealth(project: any): HealthStatus {
  if (project.status === 'Completed') return 'completed';
  if (project.status === 'On Hold') return 'paused';
  if (project.status === 'Overdue') return 'delayed';
  const budgetPct = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
  if (budgetPct > 90 && project.progress < 80) return 'at-risk';
  if (project.progress < 30 && budgetPct > 50) return 'at-risk';
  return 'on-track';
}

function getDeadlineInfo(endDate: string) {
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const parts = endDate.split(' ');
  if (parts.length < 3) return { days: 30, label: endDate, urgent: false };
  const d = new Date(parseInt(parts[2]), months[parts[1]] ?? 0, parseInt(parts[0]));
  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { days: diff, label: `${Math.abs(diff)} hari terlambat`, urgent: true };
  if (diff === 0) return { days: 0, label: 'Hari ini', urgent: true };
  if (diff <= 7) return { days: diff, label: `${diff} hari lagi`, urgent: true };
  if (diff <= 30) return { days: diff, label: `${diff} hari lagi`, urgent: false };
  return { days: diff, label: `${Math.floor(diff / 7)} minggu lagi`, urgent: false };
}

type ViewTab = 'overview' | 'kanban' | 'milestones' | 'gantt' | 'budget' | 'gallery';

const kanbanCols = [
  { id: 'Backlog', title: 'Backlog', color: 'bg-gray-400' },
  { id: 'To Do', title: 'To Do', color: 'bg-blue-500' },
  { id: 'In Progress', title: 'In Progress', color: 'bg-brand-500' },
  { id: 'Review', title: 'Review', color: 'bg-amber-500' },
  { id: 'Done', title: 'Done', color: 'bg-emerald-500' },
];

const statusBadge: Record<string, { dot: string; bg: string; text: string }> = {
  Backlog: { dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600' },
  'To Do': { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  'In Progress': { dot: 'bg-brand-500', bg: 'bg-brand-50', text: 'text-brand-700' },
  Review: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  Done: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

const priorityBadge: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-600', Medium: 'bg-blue-50 text-blue-700',
  High: 'bg-amber-50 text-amber-700', Urgent: 'bg-red-50 text-red-700',
};

// ===== UNIFIED PROGRESS BAR STYLING SYSTEM =====
type ProgressContext = 'project' | 'milestone' | 'task' | 'budget';
type ProgressStatus = 'healthy' | 'warning' | 'danger' | 'completed' | 'neutral';

function getProgressStatus(
  progress: number,
  context: ProgressContext,
  options?: {
    health?: HealthStatus;
    budgetUsed?: number;
    isOverdue?: boolean;
    isCompleted?: boolean;
  }
): ProgressStatus {
  // If explicitly completed
  if (options?.isCompleted || progress >= 100) return 'completed';
  
  // If explicitly overdue
  if (options?.isOverdue) return 'danger';
  
  // Project-level uses health status
  if (context === 'project' && options?.health) {
    if (options.health === 'delayed') return 'danger';
    if (options.health === 'at-risk') return 'warning';
    if (options.health === 'completed') return 'completed';
    if (options.health === 'paused') return 'neutral';
    return 'healthy';
  }
  
  // Budget uses percentage thresholds
  if (context === 'budget') {
    const used = options?.budgetUsed ?? progress;
    if (used > 100) return 'danger';
    if (used > 90) return 'danger';
    if (used > 75) return 'warning';
    return 'healthy';
  }
  
  // Milestone progress
  if (context === 'milestone') {
    if (progress === 0) return 'neutral';
    if (progress < 30) return 'warning';
    return 'healthy';
  }
  
  // Task progress — simple healthy/completed
  if (context === 'task') {
    if (progress === 0) return 'neutral';
    return 'healthy';
  }
  
  return 'healthy';
}

const progressBarColors: Record<ProgressStatus, { bar: string; text: string; glow?: string }> = {
  healthy: { 
    bar: 'bg-gradient-to-r from-brand-600 to-brand-400', 
    text: 'text-brand-700',
    glow: 'shadow-brand-500/20'
  },
  warning: { 
    bar: 'bg-gradient-to-r from-amber-500 to-amber-400', 
    text: 'text-amber-600',
    glow: 'shadow-amber-500/20'
  },
  danger: { 
    bar: 'bg-gradient-to-r from-red-600 to-red-400', 
    text: 'text-red-600',
    glow: 'shadow-red-500/20'
  },
  completed: { 
    bar: 'bg-gradient-to-r from-emerald-600 to-emerald-400', 
    text: 'text-emerald-600',
    glow: 'shadow-emerald-500/20'
  },
  neutral: { 
    bar: 'bg-gray-300', 
    text: 'text-gray-500',
    glow: ''
  }
};

function getProgressBarStyle(
  progress: number,
  context: ProgressContext,
  options?: {
    health?: HealthStatus;
    budgetUsed?: number;
    isOverdue?: boolean;
    isCompleted?: boolean;
  }
) {
  const status = getProgressStatus(progress, context, options);
  return progressBarColors[status];
}
// ===== END PROGRESS BAR STYLING SYSTEM =====

const gallery = [
  { id: 1, emoji: '🏠', caption: 'Tampak depan sebelum', date: '10 Jan', milestone: 'Before', type: 'before' },
  { id: 2, emoji: '🔨', caption: 'Proses bongkar keramik', date: '15 Jan', milestone: 'Demolition', type: 'during' },
  { id: 3, emoji: '🧱', caption: 'Pemasangan dinding baru', date: '01 Feb', milestone: 'Structure', type: 'during' },
  { id: 4, emoji: '💡', caption: 'Instalasi wiring listrik', date: '20 Feb', milestone: 'MEP', type: 'during' },
  { id: 5, emoji: '🚿', caption: 'Plumbing bathroom utama', date: '05 Mar', milestone: 'MEP', type: 'during' },
  { id: 6, emoji: '🎨', caption: 'Finishing cat dinding', date: '10 Mar', milestone: 'Finishing', type: 'during' },
];

const teamMembers = [
  { id: 1, name: 'Ahmad Fauzi', role: 'Project Manager', avatar: 'AH', color: 'bg-brand-600' },
  { id: 2, name: 'Budi Tresno', role: 'Site Supervisor', avatar: 'BT', color: 'bg-indigo-500' },
  { id: 3, name: 'Sari Wulandari', role: 'Designer', avatar: 'SR', color: 'bg-rose-500' },
  { id: 4, name: 'Doni Kusuma', role: 'Carpenter', avatar: 'DN', color: 'bg-amber-500' },
];

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = useData();
  const [activeView, setActiveView] = useState<ViewTab>('overview');
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  // Edit & Delete states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    status: '' as 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Overdue',
    priority: '' as 'Low' | 'Medium' | 'High' | 'Urgent',
    startDate: '',
    endDate: '',
    location: '',
    description: '',
    budget: 0,
  });

  const project = data.getProject(id || '') || data.projects[0];
  const customer = data.getCustomer(project?.customerId || '');
  const projectTransactions = data.getTransactionsByProject(project?.id || '');
  const projectEstimates = data.getEstimatesByProject(project?.id || '');

  const tasks = project?.tasks || [];
  const milestones = (project?.milestones || []).sort((a, b) => a.order - b.order);
  const budgetCategories = project?.budgetCategories || [];

  const health = project ? getHealth(project) : 'on-track';
  const hm = healthMeta[health];
  const deadline = project ? getDeadlineInfo(project.endDate) : { days: 30, label: '', urgent: false };
  const overdueTasks = tasks.filter((t: TaskType) => t.status !== 'Done' && t.dueDate).length;
  const nextMilestone = milestones.find((m: Milestone) => m.status === 'Active') || milestones.find((m: Milestone) => m.status === 'Upcoming');

  const financeReport: ProjectFinancialReport | null = useMemo(() => {
    if (!project?.id) return null;
    try {
      return data.getProjectFinancialReport(project.id);
    } catch {
      return null;
    }
  }, [data, project?.id]);

  const moveTask = useCallback((taskId: string, newStatus: string) => {
    if (project) data.updateTask(project.id, taskId, { status: newStatus as TaskType['status'] });
  }, [project, data]);

  const viewTabs: { id: ViewTab; label: string; icon: any; shortLabel: string }[] = [
    { id: 'overview', label: 'Ringkasan', shortLabel: 'Info', icon: BarChart3 },
    { id: 'kanban', label: 'Kanban Board', shortLabel: 'Board', icon: LayoutGrid },
    { id: 'milestones', label: 'Milestones', shortLabel: 'Miles', icon: Target },
    { id: 'gantt', label: 'Gantt Chart', shortLabel: 'Gantt', icon: GanttChartSquare },
    { id: 'budget', label: 'Anggaran', shortLabel: 'Dana', icon: Wallet },
    { id: 'gallery', label: 'Galeri', shortLabel: 'Foto', icon: Image },
  ];

  if (!project) return <div className="p-8 text-center text-gray-400">Project not found</div>;

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="px-4 md:px-6 pt-3 pb-0">
          <div className="flex items-center justify-between mb-2 animate-fade-in-up">
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <button onClick={() => navigate('/projects')} className="flex items-center gap-1 text-gray-400 hover:text-brand-600 transition-colors flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Projects</span>
              </button>
              <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
              <span className="font-semibold text-gray-700 text-xs truncate">{project.id}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1 bg-gradient-to-r from-brand-700 to-brand-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:shadow-lg transition-all active:scale-95">
                <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Add Task</span>
              </button>
              <div className="relative">
                <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px] z-30 animate-fade-in">
                    <button onClick={() => { setShowMoreMenu(false); setEditForm({
                      name: project.name,
                      category: project.category,
                      status: project.status,
                      priority: project.priority,
                      startDate: project.startDate,
                      endDate: project.endDate,
                      location: project.location,
                      description: project.description || '',
                      budget: project.budget,
                    }); setShowEditModal(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                      <Edit3 className="w-4 h-4" /> Edit Project
                    </button>
                    <button onClick={() => { setShowMoreMenu(false); setShowDeleteModal(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      <Archive className="w-4 h-4" /> Archive Project
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2 animate-fade-in-up stagger-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 border border-brand-100 flex items-center justify-center text-xl flex-shrink-0">🏗️</div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl font-extrabold text-gray-900 truncate">{project.name}</h1>
              <div className="flex items-center gap-2 text-[11px] text-gray-400 flex-wrap">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {customer?.name || project.customerId}</span>
                <span className="hidden sm:flex items-center gap-1"><MapPin className="w-3 h-3" /> {project.location}</span>
                <span className={cn("flex items-center gap-1 font-bold text-[10px] px-1.5 py-0.5 rounded-md", hm.bg, hm.color)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", hm.dot, health === 'on-track' && 'animate-pulse')} />
                  {hm.label}
                </span>
                <span className={cn("flex items-center gap-1 text-[10px] font-medium", deadline.urgent ? 'text-red-600' : 'text-gray-400')}>
                  <Clock className="w-3 h-3" />
                  {deadline.label}
                </span>
              </div>
            </div>
            <div className="flex -space-x-1.5 flex-shrink-0">
              {teamMembers.slice(0, 3).map(m => (
                <div key={m.id} className={cn("w-7 h-7 rounded-lg border-2 border-white flex items-center justify-center text-[9px] font-bold text-white", m.color)}>{m.avatar}</div>
              ))}
              {teamMembers.length > 3 && <div className="w-7 h-7 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500">+{teamMembers.length - 3}</div>}
            </div>
          </div>

          {/* Main Project Progress Bar - Uses unified styling */}
          {(() => {
            const pStyle = getProgressBarStyle(project.progress, 'project', { health });
            return (
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("flex-1 h-2 bg-gray-100 rounded-full overflow-hidden", pStyle.glow && `shadow-sm ${pStyle.glow}`)}>
                  <div className={cn("h-full rounded-full transition-all duration-500", pStyle.bar)} 
                    style={{ width: `${project.progress}%` }} />
                </div>
                <span className={cn("text-xs font-extrabold min-w-[32px] text-right", pStyle.text)}>{project.progress}%</span>
              </div>
            );
          })()}

          <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {viewTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveView(tab.id)}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all whitespace-nowrap border-b-2",
                  activeView === tab.id ? "text-brand-700 border-brand-600 bg-brand-50/50" : "text-gray-400 border-transparent hover:text-gray-600"
                )}>
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {activeView === 'overview' && <OverviewView project={project} tasks={tasks} milestones={milestones} budgetCategories={budgetCategories} customer={customer} transactions={projectTransactions} estimates={projectEstimates} onTaskClick={setSelectedTask} onViewChange={setActiveView} health={health} deadline={deadline} overdueTasks={overdueTasks} nextMilestone={nextMilestone} financeReport={financeReport} />}
        {activeView === 'kanban' && <KanbanView tasks={tasks} onTaskClick={setSelectedTask} onMoveTask={moveTask} />}
        {activeView === 'milestones' && <MilestonesView project={project} milestones={milestones} tasks={tasks} selectedId={selectedMilestone} onSelect={setSelectedMilestone} onAddMilestone={() => setShowAddMilestone(true)} />}
        {activeView === 'gantt' && <GanttView project={project} tasks={tasks} milestones={milestones} />}
        {activeView === 'budget' && <BudgetView project={project} budgetCategories={budgetCategories} transactions={projectTransactions} estimates={projectEstimates} financeReport={financeReport} onAddExpense={() => setShowAddExpense(true)} />}
        {activeView === 'gallery' && <GalleryView project={project} />}
      </div>

      {selectedTask && <TaskDetailModal task={selectedTask} project={project} onClose={() => setSelectedTask(null)} />}
      {showAddTask && <AddTaskModal project={project} milestones={milestones} onClose={() => setShowAddTask(false)} />}
      {showAddMilestone && <AddMilestoneModal project={project} onClose={() => setShowAddMilestone(false)} />}
      {showAddExpense && <AddExpenseModal project={project} budgetCategories={budgetCategories} onClose={() => setShowAddExpense(false)} />}
      
      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-xl animate-scale-in">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-blue-100 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Edit Project</h2>
                  <p className="text-xs text-gray-500">Perbarui informasi project</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Nama Project *</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 ring-brand-200 focus:border-brand-400" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Prioritas</label>
                  <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Tanggal Mulai</label>
                  <input type="text" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="01 Jan 2024" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Tanggal Selesai</label>
                  <input type="text" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="30 Mar 2024" />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Lokasi</label>
                <input type="text" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Budget (Rp)</label>
                <input type="number" value={editForm.budget} onChange={e => setEditForm({ ...editForm, budget: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Deskripsi</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none" />
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">
                Batal
              </button>
              <button onClick={() => {
                setIsSaving(true);
                data.updateProject(project.id, {
                  name: editForm.name,
                  category: editForm.category,
                  status: editForm.status,
                  priority: editForm.priority,
                  startDate: editForm.startDate,
                  endDate: editForm.endDate,
                  location: editForm.location,
                  description: editForm.description,
                  budget: editForm.budget,
                });
                data.addActivity({ type: 'project', action: 'Project Updated', detail: `"${editForm.name}" diperbarui`, entityId: project.id });
                setTimeout(() => {
                  setIsSaving(false);
                  setShowEditModal(false);
                }, 500);
              }}
                disabled={isSaving}
                className="px-5 py-2 bg-gradient-to-r from-brand-700 to-brand-500 text-white text-sm font-bold rounded-xl hover:shadow-lg active:scale-95 transition-all flex items-center gap-2">
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete/Archive Project Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Arsipkan Project?</h2>
              <p className="text-sm text-gray-600 mb-4">
                Project <strong>"{project.name}"</strong> akan diarsipkan dan tidak muncul di daftar aktif.
              </p>
              
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left mb-6">
                <div className="flex items-start gap-3">
                  <Archive className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Project akan diarsipkan selama 30 hari</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Setelah 30 hari, project dapat dihapus permanen atau dipulihkan kembali. Selama periode ini, data project tetap aman tersimpan.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                  Batal
                </button>
                <button onClick={() => {
                  setIsDeleting(true);
                  setTimeout(() => {
                    data.archiveProject(project.id, 'Diarsipkan oleh pengguna');
                    setIsDeleting(false);
                    setShowDeleteModal(false);
                    navigate('/projects');
                  }, 1000);
                }}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all flex items-center gap-2">
                  {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengarsipkan...</> : <><Archive className="w-4 h-4" /> Arsipkan Project</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside to close more menu */}
      {showMoreMenu && <div className="fixed inset-0 z-20" onClick={() => setShowMoreMenu(false)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════
function OverviewView({ project, tasks, milestones, budgetCategories, transactions, onViewChange, health: _health, deadline, overdueTasks, nextMilestone, financeReport }: any) {
  const doneCount = tasks.filter((t: TaskType) => t.status === 'Done').length;
  const inProgressCount = tasks.filter((t: TaskType) => t.status === 'In Progress').length;
  const reviewCount = tasks.filter((t: TaskType) => t.status === 'Review').length;

  const finance = financeReport;
  const budgetUsed = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
  const budgetRemaining = project.budget - project.spent;
  const completedMs = milestones.filter((m: Milestone) => m.status === 'Completed').length;
  const activeMs = milestones.filter((m: Milestone) => m.status === 'Active').length;

  const materialSpent =
    budgetCategories.find((c: BudgetCategory) => c.name === 'Material')?.spent ??
    budgetCategories.find((c: BudgetCategory) => c.name === 'Bahan')?.spent ??
    0;
  const laborSpent =
    budgetCategories.find((c: BudgetCategory) => c.name === 'Tenaga Kerja')?.spent ??
    budgetCategories.find((c: BudgetCategory) => c.name === 'Labor')?.spent ??
    0;
  const rap = finance?.income?.invoiced ?? 0;
  const realisasiPembayaran = finance?.income?.collected ?? 0;
  const sisaPembayaranCustomer = finance?.income?.outstanding ?? 0;
  const hutangOutstanding = finance?.payables?.outstanding ?? 0;
  const piutangOutstanding = finance?.income?.outstanding ?? 0;
  const profitValue = finance?.profitability?.netProfit ?? (realisasiPembayaran - project.spent);
  const profitLabel = project.status === 'Completed' ? 'Laba' : 'Proyeksi laba';

  const totalIncome = transactions.filter((t: any) => t.type === 'Income').reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = transactions.filter((t: any) => t.type === 'Expense').reduce((s: number, t: any) => s + t.amount, 0);

  // Budget safety
  const budgetSafe = budgetUsed <= 70;
  const budgetWarn = budgetUsed > 70 && budgetUsed <= 90;
  const budgetDanger = budgetUsed > 90;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Next Focus Banner */}
      {nextMilestone && (
        <div className="bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-100 rounded-xl p-3 flex items-center gap-3 animate-fade-in-up cursor-pointer hover:shadow-sm transition-all" onClick={() => onViewChange('milestones')}>
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0", nextMilestone.color)}>
            {nextMilestone.order}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-brand-600 uppercase">Fokus Saat Ini</p>
            <p className="text-sm font-bold text-gray-900 truncate">{nextMilestone.title}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-extrabold text-brand-700">{nextMilestone.progress}%</p>
            <p className="text-[10px] text-gray-400">{nextMilestone.checklist.filter((c: any) => c.done).length}/{nextMilestone.checklist.length} checklist</p>
          </div>
          <ChevronRight className="w-4 h-4 text-brand-400 flex-shrink-0" />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 animate-fade-in-up">
        {/* Harga & RAP */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-sm transition-all animate-fade-in-up stagger-1 cursor-pointer" onClick={() => onViewChange('budget')}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-brand-50">
              <Wallet className="w-3.5 h-3.5 text-brand-700" />
            </div>
            <span className="text-[8px] font-bold bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded-md">Harga</span>
          </div>
          <p className="text-lg md:text-xl font-extrabold text-gray-900">{formatCurrency(finance?.income?.contracted ?? project.budget)}</p>
          <div className="mt-1.5 space-y-0.5">
            <p className="text-[10px] text-gray-400">RAP: <span className="font-semibold text-gray-700">{formatCurrency(rap)}</span></p>
            <p className="text-[10px] text-gray-400">Realisasi: <span className="font-semibold text-emerald-700">{formatCurrency(realisasiPembayaran)}</span></p>
          </div>
          <p className="text-[9px] text-gray-300 mt-0.5">Sisa pembayaran: {formatCurrency(sisaPembayaranCustomer)}</p>
        </div>

        {/* Realisasi Biaya */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-sm transition-all animate-fade-in-up stagger-2 cursor-pointer" onClick={() => onViewChange('budget')}>
          <div className="flex items-center justify-between mb-1.5">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", budgetDanger ? 'bg-red-50' : budgetWarn ? 'bg-amber-50' : 'bg-emerald-50')}>
              <DollarSign className={cn("w-3.5 h-3.5", budgetDanger ? 'text-red-600' : budgetWarn ? 'text-amber-600' : 'text-emerald-600')} />
            </div>
            <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-md",
              budgetSafe ? 'bg-emerald-50 text-emerald-700' : budgetWarn ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
            )}>{budgetSafe ? 'Aman' : budgetWarn ? 'Perhatian' : 'Kritis'}</span>
          </div>
          <p className="text-lg md:text-xl font-extrabold text-gray-900">{budgetUsed}%</p>
          <p className="text-[10px] text-gray-400">Realisasi biaya</p>
          <div className="mt-1.5 space-y-0.5">
            <p className="text-[10px] text-gray-400">Bahan: <span className="font-semibold text-blue-700">{formatCurrency(materialSpent)}</span></p>
            <p className="text-[10px] text-gray-400">Pekerja: <span className="font-semibold text-amber-700">{formatCurrency(laborSpent)}</span></p>
          </div>
        </div>

        {/* Hutang & Piutang */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-sm transition-all animate-fade-in-up stagger-3 cursor-pointer" onClick={() => onViewChange('budget')}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-50">
              <Receipt className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="text-[8px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-md">AR/AP</span>
          </div>
          <div className="mt-1 space-y-0.5">
            <p className="text-[10px] text-gray-400">Piutang: <span className="font-semibold text-emerald-700">{formatCurrency(piutangOutstanding)}</span></p>
            <p className="text-[10px] text-gray-400">Hutang: <span className="font-semibold text-rose-700">{formatCurrency(hutangOutstanding)}</span></p>
          </div>
          <p className="text-[9px] text-gray-300 mt-0.5">Gunakan tab Anggaran untuk detail</p>
        </div>

        {/* Proyeksi laba & Pembayaran */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-sm transition-all animate-fade-in-up stagger-4 cursor-pointer" onClick={() => onViewChange('budget')}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-50">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-md",
              profitValue >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            )}>{profitValue >= 0 ? 'Positif' : 'Negatif'}</span>
          </div>
          <p className={cn("text-lg md:text-xl font-extrabold", profitValue >= 0 ? 'text-emerald-700' : 'text-rose-700')}>{formatCurrency(profitValue)}</p>
          <p className="text-[10px] text-gray-400">{profitLabel}</p>
          <div className="mt-1.5 space-y-0.5">
            <p className="text-[10px] text-gray-400">Diterima: <span className="font-semibold text-emerald-700">{formatCurrency(realisasiPembayaran)}</span></p>
            <p className="text-[9px] text-gray-300">Sisa: {formatCurrency(sisaPembayaranCustomer)}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Milestones Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-600" /> Milestones
              <span className="text-[9px] font-normal text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{completedMs}/{milestones.length} selesai</span>
            </h3>
            <button onClick={() => onViewChange('milestones')} className="text-[11px] text-brand-600 font-semibold hover:underline flex items-center gap-0.5">
              Kelola <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5">
            {milestones.slice(0, 5).map((m: Milestone) => {
              const isActive = m.status === 'Active';
              const checkDone = m.checklist.filter((c: any) => c.done).length;
              const checkTotal = m.checklist.length;
              return (
                <div key={m.id} className={cn("flex items-center gap-3 group cursor-pointer p-1.5 rounded-lg transition-all",
                  isActive ? "bg-brand-50/50 hover:bg-brand-50" : "hover:bg-gray-50"
                )} onClick={() => onViewChange('milestones')}>
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold",
                    m.status === 'Completed' ? 'bg-emerald-500' : isActive ? m.color : 'bg-gray-200 text-gray-400'
                  )}>{m.status === 'Completed' ? '✓' : m.order}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={cn("text-sm font-medium truncate group-hover:text-brand-600 transition-colors",
                        m.status === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                      )}>{m.title}</p>
                      {isActive && <span className="text-[7px] font-bold bg-brand-100 text-brand-700 px-1 py-0.5 rounded flex-shrink-0 uppercase">Aktif</span>}
                    </div>
                    {/* Milestone Progress - Uses unified styling */}
                    {(() => {
                      const mStyle = getProgressBarStyle(m.progress, 'milestone', { isCompleted: m.status === 'Completed' });
                      return (
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                            <div className={cn("h-full rounded-full transition-all duration-300", mStyle.bar)} style={{ width: `${m.progress}%` }} />
                          </div>
                          <span className={cn("text-[10px] font-medium", mStyle.text)}>{m.progress}%</span>
                          {checkTotal > 0 && <span className="text-[9px] text-gray-300">{checkDone}/{checkTotal}</span>}
                        </div>
                      );
                    })()}
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{m.targetDate}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-brand-600" /> Anggaran
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded",
                budgetSafe ? 'bg-emerald-50 text-emerald-700' : budgetWarn ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
              )}>{budgetSafe ? '✓ Aman' : budgetWarn ? '⚠ Perhatian' : '⚠ Kritis'}</span>
            </h3>
            <button onClick={() => onViewChange('budget')} className="text-[11px] text-brand-600 font-semibold hover:underline flex items-center gap-0.5">
              Detail <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Planned vs Actual mini bar */}
          <div className="mb-3 p-2.5 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-gray-500">Terpakai <span className="font-bold text-gray-700">{formatCurrency(project.spent)}</span></span>
              <span className="text-gray-500">dari <span className="font-bold text-gray-700">{formatCurrency(project.budget)}</span></span>
            </div>
            {/* Budget Progress - Uses unified styling */}
            {(() => {
              const bStyle = getProgressBarStyle(budgetUsed, 'budget', { budgetUsed });
              return (
                <div className={cn("h-2 bg-gray-200 rounded-full overflow-hidden", bStyle.glow && `shadow-sm ${bStyle.glow}`)}>
                  <div className={cn("h-full rounded-full transition-all duration-500", bStyle.bar)} 
                    style={{ width: `${Math.min(budgetUsed, 100)}%` }} />
                </div>
              );
            })()}
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-gray-400">{budgetUsed}% terpakai</span>
              <span className={cn("text-[9px] font-semibold", budgetRemaining >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                Sisa: {formatCurrency(Math.abs(budgetRemaining))}{budgetRemaining < 0 ? ' (over)' : ''}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-emerald-50 rounded-xl p-2.5">
              <div className="flex items-center gap-1 mb-0.5">
                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                <span className="text-[9px] font-bold text-emerald-600 uppercase">Pemasukan</span>
              </div>
              <p className="text-sm font-extrabold text-emerald-700">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-2.5">
              <div className="flex items-center gap-1 mb-0.5">
                <ArrowDownRight className="w-3 h-3 text-red-600" />
                <span className="text-[9px] font-bold text-red-600 uppercase">Pengeluaran</span>
              </div>
              <p className="text-sm font-extrabold text-red-700">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {budgetCategories.slice(0, 5).map((bc: BudgetCategory) => {
              const pct = bc.allocated > 0 ? Math.round((bc.spent / bc.allocated) * 100) : 0;
              const isOver = pct > 90;
              return (
                <div key={bc.id} className={cn("flex items-center gap-2 p-1 rounded-lg transition-all", isOver ? 'bg-red-50/50' : 'hover:bg-gray-50')}>
                  <span className="text-sm">{bc.icon}</span>
                  <span className="text-xs text-gray-600 flex-1 truncate">{bc.name}</span>
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-amber-400' : 'bg-brand-400')} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <span className={cn("text-[10px] w-8 text-right font-semibold", pct > 90 ? 'text-red-600' : 'text-gray-400')}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-fade-in-up stagger-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600" /> Transaksi Terakhir
            {transactions.length > 0 && <span className="text-[9px] font-normal text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{transactions.length} total</span>}
          </h3>
          <button onClick={() => onViewChange('budget')} className="text-[11px] text-brand-600 font-semibold hover:underline flex items-center gap-0.5">
            Semua <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Quick totals */}
        {transactions.length > 0 && (
          <div className="flex items-center gap-3 mb-3 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ArrowUpRight className="w-3 h-3" /> +{formatCurrency(totalIncome)}
            </span>
            <span className="flex items-center gap-1 text-red-600 font-semibold">
              <ArrowDownRight className="w-3 h-3" /> -{formatCurrency(totalExpense)}
            </span>
            <span className={cn("font-bold ml-auto", totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              Net: {formatCurrency(Math.abs(totalIncome - totalExpense))}
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          {transactions.slice(0, 6).map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-50 transition-all cursor-pointer group">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", t.type === 'Income' ? 'bg-emerald-50' : 'bg-red-50')}>
                {t.type === 'Income' ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate group-hover:text-brand-700 transition-colors">{t.desc}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-gray-400">{t.date}</span>
                  <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{t.category}</span>
                </div>
              </div>
              <span className={cn("text-sm font-bold", t.type === 'Income' ? 'text-emerald-600' : 'text-red-600')}>
                {t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-6">
              <Activity className="w-6 h-6 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Belum ada transaksi</p>
              <button onClick={() => onViewChange('budget')} className="text-xs text-brand-600 font-semibold mt-1 hover:underline">Catat transaksi pertama →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// KANBAN
// ═══════════════════════════════════════════════════════════
function KanbanView({ tasks, onTaskClick, onMoveTask }: { tasks: TaskType[]; onTaskClick: (t: TaskType) => void; onMoveTask: (id: string, status: string) => void }) {
  const [search, setSearch] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const dragCounter = useRef<Record<string, number>>({});

  const filtered = tasks.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-6 animate-fade-in-up">
      <div className="mb-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..." className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4">
        {kanbanCols.map(col => {
          const colTasks = filtered.filter(t => t.status === col.id);
          const isOver = dragOverCol === col.id;

          return (
            <div key={col.id}
              className={cn("flex-shrink-0 w-[260px] md:w-[280px] rounded-2xl transition-all", isOver ? "bg-brand-50 ring-2 ring-brand-300 ring-dashed" : "bg-gray-50/80")}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDragEnter={() => { dragCounter.current[col.id] = (dragCounter.current[col.id] || 0) + 1; setDragOverCol(col.id); }}
              onDragLeave={() => { dragCounter.current[col.id]--; if (dragCounter.current[col.id] <= 0) { dragCounter.current[col.id] = 0; setDragOverCol(null); } }}
              onDrop={e => { e.preventDefault(); if (dragId) onMoveTask(dragId, col.id); setDragId(null); setDragOverCol(null); dragCounter.current[col.id] = 0; }}
            >
              <div className="px-3 py-2.5 flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", col.color)} />
                <span className="text-xs font-bold text-gray-700">{col.title}</span>
                <span className="text-[10px] font-bold text-gray-400 bg-white rounded-md px-1.5 py-0.5">{colTasks.length}</span>
              </div>
              <div className="px-2 pb-2 space-y-1.5 min-h-[80px]">
                {colTasks.map(task => (
                  <div key={task.id} draggable
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => { setDragId(null); setDragOverCol(null); }}
                    onClick={() => onTaskClick(task)}
                    className={cn("bg-white rounded-xl p-3 border border-gray-100 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all group",
                      dragId === task.id && "opacity-50 scale-95"
                    )}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <GripVertical className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                      {task.labels.map(l => <span key={l} className="text-[8px] font-bold bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">{l}</span>)}
                      <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded ml-auto", priorityBadge[task.priority])}>{task.priority}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2 group-hover:text-brand-700 transition-colors">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        {task.subtasks.length > 0 && <span className="flex items-center gap-0.5"><CheckSquare className="w-3 h-3" />{task.subtasks.filter(s => s.done).length}/{task.subtasks.length}</span>}
                        {task.comments > 0 && <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{task.comments}</span>}
                        <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{task.dueDate}</span>
                      </div>
                      <div className="flex -space-x-1">
                        {task.assignees.slice(0, 2).map((a, i) => (
                          <div key={i} className={cn("w-5 h-5 rounded-md border border-white flex items-center justify-center text-[7px] font-bold text-white", a.color)}>{a.avatar}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && isOver && (
                  <div className="text-center py-6 text-xs text-brand-500 font-medium animate-pulse">Drop here</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MILESTONES — Full Management
// ═══════════════════════════════════════════════════════════
function MilestonesView({ project, milestones, tasks, selectedId, onSelect, onAddMilestone }: {
  project: any; milestones: Milestone[]; tasks: TaskType[]; selectedId: string | null;
  onSelect: (id: string | null) => void; onAddMilestone: () => void;
}) {
  const data = useData();
  const [newCheckTitle, setNewCheckTitle] = useState('');
  const selected = milestones.find(m => m.id === selectedId);
  const milestoneTasks = selected ? tasks.filter(t => t.milestoneId === selected.id) : [];
  const overallProgress = milestones.length > 0
    ? Math.round(milestones.reduce((s, m) => s + m.progress, 0) / milestones.length)
    : 0;

  return (
    <div className="p-4 md:p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Milestone Tracker</h2>
          <p className="text-xs text-gray-400">{milestones.filter(m => m.status === 'Completed').length} of {milestones.length} completed • Overall {overallProgress}%</p>
        </div>
        <button onClick={onAddMilestone}
          className="flex items-center gap-1.5 bg-gradient-to-r from-brand-700 to-brand-500 text-white px-3 py-2 rounded-xl text-xs font-bold hover:shadow-lg transition-all active:scale-95">
          <Plus className="w-3.5 h-3.5" /> Add Milestone
        </button>
      </div>

      {/* Overall Progress - Health-based coloring */}
      {(() => {
        // Calculate overall health based on progress and milestone completion
        const completedCount = milestones.filter(m => m.status === 'Completed').length;
        const overallHealth: ProgressStatus = 
          overallProgress >= 100 ? 'completed' :
          overallProgress < 30 && completedCount === 0 ? 'warning' :
          'healthy';
        const bannerGradient = 
          overallHealth === 'completed' ? 'from-emerald-600 to-emerald-500' :
          overallHealth === 'warning' ? 'from-amber-600 to-amber-500' :
          'from-brand-600 to-brand-500';
        
        return (
          <div className={cn("bg-gradient-to-r rounded-2xl p-4 mb-4 text-white shadow-lg", bannerGradient)}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-semibold opacity-90">Overall Progress</span>
                <p className="text-[10px] opacity-70">{completedCount} dari {milestones.length} milestone selesai</p>
              </div>
              <span className="text-2xl font-extrabold">{overallProgress}%</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500 shadow-sm" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
        );
      })()}

      <div className="grid md:grid-cols-5 gap-4">
        {/* Milestone List */}
        <div className={cn("space-y-2", selected ? "md:col-span-2" : "md:col-span-5")}>
          {milestones.map((m, idx) => {
            const isSelected = selectedId === m.id;
            const checkDone = m.checklist.filter(c => c.done).length;
            const checkTotal = m.checklist.length;

            return (
              <div key={m.id}
                onClick={() => onSelect(isSelected ? null : m.id)}
                className={cn(
                  "bg-white rounded-xl border p-3 cursor-pointer transition-all hover:shadow-sm animate-fade-in-up",
                  isSelected ? "border-brand-300 ring-1 ring-brand-200 shadow-sm" : "border-gray-100 hover:border-gray-200",
                  `stagger-${Math.min(idx + 1, 8)}`
                )}>
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5",
                    m.status === 'Completed' ? 'bg-emerald-500' : m.status === 'Active' ? m.color : 'bg-gray-200 text-gray-500'
                  )}>
                    {m.status === 'Completed' ? <CheckCircle2 className="w-4 h-4" /> : m.order}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-bold truncate", m.status === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-900')}>{m.title}</p>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0",
                        m.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                        m.status === 'Active' ? 'bg-brand-50 text-brand-700' : 'bg-gray-50 text-gray-500'
                      )}>{m.status}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{m.responsible} • Target: {m.targetDate}</p>
                    {/* Milestone Progress - Uses unified styling */}
                    {(() => {
                      const msStyle = getProgressBarStyle(m.progress, 'milestone', { isCompleted: m.status === 'Completed' });
                      return (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all duration-300", msStyle.bar)} style={{ width: `${m.progress}%` }} />
                          </div>
                          <span className={cn("text-[10px] font-bold", msStyle.text)}>{m.progress}%</span>
                          {checkTotal > 0 && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <CheckSquare className="w-3 h-3" /> {checkDone}/{checkTotal}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <ChevronRight className={cn("w-4 h-4 text-gray-300 flex-shrink-0 transition-transform mt-1", isSelected && "rotate-90")} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestone Detail Panel */}
        {selected && (
          <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden animate-fade-in-up">
            {/* Detail Header */}
            <div className={cn("p-4 border-b border-gray-100", selected.color.replace('bg-', 'bg-').replace('500', '50'))}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold", selected.color)}>
                    {selected.status === 'Completed' ? '✓' : selected.order}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{selected.title}</h3>
                    <p className="text-[11px] text-gray-500">{selected.description}</p>
                  </div>
                </div>
                <button onClick={() => onSelect(null)} className="p-1.5 hover:bg-gray-100 rounded-lg md:hidden"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {selected.responsible}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selected.targetDate}</span>
                <span className={cn("font-bold px-1.5 py-0.5 rounded",
                  selected.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                  selected.status === 'Active' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
                )}>{selected.status}</span>
              </div>
              {/* Selected Milestone Progress - Uses unified styling */}
              {(() => {
                const selStyle = getProgressBarStyle(selected.progress, 'milestone', { isCompleted: selected.status === 'Completed' });
                return (
                  <div className="flex items-center gap-2 mt-2">
                    <div className={cn("flex-1 h-2 bg-white/60 rounded-full overflow-hidden", selStyle.glow && `shadow-sm ${selStyle.glow}`)}>
                      <div className={cn("h-full rounded-full transition-all duration-500", selStyle.bar)} 
                        style={{ width: `${selected.progress}%` }} />
                    </div>
                    <span className={cn("text-xs font-extrabold", selStyle.text)}>{selected.progress}%</span>
                  </div>
                );
              })()}
            </div>

            {/* Checklist */}
            <div className="p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-brand-600" />
                Checklist
                <span className="text-[10px] font-normal text-gray-400">
                  ({selected.checklist.filter(c => c.done).length}/{selected.checklist.length} completed)
                </span>
              </h4>

              <div className="space-y-1 mb-3">
                {selected.checklist.map(item => (
                  <label key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group">
                    <input type="checkbox" checked={item.done}
                      onChange={() => data.toggleMilestoneCheck(project.id, selected.id, item.id)}
                      className="w-4 h-4 rounded-md accent-brand-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className={cn("text-sm transition-all", item.done ? "text-gray-400 line-through" : "text-gray-800 font-medium")}>{item.title}</span>
                      {item.assignee && <span className="text-[10px] text-gray-400 ml-2">• {item.assignee}</span>}
                    </div>
                    {item.dueDate && <span className="text-[10px] text-gray-400">{item.dueDate}</span>}
                    <Trash2 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all flex-shrink-0" />
                  </label>
                ))}
              </div>

              {/* Add check item */}
              <div className="flex gap-2">
                <input type="text" value={newCheckTitle} onChange={e => setNewCheckTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newCheckTitle.trim()) { data.addMilestoneCheckItem(project.id, selected.id, newCheckTitle.trim()); setNewCheckTitle(''); } }}
                  placeholder="Add checklist item..." className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
                <button onClick={() => { if (newCheckTitle.trim()) { data.addMilestoneCheckItem(project.id, selected.id, newCheckTitle.trim()); setNewCheckTitle(''); } }}
                  className="px-3 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-semibold hover:bg-brand-100 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Related Tasks */}
              {milestoneTasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <List className="w-4 h-4 text-brand-600" /> Related Tasks
                  </h4>
                  <div className="space-y-1">
                    {milestoneTasks.map(t => {
                      const st = statusBadge[t.status] || statusBadge['Backlog'];
                      return (
                        <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-all">
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", st.dot)} />
                          <span className="text-sm text-gray-700 flex-1 truncate">{t.title}</span>
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", st.bg, st.text)}>{t.status}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// GANTT CHART
// ═══════════════════════════════════════════════════════════
function GanttView({ project, tasks, milestones }: { project: any; tasks: TaskType[]; milestones: Milestone[] }) {
  const data = useData();
  const TOTAL_DAYS = 180;
  const MONTHS = [
    { label: 'Jan', days: 31 }, { label: 'Feb', days: 28 }, { label: 'Mar', days: 31 },
    { label: 'Apr', days: 30 }, { label: 'May', days: 31 }, { label: 'Jun', days: 30 },
  ];
  const todayDay = 75;
  const todayPct = (todayDay / TOTAL_DAYS) * 100;

  const taskGroups = useMemo(() => {
    const groups: Record<string, TaskType[]> = {};
    milestones.forEach(m => { groups[m.title] = tasks.filter(t => t.milestoneId === m.id); });
    const ungrouped = tasks.filter(t => !t.milestoneId || !milestones.find(m => m.id === t.milestoneId));
    if (ungrouped.length > 0) groups['Other'] = ungrouped;
    return groups;
  }, [tasks, milestones]);

  const [dragState, setDragState] = useState<{ taskId: string; type: 'move' | 'resize-left' | 'resize-right'; startX: number; origStart: number; origDur: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent, taskId: string, type: 'move' | 'resize-left' | 'resize-right', startDay: number, dur: number) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({ taskId, type, startX: e.clientX, origStart: startDay, origDur: dur });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState || !trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const pxPerDay = trackRect.width / TOTAL_DAYS;
    const dx = e.clientX - dragState.startX;
    const dDays = Math.round(dx / pxPerDay);

    let newStart = dragState.origStart;
    let newDur = dragState.origDur;

    if (dragState.type === 'move') { newStart = Math.max(0, dragState.origStart + dDays); }
    else if (dragState.type === 'resize-left') { newStart = Math.max(0, dragState.origStart + dDays); newDur = Math.max(3, dragState.origDur - dDays); }
    else { newDur = Math.max(3, dragState.origDur + dDays); }

    // Keep dueDate in sync with schedule (best-effort: derived from project.startDate)
    let derivedDueDate: string | undefined;
    const startDate = project.startDate ? new Date(project.startDate) : null;
    if (startDate && !Number.isNaN(startDate.getTime())) {
      const due = new Date(startDate);
      due.setDate(due.getDate() + newStart + newDur);
      derivedDueDate = due.toISOString().split('T')[0];
    }

    data.updateTask(project.id, dragState.taskId, { startDay: newStart, duration: newDur, ...(derivedDueDate ? { dueDate: derivedDueDate } : {}) });

    const startLabel = `Day ${newStart}`;
    const endLabel = `Day ${newStart + newDur}`;
    setTooltip({ x: e.clientX, y: e.clientY - 40, text: `${startLabel} → ${endLabel} (${newDur}d)` });
  }, [dragState, data, project.id]);

  const handlePointerUp = useCallback(() => { setDragState(null); setTooltip(null); }, []);

  return (
    <div className="p-4 md:p-6 animate-fade-in-up" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      {/* Mobile compact */}
      <div className="md:hidden space-y-3">
        {Object.entries(taskGroups).map(([group, groupTasks]) => (
          <div key={group}>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1.5">{group}</h4>
            <div className="space-y-1">
              {groupTasks.map(t => {
                const taskProgress = t.status === 'Done' ? 100 : t.status === 'In Progress' ? 50 : 0;
                const tStyle = getProgressBarStyle(taskProgress, 'task', { isCompleted: t.status === 'Done' });
                return (
                  <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full", tStyle.bar.replace('bg-gradient-to-r from-', 'bg-').split(' ')[0])} />
                      <span className="text-sm font-medium text-gray-900 flex-1 truncate">{t.title}</span>
                      <span className="text-[10px] text-gray-400">{t.duration}d</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-300", tStyle.bar)} 
                        style={{ width: `${taskProgress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Gantt */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Month headers */}
        <div className="flex border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="w-[240px] flex-shrink-0 px-4 py-3 border-r border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase">Task</span>
          </div>
          <div className="flex-1 flex" ref={trackRef}>
            {MONTHS.map((m, i) => (
              <div key={i} style={{ width: `${(m.days / TOTAL_DAYS) * 100}%` }}
                className="text-center py-3 text-xs font-bold border-r border-gray-50 text-gray-500">{m.label}</div>
            ))}
          </div>
        </div>

        {/* Task rows grouped by milestone */}
        {Object.entries(taskGroups).map(([group, groupTasks]) => (
          <div key={group}>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/50 border-b border-gray-100">
              <Target className="w-3 h-3 text-brand-600" />
              <span className="text-[11px] font-bold text-gray-600 uppercase">{group}</span>
              <span className="text-[10px] text-gray-400">({groupTasks.length})</span>
            </div>
            {groupTasks.map(t => {
              const leftPct = (t.startDay / TOTAL_DAYS) * 100;
              const widthPct = (t.duration / TOTAL_DAYS) * 100;
              const tProgress = t.status === 'Done' ? 100 : t.status === 'In Progress' ? 50 : 0;
              const tStyle = getProgressBarStyle(tProgress, 'task', { isCompleted: t.status === 'Done' });
              // Extract solid color for Gantt bars
              const solidColor = t.status === 'Done' ? 'bg-emerald-500' : t.status === 'In Progress' ? 'bg-brand-500' : 'bg-gray-300';

              return (
                <div key={t.id} className="flex border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                  <div className="w-[240px] flex-shrink-0 px-4 py-2.5 border-r border-gray-100 flex items-center gap-2">
                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", solidColor)} />
                    <span className="text-xs text-gray-700 truncate flex-1">{t.title}</span>
                    <span className={cn("text-[10px] font-medium", tStyle.text)}>{t.duration}d</span>
                  </div>
                  <div className="flex-1 relative py-2.5 px-1">
                    {/* Grid */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {MONTHS.map((m, i) => <div key={i} style={{ width: `${(m.days / TOTAL_DAYS) * 100}%` }} className="border-r border-gray-50" />)}
                    </div>
                    {/* Today marker */}
                    <div className="absolute top-0 bottom-0 w-px bg-red-300 z-[5] pointer-events-none" style={{ left: `${todayPct}%` }} />
                    {/* Bar - Uses unified styling */}
                    <div className={cn("absolute top-2 bottom-2 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-shadow", tStyle.glow && `shadow-md ${tStyle.glow}`)}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      onPointerDown={e => handlePointerDown(e, t.id, 'move', t.startDay, t.duration)}>
                      {/* Left resize */}
                      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 hover:bg-white/30"
                        onPointerDown={e => { e.stopPropagation(); handlePointerDown(e, t.id, 'resize-left', t.startDay, t.duration); }} />
                      {/* Bar bg */}
                      <div className={cn("absolute inset-0 rounded-lg opacity-30", solidColor)} />
                      {/* Progress fill - Uses unified styling */}
                      <div className={cn("absolute inset-y-0 left-0 rounded-lg", tStyle.bar)} style={{ width: `${tProgress}%` }} />
                      {/* Label */}
                      <span className="relative z-10 text-[9px] font-bold text-gray-700 px-2 py-1 truncate block">{t.title}</span>
                      {/* Right resize */}
                      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-10 hover:bg-white/30"
                        onPointerDown={e => { e.stopPropagation(); handlePointerDown(e, t.id, 'resize-right', t.startDay, t.duration); }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Legend:</span>
          {[{ l: 'Done', c: 'bg-emerald-400' }, { l: 'In Progress', c: 'bg-brand-500' }, { l: 'Upcoming', c: 'bg-gray-300' }].map(x => (
            <span key={x.l} className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className={cn("w-3 h-1.5 rounded-full", x.c)} />{x.l}</span>
          ))}
          <span className="text-[10px] text-gray-400 ml-auto">Drag to move • Edge to resize</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 px-2.5 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg shadow-lg pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}>
          {tooltip.text}
          <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-gray-900 rotate-45 -translate-x-1/2" />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BUDGET — RAP / Realisasi line items (bahan & pekerja)
// ═══════════════════════════════════════════════════════════
function BudgetLinesSection({ project }: { project: Project }) {
  const data = useData();
  const [importHint, setImportHint] = useState<{ type: 'ok' | 'info'; text: string } | null>(null);
  const lines = project.budgetLines ?? [];
  const stockItems = data.inventory.filter(i => i.category === 'Material');
  const linkedEstimates = data.getEstimatesByProject(project.id);

  const materialLines = lines.filter(l => l.kind === 'material');
  const laborLines = lines.filter(l => l.kind === 'labor');

  const materialSpentTotal = project.budgetCategories
    .filter(bc => bc.name === 'Material' || bc.name === 'Bahan')
    .reduce((s, bc) => s + bc.spent, 0);
  const laborSpentTotal = project.budgetCategories
    .filter(bc => bc.name === 'Tenaga Kerja' || bc.name === 'Labor')
    .reduce((s, bc) => s + bc.spent, 0);

  const addLine = (kind: ProjectBudgetLine['kind']) => {
    data.addProjectBudgetLine(project.id, {
      kind,
      description: kind === 'material' ? '' : 'Jenis pekerjaan / upah',
      qty: 1,
      unit: kind === 'material' ? 'unit' : 'oh',
      budgetAmount: 0,
      actualAmount: 0,
    });
  };

  const handleImportFromEstimator = () => {
    const n = data.importProjectBudgetLinesFromEstimates(project.id);
    if (n > 0) {
      setImportHint({ type: 'ok', text: `${n} baris bahan ditambahkan dari ${linkedEstimates.length} estimasi (RAP = HPP × qty).` });
    } else {
      setImportHint({
        type: 'info',
        text: linkedEstimates.length === 0
          ? 'Belum ada estimasi yang ditautkan ke proyek ini.'
          : 'Semua item estimasi sudah ada di tabel atau tidak ada item baru.',
      });
    }
    window.setTimeout(() => setImportHint(null), 6000);
  };

  const applyInventory = (line: ProjectBudgetLine, invId: string) => {
    if (!invId) {
      data.updateProjectBudgetLine(project.id, line.id, { inventoryItemId: undefined });
      return;
    }
    const inv = data.inventory.find(i => i.id === invId);
    if (!inv) return;
    const qty = line.qty > 0 ? line.qty : 1;
    data.updateProjectBudgetLine(project.id, line.id, {
      inventoryItemId: invId,
      description: inv.name,
      unit: inv.unit,
      qty,
      budgetAmount: Math.round(inv.buyPrice * qty),
    });
  };

  const renderTable = (rows: ProjectBudgetLine[], kind: ProjectBudgetLine['kind']) => {
    const sumBudget = rows.reduce((s, l) => s + l.budgetAmount, 0);
    const actualTotal = kind === 'material' ? materialSpentTotal : laborSpentTotal;
    const variance = sumBudget - actualTotal;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              {kind === 'material' && <th className="py-2 pr-2 w-[140px]">Inventory</th>}
              <th className="py-2 pr-2 min-w-[140px]">Item</th>
              <th className="py-2 pr-2 w-16">Qty</th>
              <th className="py-2 pr-2 w-20">Satuan</th>
              <th className="py-2 pr-2 w-[100px]">RAP</th>
              <th className="py-2 pr-2 w-[100px]">Realisasi</th>
              <th className="py-2 pr-2 w-[88px]">Sisa / (Lebih)</th>
              <th className="py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map(line => {
              // Realisasi per baris diturunkan dari `spent` kategori,
              // dibagi proporsional berdasarkan bobot RAP (budgetAmount).
              const lineActual = sumBudget > 0 ? actualTotal * (line.budgetAmount / sumBudget) : 0;
              const v = line.budgetAmount - lineActual;
              return (
                <tr key={line.id} className="border-b border-gray-50 hover:bg-gray-50/80 align-middle">
                  {kind === 'material' && (
                    <td className="py-1.5 pr-2">
                      <select
                        value={line.inventoryItemId ?? ''}
                        onChange={e => applyInventory(line, e.target.value)}
                        className="w-full max-w-[130px] text-[11px] rounded-lg border border-gray-200 bg-white px-1.5 py-1 text-gray-800 focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="">— manual —</option>
                        {stockItems.map(inv => (
                          <option key={inv.id} value={inv.id}>{inv.code} · {inv.name.slice(0, 18)}{inv.name.length > 18 ? '…' : ''}</option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="py-1.5 pr-2">
                    <input
                      value={line.description}
                      onChange={e => data.updateProjectBudgetLine(project.id, line.id, { description: e.target.value })}
                      className="w-full text-[11px] rounded-lg border border-gray-200 px-2 py-1 focus:ring-1 focus:ring-brand-500"
                      placeholder="Uraian"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={line.qty || ''}
                      onChange={e => {
                        const q = parseFloat(e.target.value) || 0;
                        const patch: Partial<ProjectBudgetLine> = { qty: q };
                        if (kind === 'material' && line.inventoryItemId) {
                          const inv = data.inventory.find(i => i.id === line.inventoryItemId);
                          if (inv && q > 0) patch.budgetAmount = Math.round(inv.buyPrice * q);
                        }
                        data.updateProjectBudgetLine(project.id, line.id, patch);
                      }}
                      className="w-full text-[11px] rounded-lg border border-gray-200 px-1 py-1 focus:ring-1 focus:ring-brand-500"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      value={line.unit}
                      onChange={e => data.updateProjectBudgetLine(project.id, line.id, { unit: e.target.value })}
                      className="w-full text-[11px] rounded-lg border border-gray-200 px-1 py-1 focus:ring-1 focus:ring-brand-500"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={line.budgetAmount || ''}
                      onChange={e => data.updateProjectBudgetLine(project.id, line.id, { budgetAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full text-[11px] rounded-lg border border-gray-200 px-1 py-1 focus:ring-1 focus:ring-brand-500"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={Math.round(lineActual * 100) / 100}
                      readOnly
                      className="w-full text-[11px] rounded-lg border border-gray-100 bg-gray-50 px-1 py-1 text-gray-500"
                    />
                  </td>
                  <td className={cn('py-1.5 pr-2 font-semibold text-[11px]', v >= 0 ? 'text-emerald-700' : 'text-amber-700')}>
                    {formatFull(v)}
                  </td>
                  <td className="py-1.5">
                    <button
                      type="button"
                      onClick={() => data.removeProjectBudgetLine(project.id, line.id)}
                      className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={kind === 'material' ? 8 : 7} className="py-6 text-center text-[11px] text-gray-400">
                  Belum ada baris. Tambah untuk mulai mengisi RAP & realisasi.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50/90 font-bold text-gray-800">
                <td colSpan={kind === 'material' ? 4 : 3} className="py-2 px-1 text-[10px] uppercase text-gray-500">Subtotal</td>
                <td className="py-2 pr-2 text-[11px]">{formatFull(sumBudget)}</td>
                <td className="py-2 pr-2 text-[11px]">{formatFull(actualTotal)}</td>
                <td className={cn('py-2 pr-2 text-[11px]', variance >= 0 ? 'text-emerald-700' : 'text-amber-700')}>{formatFull(variance)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">RAP & realisasi biaya</h3>
          <p className="text-[10px] text-gray-500 mt-0.5 max-w-xl">
            Tabel baris per bahan dan pekerja. Bahan bisa dipilih dari <span className="font-semibold text-gray-600">inventory</span> untuk mengisi nama, satuan, dan usulan RAP (harga beli × qty). Ringkasan kategori Material & Tenaga Kerja di bawah menyamai subtotal tabel ini.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={handleImportFromEstimator}
            disabled={linkedEstimates.length === 0}
            title={linkedEstimates.length === 0 ? 'Tautkan estimasi ke proyek di modul Estimator' : 'Impor item estimasi sebagai baris bahan (HPP × qty)'}
            className={cn(
              'flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-colors',
              linkedEstimates.length === 0
                ? 'text-gray-400 bg-gray-50 border-gray-100 cursor-not-allowed'
                : 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border-indigo-100',
            )}
          >
            <Download className="w-3.5 h-3.5" /> Dari estimator
          </button>
          <button
            type="button"
            onClick={() => addLine('material')}
            className="flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl border border-brand-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Baris bahan
          </button>
          <button
            type="button"
            onClick={() => addLine('labor')}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Baris upah
          </button>
        </div>
      </div>

      {importHint && (
        <div
          className={cn(
            'mx-4 mt-3 px-3 py-2 rounded-xl text-[11px] font-medium',
            importHint.type === 'ok' ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-gray-50 text-gray-700 border border-gray-100',
          )}
        >
          {importHint.text}
        </div>
      )}

      <div className="p-4 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg">Bahan</span>
            <span className="text-[10px] text-gray-400">{materialLines.length} baris</span>
          </div>
          {renderTable(materialLines, 'material')}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-extrabold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg">Upah / pekerja</span>
            <span className="text-[10px] text-gray-400">{laborLines.length} baris</span>
          </div>
          {renderTable(laborLines, 'labor')}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BUDGET — Connected to Finance
// ═══════════════════════════════════════════════════════════
function BudgetView({ project, budgetCategories, transactions, estimates, financeReport, onAddExpense }: {
  project: Project;
  budgetCategories: BudgetCategory[];
  transactions: any[];
  estimates: any[];
  financeReport: ProjectFinancialReport | null;
  onAddExpense: () => void;
}) {
  const navigate = useNavigate();
  const remaining = project.budget - project.spent;
  const usedPct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
  const totalIncome = transactions.filter((t: any) => t.type === 'Income').reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = transactions.filter((t: any) => t.type === 'Expense').reduce((s: number, t: any) => s + t.amount, 0);
  const profit = totalIncome - totalExpense;

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in-up">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center gap-1 mb-1"><Wallet className="w-3.5 h-3.5 text-brand-600" /><span className="text-[9px] font-bold text-gray-400 uppercase">Total Anggaran</span></div>
          <p className="text-base font-extrabold text-gray-900">{formatCurrency(project.budget)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center gap-1 mb-1"><TrendingDown className="w-3.5 h-3.5 text-red-500" /><span className="text-[9px] font-bold text-gray-400 uppercase">Terpakai</span></div>
          <p className="text-base font-extrabold text-red-600">{formatCurrency(project.spent)}</p>
          <p className="text-[10px] text-gray-400">{usedPct}% terpakai</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center gap-1 mb-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[9px] font-bold text-gray-400 uppercase">Sisa</span></div>
          <p className={cn("text-base font-extrabold", remaining >= 0 ? "text-emerald-600" : "text-red-600")}>{formatCurrency(remaining)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center gap-1 mb-1"><PieChart className="w-3.5 h-3.5 text-purple-500" /><span className="text-[9px] font-bold text-gray-400 uppercase">Profit</span></div>
          <p className={cn("text-base font-extrabold", profit >= 0 ? "text-emerald-600" : "text-red-600")}>{formatCurrency(profit)}</p>
        </div>
      </div>

      {financeReport && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="flex items-center gap-1 mb-1"><PieChart className="w-3.5 h-3.5 text-purple-500" /><span className="text-[9px] font-bold text-gray-400 uppercase">RAP</span></div>
            <p className="text-base font-extrabold text-gray-900">{formatCurrency(financeReport.income.invoiced)}</p>
            <p className="text-[10px] text-gray-400">Invoiced</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="flex items-center gap-1 mb-1"><ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[9px] font-bold text-gray-400 uppercase">Realisasi</span></div>
            <p className="text-base font-extrabold text-emerald-700">{formatCurrency(financeReport.income.collected)}</p>
            <p className="text-[10px] text-gray-400">{financeReport.health.paymentCollection}% collection</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="flex items-center gap-1 mb-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[9px] font-bold text-gray-400 uppercase">Piutang</span></div>
            <p className="text-base font-extrabold text-emerald-700">{formatCurrency(financeReport.income.outstanding)}</p>
            <p className="text-[10px] text-gray-400">Sisa tagihan</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="flex items-center gap-1 mb-1"><Receipt className="w-3.5 h-3.5 text-rose-600" /><span className="text-[9px] font-bold text-gray-400 uppercase">Hutang</span></div>
            <p className="text-base font-extrabold text-rose-700">{formatCurrency(financeReport.payables.outstanding)}</p>
            <p className="text-[10px] text-gray-400">Outstanding</p>
          </div>
        </div>
      )}

      {/* Budget Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900">Utilisasi Anggaran</h3>
          <span className={cn("text-sm font-extrabold", usedPct > 90 ? 'text-red-600' : usedPct > 70 ? 'text-amber-600' : 'text-brand-700')}>{usedPct}%</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-1">
          <div className={cn("h-full rounded-full transition-all", usedPct > 90 ? 'bg-red-500' : usedPct > 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-brand-600 to-brand-400')}
            style={{ width: `${Math.min(usedPct, 100)}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>Rp 0</span>
          <span>{formatFull(project.budget)}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Rincian Kategori</h3>
            <button onClick={onAddExpense}
              className="text-xs text-brand-600 font-semibold hover:bg-brand-50 px-2 py-1 rounded-lg transition-all flex items-center gap-1">
              <Plus className="w-3 h-3" /> Tambah Biaya
            </button>
          </div>
          <div className="space-y-3">
            {budgetCategories.map(bc => {
              const pct = bc.allocated > 0 ? Math.round((bc.spent / bc.allocated) * 100) : 0;
              const variance = bc.allocated - bc.spent;
              return (
                <div key={bc.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{bc.icon}</span>
                    <span className="text-sm font-semibold text-gray-900 flex-1">{bc.name}</span>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded",
                      pct > 90 ? 'bg-red-50 text-red-700' : pct > 70 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    )}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                    <div className={cn("h-full rounded-full transition-all", bc.color)} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Spent: {formatCurrency(bc.spent)}</span>
                    <span>Budget: {formatCurrency(bc.allocated)}</span>
                    <span className={cn(variance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transactions & Links */}
        <div className="space-y-4">
          {/* Income vs Expense */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Arus Kas</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <ArrowUpRight className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-lg font-extrabold text-emerald-700">{formatCurrency(totalIncome)}</p>
                <p className="text-[10px] text-emerald-600">Total Income</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <ArrowDownRight className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-lg font-extrabold text-red-700">{formatCurrency(totalExpense)}</p>
                <p className="text-[10px] text-red-600">Total Expense</p>
              </div>
            </div>
            <button onClick={() => navigate('/finance')}
              className="w-full text-center text-xs text-brand-600 font-semibold hover:bg-brand-50 py-2 rounded-xl transition-all flex items-center justify-center gap-1">
               <ExternalLink className="w-3 h-3" /> Buka Modul Keuangan
            </button>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Transaksi Terbaru</h3>
            <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar">
              {transactions.slice(0, 8).map((t: any) => (
                <div key={t.id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-50 transition-all">
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0", t.type === 'Income' ? 'bg-emerald-50' : 'bg-red-50')}>
                    {t.type === 'Income' ? <ArrowUpRight className="w-3 h-3 text-emerald-600" /> : <ArrowDownRight className="w-3 h-3 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 truncate">{t.desc}</p>
                    <p className="text-[10px] text-gray-400">{t.date}</p>
                  </div>
                  <span className={cn("text-xs font-bold", t.type === 'Income' ? 'text-emerald-600' : 'text-red-600')}>
                    {t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-center text-xs text-gray-400 py-4">Belum ada transaksi</p>}
            </div>
          </div>

          {/* Linked Estimates */}
          {estimates.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" /> Linked Estimates
              </h3>
              {estimates.map((e: any) => (
                <div key={e.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer" onClick={() => navigate('/estimator')}>
                  <Receipt className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">{e.title}</p>
                    <p className="text-[10px] text-gray-400">{e.items.length} items • {e.status}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// GALLERY
// ═══════════════════════════════════════════════════════════
function GalleryView({ project }: { project: any }) {
  const data = useData();
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const filters = ['all', 'before', 'during', 'after', 'documents'];
  const galleryItems = project?.gallery?.length ? project.gallery : gallery;
  const filtered =
    filter === 'all'
      ? galleryItems
      : filter === 'documents'
        ? galleryItems.filter((p: any) => p.type === 'document')
        : galleryItems.filter((p: any) => p.type === filter);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0 || !project?.id) return;
    setUploading(true);

    const readAsDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

    const filesArray = Array.from(files).slice(0, 10);
    const now = new Date().toISOString().split('T')[0];

    const nextItems = await Promise.all(
      filesArray.map(async (file, idx) => {
        const url = await readAsDataUrl(file);
        const isImage = file.type.startsWith('image/');
        const type =
          !isImage
            ? 'document'
            : filter === 'documents' || filter === 'all'
              ? 'during'
              : filter;

        return {
          id: `${now}-${file.name}-${idx}`,
          url,
          caption: file.name,
          date: now,
          type,
        };
      })
    );

    const current = project.gallery?.length ? project.gallery : [];
    data.updateProject(project.id, { gallery: [...current, ...nextItems] });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-4 md:p-6 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-4">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
              filter === f ? "bg-brand-50 text-brand-700" : "text-gray-400 hover:text-gray-600")}>{f}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {filtered.map((p, i) => (
          <div key={p.id} onClick={() => setLightbox(i)}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group">
            <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              {p.url && String(p.url).startsWith('data:image') ? (
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              ) : p.type === 'document' ? (
                <FileText className="w-9 h-9 text-gray-400" />
              ) : (
                <span className="text-5xl">{p.emoji}</span>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium text-gray-900 truncate">{p.caption}</p>
              <p className="text-[10px] text-gray-400">
                {p.date}
                {p.milestone ? ` • ${p.milestone}` : ''}
              </p>
            </div>
          </div>
        ))}
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          className="bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center aspect-square hover:border-brand-400 hover:text-brand-500 text-gray-400 transition-all cursor-pointer"
        >
          <Upload className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{uploading ? 'Uploading...' : 'Upload'}</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {lightbox !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button onClick={e => { e.stopPropagation(); setLightbox(Math.max(0, lightbox - 1)); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><ChevronLeft className="w-6 h-6" /></button>
          <div className="text-center" onClick={e => e.stopPropagation()}>
            {filtered[lightbox]?.url && String(filtered[lightbox].url).startsWith('data:image') ? (
              <img
                src={filtered[lightbox].url}
                alt=""
                className="max-w-[70vw] max-h-[60vh] object-contain rounded-xl border border-white/10"
              />
            ) : filtered[lightbox]?.type === 'document' ? (
              <FileText className="w-16 h-16 text-gray-200 mx-auto mb-3" />
            ) : (
              <span className="text-8xl block mb-4">{filtered[lightbox].emoji}</span>
            )}
            <p className="text-white font-semibold">{filtered[lightbox].caption}</p>
            <p className="text-white/60 text-sm">{filtered[lightbox].date}</p>
          </div>
          <button onClick={e => { e.stopPropagation(); setLightbox(Math.min(filtered.length - 1, lightbox + 1)); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><ChevronRight className="w-6 h-6" /></button>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><X className="w-5 h-5" /></button>
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-sm">{lightbox + 1} / {filtered.length}</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TASK DETAIL MODAL
// ═══════════════════════════════════════════════════════════
export function TaskDetailModal({ task, project, onClose }: { task: TaskType; project: any; onClose: () => void }) {
  const data = useData();
  const [activeTab, setActiveTab] = useState<'subtasks' | 'progress' | 'comments' | 'activity'>('subtasks');
  const [commentText, setCommentText] = useState('');
  const [workLogText, setWorkLogText] = useState('');
  const [workLogStatus, setWorkLogStatus] = useState(task.status);
  const [workLogPhotos, setWorkLogPhotos] = useState<string[]>([]);
  const [subtaskTitleDraft, setSubtaskTitleDraft] = useState('');
  const [showSubtaskComposer, setShowSubtaskComposer] = useState(false);
  const [assigneeNameDraft, setAssigneeNameDraft] = useState('');
  const [assigneeColorDraft, setAssigneeColorDraft] = useState('bg-brand-600');
  const [showAssigneeComposer, setShowAssigneeComposer] = useState(false);
  
  const st = statusBadge[task.status] || statusBadge['Backlog'];
  const milestone = project.milestones.find((m: Milestone) => m.id === task.milestoneId);
  const taskComments = data.getTaskComments(task.id);
  const taskWorkLogs = data.getWorkLogsByTask(task.id);

  const addSubtask = () => {
    const title = subtaskTitleDraft.trim();
    if (!title) return;
    const newId = `st-${Math.random().toString(36).slice(2, 9)}`;
    data.updateTask(project.id, task.id, {
      subtasks: [...task.subtasks, { id: newId, title, done: false }],
    });
    setSubtaskTitleDraft('');
    setShowSubtaskComposer(false);
  };

  const deriveAssigneeAvatar = (name: string) => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    const initials = words.slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
    if (initials.length >= 2) return initials;
    const stripped = name.replace(/[^a-zA-Z0-9]/g, '');
    return stripped.slice(0, 2).toUpperCase();
  };

  const addAssignee = () => {
    const name = assigneeNameDraft.trim();
    if (!name) return;
    const avatar = deriveAssigneeAvatar(name);
    // Hindari duplikasi berdasarkan avatar
    if (task.assignees.some(a => a.avatar === avatar)) {
      setShowAssigneeComposer(false);
      setAssigneeNameDraft('');
      return;
    }
    data.updateTask(project.id, task.id, {
      assignees: [...task.assignees, { avatar, color: assigneeColorDraft }],
    });
    setAssigneeNameDraft('');
    setShowAssigneeComposer(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    data.addTaskComment(task.id, commentText);
    setCommentText('');
  };

  const handleWorkLogPhotosSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const readAsDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

    // Batasi untuk mencegah memory overload
    const filesArray = Array.from(files).slice(0, 6);
    const urls = await Promise.all(filesArray.map(readAsDataUrl));
    setWorkLogPhotos(prev => [...prev, ...urls]);
  };

  const handleAddWorkLog = () => {
    if (!workLogText.trim()) return;
    data.addWorkLog({
      taskId: task.id,
      description: workLogText,
      photos: workLogPhotos,
      statusUpdate: workLogStatus as any
    });
    setWorkLogText('');
    setWorkLogPhotos([]);
    if (workLogStatus === 'Done') onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white w-full h-[90vh] md:h-auto md:max-h-[85vh] md:max-w-xl md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col">
        <div className="flex-shrink-0 border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400">{task.id}</span>
              <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", priorityBadge[task.priority])}>{task.priority}</span>
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1", st.bg, st.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />{task.status}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <h2 className="text-base font-extrabold text-gray-900">{task.title}</h2>
          {milestone && <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1"><Target className="w-3 h-3" /> {milestone.title}</p>}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          <p className="text-sm text-gray-600">{task.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { icon: Flag, label: 'Priority', value: task.priority },
              { icon: Calendar, label: 'Due', value: task.dueDate },
              { icon: Timer, label: 'Logged', value: task.timeLogged },
              { icon: Target, label: 'Milestone', value: milestone?.title || '-' },
            ].map((d, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-2.5">
                <div className="flex items-center gap-1 mb-0.5"><d.icon className="w-3 h-3 text-gray-400" /><span className="text-[9px] font-bold text-gray-400 uppercase">{d.label}</span></div>
                <p className="text-xs font-semibold text-gray-700 capitalize truncate">{d.value}</p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Assignees</h4>
            <div className="flex flex-wrap gap-1.5">
              {task.assignees.map((a, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                  <div className={cn("w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold text-white", a.color)}>{a.avatar}</div>
                  <span className="text-xs font-medium text-gray-700">{a.avatar}</span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowAssigneeComposer(s => !s)}
                className="text-xs text-brand-600 hover:bg-brand-50 px-2 py-1.5 rounded-lg font-medium"
              >
                + Add
              </button>
            </div>
            {showAssigneeComposer && (
              <div className="mt-2 p-2 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                <div className="flex gap-2">
                  <input
                    value={assigneeNameDraft}
                    onChange={(e) => setAssigneeNameDraft(e.target.value)}
                    placeholder="Nama (mis. Ahmad)"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                  />
                  <select
                    value={assigneeColorDraft}
                    onChange={(e) => setAssigneeColorDraft(e.target.value)}
                    className="px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                  >
                    {['bg-brand-600','bg-indigo-500','bg-rose-500','bg-amber-500','bg-emerald-500','bg-blue-500','bg-purple-500','bg-teal-500'].map(c => (
                      <option key={c} value={c}>{c.replace('bg-', '')}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setShowAssigneeComposer(false); setAssigneeNameDraft(''); }} className="text-xs px-3 py-2 rounded-xl text-gray-500 hover:bg-gray-100">Cancel</button>
                  <button type="button" onClick={addAssignee} className="text-xs px-3 py-2 rounded-xl bg-brand-50 text-brand-700 font-bold hover:bg-brand-100 border border-brand-100">Tambah</button>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div>
            <div className="flex gap-0.5 border-b border-gray-100 mb-3">
              {([
                { id: 'subtasks' as const, label: 'Subtasks', count: task.subtasks.length },
                { id: 'progress' as const, label: 'Progress', count: taskWorkLogs.length },
                { id: 'comments' as const, label: 'Komentar', count: taskComments.length },
                { id: 'activity' as const, label: 'Activity', count: 0 },
              ]).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn("px-3 py-2 text-xs font-semibold border-b-2 transition-all",
                    activeTab === tab.id ? "text-brand-700 border-brand-600" : "text-gray-400 border-transparent")}>{tab.label}</button>
              ))}
            </div>

            {activeTab === 'subtasks' && (
              <div className="space-y-1">
                {task.subtasks.map(s => (
                  <label key={s.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={(e) => {
                        const nextDone = e.target.checked;
                        data.updateTask(project.id, task.id, {
                          subtasks: task.subtasks.map(x => (x.id === s.id ? { ...x, done: nextDone } : x)),
                        });
                      }}
                      className="w-3.5 h-3.5 rounded accent-brand-600"
                    />
                    <span className={cn("text-sm flex-1", s.done ? "text-gray-400 line-through" : "text-gray-700")}>{s.title}</span>
                  </label>
                ))}
                {!showSubtaskComposer ? (
                  <button
                    type="button"
                    onClick={() => setShowSubtaskComposer(true)}
                    className="flex items-center gap-1.5 text-xs text-brand-600 font-medium px-2 py-1.5 hover:bg-brand-50 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Subtask
                  </button>
                ) : (
                  <div className="p-2 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                    <input
                      value={subtaskTitleDraft}
                      onChange={(e) => setSubtaskTitleDraft(e.target.value)}
                      placeholder="Judul subtask"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addSubtask();
                        if (e.key === 'Escape') { setShowSubtaskComposer(false); setSubtaskTitleDraft(''); }
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowSubtaskComposer(false); setSubtaskTitleDraft(''); }}
                        className="text-xs px-3 py-2 rounded-xl text-gray-500 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={addSubtask}
                        className="text-xs px-3 py-2 rounded-xl bg-brand-50 text-brand-700 font-bold hover:bg-brand-100 border border-brand-100"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update Progres</p>
                  <div className="bg-white/60 border border-gray-100 rounded-xl p-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-gray-500 uppercase">Foto (opsional)</p>
                      {workLogPhotos.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setWorkLogPhotos([])}
                          className="text-[10px] text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg transition-colors"
                        >
                          Hapus semua
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleWorkLogPhotosSelected(e.target.files)}
                      className="block w-full text-[11px] text-gray-500"
                    />
                    {workLogPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {workLogPhotos.slice(0, 8).map((p, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                            <img src={p} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setWorkLogPhotos(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute -top-2 -right-2 p-1 rounded-full bg-white/90 border border-gray-100 hover:bg-white"
                              title="Remove"
                            >
                              <X className="w-3 h-3 text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <textarea value={workLogText} onChange={e => setWorkLogText(e.target.value)}
                    placeholder="Apa yang dilakukan?..." className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs h-16 outline-none focus:ring-1 focus:ring-brand-500" />
                  <div className="flex items-center justify-between">
                    <select value={workLogStatus} onChange={e => setWorkLogStatus(e.target.value as any)}
                      className="text-[10px] font-bold bg-white border border-gray-200 rounded-md px-2 py-1">
                      {kanbanCols.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <button onClick={handleAddWorkLog} className="px-3 py-1 bg-brand-600 text-white rounded-md text-[10px] font-bold">Kirim Update</button>
                  </div>
                </div>

                <div className="space-y-3 relative before:absolute before:left-[14px] before:top-2 before:bottom-0 before:w-px before:bg-gray-100">
                  {taskWorkLogs.map(log => (
                    <div key={log.id} className="relative pl-8 pb-3">
                      <div className="absolute left-0 top-0 w-7 h-7 bg-brand-50 border border-brand-100 rounded-lg flex items-center justify-center z-10">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                      </div>
                      <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-50 hover:border-gray-100 transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-900">{log.userId === data.currentUser?.id ? 'Anda' : 'Tim'} • <span className="text-brand-600 uppercase">{log.statusUpdate}</span></span>
                          <span className="text-[9px] text-gray-400">{new Date(log.createdAt).toLocaleDateString('id-ID')}</span>
                        </div>
                        <p className="text-xs text-gray-600">{log.description}</p>
                        {log.photos && log.photos.length > 0 && (
                          <div className="flex gap-1.5 mt-2">
                            {log.photos.map((p, idx) => (
                              <img key={idx} src={p} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {taskWorkLogs.length === 0 && <p className="text-center py-4 text-xs text-gray-400 italic">Belum ada update progres.</p>}
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {taskComments.map(c => (
                    <div key={c.id} className="flex gap-2.5">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 bg-brand-500")}>
                        {c.userName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-gray-900">{c.userName}</span>
                          <span className="text-[9px] text-gray-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))}
                  {taskComments.length === 0 && <p className="text-center py-4 text-xs text-gray-400 italic">Belum ada komentar.</p>}
                </div>
                
                <div className="flex gap-2 pt-1 border-t border-gray-100 mt-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                    {data.currentUser?.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 relative">
                    <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                      placeholder="Tulis komentar..." className="w-full px-3 py-2 pr-9 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" />
                    <button onClick={handleAddComment} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-brand-600 hover:scale-110 transition-transform"><Send className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-0 before:w-px before:bg-gray-100">
                {(() => {
                  const logs = (data.activityLog || [])
                    .filter(l => typeof l.detail === 'string' && l.detail.includes(String(task.id)))
                    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                    .slice(0, 10);

                  if (logs.length === 0) {
                    return (
                      <p className="text-center text-xs text-gray-400 py-6">
                        Belum ada activity untuk task ini.
                      </p>
                    );
                  }

                  return logs.map(log => {
                    const dotColor =
                      log.type === 'hr' ? 'bg-emerald-100 border-emerald-500' :
                      log.type === 'task' ? 'bg-brand-100 border-brand-500' :
                      log.type === 'finance' ? 'bg-amber-100 border-amber-500' :
                      'bg-gray-100 border-gray-300';

                    const when = log.timestamp
                      ? new Date(log.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
                      : '';

                    return (
                      <div key={log.id} className="relative pl-7 pb-3">
                        <div className={cn("absolute left-0 top-1 w-4 h-4 rounded-full border-2 z-10", dotColor)} />
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <p className="text-xs text-gray-600">
                              <span className="font-bold text-gray-900">{log.action}</span>
                              {log.actorName ? ` — oleh ${log.actorName}` : ''}
                            </p>
                            <p className="text-[10px] text-gray-400 leading-snug break-words">{log.detail}</p>
                            {when && <p className="text-[9px] text-gray-300 mt-1">{when}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ADD TASK MODAL
// ═══════════════════════════════════════════════════════════
function AddTaskModal({ project, milestones, onClose }: { project: any; milestones: Milestone[]; onClose: () => void }) {
  const data = useData();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState('To Do');
  const [priority, setPriority] = useState('Medium');
  const [milestoneId, setMilestoneId] = useState(milestones[0]?.id || '');
  const [dueDate, setDueDate] = useState('');

  const handleCreate = () => {
    if (!title.trim()) return;
    data.addTask(project.id, {
      milestoneId, title: title.trim(), description: desc, status: status as TaskType['status'],
      priority: priority as TaskType['priority'], assignee: '', assignees: [],
      dueDate, labels: [], subtasks: [], comments: 0, attachments: 0, timeLogged: '0h', startDay: 0, duration: 7,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between z-10 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center text-white"><Plus className="w-4 h-4" /></div>
            <div><h2 className="text-base font-bold text-gray-900">New Task</h2><p className="text-[10px] text-gray-500">Add to {project.name}</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Pasang keramik ruang tamu" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:bg-white" /></div>
          <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Description</label>
            <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Details..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Milestone</label>
              <select value={milestoneId} onChange={e => setMilestoneId(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                <option value="">No milestone</option>
                {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select></div>
            <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                {['Backlog', 'To Do', 'In Progress', 'Review'].map(s => <option key={s}>{s}</option>)}
              </select></div>
            <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30" /></div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button onClick={handleCreate} className="px-5 py-2 bg-gradient-to-r from-brand-700 to-brand-500 text-white text-sm font-bold rounded-xl hover:shadow-lg active:scale-95 transition-all">Create Task</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ADD MILESTONE MODAL
// ═══════════════════════════════════════════════════════════
function AddMilestoneModal({ project, onClose }: { project: any; onClose: () => void }) {
  const data = useData();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [target, setTarget] = useState('');
  const [responsible, setResponsible] = useState('');
  const [color, setColor] = useState('bg-brand-500');

  const colors = ['bg-brand-500', 'bg-blue-500', 'bg-purple-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-500', 'bg-indigo-500'];

  const handleCreate = () => {
    if (!title.trim()) return;
    data.addMilestone(project.id, { title: title.trim(), description: desc, targetDate: target, responsible, color });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between z-10 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-brand-500 flex items-center justify-center text-white"><Target className="w-4 h-4" /></div>
            <div><h2 className="text-base font-bold text-gray-900">New Milestone</h2><p className="text-[10px] text-gray-500">{project.name}</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Milestone Name *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Pekerjaan Struktur" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:bg-white" /></div>
          <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Description</label>
            <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe this milestone..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Target Date</label>
              <input type="date" value={target} onChange={e => setTarget(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30" /></div>
            <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Responsible</label>
              <select value={responsible} onChange={e => setResponsible(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                <option value="">Select...</option>
                {project.team.map((t: string) => <option key={t}>{t}</option>)}
              </select></div>
          </div>
          <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Color</label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button key={c} onClick={() => setColor(c)} className={cn("w-8 h-8 rounded-lg transition-all", c, color === c ? "ring-2 ring-offset-2 ring-brand-500 scale-110" : "opacity-60 hover:opacity-100")} />
              ))}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button onClick={handleCreate} className="px-5 py-2 bg-gradient-to-r from-brand-700 to-brand-500 text-white text-sm font-bold rounded-xl hover:shadow-lg active:scale-95 transition-all">Create Milestone</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ADD EXPENSE MODAL — Connected to Finance
// ═══════════════════════════════════════════════════════════
function AddExpenseModal({ project, budgetCategories, onClose }: { project: any; budgetCategories: BudgetCategory[]; onClose: () => void }) {
  const data = useData();
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(budgetCategories[0]?.name || 'Material');
  const [type, setType] = useState<'Expense' | 'Income'>('Expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCreate = () => {
    if (!desc.trim() || !amount) return;
    const amt = parseInt(amount.replace(/\D/g, ''));
    if (isNaN(amt)) return;

    // Create transaction linked to project
    data.addTransaction({
      date, desc: desc.trim(), type, category, amount: amt,
      projectId: project.id, supplierId: null, status: 'Completed',
    });

    // Update budget category spent
    if (type === 'Expense') {
      const bc = budgetCategories.find(b => b.name === category);
      if (bc) data.updateBudgetCategory(project.id, bc.id, { spent: bc.spent + amt });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between z-10 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-brand-500 flex items-center justify-center text-white"><DollarSign className="w-4 h-4" /></div>
            <div><h2 className="text-base font-bold text-gray-900">Add Transaction</h2><p className="text-[10px] text-gray-500">{project.name}</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex bg-gray-100 rounded-xl p-0.5">
            {(['Expense', 'Income'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={cn("flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                  type === t ? (t === 'Expense' ? "bg-red-500 text-white" : "bg-emerald-500 text-white") : "text-gray-500")}>{t}</button>
            ))}
          </div>
          <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Description *</label>
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Beli semen 50 sak" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:bg-white" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Amount (Rp) *</label>
              <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1,000,000" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30" /></div>
            <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                {budgetCategories.map(bc => <option key={bc.id} value={bc.name}>{bc.icon} {bc.name}</option>)}
                <option value="Client Payment">💰 Client Payment</option>
              </select></div>
          </div>
          <div><label className="text-sm font-semibold text-gray-700 mb-1 block">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30" /></div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[11px] text-gray-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> This transaction will be recorded in Finance module and linked to this project's budget.</p>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button onClick={handleCreate} className={cn("px-5 py-2 text-white text-sm font-bold rounded-xl hover:shadow-lg active:scale-95 transition-all",
            type === 'Expense' ? "bg-gradient-to-r from-red-600 to-red-500" : "bg-gradient-to-r from-emerald-600 to-emerald-500"
          )}>Record {type}</button>
        </div>
      </div>
    </div>
  );
}
