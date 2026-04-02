import Dexie, { Table } from 'dexie';

// --- TYPE DEFINITIONS ---

export type UserRole = 'OWNER' | 'ADMIN_SYSTEM';
export type SubscriptionPlan = 'FREE' | 'PRO' | 'ENTERPRISE';
export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'EWALLET';
export type TransactionStatus = 'COMPLETED' | 'VOIDED' | 'PENDING';
export type DiscountType = 'PERCENT' | 'NOMINAL';
export type DebtType = 'DEBT' | 'RECEIVABLE';
export type DebtStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type CostType = 'PRODUCTION' | 'OPERATIONAL' | 'SALARY' | 'MARKETING' | 'OTHER';
export type CostFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type SessionStatus = 'ACTIVE' | 'CLOSED';
export type CashflowType = 'INCOME' | 'EXPENSE';
export type AccountCategory = 'asset' | 'liability' | 'equity' | 'income' | 'expense';
export type AccountSubCategory = string;
export type StoreDayStatus = 'OPEN' | 'CLOSED';
export type StockOpnameStatus = 'DRAFT' | 'FINAL';
export type StockOpnameApprovalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED';
export type StockAdjustmentReason = 'OPNAME' | 'MANUAL';
export type TaskStatus = 'TODO' | 'DOING' | 'DONE';
export type TaskColumnKind = 'DEFAULT' | 'CUSTOM';

