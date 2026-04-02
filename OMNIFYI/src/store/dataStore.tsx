import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ===== TYPES =====
export type UserRole = 'Admin' | 'HR' | 'Finance' | 'Employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type SalaryScheme = 'monthly' | 'daily' | 'project-based';

export interface Employee {
  id: string;
  userId: string;
  position: string;
  joinDate: string;
  baseSalary: number;
  dailyRate?: number; // for daily-paid workers
  bankAccount: string;
  status: 'Active' | 'Inactive';
  salaryScheme: SalaryScheme;
  paymentCycle?: 'monthly' | 'weekly' | 'bi-weekly'; // payment frequency
  department?: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  locationLat?: number;
  locationLong?: number;
  photoUrl?: string;
  status: 'Present' | 'Late' | 'Leave' | 'Sick' | 'Absent' | 'Alfa';
  notes?: string;
  workHours?: number; // calculated work hours
  overtimeHours?: number; // calculated overtime
}

export interface WorkLog {
  id: string;
  taskId: string;
  userId: string;
  description: string;
  photos: string[];
  statusUpdate: 'Backlog' | 'To Do' | 'In Progress' | 'Review' | 'Done';
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

// ===== LEAVE MANAGEMENT =====
export interface LeaveRequest {
  id: string;
  userId: string;
  type: 'Annual' | 'Sick' | 'Emergency' | 'Unpaid' | 'Izin';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  attachment?: string; // for sick notes, etc
}

// ===== PAYROLL =====
export type PayrollStatus = 'Draft' | 'Processed' | 'Approved' | 'Paid';

export interface ProjectWage {
  projectId: string;
  projectName: string;
  role: string;
  daysWorked: number;
  dailyRate: number;
  totalAmount: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  userId: string;
  period: string; // "2024-03" for monthly, "2024-W12" for weekly
  periodType: 'monthly' | 'weekly';
  salaryScheme: SalaryScheme;
  baseSalary: number;
  dailyRate?: number;
  workingDays: number;
  presentDays: number;
  lateDays: number;
  leaveDays: number;
  absentDays: number;
  overtimeHours: number;
  overtimePay: number;
  projectWages?: ProjectWage[]; // for project-based workers
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossPay: number;
  netPay: number;
  status: PayrollStatus;
  processedAt?: string;
  processedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  notes?: string;
}

// ===== COMPANY INFO =====
export interface CompanyInfo {
  name: string;
  tagline: string;
  vision: string;
  mission: string[];
  values: { title: string; description: string; icon: string }[];
  address: string;
  phone: string;
  email: string;
  website: string;
}

export interface CompanyPolicy {
  id: string;
  title: string;
  category: 'Attendance' | 'Leave' | 'Conduct' | 'Safety' | 'General';
  content: string;
  effectiveDate: string;
  version: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'Info' | 'Warning' | 'Urgent' | 'Celebration';
  authorId: string;
  authorName: string;
  publishedAt: string;
  expiresAt?: string;
  pinned: boolean;
}

export interface EmployeeDocument {
  id: string;
  userId: string;
  title: string;
  type: 'Contract' | 'ID' | 'Certificate' | 'Payslip' | 'Tax' | 'Other';
  fileUrl: string;
  uploadedAt: string;
  expiresAt?: string;
}

// ============================================
// CHART OF ACCOUNTS (COA)
// ============================================
export type AccountCategory = 'asset' | 'liability' | 'equity' | 'income' | 'expense';
export type AccountSubCategory = 
  | 'cash' | 'bank' | 'receivable' | 'inventory' | 'equipment' | 'prepaid' | 'other_asset'
  | 'payable' | 'project_debt' | 'other_liability'
  | 'capital' | 'retained_earnings' | 'current_earnings'
  | 'sales' | 'service' | 'other_income'
  | 'cogs' | 'operating' | 'payroll_expense' | 'other_expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  category: AccountCategory;
  subCategory: AccountSubCategory;
  description?: string;
  balance: number;
  isActive: boolean;
  isSystem: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// RECEIVABLES & PAYABLES
// ============================================
export type DebtType = 'customer' | 'supplier' | 'project' | 'interproject' | 'employee' | 'other';
export type DebtStatus = 'open' | 'partial' | 'paid' | 'overdue' | 'written_off';

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: 'cash' | 'transfer' | 'check' | 'other';
  reference?: string;
  notes?: string;
  recordedBy: string;
}

export interface Receivable {
  id: string;
  type: DebtType;
  customerId?: string;
  customerName?: string;
  projectId?: string;
  projectName?: string;
  employeeId?: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  invoiceDate: string;
  dueDate: string;
  status: DebtStatus;
  payments: PaymentRecord[];
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface Payable {
  id: string;
  type: DebtType;
  supplierId?: string;
  supplierName?: string;
  projectId?: string;
  projectName?: string;
  toProjectId?: string;
  toProjectName?: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  invoiceDate: string;
  dueDate: string;
  status: DebtStatus;
  payments: PaymentRecord[];
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

// ============================================
// FINANCIAL REPORT TYPES
// ============================================
export interface ProfitLossReport {
  period: { start: string; end: string };
  projectId?: string;
  projectName?: string;
  // Revenue section
  revenue: {
    total: number;
    breakdown: { category: string; amount: number; percentage: number }[];
  };
  // Cost of goods/services
  costOfSales: {
    total: number;
    breakdown: { category: string; amount: number; percentage: number }[];
  };
  grossProfit: number;
  grossMargin: number;
  // Operating expenses
  operatingExpenses: {
    total: number;
    breakdown: { category: string; amount: number; percentage: number }[];
  };
  // Net results
  netProfit: number;
  netMargin: number;
  // Comparison
  comparison?: {
    previousPeriod: { revenue: number; netProfit: number };
    percentageChange: { revenue: number; netProfit: number };
  };
}

export interface CashFlowReport {
  period: { start: string; end: string };
  openingBalance: number;
  closingBalance: number;
  // Operating activities
  operating: {
    inflows: { category: string; amount: number }[];
    outflows: { category: string; amount: number }[];
    netOperating: number;
  };
  // Investing activities (equipment, etc)
  investing: {
    inflows: { description: string; amount: number }[];
    outflows: { description: string; amount: number }[];
    netInvesting: number;
  };
  // Financing activities
  financing: {
    inflows: { description: string; amount: number }[];
    outflows: { description: string; amount: number }[];
    netFinancing: number;
  };
  netCashFlow: number;
  // Daily/weekly breakdown for chart
  dailyFlow: { date: string; inflow: number; outflow: number; balance: number }[];
}

export interface BalanceSheetReport {
  asOfDate: string;
  // Assets
  assets: {
    current: {
      total: number;
      items: { name: string; accountCode: string; balance: number }[];
    };
    fixed: {
      total: number;
      items: { name: string; accountCode: string; balance: number }[];
    };
    totalAssets: number;
  };
  // Liabilities
  liabilities: {
    current: {
      total: number;
      items: { name: string; accountCode: string; balance: number }[];
    };
    longTerm: {
      total: number;
      items: { name: string; accountCode: string; balance: number }[];
    };
    totalLiabilities: number;
  };
  // Equity
  equity: {
    total: number;
    items: { name: string; accountCode: string; balance: number }[];
  };
  // Should balance
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface ProjectFinancialReport {
  projectId: string;
  projectName: string;
  projectStatus: string;
  period: { start: string; end: string };
  // Budget vs Actual
  budget: {
    total: number;
    categories: { name: string; budgeted: number; actual: number; variance: number; variancePercent: number }[];
  };
  // Income tracking
  income: {
    contracted: number; // total contract value
    invoiced: number;
    collected: number;
    outstanding: number;
    payments: { date: string; description: string; amount: number; type: string }[];
  };
  // Payables (hutang) tracking (pending/partial/paid)
  payables: {
    total: number;
    paid: number;
    outstanding: number;
    payments: { date: string; description: string; amount: number; method?: string }[];
  };
  // Expense tracking
  expenses: {
    total: number;
    categories: { name: string; amount: number; percentage: number }[];
    topExpenses: { date: string; description: string; amount: number; category: string }[];
  };
  // Payroll charged
  payroll: {
    total: number;
    workers: { name: string; role: string; amount: number }[];
  };
  // Profitability
  profitability: {
    grossProfit: number;
    grossMargin: number;
    netProfit: number;
    netMargin: number;
  };
  // Health indicators
  health: {
    budgetUtilization: number;
    paymentCollection: number;
    isOnBudget: boolean;
    isOnTrack: boolean;
  };
}

export interface AgingReport {
  type: 'receivables' | 'payables';
  asOfDate: string;
  summary: {
    total: number;
    current: number; // 0-30 days
    days31to60: number;
    days61to90: number;
    over90: number;
  };
  items: {
    id: string;
    entityName: string; // customer/supplier name
    projectName?: string;
    originalAmount: number;
    outstandingAmount: number;
    dueDate: string;
    daysOverdue: number;
    agingBucket: 'Current' | '31-60' | '61-90' | '90+';
    lastPaymentDate?: string;
    lastPaymentAmount?: number;
  }[];
  // Grouped totals
  byEntity: { name: string; total: number; overdue: number }[];
}

export interface TransactionSummaryReport {
  period: { start: string; end: string };
  groupBy: 'day' | 'week' | 'month' | 'category' | 'project';
  totals: {
    income: number;
    expense: number;
    net: number;
    transactionCount: number;
  };
  groups: {
    key: string; // date, category name, or project name
    income: number;
    expense: number;
    net: number;
    count: number;
    items?: { id: string; date: string; description: string; amount: number; type: string }[];
  }[];
  // Top items
  topIncome: { description: string; amount: number; date: string }[];
  topExpense: { description: string; amount: number; date: string }[];
}

// ===== PERMISSION MATRIX =====
export type AppModule = 'dashboard' | 'projects' | 'crm' | 'finance' | 'inventory' | 'estimator' | 'admin' | 'hr' | 'payroll';

export interface RolePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export const PERMISSION_MATRIX: Record<UserRole, Record<AppModule, RolePermission>> = {
  Admin: {
    dashboard: { view: true, create: true, edit: true, delete: true },
    projects: { view: true, create: true, edit: true, delete: true },
    crm: { view: true, create: true, edit: true, delete: true },
    finance: { view: true, create: true, edit: true, delete: true },
    inventory: { view: true, create: true, edit: true, delete: true },
    estimator: { view: true, create: true, edit: true, delete: true },
    admin: { view: true, create: true, edit: true, delete: true },
    hr: { view: true, create: true, edit: true, delete: true },
    payroll: { view: true, create: true, edit: true, delete: true },
  },
  HR: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    projects: { view: true, create: false, edit: false, delete: false },
    crm: { view: false, create: false, edit: false, delete: false },
    finance: { view: false, create: false, edit: false, delete: false },
    inventory: { view: true, create: false, edit: false, delete: false },
    estimator: { view: false, create: false, edit: false, delete: false },
    admin: { view: false, create: false, edit: false, delete: false },
    hr: { view: true, create: true, edit: true, delete: true },
    payroll: { view: true, create: true, edit: true, delete: false },
  },
  Finance: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    projects: { view: true, create: false, edit: false, delete: false },
    crm: { view: true, create: false, edit: false, delete: false },
    finance: { view: true, create: true, edit: true, delete: false },
    inventory: { view: true, create: true, edit: true, delete: false },
    estimator: { view: true, create: true, edit: false, delete: false },
    admin: { view: false, create: false, edit: false, delete: false },
    hr: { view: false, create: false, edit: false, delete: false },
    payroll: { view: true, create: false, edit: false, delete: false },
  },
  Employee: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    projects: { view: true, create: false, edit: false, delete: false },
    crm: { view: false, create: false, edit: false, delete: false },
    finance: { view: false, create: false, edit: false, delete: false },
    inventory: { view: false, create: false, edit: false, delete: false },
    estimator: { view: false, create: false, edit: false, delete: false },
    admin: { view: false, create: false, edit: false, delete: false },
    hr: { view: false, create: false, edit: false, delete: false },
    payroll: { view: false, create: false, edit: false, delete: false },
  },
};

// Helper function — check permission
export function hasPermission(role: UserRole, module: AppModule, action: keyof RolePermission = 'view'): boolean {
  return PERMISSION_MATRIX[role]?.[module]?.[action] ?? false;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  status: 'Active' | 'Lead' | 'Inactive';
  starred: boolean;
  tags: string[];
  createdAt: string;
  updatedBy?: string;
  // Pipeline CRM fields
  pipelineStage?: 'new-lead' | 'contacted' | 'follow-up' | 'negotiation' | 'quotation' | 'won' | 'lost' | 'after-sales';
  leadSource?: string;
  assignedTo?: string;
  dealValue?: number;
  totalValue?: number;
  lastContactDate?: string;
  nextFollowUp?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
  assignee?: string;
  dueDate?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'Completed' | 'Active' | 'Upcoming';
  progress: number;
  checklist: ChecklistItem[];
  responsible: string;
  color: string;
  order: number;
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId: string;
  title: string;
  description: string;
  status: 'Backlog' | 'To Do' | 'In Progress' | 'Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignee: string;
  assignees: { avatar: string; color: string }[];
  dueDate: string;
  labels: string[];
  subtasks: { id: string; title: string; done: boolean }[];
  comments: number;
  attachments: number;
  timeLogged: string;
  startDay: number;
  duration: number;
  updatedBy?: string;
}

export interface BudgetCategory {
  id: string;
  projectId: string;
  name: string;
  allocated: number;
  spent: number;
  icon: string;
  color: string;
}

/** Baris RAP / realisasi biaya (bahan & pekerja) per proyek */
export type ProjectBudgetLineKind = 'material' | 'labor';

export interface ProjectBudgetLine {
  id: string;
  projectId: string;
  kind: ProjectBudgetLineKind;
  /** Opsional: tautkan ke master inventory (khusus bahan) */
  inventoryItemId?: string;
  /** Jika dari impor estimator: `${estimateId}:${itemId}` untuk cegah duplikat */
  sourceEstimateItemId?: string;
  description: string;
  qty: number;
  unit: string;
  /** Nilai anggaran baris (RAP) */
  budgetAmount: number;
  /** Realisasi biaya aktual */
  actualAmount: number;
}

export interface Project {
  id: string;
  name: string;
  customerId: string;
  category: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Overdue';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  team: string[];
  tasks: Task[];
  milestones: Milestone[];
  budgetCategories: BudgetCategory[];
  /** Detail baris anggaran bahan / pekerja; jika ada, ringkasan Material & Tenaga Kerja diselaraskan dari sini */
  budgetLines?: ProjectBudgetLine[];
  createdAt: string;
  updatedBy?: string;
  archivedAt?: string;
  archiveReason?: string;
  gallery?: { id: string; url: string; caption: string; date: string; type: string; milestone?: string }[];
}

export interface Estimate {
  id: string;
  projectId: string | null;
  customerId: string | null;
  title: string;
  items: EstimateItem[];
  contingency: number;
  taxEnabled: boolean;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected';
  createdAt: string;
  updatedBy?: string;
}

export interface EstimateItem {
  id: string;
  category: string;
  description: string;
  qty: number;
  unit: string;
  hpp: number;
  sellPrice: number;
}

export interface Transaction {
  id: string;
  date: string;
  desc: string;
  type: 'Income' | 'Expense' | 'Transfer';
  category: string;
  amount: number;
  projectId: string | null;
  supplierId: string | null;
  status: 'Completed' | 'Pending';
  updatedBy?: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  buyPrice: number;
  sellPrice: number;
  supplier: string;
}

/** Cocokkan deskripsi baris estimator ke master inventory (untuk dropdown & ID opsional) */
export function findMatchingInventoryId(inventory: InventoryItem[], description: string): string | undefined {
  const d = description.toLowerCase().replace(/\s+/g, ' ').trim();
  if (d.length < 3) return undefined;
  for (const inv of inventory) {
    if (inv.category !== 'Material') continue;
    const n = inv.name.toLowerCase();
    if (n.length >= 4 && d.includes(n)) return inv.id;
    const take = Math.min(24, d.length);
    if (take >= 4 && n.includes(d.slice(0, take))) return inv.id;
  }
  const dWords = d.split(/[^a-z0-9]+/).filter(w => w.length >= 4);
  for (const inv of inventory) {
    if (inv.category !== 'Material') continue;
    const nWords = inv.name.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 4);
    if (dWords.some(dw => nWords.some(nw => nw.includes(dw) || dw.includes(nw)))) return inv.id;
  }
  return undefined;
}

function dedupeBudgetLinesByEstimateSource(lines: ProjectBudgetLine[]): ProjectBudgetLine[] {
  const seen = new Set<string>();
  return lines.filter(l => {
    if (!l.sourceEstimateItemId) return true;
    if (seen.has(l.sourceEstimateItemId)) return false;
    seen.add(l.sourceEstimateItemId);
    return true;
  });
}

export interface ActivityLog {
  id: string;
  type: 'project' | 'finance' | 'crm' | 'inventory' | 'estimate' | 'task' | 'milestone' | 'system' | 'hr' | 'attendance' | 'leave' | 'payroll';
  action: string;
  detail: string;
  timestamp: string;
  entityId?: string;
  actorId?: string;
  actorName?: string;
}

// ===== INITIAL DATA =====
// Helper to get dates relative to today
const getRelativeDate = (daysFromToday: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split('T')[0];
};

const initialCustomers: Customer[] = [
  { id: 'CUST-001', name: 'Budi Santoso', company: 'PT Maju Jaya', phone: '+62 812-3456-7890', email: 'budi@majujaya.com', address: 'Jl. Sudirman No. 15, Jakarta', status: 'Active', starred: true, tags: ['VIP'], createdAt: '2024-01-10', pipelineStage: 'won', nextFollowUp: getRelativeDate(0) },
  { id: 'CUST-002', name: 'Sarah Wilson', company: 'TechCorp Indo', phone: '+62 811-2233-4455', email: 'sarah@techcorp.id', address: 'Jl. Gatot Subroto No. 8, Jakarta', status: 'Lead', starred: false, tags: ['Priority'], createdAt: '2024-02-05', pipelineStage: 'follow-up', nextFollowUp: getRelativeDate(-2) },
  { id: 'CUST-003', name: 'Andi Wijaya', company: 'CV Bangun Nusantara', phone: '+62 856-7890-1234', email: 'andi@bangun.co.id', address: 'Jl. Diponegoro No. 22, Bandung', status: 'Active', starred: true, tags: ['VIP', 'Priority'], createdAt: '2024-01-15', pipelineStage: 'negotiation', nextFollowUp: getRelativeDate(1) },
  { id: 'CUST-004', name: 'Linda Kusuma', company: 'Individual', phone: '+62 878-1122-3344', email: 'linda.k@gmail.com', address: 'Jl. Merdeka No. 5, Surabaya', status: 'Inactive', starred: false, tags: [], createdAt: '2023-11-20', pipelineStage: 'lost' },
  { id: 'CUST-005', name: 'Reza Mahendra', company: 'PT Konstruksi Utama', phone: '+62 813-9876-5432', email: 'reza@konstruksi.id', address: 'Jl. Pemuda No. 30, Semarang', status: 'Active', starred: true, tags: ['VIP'], createdAt: '2024-01-02', pipelineStage: 'quotation', nextFollowUp: getRelativeDate(3) },
  { id: 'CUST-006', name: 'Maya Putri', company: 'PT Graha Indah', phone: '+62 815-6677-8899', email: 'maya@grahaindah.com', address: 'Jl. Asia Afrika No. 11, Bandung', status: 'Active', starred: false, tags: [], createdAt: '2024-03-01' },
];

const mkMilestones = (pid: string): Milestone[] => {
  if (pid === 'PRJ-001') return [
    { id: 'MS-001', projectId: pid, title: 'Persiapan & Demolisi', description: 'Bongkar struktur lama, persiapan lahan', targetDate: '2024-02-15', status: 'Completed', progress: 100, responsible: 'Ahmad', color: 'bg-emerald-500', order: 1, checklist: [
      { id: 'c1', title: 'Survey lokasi & pengukuran', done: true },
      { id: 'c2', title: 'Bongkar keramik lantai lama', done: true },
      { id: 'c3', title: 'Bongkar dinding partisi', done: true },
      { id: 'c4', title: 'Buang material bekas', done: true },
    ]},
    { id: 'MS-002', projectId: pid, title: 'Pekerjaan Struktur', description: 'Pondasi, kolom, dinding, dan rangka atap', targetDate: '2024-03-20', status: 'Completed', progress: 100, responsible: 'Budi T', color: 'bg-blue-500', order: 2, checklist: [
      { id: 'c5', title: 'Perkuatan pondasi', done: true },
      { id: 'c6', title: 'Pasang kolom baru', done: true },
      { id: 'c7', title: 'Pasang dinding bata', done: true },
      { id: 'c8', title: 'Quality check struktur', done: true },
    ]},
    { id: 'MS-003', projectId: pid, title: 'MEP (Mekanikal Elektrikal Plumbing)', description: 'Instalasi listrik, air, dan ducting AC', targetDate: '2024-04-10', status: 'Active', progress: 65, responsible: 'Ahmad', color: 'bg-amber-500', order: 3, checklist: [
      { id: 'c9', title: 'Wiring listrik lantai 1', done: true },
      { id: 'c10', title: 'Wiring listrik lantai 2', done: true },
      { id: 'c11', title: 'Instalasi pipa air bersih', done: false, assignee: 'Ahmad', dueDate: '2024-04-01' },
      { id: 'c12', title: 'Instalasi pipa air kotor', done: false, assignee: 'Ahmad', dueDate: '2024-04-05' },
      { id: 'c13', title: 'Pasang titik AC & ducting', done: false },
      { id: 'c14', title: 'Testing & commissioning', done: false },
    ]},
    { id: 'MS-004', projectId: pid, title: 'Finishing Interior', description: 'Keramik, cat, plafon, dan detail finishing', targetDate: '2024-05-20', status: 'Upcoming', progress: 10, responsible: 'Sari', color: 'bg-purple-500', order: 4, checklist: [
      { id: 'c15', title: 'Pasang keramik lantai', done: false },
      { id: 'c16', title: 'Pasang keramik dinding kamar mandi', done: false },
      { id: 'c17', title: 'Plafon gypsum', done: false },
      { id: 'c18', title: 'Cat dinding interior', done: false },
      { id: 'c19', title: 'Pasang kusen & pintu', done: false },
      { id: 'c20', title: 'Pasang sanitary ware', done: false },
    ]},
    { id: 'MS-005', projectId: pid, title: 'Furniture & Fixtures', description: 'Kitchen set, lemari, dan instalasi fixture', targetDate: '2024-06-10', status: 'Upcoming', progress: 0, responsible: 'Doni', color: 'bg-rose-500', order: 5, checklist: [
      { id: 'c21', title: 'Produksi kitchen set', done: false },
      { id: 'c22', title: 'Instalasi kitchen set', done: false },
      { id: 'c23', title: 'Pasang lampu & stop kontak', done: false },
      { id: 'c24', title: 'Pasang shower & kran', done: false },
    ]},
    { id: 'MS-006', projectId: pid, title: 'Serah Terima', description: 'Final inspection, cleaning, dan handover ke client', targetDate: '2024-06-30', status: 'Upcoming', progress: 0, responsible: 'Ahmad', color: 'bg-teal-500', order: 6, checklist: [
      { id: 'c25', title: 'Final inspection internal', done: false },
      { id: 'c26', title: 'Pembersihan total', done: false },
      { id: 'c27', title: 'Walk-through dengan client', done: false },
      { id: 'c28', title: 'Dokumen serah terima', done: false },
      { id: 'c29', title: 'Garansi & maintenance card', done: false },
    ]},
  ];
  return [];
};

const mkBudgetCats = (pid: string): BudgetCategory[] => {
  if (pid === 'PRJ-001') return [
    { id: 'BC-01', projectId: pid, name: 'Material', allocated: 180000000, spent: 112000000, icon: '🧱', color: 'bg-blue-500' },
    { id: 'BC-02', projectId: pid, name: 'Tenaga Kerja', allocated: 120000000, spent: 85000000, icon: '👷', color: 'bg-amber-500' },
    { id: 'BC-03', projectId: pid, name: 'Peralatan', allocated: 45000000, spent: 28000000, icon: '🔧', color: 'bg-purple-500' },
    { id: 'BC-04', projectId: pid, name: 'Subkontraktor', allocated: 65000000, spent: 38000000, icon: '🏗️', color: 'bg-rose-500' },
    { id: 'BC-05', projectId: pid, name: 'Overhead', allocated: 25000000, spent: 12000000, icon: '📋', color: 'bg-teal-500' },
    { id: 'BC-06', projectId: pid, name: 'Cadangan', allocated: 15000000, spent: 5000000, icon: '🛡️', color: 'bg-gray-500' },
  ];
  return [
    { id: 'BC-01', projectId: pid, name: 'Material', allocated: 0, spent: 0, icon: '🧱', color: 'bg-blue-500' },
    { id: 'BC-02', projectId: pid, name: 'Tenaga Kerja', allocated: 0, spent: 0, icon: '👷', color: 'bg-amber-500' },
    { id: 'BC-03', projectId: pid, name: 'Peralatan', allocated: 0, spent: 0, icon: '🔧', color: 'bg-purple-500' },
    { id: 'BC-04', projectId: pid, name: 'Overhead', allocated: 0, spent: 0, icon: '📋', color: 'bg-teal-500' },
  ];
};

const mkBudgetLines = (pid: string): ProjectBudgetLine[] => {
  if (pid !== 'PRJ-001') return [];
  return [
    { id: 'BL-001', projectId: pid, kind: 'material', inventoryItemId: 'INV-001', description: 'Semen Tiga Roda 50kg', qty: 720, unit: 'sak', budgetAmount: 45000000, actualAmount: 40000000 },
    { id: 'BL-002', projectId: pid, kind: 'material', inventoryItemId: 'INV-003', description: 'Keramik 60x60 Roman', qty: 110, unit: 'm²', budgetAmount: 40000000, actualAmount: 30000000 },
    { id: 'BL-003', projectId: pid, kind: 'material', inventoryItemId: 'INV-002', description: 'Besi Hollow 15x30', qty: 380, unit: 'batang', budgetAmount: 35000000, actualAmount: 22000000 },
    { id: 'BL-004', projectId: pid, kind: 'material', inventoryItemId: 'INV-004', description: 'Cat Dulux Weathershield', qty: 48, unit: 'kaleng', budgetAmount: 30000000, actualAmount: 12000000 },
    { id: 'BL-005', projectId: pid, kind: 'material', inventoryItemId: 'INV-005', description: 'Gypsum Board 120x240', qty: 460, unit: 'lembar', budgetAmount: 30000000, actualAmount: 8000000 },
    { id: 'BL-006', projectId: pid, kind: 'labor', description: 'Upah tukang harian (struktur & finishing)', qty: 150, unit: 'oh', budgetAmount: 60000000, actualAmount: 45000000 },
    { id: 'BL-007', projectId: pid, kind: 'labor', description: 'Borongan instalasi MEP', qty: 1, unit: 'paket', budgetAmount: 40000000, actualAmount: 28000000 },
    { id: 'BL-008', projectId: pid, kind: 'labor', description: 'Supervisor lapangan & QC', qty: 1, unit: 'kontrak', budgetAmount: 20000000, actualAmount: 12000000 },
  ];
};

/** Selaraskan kategori Material / Tenaga Kerja dan total spent proyek dari budgetLines */
function applyBudgetLineSyncToProject(p: Project): Project {
  const lines = p.budgetLines ?? [];
  const matLines = lines.filter(l => l.kind === 'material');
  const labLines = lines.filter(l => l.kind === 'labor');
  const matAlloc = matLines.reduce((s, l) => s + l.budgetAmount, 0);
  const labAlloc = labLines.reduce((s, l) => s + l.budgetAmount, 0);

  const budgetCategories = p.budgetCategories.map(bc => {
    const isMat = bc.name === 'Material' || bc.name === 'Bahan';
    const isLab = bc.name === 'Tenaga Kerja' || bc.name === 'Labor';
    // UX: dari tabel Realisation, user mengedit RAP/anggaran (allocated) saja.
    // Nilai realisasi (spent) seharusnya tetap berasal dari transaksi / input biaya (AddExpenseModal),
    // sehingga tidak tertimpa oleh budgetLines.actualAmount yang belum tentu terisi.
    if (isMat) return { ...bc, allocated: matAlloc };
    if (isLab) return { ...bc, allocated: labAlloc };
    return bc;
  });

  const totalBudget = budgetCategories.reduce((s, c) => s + c.allocated, 0);
  const totalSpent = budgetCategories.reduce((s, c) => s + c.spent, 0);
  return { ...p, budgetCategories, budget: totalBudget, spent: totalSpent };
}

const mkTasks = (pid: string): Task[] => {
  if (pid === 'PRJ-001') return [
    { id: 'T-001', projectId: pid, milestoneId: 'MS-001', title: 'Bongkar keramik ruang tamu', description: 'Bongkar semua keramik lama di ruang tamu 24m2.', status: 'Done', priority: 'High', assignee: 'Budi T', assignees: [{ avatar: 'BT', color: 'bg-indigo-500' }], dueDate: '20 Jan', labels: ['Demolition'], subtasks: [{ id: 's1', title: 'Area A', done: true }, { id: 's2', title: 'Area B', done: true }], comments: 3, attachments: 2, timeLogged: '16h', startDay: 0, duration: 10 },
    { id: 'T-002', projectId: pid, milestoneId: 'MS-001', title: 'Bongkar dinding partisi', description: 'Bongkar partisi ruang tengah.', status: 'Done', priority: 'Medium', assignee: 'Budi T', assignees: [{ avatar: 'BT', color: 'bg-indigo-500' }], dueDate: '25 Jan', labels: ['Demolition'], subtasks: [], comments: 1, attachments: 1, timeLogged: '8h', startDay: 5, duration: 8 },
    { id: 'T-003', projectId: pid, milestoneId: 'MS-002', title: 'Perkuatan pondasi', description: 'Pondasi batu kali area dapur.', status: 'Done', priority: 'Urgent', assignee: 'Ahmad', assignees: [{ avatar: 'AH', color: 'bg-brand-600' }], dueDate: '10 Feb', labels: ['Structure'], subtasks: [{ id: 's3', title: 'Galian', done: true }, { id: 's4', title: 'Cor', done: true }], comments: 5, attachments: 4, timeLogged: '24h', startDay: 15, duration: 15 },
    { id: 'T-004', projectId: pid, milestoneId: 'MS-002', title: 'Rangka atap baja ringan', description: 'Rangka atap baja ringan 120m2.', status: 'Done', priority: 'High', assignee: 'Ahmad', assignees: [{ avatar: 'AH', color: 'bg-brand-600' }, { avatar: 'BT', color: 'bg-indigo-500' }], dueDate: '15 Mar', labels: ['Structure'], subtasks: [{ id: 's5', title: 'Pasang rangka', done: true }, { id: 's6', title: 'Pasang genteng', done: true }], comments: 6, attachments: 3, timeLogged: '32h', startDay: 30, duration: 20 },
    { id: 'T-005', projectId: pid, milestoneId: 'MS-003', title: 'Wiring listrik lantai 1', description: 'Pemasangan kabel listrik lantai 1.', status: 'Done', priority: 'High', assignee: 'Ahmad', assignees: [{ avatar: 'AH', color: 'bg-brand-600' }], dueDate: 'Mar 20', labels: ['Electrical'], subtasks: [{ id: 's7', title: 'Tarik kabel', done: true }, { id: 's8', title: 'Pasang MCB', done: true }], comments: 4, attachments: 2, timeLogged: '20h', startDay: 50, duration: 12 },
    { id: 'T-006', projectId: pid, milestoneId: 'MS-003', title: 'Instalasi pipa air bathroom', description: 'Instalasi pipa PPR bathroom utama.', status: 'In Progress', priority: 'Urgent', assignee: 'Ahmad', assignees: [{ avatar: 'AH', color: 'bg-brand-600' }], dueDate: 'Today', labels: ['Plumbing'], subtasks: [{ id: 's9', title: 'Pipa air bersih', done: true }, { id: 's10', title: 'Pipa air kotor', done: false }, { id: 's11', title: 'Test tekanan', done: false }], comments: 8, attachments: 3, timeLogged: '12h', startDay: 55, duration: 14 },
    { id: 'T-007', projectId: pid, milestoneId: 'MS-004', title: 'Pasang keramik 60x60 ruang tamu', description: 'Pasang keramik granit 60x60 area ruang tamu 24m2.', status: 'To Do', priority: 'High', assignee: 'Budi T', assignees: [{ avatar: 'BT', color: 'bg-indigo-500' }], dueDate: 'May 1', labels: ['Tiling'], subtasks: [], comments: 2, attachments: 1, timeLogged: '0h', startDay: 70, duration: 12 },
    { id: 'T-008', projectId: pid, milestoneId: 'MS-004', title: 'Cat dinding kamar utama', description: 'Cat dinding 2 coat kamar utama.', status: 'To Do', priority: 'Medium', assignee: 'Sari', assignees: [{ avatar: 'SR', color: 'bg-rose-500' }], dueDate: 'May 10', labels: ['Painting'], subtasks: [], comments: 1, attachments: 0, timeLogged: '0h', startDay: 75, duration: 10 },
    { id: 'T-009', projectId: pid, milestoneId: 'MS-004', title: 'Plafon GRC ruang keluarga', description: 'Plafon GRC board area ruang keluarga.', status: 'Backlog', priority: 'Medium', assignee: 'Budi T', assignees: [{ avatar: 'BT', color: 'bg-indigo-500' }], dueDate: 'May 15', labels: ['Ceiling'], subtasks: [], comments: 0, attachments: 0, timeLogged: '0h', startDay: 78, duration: 10 },
    { id: 'T-010', projectId: pid, milestoneId: 'MS-005', title: 'Produksi kitchen set', description: 'Workshop produksi kitchen set custom.', status: 'Backlog', priority: 'Medium', assignee: 'Doni', assignees: [{ avatar: 'DN', color: 'bg-amber-500' }], dueDate: 'Jun 1', labels: ['Furniture'], subtasks: [], comments: 0, attachments: 0, timeLogged: '0h', startDay: 90, duration: 15 },
    { id: 'T-011', projectId: pid, milestoneId: 'MS-006', title: 'Final inspection', description: 'Inspeksi final seluruh pekerjaan.', status: 'Backlog', priority: 'High', assignee: 'Ahmad', assignees: [{ avatar: 'AH', color: 'bg-brand-600' }], dueDate: 'Jun 25', labels: ['QC'], subtasks: [], comments: 0, attachments: 0, timeLogged: '0h', startDay: 110, duration: 5 },
  ];
  return [];
};