export interface User {
  id?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Tenant {
  id?: string;
  ownerId: string;
  name: string;
  slug: string;
  subscriptionPlan: SubscriptionPlan;
  isActive: boolean;
  createdAt: Date;
}

export interface Business {
  id?: string;
  tenantId: string;
  name: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  category?: string;
  taxPercentage: number;
  serviceChargePercentage: number;
  receiptHeader?: string;
  receiptFooter?: string;
  isActive: boolean;
  createdAt: Date;
  taxEnabled?: boolean;
  serviceChargeEnabled?: boolean;
  receiptShowTax?: boolean;
  notifyLowStock?: boolean;
  notifyDebtDue?: boolean;
  emailDailySummary?: boolean;
  defaultProductTaxPercent?: number;
  skuAutoPrefix?: string;
  defaultUnit?: string;
  printerPaperMm?: 58 | 80;
  /** If true, cashier must do stock opname after closing store day */
  requireStockOpnameAfterClose?: boolean;
  /** If true, submitted stock opname auto-approved and applies stock */
  stockOpnameAutoApprove?: boolean;
  /** Enable manual non-cash payment methods showing destination accounts */
  manualPaymentEnabled?: boolean;
  /** Require proof photo for manual non-cash payments */
  manualPaymentProofRequired?: boolean;
}

export type ManualPaymentAccountType = 'BANK' | 'EWALLET';
export type ManualPaymentAccountProvider =
  | 'BCA'
  | 'BRI'
  | 'BNI'
  | 'MANDIRI'
  | 'PERMATA'
  | 'DANA'
  | 'OVO'
  | 'GOPAY'
  | 'LINKAJA'
  | 'SHOPEEPAY'
  | 'OTHER';

export interface PaymentManualAccount {
  id?: string;
  tenantId: string;
  businessId: string;
  type: ManualPaymentAccountType;
  provider: ManualPaymentAccountProvider;
  label: string;
  ownerName?: string;
  accountNumber: string;
  instructions?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cashier {
  id?: string;
  businessId: string;
  tenantId: string;
  name: string;
  pinHash: string;
  avatarUrl?: string;
  phone?: string;
  whatsapp?: string;
  isActive: boolean;
  createdAt: Date;
  /** Permissions (default true untuk void/diskon jika tidak di-set) */
  canVoid?: boolean;
  canDiscount?: boolean;
  maxDiscountPercent?: number;
  canViewReports?: boolean;
}

export interface CashierSession {
  id?: string;
  cashierId: string;
  businessId: string;
  shiftId?: string;
  clockIn: Date;
  clockOut?: Date;
  pinVerifiedAt: Date;
  ipAddress?: string;
  deviceInfo?: string;
  status: SessionStatus;
}

export interface Shift {
  id?: string;
  businessId: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Category {
  id?: string;
  businessId: string;
  tenantId: string;
  name: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id?: string;
  businessId: string;
  tenantId: string;
  categoryId?: string;
  name: string;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  sellingPrice: number;
  hpp: number;
  stockQuantity: number;
  minStockAlert: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Material {
  id?: string;
  businessId: string;
  tenantId: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  stockQuantity: number;
  minStockAlert: number;
  supplierName?: string;
  supplierContact?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface MaterialRestockHistory {
  id?: string;
  materialId: string;
  businessId: string;
  tenantId: string;
  previousStock: number;
  addedStock: number;
  newStock: number;
  pricePerUnit: number;
  totalCost: number;
  notes?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface ProductMaterial {
  id?: string;
  productId: string;
  materialId: string;
  quantityUsed: number;
  unit: string;
  cost: number;
}

export interface Transaction {
  id?: string;
  businessId: string;
  tenantId: string;
  cashierId: string;
  shiftId?: string;
  invoiceNumber: string;
  subtotal: number;
  discountAmount: number;
  discountType: DiscountType;
  taxAmount: number;
  serviceCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  changeAmount: number;
  customerName?: string;
  notes?: string;
  status: TransactionStatus;
  createdAt: Date;
  manualPaymentAccountId?: string;
  manualPaymentProofDataUrl?: string;
  manualPaymentConfirmedAt?: Date;
}

export interface TransactionItem {
  id?: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  notes?: string;
}

export interface DebtReceivable {
  id?: string;
  businessId: string;
  tenantId: string;
  type: DebtType;
  partyName: string;
  partyPhone?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: Date;
  status: DebtStatus;
  notes?: string;
  createdAt: Date;
}

export interface BusinessCost {
  id?: string;
  businessId: string;
  tenantId: string;
  type: CostType;
  name: string;
  amount: number;
  frequency: CostFrequency;
  isActive: boolean;
  createdAt: Date;
}

export interface CashflowEntry {
  id?: string;
  businessId: string;
  tenantId: string;
  type: CashflowType;
  category: string;
  date: Date;
  amount: number;
  description: string;
  attachment?: Blob | null;
  attachmentName?: string | null;
  createdAt: Date;
}

export interface DebtPayment {
  id?: string;
  debtReceivableId: string;
  businessId: string;
  tenantId: string;
  amount: number;
  paidAt: Date;
  notes?: string;
  createdAt: Date;
}

export interface FinanceAccount {
  id?: string;
  businessId: string;
  tenantId: string;
  code: string;
  name: string;
  category: AccountCategory;
  subCategory?: AccountSubCategory;
  parentId?: string | null;
  sortOrder: number;
  balance: number;
  isActive: boolean;
  isSystem?: boolean;
  createdAt: Date;
}

export interface ActivityLog {
  id?: string;
  tenantId: string;
  businessId: string;
  actorType: 'OWNER' | 'CASHIER';
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

export interface TodoItem {
  id?: string;
  tenantId: string;
  businessId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: TodoPriority;
  dueDate?: Date;
  createdAt: Date;
}

export interface TaskItem {
  id?: string;
  tenantId: string;
  businessId: string;
  title: string;
  description?: string;
  /** Backward compatible; prefer `columnId` */
  status?: TaskStatus;
  /** Kanban column reference */
  columnId: string;
  priority: TodoPriority;
  dueDate?: Date;
  /** JSON string of cashierIds tagged/assigned */
  assigneeCashierIdsJson: string;
  createdAt: Date;
  updatedAt?: Date;
  createdByOwnerId: string;
}

export interface TaskColumn {
  id?: string;
  tenantId: string;
  businessId: string;
  title: string;
  sortOrder: number;
  kind: TaskColumnKind;
  createdAt: Date;
  updatedAt?: Date;
}

/** Jadwal kasir per hari (tanpa drag–drop di DB; UI menyimpan assignment). */
export interface ShiftAssignment {
  id?: string;
  businessId: string;
  tenantId: string;
  shiftId: string;
  cashierId: string;
  /** YYYY-MM-DD */
  date: string;
  createdAt: Date;
}

export interface ShiftCloseRecord {
  id?: string;
  businessId: string;
  tenantId: string;
  cashierId: string;
  cashierSessionId?: string;
  shiftId?: string;
  expectedCash: number;
  actualCash: number;
  variance: number;
  transactionCount: number;
  voidCount: number;
  totalRevenue: number;
  paymentBreakdownJson: string;
  notes?: string;
  closedAt: Date;
  closedBy: 'OWNER' | 'CASHIER';
}

export type MemberTier = 'REGULAR' | 'SILVER' | 'GOLD';

export interface Member {
  id?: string;
  businessId: string;
  tenantId: string;
  name: string;
  phone?: string;
  email?: string;
  tier: MemberTier;
  points: number;
  specialPricePercent?: number;
  specialDiscountPercent?: number;
  benefitStartAt?: Date;
  benefitEndAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export type LeadStage = 'DEMO' | 'CHECKOUT' | 'PAID' | 'ONBOARDED';

export interface CrmLead {
  id?: string;
  tenantId?: string;
  businessId?: string;
  fullName: string;
  email: string;
  phone: string;
  businessType: string;
  source: 'LANDING_DEMO' | 'LANDING_CHECKOUT' | 'APP_FEEDBACK';
  stage: LeadStage;
  notes?: string;
  orderId?: string;
  amount?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface BuyerInboxMessage {
  id?: string;
  leadId?: string;
  senderName: string;
  senderEmail?: string;
  message: string;
  createdAt: Date;
  status: 'NEW' | 'REVIEWED' | 'DONE';
}

export interface PayrollProfile {
  id?: string;
  businessId: string;
  tenantId: string;
  cashierId: string;
  baseSalaryMonthly: number;
  hourlyRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PayrollRun {
  id?: string;
  businessId: string;
  tenantId: string;
  /** YYYY-MM */
  month: string;
  generatedAt: Date;
  generatedBy: 'OWNER';
}

export interface PayrollLine {
  id?: string;
  payrollRunId: string;
  businessId: string;
  tenantId: string;
  cashierId: string;
  daysWorked: number;
  totalHours: number;
  baseSalaryMonthly: number;
  hourlyRate: number;
  grossPay: number;
}

export interface StoreDay {
  id?: string;
  tenantId: string;
  businessId: string;
  /** YYYY-MM-DD (local business day) */
  dateYmd: string;
  status: StoreDayStatus;
  openedAt: Date;
  openedByOwnerId: string;
  openingCash: number;
  closedAt?: Date;
  closedByOwnerId?: string;
  actualCash?: number;
  expectedCash?: number;
  variance?: number;
  summaryJson?: string;
  updatedAt?: Date;
}

export interface CashierHandover {
  id?: string;
  tenantId: string;
  businessId: string;
  dateYmd: string;
  fromCashierId: string;
  toCashierId: string;
  handoverAt: Date;
  notes?: string;
  drawerCashAtHandover?: number;
}

export interface StockOpnameSession {
  id?: string;
  tenantId: string;
  businessId: string;
  status: StockOpnameApprovalStatus;
  startedAt: Date;
  endedAt?: Date;
  createdByActorType: 'OWNER' | 'CASHIER';
  createdByActorId: string;
  notes?: string;
  storeDayId?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedByOwnerId?: string;
}

export interface StockOpnameLine {
  id?: string;
  tenantId: string;
  businessId: string;
  sessionId: string;
  itemType: 'PRODUCT' | 'MATERIAL';
  itemId: string;
  systemQty: number;
  countedQty: number;
  diffQty: number;
}

export interface MaterialStockAdjustment {
  id?: string;
  tenantId: string;
  businessId: string;
  materialId: string;
  qtyDelta: number;
  reason: StockAdjustmentReason;
  refId?: string;
  createdAt: Date;
  createdByOwnerId: string;
}

export interface StockAdjustment {
  id?: string;
  tenantId: string;
  businessId: string;
  productId: string;
  qtyDelta: number;
  reason: StockAdjustmentReason;
  refId?: string;
  createdAt: Date;
  createdByOwnerId: string;
}

// --- DATABASE CLASS ---

class POSDatabase extends Dexie {
  users!: Table<User, string>;
  tenants!: Table<Tenant, string>;
  businesses!: Table<Business, string>;
  cashiers!: Table<Cashier, string>;
  cashierSessions!: Table<CashierSession, string>;
  shifts!: Table<Shift, string>;
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  materials!: Table<Material, string>;
  productMaterials!: Table<ProductMaterial, string>;
  transactions!: Table<Transaction, string>;
  transactionItems!: Table<TransactionItem, string>;
  debtReceivables!: Table<DebtReceivable, string>;
  businessCosts!: Table<BusinessCost, string>;
  cashflowEntries!: Table<CashflowEntry, string>;
  debtPayments!: Table<DebtPayment, string>;
  financeAccounts!: Table<FinanceAccount, string>;
  activityLogs!: Table<ActivityLog, string>;
  todoItems!: Table<TodoItem, string>;
  materialRestockHistory!: Table<MaterialRestockHistory, string>;
  shiftAssignments!: Table<ShiftAssignment, string>;
  shiftCloses!: Table<ShiftCloseRecord, string>;
  members!: Table<Member, string>;
  crmLeads!: Table<CrmLead, string>;
  buyerInbox!: Table<BuyerInboxMessage, string>;
  payrollProfiles!: Table<PayrollProfile, string>;
  payrollRuns!: Table<PayrollRun, string>;
  payrollLines!: Table<PayrollLine, string>;
  storeDays!: Table<StoreDay, string>;
  cashierHandovers!: Table<CashierHandover, string>;
  stockOpnameSessions!: Table<StockOpnameSession, string>;
  stockOpnameLines!: Table<StockOpnameLine, string>;
  stockAdjustments!: Table<StockAdjustment, string>;
  materialStockAdjustments!: Table<MaterialStockAdjustment, string>;
  paymentManualAccounts!: Table<PaymentManualAccount, string>;
  tasks!: Table<TaskItem, string>;
  taskColumns!: Table<TaskColumn, string>;

  constructor() {
    super('POSDatabase');

    this.version(3).stores({
      users: '++id, email, role, createdAt',
      tenants: '++id, ownerId, slug, isActive',
      businesses: '++id, tenantId, isActive',
      cashiers: '++id, businessId, tenantId, isActive',
      cashierSessions: '++id, cashierId, businessId, status, clockIn',
      shifts: '++id, businessId, isActive',
      categories: '++id, businessId, tenantId, sortOrder',
      products: '++id, businessId, tenantId, categoryId, sku, barcode, isActive',
      materials: '++id, businessId, tenantId, isActive',
      productMaterials: '++id, productId, materialId',
      transactions: '++id, businessId, tenantId, cashierId, invoiceNumber, status, createdAt, paymentMethod',
      transactionItems: '++id, transactionId, productId',
      debtReceivables: '++id, businessId, tenantId, type, status, dueDate',
      businessCosts: '++id, businessId, tenantId, type, isActive, createdAt',
      cashflowEntries: '++id, businessId, tenantId, type, category, date, createdAt',
      debtPayments: '++id, businessId, tenantId, debtReceivableId, paidAt, createdAt',
      financeAccounts: '++id, businessId, tenantId, category, subCategory, parentId, sortOrder, code, isActive',
      activityLogs: '++id, tenantId, businessId, actorId, createdAt',
      todoItems: '++id, tenantId, businessId, isCompleted, priority, dueDate',
      materialRestockHistory: '++id, materialId, businessId, tenantId, createdAt',
    });

    this.version(4).stores({
      users: '++id, email, role, createdAt',
      tenants: '++id, ownerId, slug, isActive',
      businesses: '++id, tenantId, isActive',
      cashiers: '++id, businessId, tenantId, isActive',
      cashierSessions: '++id, cashierId, businessId, status, clockIn',
      shifts: '++id, businessId, isActive',
      categories: '++id, businessId, tenantId, sortOrder',
      products: '++id, businessId, tenantId, categoryId, sku, barcode, isActive',
      materials: '++id, businessId, tenantId, isActive',
      productMaterials: '++id, productId, materialId',
      transactions: '++id, businessId, tenantId, cashierId, invoiceNumber, status, createdAt, paymentMethod',
      transactionItems: '++id, transactionId, productId',
      debtReceivables: '++id, businessId, tenantId, type, status, dueDate',
      businessCosts: '++id, businessId, tenantId, type, isActive, createdAt',
      cashflowEntries: '++id, businessId, tenantId, type, category, date, createdAt',
      debtPayments: '++id, businessId, tenantId, debtReceivableId, paidAt, createdAt',
      financeAccounts: '++id, businessId, tenantId, category, subCategory, parentId, sortOrder, code, isActive',
      activityLogs: '++id, tenantId, businessId, actorId, action, createdAt',
      todoItems: '++id, tenantId, businessId, isCompleted, priority, dueDate',
      materialRestockHistory: '++id, materialId, businessId, tenantId, createdAt',
      shiftAssignments: '++id, businessId, shiftId, cashierId, date, tenantId',
      shiftCloses: '++id, businessId, cashierId, closedAt, tenantId',
    });

    this.version(5).stores({
      users: '++id, email, role, createdAt',
      tenants: '++id, ownerId, slug, isActive',
      businesses: '++id, tenantId, isActive',
      cashiers: '++id, businessId, tenantId, isActive',
      cashierSessions: '++id, cashierId, businessId, status, clockIn',
      shifts: '++id, businessId, isActive',
      categories: '++id, businessId, tenantId, sortOrder',
      products: '++id, businessId, tenantId, categoryId, sku, barcode, isActive',
      materials: '++id, businessId, tenantId, isActive',
      productMaterials: '++id, productId, materialId',
      transactions: '++id, businessId, tenantId, cashierId, invoiceNumber, status, createdAt, paymentMethod',
      transactionItems: '++id, transactionId, productId',
      debtReceivables: '++id, businessId, tenantId, type, status, dueDate',
      businessCosts: '++id, businessId, tenantId, type, isActive, createdAt',
      cashflowEntries: '++id, businessId, tenantId, type, category, date, createdAt',
      debtPayments: '++id, businessId, tenantId, debtReceivableId, paidAt, createdAt',
      financeAccounts: '++id, businessId, tenantId, category, subCategory, parentId, sortOrder, code, isActive',
      activityLogs: '++id, tenantId, businessId, actorId, action, createdAt',
      todoItems: '++id, tenantId, businessId, isCompleted, priority, dueDate',
      materialRestockHistory: '++id, materialId, businessId, tenantId, createdAt',
      shiftAssignments: '++id, businessId, shiftId, cashierId, date, tenantId',
      shiftCloses: '++id, businessId, cashierId, closedAt, tenantId',
      members: '++id, businessId, tenantId, tier, phone, email, isActive, createdAt',
    });

    this.version(6).stores({
      users: '++id, email, role, createdAt',
      tenants: '++id, ownerId, slug, isActive',
      businesses: '++id, tenantId, isActive',
      cashiers: '++id, businessId, tenantId, isActive',
      cashierSessions: '++id, cashierId, businessId, status, clockIn',
      shifts: '++id, businessId, isActive',
      categories: '++id, businessId, tenantId, sortOrder',
      products: '++id, businessId, tenantId, categoryId, sku, barcode, isActive',
      materials: '++id, businessId, tenantId, isActive',
      productMaterials: '++id, productId, materialId',
      transactions: '++id, businessId, tenantId, cashierId, invoiceNumber, status, createdAt, paymentMethod',
      transactionItems: '++id, transactionId, productId',
      debtReceivables: '++id, businessId, tenantId, type, status, dueDate',
      businessCosts: '++id, businessId, tenantId, type, isActive, createdAt',
      cashflowEntries: '++id, businessId, tenantId, type, category, date, createdAt',
      debtPayments: '++id, businessId, tenantId, debtReceivableId, paidAt, createdAt',
      financeAccounts: '++id, businessId, tenantId, category, subCategory, parentId, sortOrder, code, isActive',
      activityLogs: '++id, tenantId, businessId, actorId, action, createdAt',
      todoItems: '++id, tenantId, businessId, isCompleted, priority, dueDate',
      materialRestockHistory: '++id, materialId, businessId, tenantId, createdAt',
      shiftAssignments: '++id, businessId, shiftId, cashierId, date, tenantId',
      shiftCloses: '++id, businessId, cashierId, closedAt, tenantId',
      members: '++id, businessId, tenantId, tier, phone, email, isActive, createdAt',
      crmLeads: '++id, stage, source, email, phone, createdAt, tenantId, businessId',
      buyerInbox: '++id, leadId, status, createdAt',
    });

    this.version(7).stores({
      users: '++id, email, role, createdAt',
      tenants: '++id, ownerId, slug, isActive',
      businesses: '++id, tenantId, isActive',
      cashiers: '++id, businessId, tenantId, isActive',
      cashierSessions: '++id, cashierId, businessId, status, clockIn',
      shifts: '++id, businessId, isActive',
      categories: '++id, businessId, tenantId, sortOrder',
      products: '++id, businessId, tenantId, categoryId, sku, barcode, isActive',
      materials: '++id, businessId, tenantId, isActive',
      productMaterials: '++id, productId, materialId',
      transactions: '++id, businessId, tenantId, cashierId, invoiceNumber, status, createdAt, paymentMethod',
      transactionItems: '++id, transactionId, productId',
      debtReceivables: '++id, businessId, tenantId, type, status, dueDate',
      businessCosts: '++id, businessId, tenantId, type, isActive, createdAt',
      cashflowEntries: '++id, businessId, tenantId, type, category, date, createdAt',
      debtPayments: '++id, businessId, tenantId, debtReceivableId, paidAt, createdAt',
      financeAccounts: '++id, businessId, tenantId, category, subCategory, parentId, sortOrder, code, isActive',
      activityLogs: '++id, tenantId, businessId, actorId, action, createdAt',
      todoItems: '++id, tenantId, businessId, isCompleted, priority, dueDate',
      materialRestockHistory: '++id, materialId, businessId, tenantId, createdAt',
      shiftAssignments: '++id, businessId, shiftId, cashierId, date, tenantId',
      shiftCloses: '++id, businessId, cashierId, closedAt, tenantId',
      members: '++id, businessId, tenantId, tier, phone, email, isActive, createdAt',
      crmLeads: '++id, stage, source, email, phone, createdAt, tenantId, businessId',
      buyerInbox: '++id, leadId, status, createdAt',
      payrollProfiles: '++id, businessId, tenantId, cashierId, isActive, updatedAt',
      payrollRuns: '++id, businessId, tenantId, month, generatedAt',
      payrollLines: '++id, payrollRunId, businessId, tenantId, cashierId',
    });

    this.version(8).stores({
      users: '++id, email, role, createdAt',
      tenants: '++id, ownerId, slug, isActive',
      businesses: '++id, tenantId, isActive',
      cashiers: '++id, businessId, tenantId, isActive',
      cashierSessions: '++id, cashierId, businessId, status, clockIn',
      shifts: '++id, businessId, isActive',
      categories: '++id, businessId, tenantId, sortOrder',
      products: '++id, businessId, tenantId, categoryId, sku, barcode, isActive',
      materials: '++id, businessId, tenantId, isActive',
      productMaterials: '++id, productId, materialId',
      transactions: '++id, businessId, tenantId, cashierId, invoiceNumber, status, createdAt, paymentMethod',
      transactionItems: '++id, transactionId, productId',
      debtReceivables: '++id, businessId, tenantId, type, status, dueDate',
      businessCosts: '++id, businessId, tenantId, type, isActive, createdAt',
      cashflowEntries: '++id, businessId, tenantId, type, category, date, createdAt',
      debtPayments: '++id, businessId, tenantId, debtReceivableId, paidAt, createdAt',
      financeAccounts: '++id, businessId, tenantId, category, subCategory, parentId, sortOrder, code, isActive',
      activityLogs: '++id, tenantId, businessId, actorId, action, createdAt',
      todoItems: '++id, tenantId, businessId, isCompleted, priority, dueDate',
      materialRestockHistory: '++id, materialId, businessId, tenantId, createdAt',
      shiftAssignments: '++id, businessId, shiftId, cashierId, date, tenantId',
      shiftCloses: '++id, businessId, cashierId, closedAt, tenantId',
      members: '++id, businessId, tenantId, tier, phone, email, isActive, createdAt',
      crmLeads: '++id, stage, source, email, phone, createdAt, tenantId, businessId',
      buyerInbox: '++id, leadId, status, createdAt',
      payrollProfiles: '++id, businessId, tenantId, cashierId, isActive, updatedAt',
      payrollRuns: '++id, businessId, tenantId, month, generatedAt',
      payrollLines: '++id, payrollRunId, businessId, tenantId, cashierId',
      storeDays: '++id, tenantId, businessId, dateYmd, status, openedAt, closedAt, updatedAt',
      cashierHandovers: '++id, tenantId, businessId, dateYmd, fromCashierId, toCashierId, handoverAt',
      stockOpnameSessions: '++id, tenantId, businessId, status, startedAt, endedAt, createdByOwnerId',
      stockOpnameLines: '++id, tenantId, businessId, sessionId, productId',
      stockAdjustments: '++id, tenantId, businessId, productId, reason, createdAt, refId',
    });

    this.version(9).stores({
      users: '++id, email, role, createdAt',
      tenants: '++id, ownerId, slug, isActive',
      businesses: '++id, tenantId, isActive',
      cashiers: '++id, businessId, tenantId, isActive, whatsapp',
      cashierSessions: '++id, cashierId, businessId, status, clockIn',
      shifts: '++id, businessId, isActive',
      categories: '++id, businessId, tenantId, sortOrder',
      products: '++id, businessId, tenantId, categoryId, sku, barcode, isActive',
      materials: '++id, businessId, tenantId, isActive',
      productMaterials: '++id, productId, materialId',
      transactions: '++id, businessId, tenantId, cashierId, invoiceNumber, status, createdAt, paymentMethod',
      transactionItems: '++id, transactionId, productId',
      debtReceivables: '++id, businessId, tenantId, type, status, dueDate',
      businessCosts: '++id, businessId, tenantId, type, isActive, createdAt',
      cashflowEntries: '++id, businessId, tenantId, type, category, date, createdAt',
      debtPayments: '++id, businessId, tenantId, debtReceivableId, paidAt, createdAt',
      financeAccounts: '++id, businessId, tenantId, category, subCategory, parentId, sortOrder, code, isActive',
      activityLogs: '++id, tenantId, businessId, actorId, action, createdAt',
      todoItems: '++id, tenantId, businessId, isCompleted, priority, dueDate',
      materialRestockHistory: '++id, materialId, businessId, tenantId, createdAt',
      shiftAssignments: '++id, businessId, shiftId, cashierId, date, tenantId',
      shiftCloses: '++id, businessId, cashierId, closedAt, tenantId',
      members: '++id, businessId, tenantId, tier, phone, email, isActive, createdAt',
      crmLeads: '++id, stage, source, email, phone, createdAt, tenantId, businessId',
      buyerInbox: '++id, leadId, status, createdAt',
      payrollProfiles: '++id, businessId, tenantId, cashierId, isActive, updatedAt',
      payrollRuns: '++id, businessId, tenantId, month, generatedAt',
      payrollLines: '++id, payrollRunId, businessId, tenantId, cashierId',
      storeDays: '++id, tenantId, businessId, dateYmd, status, openedAt, closedAt, updatedAt',
      cashierHandovers: '++id, tenantId, businessId, dateYmd, fromCashierId, toCashierId, handoverAt',
      stockOpnameSessions: '++id, tenantId, businessId, status, startedAt, endedAt, createdByOwnerId',
      stockOpnameLines: '++id, tenantId, businessId, sessionId, productId',
      stockAdjustments: '++id, tenantId, businessId, productId, reason, createdAt, refId',
      tasks: '++id, tenantId, businessId, status, priority, dueDate, updatedAt, createdAt, createdByOwnerId',
    });

    this.version(10).stores({
      users: '++id, email, role, createdAt',
      tenants: '++id, ownerId, slug, isActive',
      businesses: '++id, tenantId, isActive',
      cashiers: '++id, businessId, tenantId, isActive, whatsapp',
      cashierSessions: '++id, cashierId, businessId, status, clockIn',
      shifts: '++id, businessId, isActive',
      categories: '++id, businessId, tenantId, sortOrder',
      products: '++id, businessId, tenantId, categoryId, sku, barcode, isActive',
      materials: '++id, businessId, tenantId, isActive',
      productMaterials: '++id, productId, materialId',
      transactions: '++id, businessId, tenantId, cashierId, invoiceNumber, status, createdAt, paymentMethod',
      transactionItems: '++id, transactionId, productId',
      debtReceivables: '++id, businessId, tenantId, type, status, dueDate',
      businessCosts: '++id, businessId, tenantId, type, isActive, createdAt',
      cashflowEntries: '++id, businessId, tenantId, type, category, date, createdAt',
      debtPayments: '++id, businessId, tenantId, debtReceivableId, paidAt, createdAt',
      financeAccounts: '++id, businessId, tenantId, category, subCategory, parentId, sortOrder, code, isActive',
      activityLogs: '++id, tenantId, businessId, actorId, action, createdAt',
      todoItems: '++id, tenantId, businessId, isCompleted, priority, dueDate',
      materialRestockHistory: '++id, materialId, businessId, tenantId, createdAt',
      shiftAssignments: '++id, businessId, shiftId, cashierId, date, tenantId',
      shiftCloses: '++id, businessId, cashierId, closedAt, tenantId',
      members: '++id, businessId, tenantId, tier, phone, email, isActive, createdAt',
      crmLeads: '++id, stage, source, email, phone, createdAt, tenantId, businessId',
      buyerInbox: '++id, leadId, status, createdAt',
      payrollProfiles: '++id, businessId, tenantId, cashierId, isActive, updatedAt',
      payrollRuns: '++id, businessId, tenantId, month, generatedAt',
      payrollLines: '++id, payrollRunId, businessId, tenantId, cashierId',
      storeDays: '++id, tenantId, businessId, dateYmd, status, openedAt, closedAt, updatedAt',
      cashierHandovers: '++id, tenantId, businessId, dateYmd, fromCashierId, toCashierId, handoverAt',
      stockOpnameSessions: '++id, tenantId, businessId, status, startedAt, endedAt, createdByActorType, createdByActorId, submittedAt, approvedAt, approvedByOwnerId',
      stockOpnameLines: '++id, tenantId, businessId, sessionId, itemType, itemId',
      stockAdjustments: '++id, tenantId, businessId, productId, reason, createdAt, refId',
      materialStockAdjustments: '++id, tenantId, businessId, materialId, reason, createdAt, refId',
      taskColumns: '++id, tenantId, businessId, sortOrder, kind, updatedAt, createdAt',
      tasks: '++id, tenantId, businessId, columnId, priority, dueDate, updatedAt, createdAt, createdByOwnerId',
    });

    this.version(11).stores({
      users: '++id, email, role, createdAt',
      tenants: '++id, ownerId, slug, isActive',
      businesses: '++id, tenantId, isActive, requireStockOpnameAfterClose, stockOpnameAutoApprove',
      cashiers: '++id, businessId, tenantId, isActive, whatsapp',
      cashierSessions: '++id, cashierId, businessId, status, clockIn',
      shifts: '++id, businessId, isActive',
      categories: '++id, businessId, tenantId, sortOrder',
      products: '++id, businessId, tenantId, categoryId, sku, barcode, isActive',
      materials: '++id, businessId, tenantId, isActive',
      productMaterials: '++id, productId, materialId',
      transactions: '++id, businessId, tenantId, cashierId, invoiceNumber, status, createdAt, paymentMethod',
      transactionItems: '++id, transactionId, productId',
      debtReceivables: '++id, businessId, tenantId, type, status, dueDate',
      businessCosts: '++id, businessId, tenantId, type, isActive, createdAt',
      cashflowEntries: '++id, businessId, tenantId, type, category, date, createdAt',
      debtPayments: '++id, businessId, tenantId, debtReceivableId, paidAt, createdAt',
      financeAccounts: '++id, businessId, tenantId, category, subCategory, parentId, sortOrder, code, isActive',
      activityLogs: '++id, tenantId, businessId, actorId, action, createdAt',
      todoItems: '++id, tenantId, businessId, isCompleted, priority, dueDate',
      materialRestockHistory: '++id, materialId, businessId, tenantId, createdAt',
      shiftAssignments: '++id, businessId, shiftId, cashierId, date, tenantId',
      shiftCloses: '++id, businessId, cashierId, closedAt, tenantId',
      members: '++id, businessId, tenantId, tier, phone, email, isActive, createdAt',
      crmLeads: '++id, stage, source, email, phone, createdAt, tenantId, businessId',
      buyerInbox: '++id, leadId, status, createdAt',
      payrollProfiles: '++id, businessId, tenantId, cashierId, isActive, updatedAt',
      payrollRuns: '++id, businessId, tenantId, month, generatedAt',
      payrollLines: '++id, payrollRunId, businessId, tenantId, cashierId',
      storeDays: '++id, tenantId, businessId, dateYmd, status, openedAt, closedAt, updatedAt',
      cashierHandovers: '++id, tenantId, businessId, dateYmd, fromCashierId, toCashierId, handoverAt',
      stockOpnameSessions: '++id, tenantId, businessId, status, startedAt, endedAt, createdByActorType, createdByActorId, submittedAt, approvedAt, approvedByOwnerId',
      stockOpnameLines: '++id, tenantId, businessId, sessionId, itemType, itemId',
      stockAdjustments: '++id, tenantId, businessId, productId, reason, createdAt, refId',
      materialStockAdjustments: '++id, tenantId, businessId, materialId, reason, createdAt, refId',
      paymentManualAccounts: '++id, tenantId, businessId, type, provider, isActive, updatedAt, createdAt',
      taskColumns: '++id, tenantId, businessId, sortOrder, kind, updatedAt, createdAt',
      tasks: '++id, tenantId, businessId, columnId, priority, dueDate, updatedAt, createdAt, createdByOwnerId',
    });

    this.version(12).stores({
      users: '++id, email, role, createdAt',
      tenants: '++id, ownerId, slug, isActive',
      businesses:
        '++id, tenantId, isActive, requireStockOpnameAfterClose, stockOpnameAutoApprove, manualPaymentEnabled, manualPaymentProofRequired',
      cashiers: '++id, businessId, tenantId, isActive, whatsapp',
      cashierSessions: '++id, cashierId, businessId, status, clockIn',
      shifts: '++id, businessId, isActive',
      categories: '++id, businessId, tenantId, sortOrder',
      products: '++id, businessId, tenantId, categoryId, sku, barcode, isActive',
      materials: '++id, businessId, tenantId, isActive',
      productMaterials: '++id, productId, materialId',
      transactions: '++id, businessId, tenantId, cashierId, invoiceNumber, status, createdAt, paymentMethod',
      transactionItems: '++id, transactionId, productId',
      debtReceivables: '++id, businessId, tenantId, type, status, dueDate',
      businessCosts: '++id, businessId, tenantId, type, isActive, createdAt',
      cashflowEntries: '++id, businessId, tenantId, type, category, date, createdAt',
      debtPayments: '++id, businessId, tenantId, debtReceivableId, paidAt, createdAt',
      financeAccounts: '++id, businessId, tenantId, category, subCategory, parentId, sortOrder, code, isActive',
      activityLogs: '++id, tenantId, businessId, actorId, action, createdAt',
      todoItems: '++id, tenantId, businessId, isCompleted, priority, dueDate',
      materialRestockHistory: '++id, materialId, businessId, tenantId, createdAt',
      shiftAssignments: '++id, businessId, shiftId, cashierId, date, tenantId',
      shiftCloses: '++id, businessId, cashierId, closedAt, tenantId',
      members: '++id, businessId, tenantId, tier, phone, email, isActive, createdAt',
      crmLeads: '++id, stage, source, email, phone, createdAt, tenantId, businessId',
      buyerInbox: '++id, leadId, status, createdAt',
      payrollProfiles: '++id, businessId, tenantId, cashierId, isActive, updatedAt',
      payrollRuns: '++id, businessId, tenantId, month, generatedAt',
      payrollLines: '++id, payrollRunId, businessId, tenantId, cashierId',
      storeDays: '++id, tenantId, businessId, dateYmd, status, openedAt, closedAt, updatedAt',
      cashierHandovers: '++id, tenantId, businessId, dateYmd, fromCashierId, toCashierId, handoverAt',
      stockOpnameSessions:
        '++id, tenantId, businessId, status, startedAt, endedAt, createdByActorType, createdByActorId, submittedAt, approvedAt, approvedByOwnerId',
      stockOpnameLines: '++id, tenantId, businessId, sessionId, itemType, itemId',
      stockAdjustments: '++id, tenantId, businessId, productId, reason, createdAt, refId',
      materialStockAdjustments: '++id, tenantId, businessId, materialId, reason, createdAt, refId',
      paymentManualAccounts: '++id, tenantId, businessId, type, provider, isActive, updatedAt, createdAt',
      taskColumns: '++id, tenantId, businessId, sortOrder, kind, updatedAt, createdAt',
      tasks: '++id, tenantId, businessId, columnId, priority, dueDate, updatedAt, createdAt, createdByOwnerId',
    });
  }
}

export const db = new POSDatabase();

// --- SEED DATA ---

export const DEMO_OWNER_EMAIL = 'owner@example.com';

const SUPER_ADMIN_EMAIL = 'hanif.rullyant@gmail.com';

const DEMO_PRODUCT_IMAGE_MAP: Record<string, string> = {
  'KOPI-001': 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=512&h=512&fit=crop&q=80',
  'KOPI-002': 'https://images.unsplash.com/photo-1517701550927-30cf4ba1e5a6?w=512&h=512&fit=crop&q=80',
  'KOPI-003': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=512&h=512&fit=crop&q=80',
  'KOPI-004': 'https://images.unsplash.com/photo-1510591508098-4c6db859d7b4?w=512&h=512&fit=crop&q=80',
  'KOPI-005': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=512&h=512&fit=crop&q=80',
  'FOOD-001': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=512&h=512&fit=crop&q=80',
  'FOOD-002': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=512&h=512&fit=crop&q=80',
  'FOOD-003': 'https://images.unsplash.com/photo-1525351484163-94131fb13f1a?w=512&h=512&fit=crop&q=80',
  'SNACK-001': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=512&h=512&fit=crop&q=80',
  'SNACK-002': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=512&h=512&fit=crop&q=80',
};

export async function ensureSuperAdminAccount() {
  const superAdminEmail = SUPER_ADMIN_EMAIL;
  const legacyHanif = await db.users.where('email').equals('hanif').first();
  const adminByEmail = await db.users.where('email').equals(superAdminEmail).first();
  if (legacyHanif?.id) {
    if (adminByEmail && adminByEmail.id !== legacyHanif.id) {
      await db.users.delete(legacyHanif.id);
    } else {
      await db.users.update(legacyHanif.id, {
        email: superAdminEmail,
        name: 'Hanif Super Admin',
        passwordHash: '12345678',
        role: 'ADMIN_SYSTEM',
        phone: '081298888888',
      });
    }
  } else if (!adminByEmail) {
    await db.users.add({
      id: crypto.randomUUID(),
      name: 'Hanif Super Admin',
      email: superAdminEmail,
      passwordHash: '12345678',
      role: 'ADMIN_SYSTEM',
      phone: '081298888888',
      createdAt: new Date(),
    });
  } else {
    await db.users.update(adminByEmail.id!, {
      passwordHash: '12345678',
      role: 'ADMIN_SYSTEM',
    });
  }
}

/** Tenant + bisnis kosong agar super admin bisa masuk dashboard tanpa data demo. */
export async function ensureSuperAdminShellWorkspace() {
  const admin = await db.users.where('email').equals(SUPER_ADMIN_EMAIL).first();
  if (!admin?.id) return;
  const existing = await db.tenants.where('ownerId').equals(admin.id).first();
  if (existing) return;

  const tenantId = crypto.randomUUID();
  const businessId = crypto.randomUUID();
  await db.tenants.add({
    id: tenantId,
    ownerId: admin.id,
    name: 'Administrasi Platform',
    slug: 'platform-admin',
    subscriptionPlan: 'ENTERPRISE',
    isActive: true,
    createdAt: new Date(),
  });
  await db.businesses.add({
    id: businessId,
    tenantId,
    name: 'Kantor Pusat',
    taxPercentage: 0,
    serviceChargePercentage: 0,
    isActive: true,
    createdAt: new Date(),
  });
  await seedFinanceAccountsForBusiness(businessId, tenantId);
}

export async function seedFinanceAccountsForBusiness(businessId: string, tenantId: string) {
  const accountsCount = await db.financeAccounts.where('businessId').equals(businessId).count();
  if (accountsCount > 0) return;

  const now = new Date();
  const mk = (acc: Omit<FinanceAccount, 'id' | 'createdAt'> & { id?: string; createdAt?: Date }): FinanceAccount => ({
    id: acc.id ?? crypto.randomUUID(),
    businessId,
    tenantId,
    code: acc.code,
    name: acc.name,
    category: acc.category,
    subCategory: acc.subCategory,
    parentId: acc.parentId ?? null,
    sortOrder: acc.sortOrder,
    balance: acc.balance,
    isActive: acc.isActive,
    isSystem: acc.isSystem,
    createdAt: acc.createdAt ?? now,
  });

  const rootAsset = crypto.randomUUID();
  const rootLiability = crypto.randomUUID();
  const rootEquity = crypto.randomUUID();
  const rootIncome = crypto.randomUUID();
  const rootExpense = crypto.randomUUID();

  const seedAccounts: FinanceAccount[] = [
    mk({ id: rootAsset, code: 'ROOT-ASSET', name: 'Aset', category: 'asset', sortOrder: 1, balance: 0, isActive: true, isSystem: true, parentId: null }),
    mk({ id: rootLiability, code: 'ROOT-LIAB', name: 'Liabilitas', category: 'liability', sortOrder: 2, balance: 0, isActive: true, isSystem: true, parentId: null }),
    mk({ id: rootEquity, code: 'ROOT-EQUITY', name: 'Ekuitas', category: 'equity', sortOrder: 3, balance: 0, isActive: true, isSystem: true, parentId: null }),
    mk({ id: rootIncome, code: 'ROOT-INCOME', name: 'Pendapatan', category: 'income', sortOrder: 4, balance: 0, isActive: true, isSystem: true, parentId: null }),
    mk({ id: rootExpense, code: 'ROOT-EXPENSE', name: 'Beban', category: 'expense', sortOrder: 5, balance: 0, isActive: true, isSystem: true, parentId: null }),

    mk({ code: '1-1000', name: 'Kas', category: 'asset', subCategory: 'cash', parentId: rootAsset, sortOrder: 10, balance: 0, isActive: true, isSystem: true }),
    mk({ code: '1-1100', name: 'Piutang Usaha', category: 'asset', subCategory: 'receivables', parentId: rootAsset, sortOrder: 20, balance: 0, isActive: true, isSystem: true }),

    mk({ code: '2-2000', name: 'Hutang Usaha', category: 'liability', subCategory: 'payables', parentId: rootLiability, sortOrder: 10, balance: 0, isActive: true, isSystem: true }),

    mk({ code: '3-3000', name: 'Modal Owner', category: 'equity', subCategory: 'capital', parentId: rootEquity, sortOrder: 10, balance: 0, isActive: true, isSystem: true }),
    mk({ code: '3-3002', name: 'Laba Ditahan', category: 'equity', subCategory: 'retained_earnings', parentId: rootEquity, sortOrder: 20, balance: 0, isActive: true, isSystem: true }),
    mk({ code: '3-3003', name: 'Laba Berjalan', category: 'equity', subCategory: 'current_earnings', parentId: rootEquity, sortOrder: 30, balance: 0, isActive: true, isSystem: true }),

    mk({ code: '4-4000', name: 'Pendapatan Penjualan', category: 'income', subCategory: 'sales', parentId: rootIncome, sortOrder: 10, balance: 0, isActive: true, isSystem: true }),

    mk({ code: '5-5001', name: 'Beban Gaji', category: 'expense', subCategory: 'salary', parentId: rootExpense, sortOrder: 10, balance: 0, isActive: true, isSystem: true }),
    mk({ code: '5-5002', name: 'Beban Sewa', category: 'expense', subCategory: 'rent', parentId: rootExpense, sortOrder: 20, balance: 0, isActive: true, isSystem: true }),
    mk({ code: '5-5003', name: 'Beban Utilitas', category: 'expense', subCategory: 'utilities', parentId: rootExpense, sortOrder: 30, balance: 0, isActive: true, isSystem: true }),
    mk({ code: '5-5004', name: 'Beban Marketing', category: 'expense', subCategory: 'marketing', parentId: rootExpense, sortOrder: 40, balance: 0, isActive: true, isSystem: true }),
    mk({ code: '5-5005', name: 'Beban Lain-lain', category: 'expense', subCategory: 'other', parentId: rootExpense, sortOrder: 50, balance: 0, isActive: true, isSystem: true }),
  ];

  await db.financeAccounts.bulkAdd(seedAccounts);
}

async function seedDemoBusinessCostsForBusiness(businessId: string, tenantId: string) {
  const hasBusinessCosts = await db.businessCosts.where('businessId').equals(businessId).count();
  if (hasBusinessCosts > 0) return;

  const now = new Date();
  const mkDate = (monthsAgo: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - monthsAgo);
    d.setDate(5);
    d.setHours(10, 0, 0, 0);
    return d;
  };

  const costs: Omit<BusinessCost, 'id'>[] = [
    { businessId, tenantId, type: 'SALARY', name: 'Gaji', amount: 5000000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(3) },
    { businessId, tenantId, type: 'SALARY', name: 'Gaji', amount: 5000000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(2) },
    { businessId, tenantId, type: 'SALARY', name: 'Gaji', amount: 5000000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(1) },
    { businessId, tenantId, type: 'SALARY', name: 'Gaji', amount: 5000000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(0) },

    { businessId, tenantId, type: 'OPERATIONAL', name: 'Sewa', amount: 2000000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(3) },
    { businessId, tenantId, type: 'OPERATIONAL', name: 'Sewa', amount: 2000000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(2) },
    { businessId, tenantId, type: 'OPERATIONAL', name: 'Sewa', amount: 2000000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(1) },
    { businessId, tenantId, type: 'OPERATIONAL', name: 'Sewa', amount: 2000000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(0) },

    { businessId, tenantId, type: 'PRODUCTION', name: 'Utilitas', amount: 1000000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(3) },
    { businessId, tenantId, type: 'PRODUCTION', name: 'Utilitas', amount: 1000000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(2) },
    { businessId, tenantId, type: 'PRODUCTION', name: 'Utilitas', amount: 1000000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(1) },
    { businessId, tenantId, type: 'PRODUCTION', name: 'Utilitas', amount: 1000000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(0) },

    { businessId, tenantId, type: 'MARKETING', name: 'Marketing', amount: 800000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(3) },
    { businessId, tenantId, type: 'MARKETING', name: 'Marketing', amount: 800000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(2) },
    { businessId, tenantId, type: 'MARKETING', name: 'Marketing', amount: 800000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(1) },
    { businessId, tenantId, type: 'MARKETING', name: 'Marketing', amount: 800000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(0) },

    { businessId, tenantId, type: 'OTHER', name: 'Lain-lain', amount: 500000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(3) },
    { businessId, tenantId, type: 'OTHER', name: 'Lain-lain', amount: 500000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(2) },
    { businessId, tenantId, type: 'OTHER', name: 'Lain-lain', amount: 500000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(1) },
    { businessId, tenantId, type: 'OTHER', name: 'Lain-lain', amount: 500000, frequency: 'MONTHLY', isActive: true, createdAt: mkDate(0) },
  ];

  await db.businessCosts.bulkAdd(costs as BusinessCost[]);
}

export async function backfillDemoProductImages(businessId: string) {
  const existingProducts = await db.products.where('businessId').equals(businessId).toArray();
  for (const p of existingProducts) {
    if (p.imageUrl) continue;
    if (!p.sku) continue;
    const url = DEMO_PRODUCT_IMAGE_MAP[p.sku];
    if (!url) continue;
    await db.products.update(p.id!, { imageUrl: url });
  }
}

/**
 * Data demo kedai (produk, transaksi sample, dll.). Hanya dipanggil dari tombol demo / reset demo.
 */
export async function seedDemoWorkspace() {
  await ensureSuperAdminAccount();
  await ensureSuperAdminShellWorkspace();

  const demoOwner = await db.users.where('email').equals(DEMO_OWNER_EMAIL).first();
  if (demoOwner?.id) {
    const tenant = await db.tenants.where('ownerId').equals(demoOwner.id).first();
    const biz = tenant?.id ? await db.businesses.where('tenantId').equals(tenant.id).first() : undefined;
    if (biz?.id) await backfillDemoProductImages(biz.id);

    await db.users.where('email').equals(DEMO_OWNER_EMAIL).modify({ passwordHash: 'password' });
    return;
  }

  const userId = crypto.randomUUID();
  const cashierId = crypto.randomUUID();
  const tenantId = crypto.randomUUID();
  const businessId = crypto.randomUUID();

    await db.users.add({
      id: userId,
      name: 'Ahmad Pemilik',
      email: DEMO_OWNER_EMAIL,
      passwordHash: 'password',
      role: 'OWNER',
      phone: '08123456789',
      createdAt: new Date()
    });

    await db.tenants.add({
      id: tenantId,
      ownerId: userId,
      name: 'Usaha Jaya Group',
      slug: 'usaha-jaya',
      subscriptionPlan: 'PRO',
      isActive: true,
      createdAt: new Date()
    });

    await db.businesses.add({
      id: businessId,
      tenantId,
      name: 'Kedai Kopi Mantap',
      address: 'Jl. Ahmad Yani No. 123, Jakarta Selatan',
      phone: '021-12345678',
      category: 'F&B',
      taxPercentage: 10,
      serviceChargePercentage: 5,
      receiptHeader: 'Terima kasih telah berkunjung!',
      receiptFooter: 'Sampai jumpa kembali!',
      isActive: true,
      createdAt: new Date()
    });

    // Add multiple cashiers
    await db.cashiers.bulkAdd([
      {
        id: cashierId,
        businessId,
        tenantId,
        name: 'Budi Santoso',
        pinHash: '123456',
        isActive: true,
        createdAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        businessId,
        tenantId,
        name: 'Siti Rahayu',
        pinHash: '654321',
        isActive: true,
        createdAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        businessId,
        tenantId,
        name: 'Andi Pratama',
        pinHash: '111111',
        isActive: true,
        createdAt: new Date()
      }
    ]);

    // Add shifts
    await db.shifts.bulkAdd([
      { id: crypto.randomUUID(), businessId, name: 'Pagi', startTime: '07:00', endTime: '15:00', isActive: true },
      { id: crypto.randomUUID(), businessId, name: 'Siang', startTime: '15:00', endTime: '23:00', isActive: true },
      { id: crypto.randomUUID(), businessId, name: 'Malam', startTime: '23:00', endTime: '07:00', isActive: true }
    ]);

    // Add categories
    const catKopi = crypto.randomUUID();
    const catMakanan = crypto.randomUUID();
    const catSnack = crypto.randomUUID();

    await db.categories.bulkAdd([
      { id: catKopi, businessId, tenantId, name: 'Kopi', icon: '☕', sortOrder: 1, isActive: true },
      { id: catMakanan, businessId, tenantId, name: 'Makanan', icon: '🍽️', sortOrder: 2, isActive: true },
      { id: catSnack, businessId, tenantId, name: 'Snack', icon: '🍪', sortOrder: 3, isActive: true },
      { id: crypto.randomUUID(), businessId, tenantId, name: 'Minuman', icon: '🥤', sortOrder: 4, isActive: true }
    ]);

    // Add products
    await db.products.bulkAdd([
      { id: crypto.randomUUID(), businessId, tenantId, categoryId: catKopi, name: 'Kopi Susu Gula Aren', sku: 'KOPI-001', sellingPrice: 18000, hpp: 8000, stockQuantity: 100, minStockAlert: 10, unit: 'Cup', imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=512&h=512&fit=crop&q=80', isActive: true, createdAt: new Date() },
      { id: crypto.randomUUID(), businessId, tenantId, categoryId: catKopi, name: 'Americano Ice', sku: 'KOPI-002', sellingPrice: 15000, hpp: 5000, stockQuantity: 150, minStockAlert: 10, unit: 'Cup', imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1e5a6?w=512&h=512&fit=crop&q=80', isActive: true, createdAt: new Date() },
      { id: crypto.randomUUID(), businessId, tenantId, categoryId: catKopi, name: 'Cappuccino', sku: 'KOPI-003', sellingPrice: 22000, hpp: 10000, stockQuantity: 80, minStockAlert: 10, unit: 'Cup', imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=512&h=512&fit=crop&q=80', isActive: true, createdAt: new Date() },
      { id: crypto.randomUUID(), businessId, tenantId, categoryId: catKopi, name: 'Espresso Shot', sku: 'KOPI-004', sellingPrice: 12000, hpp: 4000, stockQuantity: 5, minStockAlert: 10, unit: 'Cup', imageUrl: 'https://images.unsplash.com/photo-1510591508098-4c6db859d7b4?w=512&h=512&fit=crop&q=80', isActive: true, createdAt: new Date() },
      { id: crypto.randomUUID(), businessId, tenantId, categoryId: catKopi, name: 'Latte Art', sku: 'KOPI-005', sellingPrice: 25000, hpp: 12000, stockQuantity: 60, minStockAlert: 10, unit: 'Cup', imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=512&h=512&fit=crop&q=80', isActive: true, createdAt: new Date() },
      { id: crypto.randomUUID(), businessId, tenantId, categoryId: catMakanan, name: 'Nasi Goreng Spesial', sku: 'FOOD-001', sellingPrice: 25000, hpp: 12000, stockQuantity: 50, minStockAlert: 5, unit: 'Porsi', imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=512&h=512&fit=crop&q=80', isActive: true, createdAt: new Date() },
      { id: crypto.randomUUID(), businessId, tenantId, categoryId: catMakanan, name: 'Mie Goreng', sku: 'FOOD-002', sellingPrice: 22000, hpp: 10000, stockQuantity: 45, minStockAlert: 5, unit: 'Porsi', imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=512&h=512&fit=crop&q=80', isActive: true, createdAt: new Date() },
      { id: crypto.randomUUID(), businessId, tenantId, categoryId: catMakanan, name: 'Roti Bakar Coklat', sku: 'FOOD-003', sellingPrice: 15000, hpp: 6000, stockQuantity: 3, minStockAlert: 5, unit: 'Porsi', imageUrl: 'https://images.unsplash.com/photo-1525351484163-94131fb13f1a?w=512&h=512&fit=crop&q=80', isActive: true, createdAt: new Date() },
      { id: crypto.randomUUID(), businessId, tenantId, categoryId: catSnack, name: 'Kentang Goreng', sku: 'SNACK-001', sellingPrice: 18000, hpp: 8000, stockQuantity: 30, minStockAlert: 5, unit: 'Porsi', imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=512&h=512&fit=crop&q=80', isActive: true, createdAt: new Date() },
      { id: crypto.randomUUID(), businessId, tenantId, categoryId: catSnack, name: 'Pisang Goreng', sku: 'SNACK-002', sellingPrice: 12000, hpp: 5000, stockQuantity: 2, minStockAlert: 5, unit: 'Porsi', imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=512&h=512&fit=crop&q=80', isActive: true, createdAt: new Date() }
    ]);

  // Add materials
  await db.materials.bulkAdd([
    { id: crypto.randomUUID(), businessId, tenantId, name: 'Biji Kopi Arabika', unit: 'kg', pricePerUnit: 150000, stockQuantity: 5, minStockAlert: 2, supplierName: 'CV Kopi Nusantara', supplierContact: '081234567890', notes: 'Kopi arabika premium dari Aceh Gayo', isActive: true, createdAt: new Date() },
    { id: crypto.randomUUID(), businessId, tenantId, name: 'Susu Full Cream', unit: 'liter', pricePerUnit: 18000, stockQuantity: 20, minStockAlert: 10, supplierName: 'PT Susu Makmur', supplierContact: '082345678901', isActive: true, createdAt: new Date() },
    { id: crypto.randomUUID(), businessId, tenantId, name: 'Gula Aren', unit: 'kg', pricePerUnit: 45000, stockQuantity: 8, minStockAlert: 3, supplierName: 'UD Manis Jaya', supplierContact: '083456789012', notes: 'Gula aren asli Cianjur', isActive: true, createdAt: new Date() },
    { id: crypto.randomUUID(), businessId, tenantId, name: 'Cup Plastik 16oz', unit: 'pcs', pricePerUnit: 800, stockQuantity: 200, minStockAlert: 50, supplierName: 'Toko Kemasan Murah', supplierContact: '084567890123', isActive: true, createdAt: new Date() },
    { id: crypto.randomUUID(), businessId, tenantId, name: 'Tepung Terigu', unit: 'kg', pricePerUnit: 12000, stockQuantity: 15, minStockAlert: 5, supplierName: 'Toko Bahan Kue ABC', supplierContact: '085678901234', isActive: true, createdAt: new Date() },
    { id: crypto.randomUUID(), businessId, tenantId, name: 'Telur Ayam', unit: 'butir', pricePerUnit: 2500, stockQuantity: 30, minStockAlert: 20, supplierName: 'Pak Karjo Supplier', supplierContact: '086789012345', isActive: true, createdAt: new Date() },
    { id: crypto.randomUUID(), businessId, tenantId, name: 'Mentega', unit: 'gram', pricePerUnit: 50, stockQuantity: 500, minStockAlert: 200, supplierName: 'Toko Bahan Kue ABC', supplierContact: '085678901234', isActive: true, createdAt: new Date() },
    { id: crypto.randomUUID(), businessId, tenantId, name: 'Coklat Bubuk', unit: 'gram', pricePerUnit: 120, stockQuantity: 1000, minStockAlert: 300, supplierName: 'UD Coklat Jaya', supplierContact: '087890123456', notes: 'Van Houten premium', isActive: true, createdAt: new Date() }
  ]);

  await db.members.bulkAdd([
    {
      id: crypto.randomUUID(),
      businessId,
      tenantId,
      name: 'Rina Member',
      phone: '081111111111',
      tier: 'SILVER',
      points: 120,
      specialDiscountPercent: 5,
      benefitStartAt: new Date(),
      benefitEndAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: crypto.randomUUID(),
      businessId,
      tenantId,
      name: 'Bambang Gold',
      phone: '082222222222',
      tier: 'GOLD',
      points: 560,
      specialPricePercent: 10,
      specialDiscountPercent: 8,
      benefitStartAt: new Date(),
      benefitEndAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: new Date(),
    },
  ]);

  await db.crmLeads.bulkAdd([
    {
      id: crypto.randomUUID(),
      tenantId,
      businessId,
      fullName: 'Nadia Demo',
      email: 'nadia@example.com',
      phone: '081333333333',
      businessType: 'Kedai kopi',
      source: 'LANDING_DEMO',
      stage: 'DEMO',
      notes: 'Minta demo onboarding',
      createdAt: new Date(),
    },
    {
      id: crypto.randomUUID(),
      tenantId,
      businessId,
      fullName: 'Rudi Checkout',
      email: 'rudi@example.com',
      phone: '081444444444',
      businessType: 'Retail',
      source: 'LANDING_CHECKOUT',
      stage: 'CHECKOUT',
      amount: 149000,
      orderId: `OMN-${Date.now()}`,
      createdAt: new Date(),
    },
  ]);

    // Add sample transactions (last 30 days)
    const paymentMethods: PaymentMethod[] = ['CASH', 'QRIS', 'EWALLET', 'TRANSFER'];
    const products = await db.products.toArray();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Random 5-15 transactions per day
      const txCount = Math.floor(Math.random() * 11) + 5;
      
      for (let j = 0; j < txCount; j++) {
        const txId = crypto.randomUUID();
        const txDate = new Date(date);
        txDate.setHours(Math.floor(Math.random() * 14) + 8); // 8 AM - 10 PM
        txDate.setMinutes(Math.floor(Math.random() * 60));
        
        // Random 1-4 items per transaction
        const itemCount = Math.floor(Math.random() * 4) + 1;
        let subtotal = 0;
        const items: TransactionItem[] = [];
        
        for (let k = 0; k < itemCount; k++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const qty = Math.floor(Math.random() * 3) + 1;
          const itemSubtotal = product.sellingPrice * qty;
          subtotal += itemSubtotal;
          
          items.push({
            id: crypto.randomUUID(),
            transactionId: txId,
            productId: product.id!,
            productName: product.name,
            quantity: qty,
            unitPrice: product.sellingPrice,
            discount: 0,
            subtotal: itemSubtotal
          });
        }

        const taxAmount = Math.round(subtotal * 0.1);
        const total = subtotal + taxAmount;
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const cashReceived = paymentMethod === 'CASH' ? Math.ceil(total / 10000) * 10000 : total;
        
        await db.transactions.add({
          id: txId,
          businessId,
          tenantId,
          cashierId,
          invoiceNumber: `INV-${txDate.toISOString().slice(0, 10).replace(/-/g, '')}-${String(j + 1).padStart(4, '0')}`,
          subtotal,
          discountAmount: 0,
          discountType: 'NOMINAL',
          taxAmount,
          serviceCharge: 0,
          total,
          paymentMethod,
          cashReceived,
          changeAmount: cashReceived - total,
          status: 'COMPLETED',
          createdAt: txDate
        });

        await db.transactionItems.bulkAdd(items);
      }
    }

    // Add debt/receivables
    await db.debtReceivables.bulkAdd([
      {
        id: crypto.randomUUID(),
        businessId,
        tenantId,
        type: 'DEBT',
        partyName: 'CV Kopi Nusantara',
        partyPhone: '081234567890',
        totalAmount: 1500000,
        paidAmount: 500000,
        remainingAmount: 1000000,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: 'PARTIAL',
        notes: 'Pembelian biji kopi bulan ini',
        createdAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        businessId,
        tenantId,
        type: 'RECEIVABLE',
        partyName: 'PT Kantor Jaya',
        partyPhone: '082345678901',
        totalAmount: 2500000,
        paidAmount: 0,
        remainingAmount: 2500000,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'UNPAID',
        notes: 'Pesanan katering meeting',
        createdAt: new Date()
      }
    ]);

    // Add todo items
    await db.todoItems.bulkAdd([
      { id: crypto.randomUUID(), tenantId, businessId, title: 'Restock biji kopi Arabika', description: 'Stok hampir habis, hubungi supplier', isCompleted: false, priority: 'HIGH', dueDate: new Date(), createdAt: new Date() },
      { id: crypto.randomUUID(), tenantId, businessId, title: 'Bayar tagihan listrik', isCompleted: false, priority: 'MEDIUM', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), createdAt: new Date() },
      { id: crypto.randomUUID(), tenantId, businessId, title: 'Perpanjang izin usaha', isCompleted: false, priority: 'LOW', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), createdAt: new Date() },
      { id: crypto.randomUUID(), tenantId, businessId, title: 'Update menu baru', isCompleted: true, priority: 'MEDIUM', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
    ]);

    // Add activity logs
    await db.activityLogs.bulkAdd([
      { id: crypto.randomUUID(), tenantId, businessId, actorType: 'CASHIER', actorId: cashierId, action: 'CLOCK_IN', entityType: 'SESSION', description: 'Budi Santoso masuk shift pagi', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { id: crypto.randomUUID(), tenantId, businessId, actorType: 'CASHIER', actorId: cashierId, action: 'CREATE_TRANSACTION', entityType: 'TRANSACTION', description: 'Transaksi baru INV-20240115-0012', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      { id: crypto.randomUUID(), tenantId, businessId, actorType: 'OWNER', actorId: userId, action: 'UPDATE_PRODUCT', entityType: 'PRODUCT', description: 'Update harga Kopi Susu Gula Aren', createdAt: new Date(Date.now() - 30 * 60 * 1000) },
      { id: crypto.randomUUID(), tenantId, businessId, actorType: 'CASHIER', actorId: cashierId, action: 'VOID_TRANSACTION', entityType: 'TRANSACTION', description: 'Void transaksi INV-20240115-0008', createdAt: new Date(Date.now() - 15 * 60 * 1000) },
      { id: crypto.randomUUID(), tenantId, businessId, actorType: 'CASHIER', actorId: cashierId, action: 'CREATE_TRANSACTION', entityType: 'TRANSACTION', description: 'Transaksi baru INV-20240115-0015', createdAt: new Date() }
    ]);

  await seedFinanceAccountsForBusiness(businessId, tenantId);
  await seedDemoBusinessCostsForBusiness(businessId, tenantId);
}

export async function seedInitialData() {
  await ensureSuperAdminAccount();
  await ensureSuperAdminShellWorkspace();
  const businesses = await db.businesses.toArray();
  for (const b of businesses) {
    if (!b.id) continue;
    await seedFinanceAccountsForBusiness(b.id, b.tenantId);
  }
}

export async function provisionEmptyOwnerFromCheckout(opts: {
  email: string;
  buyerName: string;
  tempPassword: string;
  businessName?: string;
}) {
  await ensureSuperAdminAccount();
  await ensureSuperAdminShellWorkspace();
  const emailNorm = opts.email.trim().toLowerCase();
  if (await db.users.where('email').equals(emailNorm).first()) return;

  const userId = crypto.randomUUID();
  const tenantId = crypto.randomUUID();
  const businessId = crypto.randomUUID();
  const ownerName = opts.buyerName.trim() || 'Pemilik';
  const bizName = opts.businessName?.trim() || ownerName;

  await db.users.add({
    id: userId,
    name: ownerName,
    email: emailNorm,
    passwordHash: opts.tempPassword,
    role: 'OWNER',
    createdAt: new Date(),
  });
  await db.tenants.add({
    id: tenantId,
    ownerId: userId,
    name: `${bizName}`,
    slug: `t-${tenantId.slice(0, 8)}`,
    subscriptionPlan: 'PRO',
    isActive: true,
    createdAt: new Date(),
  });
  await db.businesses.add({
    id: businessId,
    tenantId,
    name: bizName,
    taxPercentage: 0,
    serviceChargePercentage: 0,
    isActive: true,
    createdAt: new Date(),
  });
  await seedFinanceAccountsForBusiness(businessId, tenantId);
}

/**
 * Reset seluruh data lokal menjadi data demo.
 * Catatan: ini destruktif (menghapus IndexedDB POSDatabase).
 */
export async function resetDemoData() {
  await db.delete();
  await db.open();
  await seedInitialData();
  await seedDemoWorkspace();
}