const initialProjects: Project[] = [
  { id: 'PRJ-001', name: 'Renovasi Rumah Modern', customerId: 'CUST-001', category: 'Renovation', status: 'Active', priority: 'High', progress: 68, budget: 450000000, spent: 280000000, startDate: '2024-01-15', endDate: '2024-06-30', location: 'Kemang, Jakarta Selatan', description: 'Full home renovation including kitchen, bathroom, and living room', team: ['Ahmad', 'Budi T', 'Sari', 'Doni'], tasks: mkTasks('PRJ-001'), milestones: mkMilestones('PRJ-001'), budgetCategories: mkBudgetCats('PRJ-001'), budgetLines: mkBudgetLines('PRJ-001'), createdAt: '2024-01-10' },
  { id: 'PRJ-002', name: 'Interior Design Office', customerId: 'CUST-003', category: 'Interior', status: 'Active', priority: 'Medium', progress: 42, budget: 180000000, spent: 75000000, startDate: '2024-02-01', endDate: '2024-05-15', location: 'Sudirman, Jakarta Pusat', description: 'Modern office interior design', team: ['Sari', 'Doni'], tasks: [], milestones: [], budgetCategories: mkBudgetCats('PRJ-002'), budgetLines: mkBudgetLines('PRJ-002'), createdAt: '2024-01-28' },
  { id: 'PRJ-003', name: 'Villa Bali Resort', customerId: 'CUST-005', category: 'Construction', status: 'Active', priority: 'Urgent', progress: 25, budget: 2100000000, spent: 520000000, startDate: '2024-03-01', endDate: '2024-12-31', location: 'Ubud, Bali', description: 'Luxury resort villa', team: ['Ahmad', 'Budi T', 'Sari', 'Doni', 'Eko'], tasks: [], milestones: [], budgetCategories: mkBudgetCats('PRJ-003'), budgetLines: mkBudgetLines('PRJ-003'), createdAt: '2024-02-15' },
  { id: 'PRJ-004', name: 'Kitchen Set Custom', customerId: 'CUST-004', category: 'Furniture', status: 'Completed', priority: 'Medium', progress: 100, budget: 85000000, spent: 72000000, startDate: '2024-01-01', endDate: '2024-02-28', location: 'Surabaya, Jawa Timur', description: 'Custom kitchen set', team: ['Doni'], tasks: [], milestones: [], budgetCategories: mkBudgetCats('PRJ-004'), budgetLines: mkBudgetLines('PRJ-004'), createdAt: '2023-12-20' },
  { id: 'PRJ-005', name: 'Landscape Garden Project', customerId: 'CUST-006', category: 'Landscape', status: 'Planning', priority: 'Low', progress: 10, budget: 120000000, spent: 5000000, startDate: '2024-04-01', endDate: '2024-07-31', location: 'Bandung, Jawa Barat', description: 'Japanese garden with koi pond', team: ['Eko', 'Sari'], tasks: [], milestones: [], budgetCategories: mkBudgetCats('PRJ-005'), budgetLines: mkBudgetLines('PRJ-005'), createdAt: '2024-03-10' },
  { id: 'PRJ-006', name: 'Bathroom Renovation', customerId: 'CUST-001', category: 'Renovation', status: 'On Hold', priority: 'Low', progress: 15, budget: 55000000, spent: 8000000, startDate: '2024-03-15', endDate: '2024-05-15', location: 'Kemang, Jakarta Selatan', description: 'Master bathroom renovation', team: ['Ahmad'], tasks: [], milestones: [], budgetCategories: mkBudgetCats('PRJ-006'), budgetLines: mkBudgetLines('PRJ-006'), createdAt: '2024-03-05' },
];

const initialEstimates: Estimate[] = [
  { id: 'EST-001', projectId: 'PRJ-001', customerId: 'CUST-001', title: 'Estimasi Renovasi Rumah Modern', items: [
    { id: 'ei-1', category: 'Flooring', description: 'Pasang Keramik 60x60 Ruang Tamu', qty: 24, unit: 'm²', hpp: 85000, sellPrice: 125000 },
    { id: 'ei-2', category: 'Painting', description: 'Cat Dinding 3 Kamar', qty: 45, unit: 'm²', hpp: 25000, sellPrice: 40000 },
    { id: 'ei-3', category: 'Ceiling', description: 'Plafon Gypsum Ruang Keluarga', qty: 18, unit: 'm²', hpp: 65000, sellPrice: 95000 },
  ], contingency: 5, taxEnabled: true, status: 'Approved', createdAt: '2024-01-08' },
  { id: 'EST-002', projectId: 'PRJ-003', customerId: 'CUST-005', title: 'Estimasi Villa Bali Resort', items: [
    { id: 'ei-4', category: 'Structural', description: 'Pondasi Batu Kali', qty: 120, unit: 'm³', hpp: 450000, sellPrice: 650000 },
    { id: 'ei-5', category: 'Structural', description: 'Kolom Beton Bertulang', qty: 30, unit: 'unit', hpp: 850000, sellPrice: 1200000 },
  ], contingency: 10, taxEnabled: true, status: 'Approved', createdAt: '2024-02-10' },
];

const initialTransactions: Transaction[] = [
  { id: 'TRX-001', date: '2024-03-15', desc: 'Beli semen 50 sak @65rb', type: 'Expense', category: 'Material', amount: 3250000, projectId: 'PRJ-001', supplierId: null, status: 'Completed' },
  { id: 'TRX-002', date: '2024-03-14', desc: 'Terima DP Pak Budi 50%', type: 'Income', category: 'Client Payment', amount: 15000000, projectId: 'PRJ-001', supplierId: null, status: 'Completed' },
  { id: 'TRX-003', date: '2024-03-14', desc: 'Bayar tukang harian 5 orang @150rb', type: 'Expense', category: 'Labor', amount: 750000, projectId: 'PRJ-001', supplierId: null, status: 'Completed' },
  { id: 'TRX-004', date: '2024-03-12', desc: 'Beli besi 15x30 25pcs @45rb', type: 'Expense', category: 'Material', amount: 1125000, projectId: 'PRJ-001', supplierId: null, status: 'Completed' },
  { id: 'TRX-005', date: '2024-03-11', desc: 'Terima pelunasan CV Makmur', type: 'Income', category: 'Client Payment', amount: 25000000, projectId: 'PRJ-003', supplierId: null, status: 'Completed' },
  { id: 'TRX-006', date: '2024-03-10', desc: 'Beli cat Dulux 20 kaleng @350rb', type: 'Expense', category: 'Material', amount: 7000000, projectId: 'PRJ-001', supplierId: null, status: 'Completed' },
  { id: 'TRX-007', date: '2024-03-09', desc: 'Bayar subkon plumbing', type: 'Expense', category: 'Subcontractor', amount: 8500000, projectId: 'PRJ-001', supplierId: null, status: 'Completed' },
  { id: 'TRX-008', date: '2024-03-08', desc: 'Sewa scaffolding 1 bulan', type: 'Expense', category: 'Equipment', amount: 4500000, projectId: 'PRJ-001', supplierId: null, status: 'Completed' },
  { id: 'TRX-009', date: '2024-03-05', desc: 'Terima pembayaran tahap 2', type: 'Income', category: 'Client Payment', amount: 50000000, projectId: 'PRJ-001', supplierId: null, status: 'Completed' },
  { id: 'TRX-010', date: '2024-03-01', desc: 'Beli keramik 60x60 Roman 100m2', type: 'Expense', category: 'Material', amount: 8500000, projectId: 'PRJ-001', supplierId: null, status: 'Pending' },
];

const initialInventory: InventoryItem[] = [
  { id: 'INV-001', code: 'MTR-001', name: 'Semen Tiga Roda 50kg', category: 'Material', unit: 'sak', stock: 120, minStock: 50, buyPrice: 65000, sellPrice: 75000, supplier: 'Toko Maju' },
  { id: 'INV-002', code: 'MTR-002', name: 'Besi Hollow 15x30', category: 'Material', unit: 'batang', stock: 45, minStock: 20, buyPrice: 45000, sellPrice: 60000, supplier: 'Toko Maju' },
  { id: 'INV-003', code: 'MTR-003', name: 'Keramik 60x60 Roman', category: 'Material', unit: 'm²', stock: 200, minStock: 50, buyPrice: 85000, sellPrice: 125000, supplier: 'TB Sinar' },
  { id: 'INV-004', code: 'MTR-004', name: 'Cat Dulux Weathershield', category: 'Material', unit: 'kaleng', stock: 8, minStock: 10, buyPrice: 350000, sellPrice: 420000, supplier: 'Toko Cat' },
  { id: 'INV-005', code: 'MTR-005', name: 'Gypsum Board 120x240', category: 'Material', unit: 'lembar', stock: 35, minStock: 15, buyPrice: 65000, sellPrice: 95000, supplier: 'TB Sinar' },
];

const initialUsers: User[] = [
  { id: 'USR-001', name: 'Super Admin', email: 'admin@omnifyi.com', role: 'Admin' },
  { id: 'USR-002', name: 'HR Manager', email: 'hr@omnifyi.com', role: 'HR' },
  { id: 'USR-003', name: 'Finance Lead', email: 'finance@omnifyi.com', role: 'Finance' },
  { id: 'USR-004', name: 'Ahmad Bagus', email: 'ahmad@omnifyi.com', role: 'Employee' },
  { id: 'USR-005', name: 'Budi Santoso', email: 'budi@omnifyi.com', role: 'Employee' },
];

const initialEmployees: Employee[] = [
  { id: 'EMP-001', userId: 'USR-004', position: 'Project Manager', joinDate: '2023-01-15', baseSalary: 12000000, bankAccount: 'BCA 1234567890', status: 'Active', salaryScheme: 'monthly', paymentCycle: 'monthly', department: 'Operations' },
  { id: 'EMP-002', userId: 'USR-005', position: 'Field Supervisor', joinDate: '2023-02-01', baseSalary: 8500000, dailyRate: 400000, bankAccount: 'Mandiri 0987654321', status: 'Active', salaryScheme: 'daily', paymentCycle: 'weekly', department: 'Field' },
];

const initialAttendance: Attendance[] = [
  { id: 'ATT-001', userId: 'USR-004', date: '2024-03-15', checkInTime: '07:55', checkOutTime: '17:10', status: 'Present', notes: 'Site PRJ-001' },
  { id: 'ATT-002', userId: 'USR-005', date: '2024-03-15', checkInTime: '08:35', checkOutTime: '17:00', status: 'Late', notes: 'Macet' },
  { id: 'ATT-003', userId: 'USR-004', date: '2024-03-14', checkInTime: '07:50', checkOutTime: '17:05', status: 'Present' },
  { id: 'ATT-004', userId: 'USR-005', date: '2024-03-14', checkInTime: '08:00', checkOutTime: '17:15', status: 'Present' },
  { id: 'ATT-005', userId: 'USR-004', date: '2024-03-13', checkInTime: '07:45', checkOutTime: '18:30', status: 'Present', notes: 'Lembur finishing' },
  { id: 'ATT-006', userId: 'USR-005', date: '2024-03-13', status: 'Leave', notes: 'Cuti tahunan' },
  { id: 'ATT-007', userId: 'USR-004', date: '2024-03-12', checkInTime: '08:10', checkOutTime: '17:00', status: 'Late' },
  { id: 'ATT-008', userId: 'USR-005', date: '2024-03-12', checkInTime: '07:58', checkOutTime: '17:00', status: 'Present' },
  { id: 'ATT-009', userId: 'USR-004', date: '2024-03-11', checkInTime: '07:50', checkOutTime: '17:00', status: 'Present' },
  { id: 'ATT-010', userId: 'USR-005', date: '2024-03-11', status: 'Sick', notes: 'Sakit demam' },
];

const initialLeaveRequests: LeaveRequest[] = [
  { id: 'LV-001', userId: 'USR-005', type: 'Annual', startDate: '2024-03-13', endDate: '2024-03-13', days: 1, reason: 'Keperluan keluarga', status: 'Approved', approvedBy: 'USR-002', approvedAt: '2024-03-12', createdAt: '2024-03-11' },
  { id: 'LV-002', userId: 'USR-004', type: 'Sick', startDate: '2024-03-20', endDate: '2024-03-21', days: 2, reason: 'Sakit flu berat', status: 'Pending', createdAt: '2024-03-19' },
  { id: 'LV-003', userId: 'USR-005', type: 'Emergency', startDate: '2024-02-05', endDate: '2024-02-05', days: 1, reason: 'Keluarga masuk RS', status: 'Approved', approvedBy: 'USR-001', approvedAt: '2024-02-05', createdAt: '2024-02-05' },
];

const initialPayroll: PayrollRecord[] = [
  {
    id: 'PAY-001', employeeId: 'EMP-001', userId: 'USR-004', period: '2024-02',
    periodType: 'monthly', salaryScheme: 'monthly',
    baseSalary: 12000000, workingDays: 22, presentDays: 20, lateDays: 1, leaveDays: 1, absentDays: 0,
    overtimeHours: 8, overtimePay: 545000,
    allowances: [{ name: 'Transport', amount: 750000 }, { name: 'Makan', amount: 550000 }],
    deductions: [{ name: 'BPJS Kesehatan', amount: 480000 }, { name: 'BPJS TK', amount: 240000 }],
    grossPay: 13845000, netPay: 13125000, status: 'Paid', processedAt: '2024-03-01', processedBy: 'USR-003',
    approvedBy: 'USR-001', approvedAt: '2024-02-28', paidAt: '2024-03-01',
  },
  {
    id: 'PAY-002', employeeId: 'EMP-002', userId: 'USR-005', period: '2024-02',
    periodType: 'monthly', salaryScheme: 'daily', dailyRate: 400000,
    baseSalary: 8500000, workingDays: 22, presentDays: 19, lateDays: 2, leaveDays: 1, absentDays: 0,
    overtimeHours: 4, overtimePay: 194000,
    allowances: [{ name: 'Transport', amount: 500000 }, { name: 'Makan', amount: 400000 }],
    deductions: [{ name: 'BPJS Kesehatan', amount: 340000 }, { name: 'BPJS TK', amount: 170000 }, { name: 'Potongan Telat', amount: 100000 }],
    grossPay: 9594000, netPay: 8984000, status: 'Paid', processedAt: '2024-03-01', processedBy: 'USR-003',
    approvedBy: 'USR-001', approvedAt: '2024-02-28', paidAt: '2024-03-01',
  },
  {
    id: 'PAY-003', employeeId: 'EMP-002', userId: 'USR-005', period: '2024-W10',
    periodType: 'weekly', salaryScheme: 'daily', dailyRate: 400000,
    baseSalary: 0, workingDays: 6, presentDays: 5, lateDays: 1, leaveDays: 0, absentDays: 0,
    overtimeHours: 2, overtimePay: 120000,
    projectWages: [
      { projectId: 'PRJ-001', projectName: 'Renovasi Rumah Modern', role: 'Supervisor', daysWorked: 5, dailyRate: 400000, totalAmount: 2000000 },
    ],
    allowances: [{ name: 'Makan', amount: 150000 }],
    deductions: [{ name: 'Potongan Telat', amount: 25000 }],
    grossPay: 2270000, netPay: 2245000, status: 'Paid', processedAt: '2024-03-08', processedBy: 'USR-003',
    paidAt: '2024-03-08',
  },
];

// ===== COMPANY INFO =====
const initialCompanyInfo: CompanyInfo = {
  name: 'Omnifyi',
  tagline: 'Infinite Business Possibilities',
  vision: 'Menjadi platform manajemen bisnis terdepan yang memberdayakan UMKM dan perusahaan jasa di Indonesia untuk berkembang secara berkelanjutan melalui teknologi cerdas.',
  mission: [
    'Menyediakan solusi all-in-one yang mudah digunakan untuk pengelolaan proyek, keuangan, dan tim',
    'Mengintegrasikan kecerdasan buatan untuk otomatisasi dan pengambilan keputusan bisnis yang lebih baik',
    'Membangun ekosistem digital yang transparan dan terpercaya untuk semua stakeholder',
    'Mendukung pertumbuhan bisnis dengan insight data yang actionable dan real-time',
  ],
  values: [
    { title: 'Integritas', description: 'Transparansi dan kejujuran dalam setiap tindakan', icon: '🎯' },
    { title: 'Inovasi', description: 'Selalu mencari cara lebih baik untuk melayani', icon: '💡' },
    { title: 'Kolaborasi', description: 'Bersama tim dan klien mencapai tujuan bersama', icon: '🤝' },
    { title: 'Keunggulan', description: 'Komitmen pada kualitas dan hasil terbaik', icon: '⭐' },
  ],
  address: 'Jl. Sudirman No. 123, Jakarta Pusat 10220',
  phone: '+62 21 5555 1234',
  email: 'hello@omnifyi.com',
  website: 'https://omnifyi.com',
};

const initialPolicies: CompanyPolicy[] = [
  {
    id: 'POL-001',
    title: 'Kebijakan Kehadiran & Jam Kerja',
    category: 'Attendance',
    content: `**Jam Kerja Standard:**
- Senin - Jumat: 08:00 - 17:00 WIB
- Istirahat: 12:00 - 13:00 WIB
- Total: 8 jam kerja efektif per hari

**Ketentuan Absensi:**
- Check-in wajib dilakukan sebelum pukul 08:00
- Keterlambatan >15 menit akan tercatat sebagai "Terlambat"
- Keterlambatan >3x dalam sebulan akan ada pemotongan insentif kehadiran

**Lembur:**
- Lembur harus disetujui atasan minimal H-1
- Kompensasi lembur: 1.5x gaji per jam (hari kerja), 2x (hari libur)`,
    effectiveDate: '2024-01-01',
    version: '2.0',
  },
  {
    id: 'POL-002',
    title: 'Kebijakan Cuti & Izin',
    category: 'Leave',
    content: `**Jenis Cuti:**
1. **Cuti Tahunan**: 12 hari/tahun (setelah masa kerja 1 tahun)
2. **Cuti Sakit**: Sesuai rekomendasi dokter (dengan surat keterangan)
3. **Cuti Darurat**: Maksimal 3 hari untuk keperluan mendesak
4. **Cuti Melahirkan**: 3 bulan (sesuai UU Ketenagakerjaan)

**Prosedur Pengajuan:**
- Ajukan via aplikasi Omnifyi minimal 3 hari sebelumnya
- Cuti >3 hari wajib approval dari HR Manager
- Cuti mendadak wajib konfirmasi via telepon ke atasan`,
    effectiveDate: '2024-01-01',
    version: '1.5',
  },
  {
    id: 'POL-003',
    title: 'Kode Etik & Perilaku Karyawan',
    category: 'Conduct',
    content: `**Standar Perilaku:**
- Menjaga integritas dan profesionalisme dalam bekerja
- Menghormati rekan kerja, klien, dan semua stakeholder
- Menjaga kerahasiaan informasi perusahaan dan klien
- Tidak melakukan diskriminasi dalam bentuk apapun

**Penggunaan Aset Perusahaan:**
- Gunakan fasilitas kantor hanya untuk keperluan kerja
- Jaga dan rawat peralatan kerja yang dipercayakan
- Laporkan kerusakan atau kehilangan segera ke admin`,
    effectiveDate: '2024-01-01',
    version: '1.0',
  },
  {
    id: 'POL-004',
    title: 'Kebijakan Keselamatan Kerja (K3)',
    category: 'Safety',
    content: `**Keselamatan di Lapangan:**
- Wajib menggunakan APD (Alat Pelindung Diri) sesuai standar
- Ikuti prosedur keselamatan yang berlaku di setiap site
- Laporkan kondisi berbahaya ke supervisor segera

**APD Wajib:**
- Helm keselamatan (area konstruksi)
- Sepatu safety (semua site)
- Rompi reflektor (outdoor)
- Sarung tangan kerja (sesuai kebutuhan)`,
    effectiveDate: '2024-01-01',
    version: '1.2',
  },
];

const initialAnnouncements: Announcement[] = [
  {
    id: 'ANN-001',
    title: '🎉 Target Q1 Tercapai!',
    content: 'Selamat kepada seluruh tim! Kita berhasil mencapai target revenue Q1 2024 sebesar 120%. Terima kasih atas kerja keras dan dedikasi semua. Bonus pencapaian akan dibagikan bersama gaji bulan ini.',
    type: 'Celebration',
    authorId: 'USR-001',
    authorName: 'Super Admin',
    publishedAt: '2024-03-15T09:00:00',
    pinned: true,
  },
  {
    id: 'ANN-002',
    title: '📋 Jadwal Training Bulan April',
    content: 'Akan diadakan training internal untuk semua karyawan:\n\n1. **Safety & K3** - 5 April 2024 (wajib untuk tim lapangan)\n2. **Digital Tools Update** - 10 April 2024 (semua divisi)\n3. **Leadership Workshop** - 15 April 2024 (supervisor ke atas)\n\nPendaftaran via form di grup WhatsApp.',
    type: 'Info',
    authorId: 'USR-002',
    authorName: 'HR Manager',
    publishedAt: '2024-03-12T10:30:00',
    pinned: false,
  },
  {
    id: 'ANN-003',
    title: '⚠️ Pemeliharaan Server Akhir Pekan',
    content: 'Akan ada maintenance server pada Sabtu, 20 Maret 2024 pukul 22:00 - 06:00 WIB. Selama periode ini, akses ke aplikasi mungkin terganggu. Pastikan semua data penting sudah tersimpan.',
    type: 'Warning',
    authorId: 'USR-001',
    authorName: 'Super Admin',
    publishedAt: '2024-03-10T14:00:00',
    expiresAt: '2024-03-21T00:00:00',
    pinned: false,
  },
];

const initialEmployeeDocuments: EmployeeDocument[] = [
  { id: 'DOC-001', userId: 'USR-004', title: 'Kontrak Kerja 2024', type: 'Contract', fileUrl: '/docs/contract-2024.pdf', uploadedAt: '2024-01-02', expiresAt: '2024-12-31' },
  { id: 'DOC-002', userId: 'USR-004', title: 'KTP', type: 'ID', fileUrl: '/docs/ktp.pdf', uploadedAt: '2023-01-15' },
  { id: 'DOC-003', userId: 'USR-004', title: 'Slip Gaji Feb 2024', type: 'Payslip', fileUrl: '/docs/payslip-feb-2024.pdf', uploadedAt: '2024-03-01' },
  { id: 'DOC-004', userId: 'USR-004', title: 'Sertifikat K3', type: 'Certificate', fileUrl: '/docs/k3-cert.pdf', uploadedAt: '2023-06-10', expiresAt: '2025-06-10' },
  { id: 'DOC-005', userId: 'USR-005', title: 'Kontrak Kerja 2024', type: 'Contract', fileUrl: '/docs/contract-2024.pdf', uploadedAt: '2024-01-02', expiresAt: '2024-12-31' },
  { id: 'DOC-006', userId: 'USR-005', title: 'Slip Gaji Feb 2024', type: 'Payslip', fileUrl: '/docs/payslip-feb-2024.pdf', uploadedAt: '2024-03-01' },
];

// ============================================
// CHART OF ACCOUNTS (COA) - Initial Data
// ============================================
const initialAccounts: Account[] = [
  // ASSETS (1-XXXX)
  { id: 'ACC-1001', code: '1-1001', name: 'Kas', category: 'asset', subCategory: 'cash', description: 'Kas di tangan', balance: 25000000, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-1002', code: '1-1002', name: 'Bank BCA', category: 'asset', subCategory: 'bank', description: 'Rekening BCA Operasional', balance: 150000000, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-1003', code: '1-1003', name: 'Bank Mandiri', category: 'asset', subCategory: 'bank', description: 'Rekening Mandiri Payroll', balance: 75000000, isActive: true, isSystem: false, createdAt: '2024-01-01' },
  { id: 'ACC-1101', code: '1-1101', name: 'Piutang Usaha', category: 'asset', subCategory: 'receivable', description: 'Piutang dari customer', balance: 45000000, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-1102', code: '1-1102', name: 'Piutang Project', category: 'asset', subCategory: 'receivable', description: 'Piutang terkait project', balance: 85000000, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-1201', code: '1-1201', name: 'Persediaan Material', category: 'asset', subCategory: 'inventory', description: 'Stok material bangunan', balance: 35000000, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-1202', code: '1-1202', name: 'Persediaan Alat', category: 'asset', subCategory: 'inventory', description: 'Stok peralatan kerja', balance: 12000000, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-1301', code: '1-1301', name: 'Peralatan Kerja', category: 'asset', subCategory: 'equipment', description: 'Aset peralatan kerja', balance: 45000000, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-1302', code: '1-1302', name: 'Kendaraan', category: 'asset', subCategory: 'equipment', description: 'Kendaraan operasional', balance: 120000000, isActive: true, isSystem: false, createdAt: '2024-01-01' },
  { id: 'ACC-1401', code: '1-1401', name: 'Sewa Dibayar Dimuka', category: 'asset', subCategory: 'prepaid', description: 'Prepaid rent/sewa', balance: 15000000, isActive: true, isSystem: false, createdAt: '2024-01-01' },
  
  // LIABILITIES (2-XXXX)
  { id: 'ACC-2001', code: '2-2001', name: 'Hutang Usaha', category: 'liability', subCategory: 'payable', description: 'Hutang ke supplier', balance: 35000000, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-2002', code: '2-2002', name: 'Hutang Project', category: 'liability', subCategory: 'project_debt', description: 'Hutang terkait project', balance: 20000000, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-2003', code: '2-2003', name: 'Hutang Gaji', category: 'liability', subCategory: 'payable', description: 'Gaji yang belum dibayar', balance: 0, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-2101', code: '2-2101', name: 'Hutang Lain-lain', category: 'liability', subCategory: 'other_liability', description: 'Hutang lainnya', balance: 5000000, isActive: true, isSystem: false, createdAt: '2024-01-01' },
  
  // EQUITY (3-XXXX)
  { id: 'ACC-3001', code: '3-3001', name: 'Modal Pemilik', category: 'equity', subCategory: 'capital', description: 'Modal awal pemilik', balance: 500000000, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-3002', code: '3-3002', name: 'Laba Ditahan', category: 'equity', subCategory: 'retained_earnings', description: 'Akumulasi laba tahun sebelumnya', balance: 75000000, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-3003', code: '3-3003', name: 'Laba Berjalan', category: 'equity', subCategory: 'current_earnings', description: 'Laba/rugi tahun berjalan', balance: 42500000, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  
  // INCOME (4-XXXX)
  { id: 'ACC-4001', code: '4-4001', name: 'Pendapatan Jasa', category: 'income', subCategory: 'service', description: 'Pendapatan dari jasa konstruksi/renovasi', balance: 0, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-4002', code: '4-4002', name: 'Pendapatan Project', category: 'income', subCategory: 'service', description: 'DP dan termin project', balance: 0, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-4003', code: '4-4003', name: 'Pendapatan Lain-lain', category: 'income', subCategory: 'other_income', description: 'Pendapatan non-operasional', balance: 0, isActive: true, isSystem: false, createdAt: '2024-01-01' },
  
  // EXPENSES (5-XXXX)
  { id: 'ACC-5001', code: '5-5001', name: 'Beban Material', category: 'expense', subCategory: 'cogs', description: 'Biaya material project', balance: 0, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-5002', code: '5-5002', name: 'Beban Tenaga Kerja', category: 'expense', subCategory: 'cogs', description: 'Upah tukang dan pekerja', balance: 0, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-5003', code: '5-5003', name: 'Beban Subkontraktor', category: 'expense', subCategory: 'cogs', description: 'Biaya subkon', balance: 0, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-5101', code: '5-5101', name: 'Beban Gaji', category: 'expense', subCategory: 'payroll_expense', description: 'Gaji karyawan tetap', balance: 0, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-5102', code: '5-5102', name: 'Beban Lembur', category: 'expense', subCategory: 'payroll_expense', description: 'Uang lembur', balance: 0, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-5201', code: '5-5201', name: 'Beban Operasional', category: 'expense', subCategory: 'operating', description: 'Biaya operasional umum', balance: 0, isActive: true, isSystem: true, createdAt: '2024-01-01' },
  { id: 'ACC-5202', code: '5-5202', name: 'Beban Transportasi', category: 'expense', subCategory: 'operating', description: 'BBM, tol, parkir', balance: 0, isActive: true, isSystem: false, createdAt: '2024-01-01' },
  { id: 'ACC-5203', code: '5-5203', name: 'Beban Utilitas', category: 'expense', subCategory: 'operating', description: 'Listrik, air, internet', balance: 0, isActive: true, isSystem: false, createdAt: '2024-01-01' },
  { id: 'ACC-5301', code: '5-5301', name: 'Beban Lain-lain', category: 'expense', subCategory: 'other_expense', description: 'Biaya tidak terduga', balance: 0, isActive: true, isSystem: false, createdAt: '2024-01-01' },
];

// ============================================
// RECEIVABLES & PAYABLES - Initial Data
// ============================================
const initialReceivables: Receivable[] = [
  {
    id: 'RCV-001',
    type: 'customer',
    customerId: 'CUST-001',
    customerName: 'Pak Budi Santoso',
    projectId: 'PRJ-001',
    projectName: 'Renovasi Rumah Modern',
    description: 'Sisa pembayaran termin 2 - Renovasi Rumah',
    totalAmount: 45000000,
    paidAmount: 20000000,
    outstandingAmount: 25000000,
    invoiceDate: '2024-02-15',
    dueDate: '2024-03-15',
    status: 'partial',
    payments: [
      { id: 'PAY-001', amount: 20000000, date: '2024-02-20', method: 'transfer', reference: 'TRF-20240220', recordedBy: 'USR-001' }
    ],
    createdAt: '2024-02-15',
    createdBy: 'USR-001'
  },
  {
    id: 'RCV-002',
    type: 'customer',
    customerId: 'CUST-002',
    customerName: 'Bu Siti Rahma',
    projectId: 'PRJ-003',
    projectName: 'Interior Minimalis',
    description: 'Pelunasan project interior',
    totalAmount: 35000000,
    paidAmount: 0,
    outstandingAmount: 35000000,
    invoiceDate: '2024-03-01',
    dueDate: '2024-03-31',
    status: 'open',
    payments: [],
    createdAt: '2024-03-01',
    createdBy: 'USR-001'
  },
  {
    id: 'RCV-003',
    type: 'project',
    projectId: 'PRJ-002',
    projectName: 'Pembangunan Ruko',
    description: 'DP Project Ruko 30%',
    totalAmount: 150000000,
    paidAmount: 150000000,
    outstandingAmount: 0,
    invoiceDate: '2024-01-10',
    dueDate: '2024-01-20',
    status: 'paid',
    payments: [
      { id: 'PAY-002', amount: 150000000, date: '2024-01-15', method: 'transfer', reference: 'TRF-20240115', recordedBy: 'USR-001' }
    ],
    createdAt: '2024-01-10',
    createdBy: 'USR-001'
  }
];

const initialPayables: Payable[] = [
  {
    id: 'PAY-001',
    type: 'supplier',
    supplierId: 'SUP-001',
    supplierName: 'Toko Bangunan Maju Jaya',
    projectId: 'PRJ-001',
    projectName: 'Renovasi Rumah Modern',
    description: 'Pembelian material semen, pasir, bata',
    totalAmount: 15000000,
    paidAmount: 10000000,
    outstandingAmount: 5000000,
    invoiceDate: '2024-02-10',
    dueDate: '2024-03-10',
    status: 'partial',
    payments: [
      { id: 'PAYM-001', amount: 10000000, date: '2024-02-25', method: 'transfer', reference: 'TRF-OUT-001', recordedBy: 'USR-001' }
    ],
    createdAt: '2024-02-10',
    createdBy: 'USR-001'
  },
  {
    id: 'PAY-002',
    type: 'supplier',
    supplierId: 'SUP-002',
    supplierName: 'CV Besi Prima',
    description: 'Pembelian besi konstruksi',
    totalAmount: 25000000,
    paidAmount: 0,
    outstandingAmount: 25000000,
    invoiceDate: '2024-03-05',
    dueDate: '2024-04-05',
    status: 'open',
    payments: [],
    createdAt: '2024-03-05',
    createdBy: 'USR-001'
  },
  {
    id: 'PAY-003',
    type: 'project',
    projectId: 'PRJ-002',
    projectName: 'Pembangunan Ruko',
    toProjectId: 'PRJ-001',
    toProjectName: 'Renovasi Rumah Modern',
    description: 'Pinjaman dana antar project',
    totalAmount: 10000000,
    paidAmount: 0,
    outstandingAmount: 10000000,
    invoiceDate: '2024-02-20',
    dueDate: '2024-04-20',
    status: 'open',
    payments: [],
    createdAt: '2024-02-20',
    createdBy: 'USR-001'
  }
];

// ===== WORK HOURS HELPER =====
export function calculateWorkHours(checkIn?: string, checkOut?: string): { hours: number; minutes: number; overtime: number } {
  if (!checkIn || !checkOut) return { hours: 0, minutes: 0, overtime: 0 };
  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  const totalMin = (outH * 60 + outM) - (inH * 60 + inM);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  const standardHours = 8;
  const overtime = Math.max(0, hours - standardHours);
  return { hours, minutes, overtime };
}

export function isLateCheckIn(checkIn?: string, threshold: string = '08:00'): boolean {
  if (!checkIn) return false;
  return checkIn > threshold;
}

// ===== CONTEXT =====
interface DataStore {
  currentUser: User | null;
  users: User[];
  employees: Employee[];
  attendance: Attendance[];
  workLogs: WorkLog[];
  customers: Customer[];
  projects: Project[];
  estimates: Estimate[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  activityLog: ActivityLog[];

  setCurrentUser: (user: User | null) => void;
  getCustomer: (id: string) => Customer | undefined;
  getProject: (id: string) => Project | undefined;
  getProjectsByCustomer: (customerId: string) => Project[];
  getEstimatesByProject: (projectId: string) => Estimate[];
  getEstimatesByCustomer: (customerId: string) => Estimate[];
  getTransactionsByProject: (projectId: string) => Transaction[];

  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  addProject: (p: Omit<Project, 'id' | 'createdAt' | 'tasks' | 'milestones' | 'budgetCategories'>) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  archiveProject: (id: string, reason?: string) => void;
  restoreProject: (id: string) => void;
  deleteProjectPermanently: (id: string) => void;
  getArchivedProjects: () => Project[];
  addEstimate: (e: Omit<Estimate, 'id' | 'createdAt'>) => Estimate;
  updateEstimate: (id: string, data: Partial<Estimate>) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => Transaction;
  updateInventoryStock: (itemId: string, delta: number) => void;
  addTask: (projectId: string, task: Omit<Task, 'id' | 'projectId'>) => void;
  updateTask: (projectId: string, taskId: string, data: Partial<Task>) => void;
  addMilestone: (projectId: string, m: Omit<Milestone, 'id' | 'projectId' | 'order' | 'checklist' | 'progress' | 'status'>) => Milestone;
  updateMilestone: (projectId: string, milestoneId: string, data: Partial<Milestone>) => void;
  toggleMilestoneCheck: (projectId: string, milestoneId: string, checkId: string) => void;
  addMilestoneCheckItem: (projectId: string, milestoneId: string, title: string) => void;
  updateBudgetCategory: (projectId: string, catId: string, data: Partial<BudgetCategory>) => void;
  addProjectBudgetLine: (projectId: string, line: Omit<ProjectBudgetLine, 'id' | 'projectId'>) => void;
  updateProjectBudgetLine: (projectId: string, lineId: string, data: Partial<ProjectBudgetLine>) => void;
  removeProjectBudgetLine: (projectId: string, lineId: string) => void;
  /** Tambah baris bahan dari item estimator proyek (HPP×qty = RAP; hindari duplikat deskripsi+qty+satuan) */
  importProjectBudgetLinesFromEstimates: (projectId: string) => number;
  addActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  renameProject: (id: string, newName: string) => void;
  transferBudget: (fromId: string, toId: string, amount: number) => void;

  // HR / Attendance / WorkLog Methods
  leaveRequests: LeaveRequest[];
  payrollRecords: PayrollRecord[];
  taskComments: TaskComment[];
  getEmployeeByUserId: (userId: string) => Employee | undefined;
  getAttendance: (userId?: string, date?: string) => Attendance[];
  checkIn: (location: { lat: number, long: number }, photoUrl?: string, notes?: string) => void;
  checkOut: (notes?: string) => void;
  addWorkLog: (log: Omit<WorkLog, 'id' | 'userId' | 'createdAt'>) => void;

  // Leave Management
  getLeaveRequests: (userId?: string) => LeaveRequest[];
  submitLeave: (req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => LeaveRequest;
  approveLeave: (leaveId: string, approved: boolean) => void;

  // Payroll
  getPayroll: (userId?: string, period?: string) => PayrollRecord[];
  computePayroll: (employeeId: string, period: string) => PayrollRecord;
  getAllPayroll: () => PayrollRecord[];
  approvePayroll: (payrollId: string) => void;
  processPayroll: (payrollId: string) => void;
  markPayrollPaid: (payrollId: string) => void;
  generatePayrollForPeriod: (period: string, periodType: 'monthly' | 'weekly') => PayrollRecord[];
  addProjectWageToPayroll: (payrollId: string, wage: Omit<ProjectWage, 'totalAmount'>) => void;
  
  // Payroll Finance Integration
  getPayrollSummary: () => { 
    totalPaid: number; 
    totalPending: number; 
    operationalPayroll: number;
    projectLabor: number;
    thisMonth: number;
    lastMonth: number;
  };
  getPayrollTransactions: () => Transaction[];
  getProjectLaborCosts: (projectId: string) => { total: number; breakdown: { name: string; amount: number; period: string }[] };

  // Permission
  canAccess: (module: AppModule, action?: keyof RolePermission) => boolean;
  getWorkLogsByTask: (taskId: string) => WorkLog[];
  getWorkLogsByUser: (userId: string) => WorkLog[];
  getTaskComments: (taskId: string) => TaskComment[];
  addTaskComment: (taskId: string, text: string) => void;

  // Company Info & Policies
  companyInfo: CompanyInfo;
  policies: CompanyPolicy[];
  announcements: Announcement[];
  employeeDocuments: EmployeeDocument[];
  getMyDocuments: () => EmployeeDocument[];
  getMyPayroll: () => PayrollRecord[];
  getMyAttendanceHistory: (days?: number) => Attendance[];
  getCurrentMonthSalaryEstimate: () => { gross: number; net: number; breakdown: { label: string; amount: number; type: 'add' | 'sub' }[]; presentDays?: number; lateDays?: number; leaveDays?: number; sickDays?: number };
  
  // Work Hours & Leave Balance
  getWorkHoursSummary: (period?: 'daily' | 'weekly' | 'monthly') => { totalHours: number; totalOvertime: number; avgDaily: number; targetHours: number; percentage: number; daysWorked?: number };
  getMyLeaveRequests: () => LeaveRequest[];
  getLeaveBalance: () => { annual: number; sick: number; emergency: number; used: { annual: number; sick: number; emergency: number; izin: number } };

  // ============================================
  // CHART OF ACCOUNTS (COA)
  // ============================================
  accounts: Account[];
  getAccountsByCategory: (category: AccountCategory) => Account[];
  getAccountBalance: (accountId: string) => number;
  getTotalByCategory: (category: AccountCategory) => number;
  addAccount: (a: Omit<Account, 'id' | 'createdAt' | 'balance'>) => Account;
  updateAccountBalance: (accountId: string, amount: number, isDebit: boolean) => void;

  // ============================================
  // RECEIVABLES & PAYABLES
  // ============================================
  receivables: Receivable[];
  payables: Payable[];
  
  // Receivables
  getReceivables: (filters?: { status?: DebtStatus; type?: DebtType; projectId?: string; customerId?: string }) => Receivable[];
  getReceivablesSummary: () => { total: number; outstanding: number; overdue: number; overdueCount: number; paidThisMonth: number };
  addReceivable: (r: Omit<Receivable, 'id' | 'createdAt' | 'status' | 'payments' | 'paidAmount' | 'outstandingAmount'>) => Receivable;
  recordReceivablePayment: (receivableId: string, payment: Omit<PaymentRecord, 'id' | 'recordedBy'>) => void;
  
  // Payables
  getPayables: (filters?: { status?: DebtStatus; type?: DebtType; projectId?: string; supplierId?: string }) => Payable[];
  getPayablesSummary: () => { total: number; outstanding: number; overdue: number; overdueCount: number; paidThisMonth: number };
  addPayable: (p: Omit<Payable, 'id' | 'createdAt' | 'status' | 'payments' | 'paidAmount' | 'outstandingAmount'>) => Payable;
  recordPayablePayment: (payableId: string, payment: Omit<PaymentRecord, 'id' | 'recordedBy'>) => void;
  
  // Inter-project debt
  createInterProjectDebt: (fromProjectId: string, toProjectId: string, amount: number, description: string, dueDate: string) => { receivable: Receivable; payable: Payable };
  settleInterProjectDebt: (payableId: string, amount: number) => void;

  // ============================================
  // FINANCIAL REPORTS
  // ============================================
  // Profit & Loss Report
  getProfitLossReport: (startDate?: string, endDate?: string, projectId?: string) => ProfitLossReport;
  // Cash Flow Report  
  getCashFlowReport: (startDate?: string, endDate?: string) => CashFlowReport;
  // Balance Sheet
  getBalanceSheet: (asOfDate?: string) => BalanceSheetReport;
  // Project Financial Report
  getProjectFinancialReport: (projectId: string) => ProjectFinancialReport;
  // Receivables/Payables Aging Report
  getAgingReport: (type: 'receivables' | 'payables') => AgingReport;
  // Transaction Summary
  getTransactionSummary: (startDate?: string, endDate?: string, groupBy?: 'day' | 'week' | 'month' | 'category' | 'project') => TransactionSummaryReport;
}

const DataContext = createContext<DataStore | null>(null);

let nextId = 200;
const genId = (prefix: string) => `${prefix}-${String(++nextId).padStart(3, '0')}`;

export function DataProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(initialUsers[0]);
  const [users] = useState<User[]>(initialUsers);
  const [employees] = useState<Employee[]>(initialEmployees);
  const [attendance, setAttendance] = useState<Attendance[]>(initialAttendance);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(initialPayroll);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [estimates, setEstimates] = useState<Estimate[]>(initialEstimates);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [companyInfo] = useState<CompanyInfo>(initialCompanyInfo);
  const [policies] = useState<CompanyPolicy[]>(initialPolicies);
  const [announcements] = useState<Announcement[]>(initialAnnouncements);
  const [employeeDocuments] = useState<EmployeeDocument[]>(initialEmployeeDocuments);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [receivables, setReceivables] = useState<Receivable[]>(initialReceivables);
  const [payables, setPayables] = useState<Payable[]>(initialPayables);

  const getCustomer = useCallback((id: string) => customers.find(c => c.id === id), [customers]);
  const getProject = useCallback((id: string) => projects.find(p => p.id === id), [projects]);
  const getProjectsByCustomer = useCallback((cid: string) => projects.filter(p => p.customerId === cid), [projects]);
  const getEstimatesByProject = useCallback((pid: string) => estimates.filter(e => e.projectId === pid), [estimates]);
  const getEstimatesByCustomer = useCallback((cid: string) => estimates.filter(e => e.customerId === cid), [estimates]);
  const getTransactionsByProject = useCallback((pid: string) => transactions.filter(t => t.projectId === pid), [transactions]);

  const addActivity = useCallback((log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const enriched = {
      ...log,
      id: genId('LOG'),
      timestamp: new Date().toISOString(),
      actorId: log.actorId || currentUser?.id,
      actorName: log.actorName || currentUser?.name,
    };
    setActivityLog(prev => [enriched, ...prev]);
  }, [currentUser]);

  const addCustomer = useCallback((c: Omit<Customer, 'id' | 'createdAt'>) => {
    const newC: Customer = { ...c, id: genId('CUST'), createdAt: new Date().toISOString().split('T')[0] };
    setCustomers(prev => [...prev, newC]);
    addActivity({ type: 'crm', action: 'Customer Added', detail: `${newC.name} (${newC.company})`, entityId: newC.id });
    return newC;
  }, [addActivity]);

  const updateCustomer = useCallback((id: string, data: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedBy: currentUser?.id } : c));
  }, [currentUser]);

  const addProject = useCallback((p: Omit<Project, 'id' | 'createdAt' | 'tasks' | 'milestones' | 'budgetCategories'>) => {
    const newP: Project = {
      ...p,
      id: genId('PRJ'),
      tasks: [],
      milestones: [],
      budgetCategories: mkBudgetCats(''),
      budgetLines: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedBy: currentUser?.id,
    };
    setProjects(prev => [...prev, newP]);
    addActivity({ type: 'project', action: 'Project Created', detail: newP.name, entityId: newP.id });
    return newP;
  }, [addActivity, currentUser]);

  const updateProject = useCallback((id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedBy: currentUser?.id } : p));
  }, [currentUser]);

  const archiveProject = useCallback((id: string, reason?: string) => {
    const project = projects.find(p => p.id === id);
    setProjects(prev => prev.map(p => p.id === id ? { 
      ...p, 
      archivedAt: new Date().toISOString(),
      archiveReason: reason || 'Diarsipkan oleh pengguna',
      updatedBy: currentUser?.id 
    } : p));
    addActivity({ 
      type: 'project', 
      action: 'Project Archived', 
      detail: `"${project?.name}" diarsipkan. Akan dihapus permanen setelah 30 hari.`, 
      entityId: id 
    });
  }, [projects, currentUser, addActivity]);

  const restoreProject = useCallback((id: string) => {
    const project = projects.find(p => p.id === id);
    setProjects(prev => prev.map(p => p.id === id ? { 
      ...p, 
      archivedAt: undefined,
      archiveReason: undefined,
      updatedBy: currentUser?.id 
    } : p));
    addActivity({ 
      type: 'project', 
      action: 'Project Restored', 
      detail: `"${project?.name}" dipulihkan dari arsip.`, 
      entityId: id 
    });
  }, [projects, currentUser, addActivity]);

  const deleteProjectPermanently = useCallback((id: string) => {
    const project = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    addActivity({ 
      type: 'project', 
      action: 'Project Deleted', 
      detail: `"${project?.name}" dihapus permanen.`, 
      entityId: id 
    });
  }, [projects, addActivity]);

  const getArchivedProjects = useCallback(() => {
    return projects.filter(p => p.archivedAt);
  }, [projects]);

  const renameProject = useCallback((id: string, newName: string) => {
    const old = projects.find(p => p.id === id);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    addActivity({ type: 'project', action: 'Project Renamed', detail: `"${old?.name}" → "${newName}"`, entityId: id });
  }, [projects, addActivity]);

  const transferBudget = useCallback((fromId: string, toId: string, amount: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id === fromId) return { ...p, budget: p.budget - amount };
      if (p.id === toId) return { ...p, budget: p.budget + amount };
      return p;
    }));
    const fromP = projects.find(p => p.id === fromId);
    const toP = projects.find(p => p.id === toId);
    addActivity({ type: 'finance', action: 'Budget Transfer', detail: `Rp ${amount.toLocaleString()} from "${fromP?.name}" to "${toP?.name}"` });
  }, [projects, addActivity]);

  const addEstimate = useCallback((e: Omit<Estimate, 'id' | 'createdAt'>) => {
    const newE: Estimate = { ...e, id: genId('EST'), createdAt: new Date().toISOString().split('T')[0] };
    setEstimates(prev => [...prev, newE]);
    addActivity({ type: 'estimate', action: 'Estimate Created', detail: newE.title, entityId: newE.id });
    return newE;
  }, [addActivity]);

  const updateEstimate = useCallback((id: string, data: Partial<Estimate>) => {
    setEstimates(prev => prev.map(e => e.id === id ? { ...e, ...data, updatedBy: currentUser?.id } : e));
  }, [currentUser]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const newT: Transaction = { ...t, id: genId('TRX'), updatedBy: currentUser?.id };
    setTransactions(prev => [newT, ...prev]);
    if (t.projectId) {
      setProjects(prev => prev.map(p => p.id === t.projectId ? { ...p, spent: p.spent + (t.type === 'Expense' ? t.amount : 0) } : p));
    }
    addActivity({ type: 'finance', action: t.type === 'Income' ? 'Income Received' : 'Expense Recorded', detail: `${t.desc} - Rp ${t.amount.toLocaleString()}`, entityId: newT.id });
    return newT;
  }, [addActivity, currentUser]);

  const updateInventoryStock = useCallback((itemId: string, delta: number) => {
    setInventory(prev => prev.map(i => i.id === itemId ? { ...i, stock: Math.max(0, i.stock + delta) } : i));
  }, []);

  const addTask = useCallback((projectId: string, task: Omit<Task, 'id' | 'projectId'>) => {
    const newTask: Task = { ...task, id: genId('TSK'), projectId, updatedBy: currentUser?.id };
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, tasks: [...p.tasks, newTask] } : p));
    addActivity({ type: 'task', action: 'Task Added', detail: `"${task.title}"`, entityId: projectId });
  }, [addActivity, currentUser]);

  const updateTask = useCallback((projectId: string, taskId: string, data: Partial<Task>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...data, updatedBy: currentUser?.id } : t),
    } : p));
  }, [currentUser]);

  // ─── Milestone Methods ─────────────────────────────
  const addMilestone = useCallback((projectId: string, m: Omit<Milestone, 'id' | 'projectId' | 'order' | 'checklist' | 'progress' | 'status'>) => {
    const proj = projects.find(p => p.id === projectId);
    const order = (proj?.milestones.length || 0) + 1;
    const newM: Milestone = { ...m, id: genId('MS'), projectId, order, checklist: [], progress: 0, status: 'Upcoming' };
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, milestones: [...p.milestones, newM], updatedBy: currentUser?.id } : p));
    addActivity({ type: 'milestone', action: 'Milestone Created', detail: `"${m.title}"`, entityId: projectId });
    return newM;
  }, [projects, addActivity, currentUser]);

  const updateMilestone = useCallback((projectId: string, milestoneId: string, data: Partial<Milestone>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p, milestones: p.milestones.map(m => m.id === milestoneId ? { ...m, ...data } : m),
      updatedBy: currentUser?.id
    } : p));
  }, [currentUser]);

  const toggleMilestoneCheck = useCallback((projectId: string, milestoneId: string, checkId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const milestones = p.milestones.map(m => {
        if (m.id !== milestoneId) return m;
        const checklist = m.checklist.map(c => c.id === checkId ? { ...c, done: !c.done } : c);
        const doneCount = checklist.filter(c => c.done).length;
        const total = checklist.length;
        const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;
        const status: Milestone['status'] = progress === 100 ? 'Completed' : doneCount > 0 ? 'Active' : m.status === 'Completed' ? 'Active' : m.status;
        return { ...m, checklist, progress, status };
      });
      return { ...p, milestones };
    }));
  }, []);

  const addMilestoneCheckItem = useCallback((projectId: string, milestoneId: string, title: string) => {
    const newItem: ChecklistItem = { id: genId('CK'), title, done: false };
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const milestones = p.milestones.map(m => {
        if (m.id !== milestoneId) return m;
        const checklist = [...m.checklist, newItem];
        const doneCount = checklist.filter(c => c.done).length;
        const progress = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;
        return { ...m, checklist, progress };
      });
      return { ...p, milestones };
    }));
  }, []);

  const updateBudgetCategory = useCallback((projectId: string, catId: string, data: Partial<BudgetCategory>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p, budgetCategories: p.budgetCategories.map(bc => bc.id === catId ? { ...bc, ...data } : bc),
    } : p));
  }, []);

  const addProjectBudgetLine = useCallback((projectId: string, line: Omit<ProjectBudgetLine, 'id' | 'projectId'>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const newLine: ProjectBudgetLine = { ...line, id: genId('BL'), projectId };
      const budgetLines = [...(p.budgetLines ?? []), newLine];
      return applyBudgetLineSyncToProject({ ...p, budgetLines, updatedBy: currentUser?.id });
    }));
    addActivity({ type: 'project', action: 'Budget line added', detail: line.description, entityId: projectId });
  }, [addActivity, currentUser]);

  const updateProjectBudgetLine = useCallback((projectId: string, lineId: string, data: Partial<ProjectBudgetLine>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const budgetLines = (p.budgetLines ?? []).map(l => (l.id === lineId ? { ...l, ...data } : l));
      return applyBudgetLineSyncToProject({ ...p, budgetLines, updatedBy: currentUser?.id });
    }));
  }, [currentUser]);

  const removeProjectBudgetLine = useCallback((projectId: string, lineId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const budgetLines = (p.budgetLines ?? []).filter(l => l.id !== lineId);
      return applyBudgetLineSyncToProject({ ...p, budgetLines, updatedBy: currentUser?.id });
    }));
    addActivity({ type: 'project', action: 'Budget line removed', detail: lineId, entityId: projectId });
  }, [addActivity, currentUser]);

  const importProjectBudgetLinesFromEstimates = useCallback((projectId: string) => {
    let imported = 0;
    setProjects(prev => {
      const project = prev.find(p => p.id === projectId);
      if (!project) return prev;
      const existingImport = new Set(
        (project.budgetLines ?? [])
          .map(l => l.sourceEstimateItemId)
          .filter((x): x is string => Boolean(x)),
      );
      const existingKeys = new Set(
        (project.budgetLines ?? [])
          .filter(l => l.kind === 'material' && !l.sourceEstimateItemId)
          .map(l => `${l.description.trim().toLowerCase()}|${l.qty}|${l.unit}`),
      );
      const toAdd: ProjectBudgetLine[] = [];
      for (const e of estimates) {
        if (e.projectId !== projectId) continue;
        for (const it of e.items) {
          const srcKey = `${e.id}:${it.id}`;
          if (existingImport.has(srcKey)) continue;
          const manualKey = `${it.description.trim().toLowerCase()}|${it.qty}|${it.unit}`;
          if (existingKeys.has(manualKey)) continue;
          existingImport.add(srcKey);
          existingKeys.add(manualKey);
          const invId = findMatchingInventoryId(inventory, it.description);
          toAdd.push({
            id: genId('BL'),
            projectId,
            kind: 'material',
            sourceEstimateItemId: srcKey,
            inventoryItemId: invId,
            description: it.description,
            qty: it.qty,
            unit: it.unit,
            budgetAmount: Math.round(it.hpp * it.qty),
            actualAmount: 0,
          });
        }
      }
      imported = toAdd.length;
      if (imported === 0) return prev;
      const budgetLines = dedupeBudgetLinesByEstimateSource([...(project.budgetLines ?? []), ...toAdd]);
      return prev.map(p =>
        p.id === projectId ? applyBudgetLineSyncToProject({ ...p, budgetLines, updatedBy: currentUser?.id }) : p,
      );
    });
    if (imported > 0) {
      addActivity({
        type: 'estimate',
        action: 'Impor RAP dari estimator',
        detail: `${imported} baris bahan ditambahkan`,
        entityId: projectId,
      });
    }
    return imported;
  }, [estimates, inventory, currentUser, addActivity]);

  // HR / Attendance Getters (with "RLS" logic)
  const getEmployeeByUserId = useCallback((uid: string) => employees.find(e => e.userId === uid), [employees]);

  const getAttendance = useCallback((uid?: string, date?: string) => {
    if (!currentUser) return [];
    let filtered = attendance;

    // RLS: Non-admin/HR only sees their own
    if (currentUser.role !== 'Admin' && currentUser.role !== 'HR') {
      filtered = filtered.filter(a => a.userId === currentUser.id);
    } else if (uid) {
      filtered = filtered.filter(a => a.userId === uid);
    }

    if (date) {
      filtered = filtered.filter(a => a.date === date);
    }
    return filtered;
  }, [attendance, currentUser]);

  const checkIn = useCallback((location: { lat: number, long: number }, photoUrl?: string, notes?: string) => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('id-ID');
    const newAtt: Attendance = {
      id: genId('ATT'),
      userId: currentUser.id,
      date: today,
      checkInTime: time,
      locationLat: location.lat,
      locationLong: location.long,
      photoUrl,
      notes,
      status: 'Present', // Simple logic for now
    };
    setAttendance(prev => [...prev, newAtt]);
  }, [currentUser]);

  const checkOut = useCallback((notes?: string) => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('id-ID');
    setAttendance(prev => prev.map(a =>
      (a.userId === currentUser.id && a.date === today) ? { ...a, checkOutTime: time, notes: notes || a.notes } : a
    ));
  }, [currentUser]);

  const addWorkLog = useCallback((log: Omit<WorkLog, 'id' | 'userId' | 'createdAt'>) => {
    if (!currentUser) return;
    const newLog: WorkLog = {
      ...log,
      id: genId('WLOG'),
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    setWorkLogs(prev => [newLog, ...prev]);

    // Link update to task status
    const project = projects.find(p => p.tasks.some(t => t.id === log.taskId));
    if (project) {
      updateTask(project.id, log.taskId, { status: log.statusUpdate });
    }

    addActivity({ type: 'hr', action: 'Work Log Added', detail: `Task ${log.taskId}: ${log.description.slice(0, 50)}`, actorId: currentUser.id, actorName: currentUser.name });
  }, [currentUser, projects, updateTask, addActivity]);

  // ─── Leave Management ──────────────────────────────
  const getLeaveRequests = useCallback((userId?: string) => {
    if (!currentUser) return [];
    // RLS: Employee only sees their own
    if (currentUser.role === 'Employee') {
      return leaveRequests.filter(l => l.userId === currentUser.id);
    }
    // Admin/HR sees all, or filtered by userId
    if (userId) return leaveRequests.filter(l => l.userId === userId);
    return leaveRequests;
  }, [leaveRequests, currentUser]);

  const submitLeave = useCallback((req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: LeaveRequest = {
      ...req,
      id: genId('LV'),
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setLeaveRequests(prev => [newReq, ...prev]);
    addActivity({ type: 'leave', action: 'Leave Requested', detail: `${req.type} leave ${req.days} days: ${req.reason}`, entityId: newReq.id, actorId: currentUser?.id, actorName: currentUser?.name });
    return newReq;
  }, [addActivity, currentUser]);

  const approveLeave = useCallback((leaveId: string, approved: boolean) => {
    if (!currentUser) return;
    // RLS: Only Admin/HR can approve
    if (currentUser.role !== 'Admin' && currentUser.role !== 'HR') return;
    setLeaveRequests(prev => prev.map(l => l.id === leaveId ? {
      ...l,
      status: approved ? 'Approved' : 'Rejected',
      approvedBy: currentUser.id,
      approvedAt: new Date().toISOString(),
    } : l));
    const leave = leaveRequests.find(l => l.id === leaveId);
    addActivity({ type: 'leave', action: approved ? 'Leave Approved' : 'Leave Rejected', detail: `${leave?.type} leave for ${leave?.days} days`, entityId: leaveId, actorId: currentUser.id, actorName: currentUser.name });
  }, [currentUser, leaveRequests, addActivity]);

  // ─── Payroll ──────────────────────────────
  const getPayroll = useCallback((userId?: string, period?: string) => {
    if (!currentUser) return [];
    let filtered = payrollRecords;
    // RLS: Employee sees only their own, Finance can view all, Admin/HR can view all
    if (currentUser.role === 'Employee') {
      filtered = filtered.filter(p => p.userId === currentUser.id);
    }
    if (userId) filtered = filtered.filter(p => p.userId === userId);
    if (period) filtered = filtered.filter(p => p.period === period);
    return filtered;
  }, [payrollRecords, currentUser]);

  const computePayroll = useCallback((employeeId: string, period: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) throw new Error('Employee not found');
    // RLS: Only Admin/HR can compute
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'HR') throw new Error('Unauthorized');

    // Compute from attendance
    const monthAtt = attendance.filter(a => a.userId === emp.userId && a.date.startsWith(period));
    const presentDays = monthAtt.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const lateDays = monthAtt.filter(a => a.status === 'Late').length;
    const leaveDays = monthAtt.filter(a => a.status === 'Leave').length;
    const sickDays = monthAtt.filter(a => a.status === 'Sick').length;
    const absentDays = monthAtt.filter(a => a.status === 'Absent').length;

    // Compute overtime from work hours
    let overtimeHours = 0;
    monthAtt.forEach(a => {
      const wh = calculateWorkHours(a.checkInTime, a.checkOutTime);
      overtimeHours += wh.overtime;
    });

    const overtimeRate = Math.round(emp.baseSalary / 173); // Standard hourly rate
    const overtimePay = overtimeHours * overtimeRate * 1.5;
    const lateDeduction = lateDays * 50000;

    const allowances = [
      { name: 'Transport', amount: emp.baseSalary >= 10000000 ? 750000 : 500000 },
      { name: 'Makan', amount: emp.baseSalary >= 10000000 ? 550000 : 400000 },
    ];
    const deductions = [
      { name: 'BPJS Kesehatan', amount: Math.round(emp.baseSalary * 0.04) },
      { name: 'BPJS TK', amount: Math.round(emp.baseSalary * 0.02) },
      ...(lateDays > 0 ? [{ name: 'Potongan Telat', amount: lateDeduction }] : []),
    ];

    const totalAllowances = allowances.reduce((s, a) => s + a.amount, 0);
    const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
    const grossPay = emp.baseSalary + overtimePay + totalAllowances;
    const netPay = grossPay - totalDeductions;

    const record: PayrollRecord = {
      id: genId('PAY'),
      employeeId,
      userId: emp.userId,
      period,
      periodType: 'monthly',
      salaryScheme: emp.salaryScheme,
      baseSalary: emp.baseSalary,
      dailyRate: emp.dailyRate,
      workingDays: 22,
      presentDays,
      lateDays,
      leaveDays: leaveDays + sickDays,
      absentDays,
      overtimeHours,
      overtimePay,
      allowances,
      deductions,
      grossPay,
      netPay,
      status: 'Draft',
    };

    // Upsert: replace existing draft or add new
    setPayrollRecords(prev => {
      const existing = prev.findIndex(p => p.employeeId === employeeId && p.period === period && p.status === 'Draft');
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = record;
        return updated;
      }
      return [...prev, record];
    });

    addActivity({ type: 'payroll', action: 'Payroll Computed', detail: `${emp.position} period ${period}: Rp ${netPay.toLocaleString()}`, entityId: record.id, actorId: currentUser?.id, actorName: currentUser?.name });
    return record;
  }, [employees, attendance, currentUser, addActivity]);

  // ─── Payroll Management ──────────────────────────────
  const getAllPayroll = useCallback(() => {
    // RLS: Admin/HR/Finance can see all, others only their own
    if (!currentUser) return [];
    if (['Admin', 'HR', 'Finance'].includes(currentUser.role)) {
      return payrollRecords.sort((a, b) => b.period.localeCompare(a.period));
    }
    return payrollRecords.filter(p => p.userId === currentUser.id);
  }, [payrollRecords, currentUser]);

  const approvePayroll = useCallback((payrollId: string) => {
    if (!currentUser || !['Admin', 'HR'].includes(currentUser.role)) return;
    setPayrollRecords(prev => prev.map(p => 
      p.id === payrollId && p.status === 'Processed'
        ? { ...p, status: 'Approved' as const, approvedBy: currentUser.id, approvedAt: new Date().toISOString() }
        : p
    ));
    addActivity({ type: 'payroll', action: 'Payroll Approved', detail: `Payroll ${payrollId} approved`, entityId: payrollId });
  }, [currentUser, addActivity]);

  const processPayroll = useCallback((payrollId: string) => {
    if (!currentUser || !['Admin', 'HR', 'Finance'].includes(currentUser.role)) return;
    setPayrollRecords(prev => prev.map(p => 
      p.id === payrollId && p.status === 'Draft'
        ? { ...p, status: 'Processed' as const, processedAt: new Date().toISOString(), processedBy: currentUser.id }
        : p
    ));
    addActivity({ type: 'payroll', action: 'Payroll Processed', detail: `Payroll ${payrollId} processed`, entityId: payrollId });
  }, [currentUser, addActivity]);

  const markPayrollPaid = useCallback((payrollId: string) => {
    if (!currentUser || !['Admin', 'Finance'].includes(currentUser.role)) return;
    const payroll = payrollRecords.find(p => p.id === payrollId);
    if (!payroll || payroll.status !== 'Approved') return;
    
    const paidUser = users.find(u => u.id === payroll.userId);
    const employeeName = paidUser?.name || 'Unknown';
    
    // Update payroll status
    setPayrollRecords(prev => prev.map(p => 
      p.id === payrollId
        ? { ...p, status: 'Paid' as const, paidAt: new Date().toISOString() }
        : p
    ));
    
    // Determine payroll category based on salary scheme
    const isProjectBased = payroll.salaryScheme === 'project-based' && payroll.projectWages && payroll.projectWages.length > 0;
    const payrollCategory = payroll.periodType === 'weekly' ? 'Payroll Weekly' : 'Payroll Monthly';
    
    // Create main payroll transaction (for operational/general salary)
    if (!isProjectBased || payroll.baseSalary > 0) {
      const baseAmount = isProjectBased 
        ? payroll.baseSalary + payroll.overtimePay + payroll.allowances.reduce((s, a) => s + a.amount, 0) - payroll.deductions.reduce((s, d) => s + d.amount, 0)
        : payroll.netPay;
      
      if (baseAmount > 0) {
        addTransaction({
          date: new Date().toISOString().split('T')[0],
          desc: `Gaji ${payroll.periodType === 'weekly' ? 'Mingguan' : 'Bulanan'} - ${employeeName} (${payroll.period})`,
          type: 'Expense',
          category: payrollCategory,
          amount: baseAmount,
          projectId: null, // General operational expense
          supplierId: null,
          status: 'Completed',
        });
      }
    }
    
    // Create project-specific transactions for project-based wages
    if (isProjectBased && payroll.projectWages) {
      payroll.projectWages.forEach(wage => {
        addTransaction({
          date: new Date().toISOString().split('T')[0],
          desc: `Upah Project - ${employeeName} (${wage.role}) - ${wage.projectName}`,
          type: 'Expense',
          category: 'Labor',
          amount: wage.totalAmount,
          projectId: wage.projectId,
          supplierId: null,
          status: 'Completed',
        });
        
        // Update project budget if it has Labor category
        const proj = projects.find(p => p.id === wage.projectId);
        if (proj?.budgetCategories) {
          const laborCat = proj.budgetCategories.find(c => c.name === 'Labor' || c.name === 'Tenaga Kerja');
          if (laborCat) {
            updateBudgetCategory(wage.projectId, laborCat.name, {
              spent: laborCat.spent + wage.totalAmount
            });
          }
        }
      });
    }
    
    // Log activity
    addActivity({ 
      type: 'payroll', 
      action: 'Payroll Dibayar', 
      detail: `${employeeName} - ${payroll.period}: Rp ${payroll.netPay.toLocaleString('id-ID')}${isProjectBased ? ' (termasuk upah project)' : ''}`,
      actorId: currentUser.id,
      actorName: currentUser.name
    });    
    // Create finance transaction
    const emp = employees.find(e => e.id === payroll.employeeId);
    addTransaction({
      amount: payroll.netPay,
      type: 'Expense',
      category: 'Tenaga Kerja',
      date: new Date().toISOString().split('T')[0],
      desc: `Gaji ${emp?.position || 'Karyawan'} periode ${payroll.period}`,
      status: 'Completed',
      projectId: null,
      supplierId: null,
    });
    
    addActivity({ type: 'payroll', action: 'Payroll Paid', detail: `Rp ${payroll.netPay.toLocaleString()} paid`, entityId: payrollId });
  }, [currentUser, payrollRecords, employees, addTransaction, addActivity]);

  const generatePayrollForPeriod = useCallback((period: string, _periodType: 'monthly' | 'weekly') => {
    if (!currentUser || !['Admin', 'HR'].includes(currentUser.role)) return [];
    
    const results: PayrollRecord[] = [];
    employees.forEach(emp => {
      if (emp.status !== 'Active') return;
      // Skip if already has payroll for this period
      if (payrollRecords.some(p => p.employeeId === emp.id && p.period === period)) return;
      
      const record = computePayroll(emp.id, period);
      results.push(record);
    });
    return results;
  }, [currentUser, employees, payrollRecords, computePayroll]);

  const addProjectWageToPayroll = useCallback((payrollId: string, wage: Omit<ProjectWage, 'totalAmount'>) => {
    if (!currentUser || !['Admin', 'HR', 'Finance'].includes(currentUser.role)) return;
    
    const totalAmount = wage.daysWorked * wage.dailyRate;
    const fullWage: ProjectWage = { ...wage, totalAmount };
    
    setPayrollRecords(prev => prev.map(p => {
      if (p.id !== payrollId || p.status !== 'Draft') return p;
      const projectWages = [...(p.projectWages || []), fullWage];
      const wageTotal = projectWages.reduce((s, w) => s + w.totalAmount, 0);
      const newGross = p.baseSalary + wageTotal + p.overtimePay + p.allowances.reduce((s, a) => s + a.amount, 0);
      const newNet = newGross - p.deductions.reduce((s, d) => s + d.amount, 0);
      return { ...p, projectWages, grossPay: newGross, netPay: newNet };
    }));
    
    addActivity({ type: 'payroll', action: 'Project Wage Added', detail: `${wage.projectName}: Rp ${totalAmount.toLocaleString()}`, entityId: payrollId });
  }, [currentUser, addActivity]);

  // ─── Permission Helper ──────────────────────────────
  const canAccess = useCallback((module: AppModule, action: keyof RolePermission = 'view') => {
    if (!currentUser) return false;
    return hasPermission(currentUser.role, module, action);
  }, [currentUser]);

  // ─── WorkLog Getters ──────────────────────────────
  const getWorkLogsByTask = useCallback((taskId: string) => {
    return workLogs.filter(w => w.taskId === taskId);
  }, [workLogs]);

  const getWorkLogsByUser = useCallback((userId: string) => {
    if (!currentUser) return [];
    // RLS: Employee sees only their own
    if (currentUser.role === 'Employee' && userId !== currentUser.id) return [];
    return workLogs.filter(w => w.userId === userId);
  }, [workLogs, currentUser]);

  const getTaskComments = useCallback((taskId: string) => {
    return taskComments.filter(c => c.taskId === taskId);
  }, [taskComments]);

  const addTaskComment = useCallback((taskId: string, text: string) => {
    if (!currentUser) return;
    const newComment: TaskComment = {
      id: genId('TCM'),
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text,
      createdAt: new Date().toISOString(),
    };
    setTaskComments(prev => [...prev, newComment]);
    addActivity({ type: 'task', action: 'Comment Added', detail: `Task ${taskId}: ${text.slice(0, 30)}`, actorId: currentUser.id, actorName: currentUser.name });
  }, [currentUser, addActivity]);

  // ─── Company Info & Employee Personal Data ──────────────────────────────
  const getMyDocuments = useCallback(() => {
    if (!currentUser) return [];
    return employeeDocuments.filter(d => d.userId === currentUser.id);
  }, [employeeDocuments, currentUser]);

  const getMyPayroll = useCallback(() => {
    if (!currentUser) return [];
    return payrollRecords.filter(p => p.userId === currentUser.id).sort((a, b) => b.period.localeCompare(a.period));
  }, [payrollRecords, currentUser]);

  const getMyAttendanceHistory = useCallback((days: number = 30) => {
    if (!currentUser) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return attendance
      .filter(a => a.userId === currentUser.id && new Date(a.date) >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, currentUser]);

  // ─── Work Hours Summary ──────────────────────────────
  const getWorkHoursSummary = useCallback((period: 'daily' | 'weekly' | 'monthly' = 'monthly') => {
    if (!currentUser) return { totalHours: 0, totalOvertime: 0, avgDaily: 0, targetHours: 0, percentage: 0 };
    
    const now = new Date();
    let cutoff: Date;
    let targetDays: number;
    
    if (period === 'daily') {
      cutoff = new Date(now.toISOString().split('T')[0]);
      targetDays = 1;
    } else if (period === 'weekly') {
      cutoff = new Date(now);
      cutoff.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      targetDays = 6; // Mon-Sat
    } else {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
      targetDays = 22; // Avg working days
    }
    
    const periodAttendance = attendance.filter(a => 
      a.userId === currentUser.id && new Date(a.date) >= cutoff
    );
    
    let totalHours = 0;
    let totalOvertime = 0;
    
    periodAttendance.forEach(a => {
      if (a.checkInTime && a.checkOutTime) {
        const { hours, overtime } = calculateWorkHours(a.checkInTime, a.checkOutTime);
        totalHours += hours;
        totalOvertime += overtime;
      }
    });
    
    const targetHours = targetDays * 8;
    const avgDaily = periodAttendance.length > 0 ? totalHours / periodAttendance.length : 0;
    const percentage = targetHours > 0 ? Math.round((totalHours / targetHours) * 100) : 0;
    
    return { 
      totalHours: Math.round(totalHours * 10) / 10, 
      totalOvertime: Math.round(totalOvertime * 10) / 10, 
      avgDaily: Math.round(avgDaily * 10) / 10, 
      targetHours,
      percentage,
      daysWorked: periodAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length,
    };
  }, [attendance, currentUser]);

  // ─── My Leave Requests ──────────────────────────────
  const getMyLeaveRequests = useCallback(() => {
    if (!currentUser) return [];
    return leaveRequests
      .filter(l => l.userId === currentUser.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [leaveRequests, currentUser]);

  // ─── Leave Balance ──────────────────────────────
  const getLeaveBalance = useCallback(() => {
    if (!currentUser) return { annual: 12, sick: 12, emergency: 3, used: { annual: 0, sick: 0, emergency: 0, izin: 0 } };
    
    const year = new Date().getFullYear();
    const yearRequests = leaveRequests.filter(l => 
      l.userId === currentUser.id && 
      l.status === 'Approved' && 
      l.startDate.startsWith(String(year))
    );
    
    const used = {
      annual: yearRequests.filter(l => l.type === 'Annual').reduce((sum, l) => sum + l.days, 0),
      sick: yearRequests.filter(l => l.type === 'Sick').reduce((sum, l) => sum + l.days, 0),
      emergency: yearRequests.filter(l => l.type === 'Emergency').reduce((sum, l) => sum + l.days, 0),
      izin: yearRequests.filter(l => l.type === 'Izin').reduce((sum, l) => sum + l.days, 0),
    };
    
    return {
      annual: 12 - used.annual,
      sick: 12 - used.sick,
      emergency: 3 - used.emergency,
      used,
    };
  }, [leaveRequests, currentUser]);

  const getCurrentMonthSalaryEstimate = useCallback(() => {
    if (!currentUser) return { gross: 0, net: 0, breakdown: [] };
    
    const emp = employees.find(e => e.userId === currentUser.id);
    if (!emp) return { gross: 0, net: 0, breakdown: [] };

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const period = `${year}-${month}`;

    // Count attendance this month
    const monthAttendance = attendance.filter(a => 
      a.userId === currentUser.id && a.date.startsWith(period)
    );
    const presentDays = monthAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const lateDays = monthAttendance.filter(a => a.status === 'Late').length;
    const leaveDays = monthAttendance.filter(a => a.status === 'Leave').length;
    const sickDays = monthAttendance.filter(a => a.status === 'Sick').length;

    // Calculate overtime
    let overtimeHours = 0;
    monthAttendance.forEach(a => {
      if (a.checkInTime && a.checkOutTime) {
        const { overtime } = calculateWorkHours(a.checkInTime, a.checkOutTime);
        overtimeHours += overtime;
      }
    });

    const hourlyRate = emp.baseSalary / 22 / 8;
    const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5);
    const transportAllowance = 750000;
    const mealAllowance = 550000;
    const lateDeduction = lateDays * 50000;
    const bpjsHealth = Math.round(emp.baseSalary * 0.04);
    const bpjsTK = Math.round(emp.baseSalary * 0.02);

    const gross = emp.baseSalary + overtimePay + transportAllowance + mealAllowance;
    const totalDeductions = lateDeduction + bpjsHealth + bpjsTK;
    const net = gross - totalDeductions;

    const breakdown: { label: string; amount: number; type: 'add' | 'sub' }[] = [
      { label: 'Gaji Pokok', amount: emp.baseSalary, type: 'add' },
      { label: `Lembur (${overtimeHours}j)`, amount: overtimePay, type: 'add' },
      { label: 'Tunjangan Transport', amount: transportAllowance, type: 'add' },
      { label: 'Tunjangan Makan', amount: mealAllowance, type: 'add' },
      { label: 'BPJS Kesehatan', amount: bpjsHealth, type: 'sub' },
      { label: 'BPJS TK', amount: bpjsTK, type: 'sub' },
    ];

    if (lateDeduction > 0) {
      breakdown.push({ label: `Potongan Telat (${lateDays}x)`, amount: lateDeduction, type: 'sub' });
    }

    return { gross, net, breakdown, presentDays, lateDays, leaveDays, sickDays };
  }, [currentUser, employees, attendance]);

  // ─── Payroll Finance Integration ──────────────────────────────
  const getPayrollSummary = useCallback(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    const paidRecords = payrollRecords.filter(p => p.status === 'Paid');
    const pendingRecords = payrollRecords.filter(p => p.status !== 'Paid');
    
    // Calculate totals
    const totalPaid = paidRecords.reduce((sum, p) => sum + p.netPay, 0);
    const totalPending = pendingRecords.reduce((sum, p) => sum + p.netPay, 0);
    
    // Separate operational (non-project) vs project labor
    let operationalPayroll = 0;
    let projectLabor = 0;
    
    paidRecords.forEach(p => {
      if (p.projectWages && p.projectWages.length > 0) {
        projectLabor += p.projectWages.reduce((s, w) => s + w.totalAmount, 0);
        // Base salary part is still operational
        operationalPayroll += p.baseSalary + p.overtimePay + 
          p.allowances.reduce((s, a) => s + a.amount, 0) - 
          p.deductions.reduce((s, d) => s + d.amount, 0);
      } else {
        operationalPayroll += p.netPay;
      }
    });
    
    // This month & last month totals
    const thisMonthTotal = paidRecords
      .filter(p => p.period === thisMonth)
      .reduce((sum, p) => sum + p.netPay, 0);
    const lastMonthTotal = paidRecords
      .filter(p => p.period === lastMonth)
      .reduce((sum, p) => sum + p.netPay, 0);
    
    return { 
      totalPaid, 
      totalPending, 
      operationalPayroll, 
      projectLabor, 
      thisMonth: thisMonthTotal, 
      lastMonth: lastMonthTotal 
    };
  }, [payrollRecords]);

  const getPayrollTransactions = useCallback(() => {
    // Return transactions that are payroll-related (category contains 'Payroll' or 'Labor' from payroll)
    return transactions.filter(t => 
      t.category.includes('Payroll') || 
      (t.category === 'Labor' && t.desc.includes('Upah Project'))
    );
  }, [transactions]);

  const getProjectLaborCosts = useCallback((projectId: string) => {
    // Get all labor costs for a specific project from paid payrolls
    const projectTransactions = transactions.filter(t => 
      t.projectId === projectId && 
      t.category === 'Labor' && 
      t.desc.includes('Upah Project')
    );
    
    const total = projectTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const breakdown = projectTransactions.map(t => ({
      name: t.desc.split(' - ')[1] || t.desc, // Extract employee name/role
      amount: t.amount,
      period: t.date,
    }));
    
    return { total, breakdown };
  }, [transactions]);

  // ============================================
  // CHART OF ACCOUNTS (COA) Methods
  // ============================================
  const getAccountsByCategory = useCallback((category: AccountCategory) => {
    return accounts.filter(a => a.category === category && a.isActive);
  }, [accounts]);

  const getAccountBalance = useCallback((accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.balance || 0;
  }, [accounts]);

  const getTotalByCategory = useCallback((category: AccountCategory) => {
    return accounts
      .filter(a => a.category === category && a.isActive)
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  const addAccount = useCallback((a: Omit<Account, 'id' | 'createdAt' | 'balance'>) => {
    const newAccount: Account = {
      ...a,
      id: genId('ACC'),
      balance: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAccounts(prev => [...prev, newAccount]);
    addActivity({ type: 'finance', action: 'account_created', detail: `Akun baru ditambahkan: ${a.name}` });
    return newAccount;
  }, [addActivity]);

  const updateAccountBalance = useCallback((accountId: string, amount: number, isDebit: boolean) => {
    setAccounts(prev => prev.map(a => {
      if (a.id !== accountId) return a;
      // For assets & expenses: debit increases, credit decreases
      // For liabilities, equity, income: debit decreases, credit increases
      const normalDebit = ['asset', 'expense'].includes(a.category);
      const delta = normalDebit 
        ? (isDebit ? amount : -amount)
        : (isDebit ? -amount : amount);
      return { ...a, balance: a.balance + delta, updatedAt: new Date().toISOString() };
    }));
  }, []);

  // ============================================
  // RECEIVABLES Methods
  // ============================================
  const getReceivables = useCallback((filters?: { status?: DebtStatus; type?: DebtType; projectId?: string; customerId?: string }) => {
    let result = [...receivables];
    if (filters?.status) result = result.filter(r => r.status === filters.status);
    if (filters?.type) result = result.filter(r => r.type === filters.type);
    if (filters?.projectId) result = result.filter(r => r.projectId === filters.projectId);
    if (filters?.customerId) result = result.filter(r => r.customerId === filters.customerId);
    // Update overdue status
    const today = new Date().toISOString().split('T')[0];
    return result.map(r => ({
      ...r,
      status: (r.status === 'open' || r.status === 'partial') && r.dueDate < today ? 'overdue' as DebtStatus : r.status
    }));
  }, [receivables]);

  const getReceivablesSummary = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);
    
    const total = receivables.reduce((sum, r) => sum + r.totalAmount, 0);
    const outstanding = receivables.reduce((sum, r) => sum + r.outstandingAmount, 0);
    
    const overdueItems = receivables.filter(r => 
      (r.status === 'open' || r.status === 'partial') && r.dueDate < today
    );
    const overdue = overdueItems.reduce((sum, r) => sum + r.outstandingAmount, 0);
    const overdueCount = overdueItems.length;
    
    const paidThisMonth = receivables
      .flatMap(r => r.payments)
      .filter(p => p.date.startsWith(month))
      .reduce((sum, p) => sum + p.amount, 0);
    
    return { total, outstanding, overdue, overdueCount, paidThisMonth };
  }, [receivables]);

  const addReceivable = useCallback((r: Omit<Receivable, 'id' | 'createdAt' | 'status' | 'payments' | 'paidAmount' | 'outstandingAmount'>) => {
    const newReceivable: Receivable = {
      ...r,
      id: genId('RCV'),
      paidAmount: 0,
      outstandingAmount: r.totalAmount,
      status: 'open',
      payments: [],
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id || 'SYSTEM',
    };
    setReceivables(prev => [...prev, newReceivable]);
    addActivity({ 
      type: 'finance', 
      action: 'receivable_created',
      detail: `Piutang baru: ${r.description} - Rp ${r.totalAmount.toLocaleString('id-ID')}`,
      entityId: r.projectId 
    });
    return newReceivable;
  }, [currentUser, addActivity]);

  const recordReceivablePayment = useCallback((receivableId: string, payment: Omit<PaymentRecord, 'id' | 'recordedBy'>) => {
    setReceivables(prev => prev.map(r => {
      if (r.id !== receivableId) return r;
      
      const newPayment: PaymentRecord = {
        ...payment,
        id: genId('RPAY'),
        recordedBy: currentUser?.id || 'SYSTEM',
      };
      
      const newPaidAmount = r.paidAmount + payment.amount;
      const newOutstanding = r.totalAmount - newPaidAmount;
      const newStatus: DebtStatus = newOutstanding <= 0 ? 'paid' : 'partial';
      
      // Create income transaction
      const txData: Omit<Transaction, 'id'> = {
        desc: `Pembayaran Piutang: ${r.description}`,
        amount: payment.amount,
        type: 'Income',
        category: 'Receivable Payment',
        date: payment.date,
        projectId: r.projectId || null,
        supplierId: null,
        status: 'Completed',
      };
      addTransaction(txData);
      
      addActivity({ 
        type: 'finance', 
        action: 'receivable_payment',
        detail: `Pembayaran piutang diterima: Rp ${payment.amount.toLocaleString('id-ID')} untuk ${r.description}`,
        entityId: r.projectId 
      });
      
      return {
        ...r,
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstanding,
        status: newStatus,
        payments: [...r.payments, newPayment],
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [currentUser, addTransaction, addActivity]);

  // ============================================
  // PAYABLES Methods
  // ============================================
  const getPayables = useCallback((filters?: { status?: DebtStatus; type?: DebtType; projectId?: string; supplierId?: string }) => {
    let result = [...payables];
    if (filters?.status) result = result.filter(p => p.status === filters.status);
    if (filters?.type) result = result.filter(p => p.type === filters.type);
    if (filters?.projectId) result = result.filter(p => p.projectId === filters.projectId);
    if (filters?.supplierId) result = result.filter(p => p.supplierId === filters.supplierId);
    // Update overdue status
    const today = new Date().toISOString().split('T')[0];
    return result.map(p => ({
      ...p,
      status: (p.status === 'open' || p.status === 'partial') && p.dueDate < today ? 'overdue' as DebtStatus : p.status
    }));
  }, [payables]);

  const getPayablesSummary = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);
    
    const total = payables.reduce((sum, p) => sum + p.totalAmount, 0);
    const outstanding = payables.reduce((sum, p) => sum + p.outstandingAmount, 0);
    
    const overdueItems = payables.filter(p => 
      (p.status === 'open' || p.status === 'partial') && p.dueDate < today
    );
    const overdue = overdueItems.reduce((sum, p) => sum + p.outstandingAmount, 0);
    const overdueCount = overdueItems.length;
    
    const paidThisMonth = payables
      .flatMap(p => p.payments)
      .filter(pay => pay.date.startsWith(month))
      .reduce((sum, pay) => sum + pay.amount, 0);
    
    return { total, outstanding, overdue, overdueCount, paidThisMonth };
  }, [payables]);

  const addPayable = useCallback((p: Omit<Payable, 'id' | 'createdAt' | 'status' | 'payments' | 'paidAmount' | 'outstandingAmount'>) => {
    const newPayable: Payable = {
      ...p,
      id: genId('PAY'),
      paidAmount: 0,
      outstandingAmount: p.totalAmount,
      status: 'open',
      payments: [],
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id || 'SYSTEM',
    };
    setPayables(prev => [...prev, newPayable]);
    addActivity({ 
      type: 'finance', 
      action: 'payable_created',
      detail: `Hutang baru: ${p.description} - Rp ${p.totalAmount.toLocaleString('id-ID')}`,
      entityId: p.projectId 
    });
    return newPayable;
  }, [currentUser, addActivity]);

  const recordPayablePayment = useCallback((payableId: string, payment: Omit<PaymentRecord, 'id' | 'recordedBy'>) => {
    setPayables(prev => prev.map(p => {
      if (p.id !== payableId) return p;
      
      const newPayment: PaymentRecord = {
        ...payment,
        id: genId('PPAY'),
        recordedBy: currentUser?.id || 'SYSTEM',
      };
      
      const newPaidAmount = p.paidAmount + payment.amount;
      const newOutstanding = p.totalAmount - newPaidAmount;
      const newStatus: DebtStatus = newOutstanding <= 0 ? 'paid' : 'partial';
      
      // Create expense transaction
      const txData: Omit<Transaction, 'id'> = {
        desc: `Pembayaran Hutang: ${p.description}`,
        amount: payment.amount,
        type: 'Expense',
        category: 'Payable Payment',
        date: payment.date,
        projectId: p.projectId || null,
        supplierId: p.supplierId || null,
        status: 'Completed',
      };
      addTransaction(txData);
      
      addActivity({ 
        type: 'finance', 
        action: 'payable_payment',
        detail: `Pembayaran hutang: Rp ${payment.amount.toLocaleString('id-ID')} untuk ${p.description}`,
        entityId: p.projectId 
      });
      
      return {
        ...p,
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstanding,
        status: newStatus,
        payments: [...p.payments, newPayment],
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [currentUser, addTransaction, addActivity]);

  // ============================================
  // INTER-PROJECT DEBT Methods
  // ============================================
  const createInterProjectDebt = useCallback((fromProjectId: string, toProjectId: string, amount: number, description: string, dueDate: string) => {
    const fromProject = projects.find(p => p.id === fromProjectId);
    const toProject = projects.find(p => p.id === toProjectId);
    
    if (!fromProject || !toProject) throw new Error('Project not found');
    
    // Create receivable for the lending project (toProject receives money back)
    const receivable = addReceivable({
      type: 'interproject',
      projectId: toProjectId,
      projectName: toProject.name,
      description: `Pinjaman ke ${fromProject.name}: ${description}`,
      totalAmount: amount,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate,
      createdBy: currentUser?.id || 'SYSTEM',
    });
    
    // Create payable for the borrowing project (fromProject owes money)
    const payable = addPayable({
      type: 'interproject',
      projectId: fromProjectId,
      projectName: fromProject.name,
      toProjectId,
      toProjectName: toProject.name,
      description: `Pinjaman dari ${toProject.name}: ${description}`,
      totalAmount: amount,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate,
      createdBy: currentUser?.id || 'SYSTEM',
    });
    
    addActivity({ 
      type: 'finance', 
      action: 'interproject_debt',
      detail: `Pinjaman antar project: ${fromProject.name} meminjam Rp ${amount.toLocaleString('id-ID')} dari ${toProject.name}`,
    });
    
    return { receivable, payable };
  }, [projects, currentUser, addReceivable, addPayable, addActivity]);

  const settleInterProjectDebt = useCallback((payableId: string, amount: number) => {
    const payable = payables.find(p => p.id === payableId);
    if (!payable || payable.type !== 'interproject') return;
    
    // Record payment on payable
    recordPayablePayment(payableId, {
      amount,
      date: new Date().toISOString().split('T')[0],
      method: 'transfer',
      notes: 'Settlement antar project',
    });
    
    // Find and record payment on corresponding receivable
    const relatedReceivable = receivables.find(r => 
      r.type === 'interproject' && 
      r.projectId === payable.toProjectId &&
      r.description.includes(payable.projectName || '')
    );
    
    if (relatedReceivable) {
      recordReceivablePayment(relatedReceivable.id, {
        amount,
        date: new Date().toISOString().split('T')[0],
        method: 'transfer',
        notes: 'Settlement antar project',
      });
    }
  }, [payables, receivables, recordPayablePayment, recordReceivablePayment]);

  // ============================================
  // FINANCIAL REPORT METHODS
  // ============================================
  
  const getProfitLossReport = useCallback((startDate?: string, endDate?: string, projectId?: string): ProfitLossReport => {
    const today = new Date();
    const start = startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || today.toISOString().split('T')[0];
    
    // Filter transactions by date and optionally project
    const filtered = transactions.filter(t => {
      const inRange = t.date >= start && t.date <= end;
      const matchProject = projectId ? t.projectId === projectId : true;
      return inRange && matchProject;
    });
    
    // Revenue (Income transactions)
    const incomeTransactions = filtered.filter(t => t.type === 'Income');
    const totalRevenue = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Group revenue by category
    const revenueByCategory = incomeTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Expense transactions
    const expenseTransactions = filtered.filter(t => t.type === 'Expense');
    const _totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    void _totalExpense; // Used for reference, actual calculations use COGS + OPEX
    
    // Cost of sales (material, labor, subcontractor)
    const cogsCategories = ['Material', 'Tenaga Kerja', 'Labor', 'Subkontraktor', 'Payroll Monthly', 'Payroll Weekly'];
    const cogsTransactions = expenseTransactions.filter(t => cogsCategories.some(c => t.category.includes(c)));
    const totalCogs = cogsTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Group COGS by category
    const cogsByCategory = cogsTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Operating expenses (everything else)
    const opexTransactions = expenseTransactions.filter(t => !cogsCategories.some(c => t.category.includes(c)));
    const totalOpex = opexTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const opexByCategory = opexTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalOpex;
    
    const project = projectId ? projects.find(p => p.id === projectId) : undefined;
    
    return {
      period: { start, end },
      projectId,
      projectName: project?.name,
      revenue: {
        total: totalRevenue,
        breakdown: Object.entries(revenueByCategory).map(([category, amount]) => ({
          category,
          amount,
          percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0,
        })),
      },
      costOfSales: {
        total: totalCogs,
        breakdown: Object.entries(cogsByCategory).map(([category, amount]) => ({
          category,
          amount,
          percentage: totalCogs > 0 ? Math.round((amount / totalCogs) * 100) : 0,
        })),
      },
      grossProfit,
      grossMargin: totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0,
      operatingExpenses: {
        total: totalOpex,
        breakdown: Object.entries(opexByCategory).map(([category, amount]) => ({
          category,
          amount,
          percentage: totalOpex > 0 ? Math.round((amount / totalOpex) * 100) : 0,
        })),
      },
      netProfit,
      netMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0,
    };
  }, [transactions, projects]);

  const getCashFlowReport = useCallback((startDate?: string, endDate?: string): CashFlowReport => {
    const today = new Date();
    const start = startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || today.toISOString().split('T')[0];
    
    const filtered = transactions.filter(t => t.date >= start && t.date <= end);
    
    // Calculate daily flow
    const dailyMap: Record<string, { inflow: number; outflow: number }> = {};
    filtered.forEach(t => {
      if (!dailyMap[t.date]) dailyMap[t.date] = { inflow: 0, outflow: 0 };
      if (t.type === 'Income') dailyMap[t.date].inflow += t.amount;
      else if (t.type === 'Expense') dailyMap[t.date].outflow += t.amount;
    });
    
    // Get cash account balance as opening (simplified)
    const cashAccount = accounts.find(a => a.subCategory === 'cash');
    const openingBalance = cashAccount?.balance || 0;
    
    // Operating inflows (income categories)
    const operatingInflows = filtered.filter(t => t.type === 'Income')
      .reduce((acc, t) => {
        const existing = acc.find(x => x.category === t.category);
        if (existing) existing.amount += t.amount;
        else acc.push({ category: t.category, amount: t.amount });
        return acc;
      }, [] as { category: string; amount: number }[]);
    
    // Operating outflows (expense categories except equipment/asset purchases)
    const operatingCategories = ['Material', 'Tenaga Kerja', 'Labor', 'Operasional', 'Transport', 'Payroll'];
    const operatingOutflows = filtered.filter(t => t.type === 'Expense' && operatingCategories.some(c => t.category.includes(c)))
      .reduce((acc, t) => {
        const existing = acc.find(x => x.category === t.category);
        if (existing) existing.amount += t.amount;
        else acc.push({ category: t.category, amount: t.amount });
        return acc;
      }, [] as { category: string; amount: number }[]);
    
    // Investing outflows (equipment, tools)
    const investingCategories = ['Alat', 'Equipment', 'Investasi'];
    const investingOutflows = filtered.filter(t => t.type === 'Expense' && investingCategories.some(c => t.category.includes(c)))
      .map(t => ({ description: t.desc, amount: t.amount }));
    
    const totalInflows = operatingInflows.reduce((s, x) => s + x.amount, 0);
    const totalOutflows = operatingOutflows.reduce((s, x) => s + x.amount, 0);
    const totalInvesting = investingOutflows.reduce((s, x) => s + x.amount, 0);
    
    // Build daily flow with running balance
    let runningBalance = openingBalance;
    const dailyFlow = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, flow]) => {
        runningBalance += flow.inflow - flow.outflow;
        return { date, ...flow, balance: runningBalance };
      });
    
    return {
      period: { start, end },
      openingBalance,
      closingBalance: runningBalance,
      operating: {
        inflows: operatingInflows,
        outflows: operatingOutflows,
        netOperating: totalInflows - totalOutflows,
      },
      investing: {
        inflows: [],
        outflows: investingOutflows,
        netInvesting: -totalInvesting,
      },
      financing: {
        inflows: [],
        outflows: [],
        netFinancing: 0,
      },
      netCashFlow: totalInflows - totalOutflows - totalInvesting,
      dailyFlow,
    };
  }, [transactions, accounts]);

  const getBalanceSheet = useCallback((asOfDate?: string): BalanceSheetReport => {
    const date = asOfDate || new Date().toISOString().split('T')[0];
    
    // Get all asset accounts
    const assetAccounts = accounts.filter(a => a.category === 'asset' && a.isActive);
    const currentAssetSubs: AccountSubCategory[] = ['cash', 'bank', 'receivable', 'inventory', 'prepaid'];
    const currentAssets = assetAccounts.filter(a => currentAssetSubs.includes(a.subCategory));
    const fixedAssets = assetAccounts.filter(a => !currentAssetSubs.includes(a.subCategory));
    
    // Add receivables to current assets calculation
    const receivableTotal = receivables.reduce((sum, r) => sum + r.outstandingAmount, 0);
    
    // Get liability accounts
    const liabilityAccounts = accounts.filter(a => a.category === 'liability' && a.isActive);
    const currentLiabSubs: AccountSubCategory[] = ['payable', 'project_debt'];
    const currentLiabilities = liabilityAccounts.filter(a => currentLiabSubs.includes(a.subCategory));
    const longTermLiabilities = liabilityAccounts.filter(a => !currentLiabSubs.includes(a.subCategory));
    
    // Add payables to current liabilities calculation
    const payableTotal = payables.reduce((sum, p) => sum + p.outstandingAmount, 0);
    
    // Get equity accounts
    const equityAccounts = accounts.filter(a => a.category === 'equity' && a.isActive);
    
    const totalCurrentAssets = currentAssets.reduce((s, a) => s + a.balance, 0) + receivableTotal;
    const totalFixedAssets = fixedAssets.reduce((s, a) => s + a.balance, 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;
    
    const totalCurrentLiab = currentLiabilities.reduce((s, a) => s + a.balance, 0) + payableTotal;
    const totalLongTermLiab = longTermLiabilities.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = totalCurrentLiab + totalLongTermLiab;
    
    const totalEquity = equityAccounts.reduce((s, a) => s + a.balance, 0);
    
    return {
      asOfDate: date,
      assets: {
        current: {
          total: totalCurrentAssets,
          items: [
            ...currentAssets.map(a => ({ name: a.name, accountCode: a.code, balance: a.balance })),
            { name: 'Piutang Usaha', accountCode: '1130', balance: receivableTotal },
          ],
        },
        fixed: {
          total: totalFixedAssets,
          items: fixedAssets.map(a => ({ name: a.name, accountCode: a.code, balance: a.balance })),
        },
        totalAssets,
      },
      liabilities: {
        current: {
          total: totalCurrentLiab,
          items: [
            ...currentLiabilities.map(a => ({ name: a.name, accountCode: a.code, balance: a.balance })),
            { name: 'Hutang Usaha', accountCode: '2110', balance: payableTotal },
          ],
        },
        longTerm: {
          total: totalLongTermLiab,
          items: longTermLiabilities.map(a => ({ name: a.name, accountCode: a.code, balance: a.balance })),
        },
        totalLiabilities,
      },
      equity: {
        total: totalEquity,
        items: equityAccounts.map(a => ({ name: a.name, accountCode: a.code, balance: a.balance })),
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1, // Allow small rounding difference
    };
  }, [accounts, receivables, payables]);

  const getProjectFinancialReport = useCallback((projectId: string): ProjectFinancialReport => {
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');
    
    const projectTrx = transactions.filter(t => t.projectId === projectId);
    const projectRecv = receivables.filter(r => r.projectId === projectId);
    const projectPay = payables.filter(p => p.projectId === projectId);
    const projectPayroll = payrollRecords.filter(pr => 
      pr.projectWages?.some(pw => pw.projectId === projectId)
    );
    
    // Income
    const incomeTrx = projectTrx.filter(t => t.type === 'Income');
    const totalIncome = incomeTrx.reduce((s, t) => s + t.amount, 0);
    const invoiced = projectRecv.reduce((s, r) => s + r.totalAmount, 0);
    const collected = projectRecv.reduce((s, r) => s + r.paidAmount, 0);
    const outstanding = projectRecv.reduce((s, r) => s + r.outstandingAmount, 0);

    // Payables
    const payableTotal = projectPay.reduce((s, p) => s + p.totalAmount, 0);
    const payablePaid = projectPay.reduce((s, p) => s + p.paidAmount, 0);
    const payableOutstanding = projectPay.reduce((s, p) => s + p.outstandingAmount, 0);
    const payablePayments = projectPay
      .flatMap(p => p.payments.map(pay => ({
        date: pay.date,
        description: pay.notes || pay.reference || 'Pembayaran',
        amount: pay.amount,
        method: pay.method,
      })));
    
    // Expenses
    const expenseTrx = projectTrx.filter(t => t.type === 'Expense');
    const totalExpense = expenseTrx.reduce((s, t) => s + t.amount, 0);
    
    const expensesByCategory = expenseTrx.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Payroll costs
    const payrollTotal = projectPayroll.reduce((s, pr) => {
      const projectWages = pr.projectWages?.filter(pw => pw.projectId === projectId) || [];
      return s + projectWages.reduce((ws, w) => ws + w.totalAmount, 0);
    }, 0);
    
    // Budget vs actual
    const budgetCategories = project.budgetCategories.map(bc => {
      const actual = bc.spent;
      const variance = bc.allocated - actual;
      return {
        name: bc.name,
        budgeted: bc.allocated,
        actual,
        variance,
        variancePercent: bc.allocated > 0 ? Math.round((variance / bc.allocated) * 100) : 0,
      };
    });
    
    const grossProfit = totalIncome - totalExpense - payrollTotal;
    
    return {
      projectId,
      projectName: project.name,
      projectStatus: project.status,
      period: { start: project.startDate, end: project.endDate },
      budget: {
        total: project.budget,
        categories: budgetCategories,
      },
      income: {
        contracted: project.budget,
        invoiced,
        collected,
        outstanding,
        payments: incomeTrx.map(t => ({
          date: t.date,
          description: t.desc,
          amount: t.amount,
          type: t.category,
        })),
      },
      payables: {
        total: payableTotal,
        paid: payablePaid,
        outstanding: payableOutstanding,
        payments: payablePayments.sort((a, b) => b.date.localeCompare(a.date)),
      },
      expenses: {
        total: totalExpense + payrollTotal,
        categories: Object.entries(expensesByCategory).map(([name, amount]) => ({
          name,
          amount,
          percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        })),
        topExpenses: expenseTrx.slice(0, 10).map(t => ({
          date: t.date,
          description: t.desc,
          amount: t.amount,
          category: t.category,
        })),
      },
      payroll: {
        total: payrollTotal,
        workers: [],
      },
      profitability: {
        grossProfit,
        grossMargin: totalIncome > 0 ? Math.round((grossProfit / totalIncome) * 100) : 0,
        netProfit: grossProfit,
        netMargin: totalIncome > 0 ? Math.round((grossProfit / totalIncome) * 100) : 0,
      },
      health: {
        budgetUtilization: project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0,
        paymentCollection: invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0,
        isOnBudget: project.spent <= project.budget,
        isOnTrack: project.status !== 'Overdue' && project.status !== 'On Hold',
      },
    };
  }, [projects, transactions, receivables, payables, payrollRecords]);

  const getAgingReport = useCallback((type: 'receivables' | 'payables'): AgingReport => {
    const today = new Date();
    const items = type === 'receivables' ? receivables : payables;
    
    const processed = items.filter(item => item.outstandingAmount > 0).map(item => {
      const dueDate = new Date(item.dueDate);
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      let agingBucket: 'Current' | '31-60' | '61-90' | '90+' = 'Current';
      if (daysOverdue > 90) agingBucket = '90+';
      else if (daysOverdue > 60) agingBucket = '61-90';
      else if (daysOverdue > 30) agingBucket = '31-60';
      
      const lastPayment = item.payments.length > 0 
        ? item.payments.sort((a, b) => b.date.localeCompare(a.date))[0]
        : undefined;
      
      return {
        id: item.id,
        entityName: type === 'receivables' 
          ? (item as Receivable).customerName || item.projectName || 'Unknown'
          : (item as Payable).supplierName || item.projectName || 'Unknown',
        projectName: item.projectName,
        originalAmount: item.totalAmount,
        outstandingAmount: item.outstandingAmount,
        dueDate: item.dueDate,
        daysOverdue,
        agingBucket,
        lastPaymentDate: lastPayment?.date,
        lastPaymentAmount: lastPayment?.amount,
      };
    });
    
    const summary = {
      total: processed.reduce((s, i) => s + i.outstandingAmount, 0),
      current: processed.filter(i => i.agingBucket === 'Current').reduce((s, i) => s + i.outstandingAmount, 0),
      days31to60: processed.filter(i => i.agingBucket === '31-60').reduce((s, i) => s + i.outstandingAmount, 0),
      days61to90: processed.filter(i => i.agingBucket === '61-90').reduce((s, i) => s + i.outstandingAmount, 0),
      over90: processed.filter(i => i.agingBucket === '90+').reduce((s, i) => s + i.outstandingAmount, 0),
    };
    
    // Group by entity
    const byEntity = processed.reduce((acc, item) => {
      const existing = acc.find(x => x.name === item.entityName);
      if (existing) {
        existing.total += item.outstandingAmount;
        if (item.daysOverdue > 0) existing.overdue += item.outstandingAmount;
      } else {
        acc.push({
          name: item.entityName,
          total: item.outstandingAmount,
          overdue: item.daysOverdue > 0 ? item.outstandingAmount : 0,
        });
      }
      return acc;
    }, [] as { name: string; total: number; overdue: number }[]);
    
    return {
      type,
      asOfDate: today.toISOString().split('T')[0],
      summary,
      items: processed,
      byEntity,
    };
  }, [receivables, payables]);

  const getTransactionSummary = useCallback((startDate?: string, endDate?: string, groupBy: 'day' | 'week' | 'month' | 'category' | 'project' = 'category'): TransactionSummaryReport => {
    const today = new Date();
    const start = startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || today.toISOString().split('T')[0];
    
    const filtered = transactions.filter(t => t.date >= start && t.date <= end);
    
    const totalIncome = filtered.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = filtered.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
    
    // Group transactions
    const groupedMap: Record<string, { income: number; expense: number; items: typeof filtered }> = {};
    
    filtered.forEach(t => {
      let key: string;
      switch (groupBy) {
        case 'day': key = t.date; break;
        case 'week': {
          const d = new Date(t.date);
          const weekNum = Math.ceil((d.getDate() + 6 - d.getDay()) / 7);
          key = `${t.date.substring(0, 7)}-W${weekNum}`;
          break;
        }
        case 'month': key = t.date.substring(0, 7); break;
        case 'category': key = t.category; break;
        case 'project': key = t.projectId ? (projects.find(p => p.id === t.projectId)?.name || 'Unknown') : 'Non-Project'; break;
        default: key = t.category;
      }
      
      if (!groupedMap[key]) groupedMap[key] = { income: 0, expense: 0, items: [] };
      if (t.type === 'Income') groupedMap[key].income += t.amount;
      else if (t.type === 'Expense') groupedMap[key].expense += t.amount;
      groupedMap[key].items.push(t);
    });
    
    const groups = Object.entries(groupedMap).map(([key, data]) => ({
      key,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
      count: data.items.length,
      items: data.items.map(t => ({
        id: t.id,
        date: t.date,
        description: t.desc,
        amount: t.amount,
        type: t.type,
      })),
    }));
    
    // Top transactions
    const topIncome = filtered
      .filter(t => t.type === 'Income')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(t => ({ description: t.desc, amount: t.amount, date: t.date }));
    
    const topExpense = filtered
      .filter(t => t.type === 'Expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(t => ({ description: t.desc, amount: t.amount, date: t.date }));
    
    return {
      period: { start, end },
      groupBy,
      totals: {
        income: totalIncome,
        expense: totalExpense,
        net: totalIncome - totalExpense,
        transactionCount: filtered.length,
      },
      groups,
      topIncome,
      topExpense,
    };
  }, [transactions, projects]);

  const store: DataStore = {
    currentUser, users, employees, attendance, workLogs, taskComments,
    customers, projects, estimates, transactions, inventory, activityLog,
    setCurrentUser, getCustomer, getProject, getProjectsByCustomer, getEstimatesByProject, getEstimatesByCustomer, getTransactionsByProject,
    addCustomer, updateCustomer, addProject, updateProject, archiveProject, restoreProject, deleteProjectPermanently, getArchivedProjects, addEstimate, updateEstimate,
    addTransaction, updateInventoryStock, addTask, updateTask, addActivity,
    renameProject, transferBudget,
    addMilestone, updateMilestone, toggleMilestoneCheck, addMilestoneCheckItem, updateBudgetCategory,
    addProjectBudgetLine, updateProjectBudgetLine, removeProjectBudgetLine, importProjectBudgetLinesFromEstimates,
    getEmployeeByUserId, getAttendance, checkIn, checkOut, addWorkLog,
    leaveRequests, payrollRecords,
    getLeaveRequests, submitLeave, approveLeave,
    getPayroll, computePayroll,
    getAllPayroll, approvePayroll, processPayroll, markPayrollPaid, generatePayrollForPeriod, addProjectWageToPayroll,
    getPayrollSummary, getPayrollTransactions, getProjectLaborCosts,
    canAccess, getWorkLogsByTask, getWorkLogsByUser, getTaskComments, addTaskComment,
    // Company info & Employee personal data
    companyInfo, policies, announcements, employeeDocuments,
    getMyDocuments, getMyPayroll, getMyAttendanceHistory, getCurrentMonthSalaryEstimate,
    // Work hours & Leave balance
    getWorkHoursSummary, getMyLeaveRequests, getLeaveBalance,
    // Chart of Accounts (COA)
    accounts, getAccountsByCategory, getAccountBalance, getTotalByCategory, addAccount, updateAccountBalance,
    // Receivables & Payables
    receivables, payables,
    getReceivables, getReceivablesSummary, addReceivable, recordReceivablePayment,
    getPayables, getPayablesSummary, addPayable, recordPayablePayment,
    createInterProjectDebt, settleInterProjectDebt,
    // Financial Reports
    getProfitLossReport, getCashFlowReport, getBalanceSheet, getProjectFinancialReport, getAgingReport, getTransactionSummary,
  };

  return <DataContext.Provider value={store}>{children}</DataContext.Provider>;
}

export function useData(): DataStore {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
