import { useState } from 'react';
import {
  Settings,
  Building,
  Palette,
  Key,
  Users,
  Bell,
  Shield,
  CreditCard,
  FileText,
  Upload,
  Check,
  ChevronRight,
  Mail,
  MessageSquare,
  Globe,
  Database,
  Zap,
  Crown,
  History,
  Bug,
  Sparkles,
  Wrench,
  ShieldCheck,
  ArrowUp,
  Rocket,
} from 'lucide-react';
import { cn } from '../lib/utils';

const tabs = [
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'company', label: 'Company', icon: Building },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'history', label: 'Update History', icon: History },
];

interface UpdateEntry {
  version: string;
  date: string;
  type: 'feature' | 'fix' | 'improvement' | 'security';
  title: string;
  changes: string[];
}

const updateHistory: UpdateEntry[] = [
  {
    version: 'v3.2.0',
    date: '2025-01-20',
    type: 'feature',
    title: 'CRM After Sales, Retention & Upselling',
    changes: [
      'Customer Lifetime Value (CLV) analysis dengan retention score dan upsell potential',
      'Segmentasi customer otomatis: VIP, Loyal, Regular, New, At-Risk, Churned',
      'After Sales Panel dengan quick actions: Feedback, Repeat Order, Penawaran Baru, Kunjungan',
      'Smart recommendations berdasarkan data retention dan activity history',
      'Indikator segment dan upsell potential pada customer list',
    ],
  },
  {
    version: 'v3.1.0',
    date: '2025-01-19',
    type: 'feature',
    title: 'CRM Lead Capture Form & Embed',
    changes: [
      'Form lead capture standalone di /lead-form untuk embed di website eksternal',
      'Anti-spam: honeypot field dan timing validation',
      'URL parameter support: ?source= dan ?ref= untuk tracking',
      'Embed code generator: Direct Link, Iframe, dan Popup Button',
      'Lead otomatis masuk ke CRM dengan tag "Website Lead"',
    ],
  },
  {
    version: 'v3.0.0',
    date: '2025-01-18',
    type: 'feature',
    title: 'CRM WhatsApp Integration',
    changes: [
      'WhatsApp follow-up langsung dari CRM dengan template message',
      '5 template bawaan: First Response, Follow Up Quotation, Payment Reminder, After Sales, Upselling',
      'Variable substitution otomatis: {customer_name}, {project_name}, {amount}, dll',
      'Riwayat pesan WhatsApp per customer dengan status tracking',
      'WhatsApp automation rules dengan safety controls (disabled by default)',
    ],
  },
  {
    version: 'v2.9.0',
    date: '2025-01-17',
    type: 'feature',
    title: 'CRM Follow-Up System',
    changes: [
      'Sistem follow-up manual dengan 6 tipe: Call, WhatsApp, Email, Meeting, Visit, Other',
      'Follow-up reminder strip: Overdue (merah), Today (amber), Upcoming (biru)',
      'Complete follow-up dengan hasil dan next action',
      'Auto-create follow-up berikutnya dari next action',
      'Follow-up history dengan status: Scheduled, Completed, Overdue, Cancelled',
    ],
  },
  {
    version: 'v2.8.0',
    date: '2025-01-16',
    type: 'feature',
    title: 'CRM Pipeline & Activity Timeline',
    changes: [
      'Pipeline stages: New Lead → Contacted → Follow Up → Negotiation → Quotation → Won/Lost → After Sales',
      'Kanban view untuk visualisasi pipeline dengan drag-drop ready',
      'Activity timeline per customer: calls, emails, meetings, quotations, closings',
      'Quick activity log form dengan 7 tipe aktivitas',
      'Assigned PIC, deal value, dan next follow-up per customer',
    ],
  },
  {
    version: 'v2.7.0',
    date: '2025-01-15',
    type: 'feature',
    title: 'Financial Reports & Export',
    changes: [
      '6 jenis laporan: Laba Rugi, Arus Kas, Neraca, Per Project, Hutang Piutang, Ringkasan',
      'Export ke CSV/Excel dengan UTF-8 encoding untuk karakter Indonesia',
      'Export ke PDF via print dialog dengan format profesional',
      'Financial helper text untuk membantu user non-akuntansi',
      'Period filter: 7 hari, 1 bulan, 3 bulan, 1 tahun',
    ],
  },
  {
    version: 'v2.6.5',
    date: '2025-01-14',
    type: 'feature',
    title: 'Project Finance Integration',
    changes: [
      'Project Finance View dengan dana masuk, biaya realisasi, hutang/piutang, hasil bersih',
      'Quick entry pemasukan (DP, Termin, Transfer) dan pengeluaran per kategori',
      'Inter-project transfer dengan paired transactions',
      'Budget utilization bar dengan color-coded thresholds',
      'Expense breakdown chart per kategori (Material, Labor, Equipment, dll)',
    ],
  },
  {
    version: 'v2.6.0',
    date: '2025-01-13',
    type: 'feature',
    title: 'Finance Cross-Module Integration',
    changes: [
      'Transaksi terhubung ke: Payroll, Inventory, Project, Receivable, Payable',
      'Cross-Module Summary Widget di halaman Finance',
      'EnrichedTransaction dengan resolved context (project name, customer name, employee)',
      'Module badges per transaksi: Payroll, Inventory, Project, Piutang, Hutang, Umum',
      'Payment status tracking: Lunas, Pending, Sebagian, Overdue',
    ],
  },
  {
    version: 'v2.5.5',
    date: '2025-01-12',
    type: 'feature',
    title: 'Payroll ↔ Finance Connection',
    changes: [
      'Payroll yang dibayar otomatis create transaksi di Finance',
      'Kategori: Payroll Monthly, Payroll Weekly, Labor (project-based)',
      'Project wages otomatis update budget kategori Labor',
      'Payroll Summary Widget di halaman Finance',
      'getProjectLaborCosts() untuk tracking biaya tenaga kerja per project',
    ],
  },
  {
    version: 'v2.5.2',
    date: '2025-01-11',
    type: 'feature',
    title: 'Payroll Management Module',
    changes: [
      'Halaman Payroll untuk Admin/HR/Finance di /payroll',
      '3 skema gaji: Monthly, Weekly, Project-based',
      'Komponen gaji: base salary, attendance, overtime, allowances, deductions',
      'Auto-compute dari attendance data',
      'Process → Approve → Pay workflow dengan audit trail',
    ],
  },
  {
    version: 'v2.5.0',
    date: '2025-01-10',
    type: 'feature',
    title: 'Employee Dashboard & Attendance',
    changes: [
      'Dashboard khusus karyawan dengan 5 tab: Beranda, Tugas, Absensi, Gaji, Perusahaan',
      'GPS-based check-in/out dengan work area validation (Haversine formula)',
      'Selfie capture untuk verifikasi kehadiran',
      'Work hours summary: harian, mingguan, bulanan dengan overtime tracking',
      'Leave request system dengan approval workflow',
      'Company info: Visi, Misi, Values, dan SOP/Kebijakan',
    ],
  },
  {
    version: 'v2.4.5',
    date: '2025-01-09',
    type: 'feature',
    title: 'Role-Based Access & Impersonation',
    changes: [
      'Dashboard berbeda per role: Admin, HR, Finance, Employee',
      'Navigation items tersembunyi berdasarkan permission matrix',
      'View-as / Impersonation: Admin bisa lihat app sebagai karyawan',
      'Blue banner indicator saat dalam mode impersonation',
      'User switcher di profile dropdown untuk demo multi-role',
    ],
  },
  {
    version: 'v2.4.2',
    date: '2025-01-08',
    type: 'feature',
    title: 'Employee Monitoring Dashboard',
    changes: [
      'Widget monitoring karyawan di Dashboard Admin',
      'Statistik: attendance rate, work hours, overtime, tasks',
      'Payroll summary: paid this month, pending',
      'Employee productivity list dengan progress bars',
      'Today status: check-in count, late count, not-yet count',
    ],
  },
  {
    version: 'v2.4.0',
    date: '2025-01-07',
    type: 'feature',
    title: 'Interactive Gantt Chart & Drag-Drop Kanban',
    changes: [
      'Gantt chart bar bisa di-drag untuk pindah jadwal dan resize untuk ubah durasi',
      'Tooltip tanggal real-time muncul saat drag/resize bar',
      'Kanban board dengan HTML5 drag & drop antar kolom (Backlog → Done)',
      'Visual feedback: highlight kolom target dan opacity pada card yang di-drag',
      'Gantt di list project: klik project expand task-nya (bukan navigate)',
      'Perubahan jadwal di Gantt otomatis update status Overdue di Kanban',
    ],
  },
  {
    version: 'v2.3.5',
    date: '2025-01-06',
    type: 'improvement',
    title: 'Project Progress Bar System',
    changes: [
      'Unified progress bar styling dengan getProgressBarStyle()',
      'Color-coded: hijau (sehat), amber (perhatian), merah (terlambat/over budget)',
      'Context-aware: berbeda untuk project, milestone, task, dan budget',
      'Glow shadows dan smooth transitions',
      'Consistent across all project views',
    ],
  },
  {
    version: 'v2.3.0',
    date: '2025-01-05',
    type: 'feature',
    title: 'Project Detail — Milestone & Budget Management',
    changes: [
      'Milestone management: create, edit, delete dengan checklist items',
      'Auto-complete milestone: centang semua checklist → status otomatis "Completed"',
      'Budget tab dengan breakdown per kategori (Material, Labor, Equipment, dll)',
      'Add Expense dari project langsung terhubung ke Finance module',
      'Gallery tab untuk upload foto progress (Before/During/After)',
      'Lightbox viewer dengan navigasi previous/next',
    ],
  },
  {
    version: 'v2.2.5',
    date: '2025-01-04',
    type: 'improvement',
    title: 'Project List Enhancements',
    changes: [
      'Health assessment system: on-track, at-risk, delayed, completed, paused',
      'Filter chips: Semua, Berjalan, Segera, Berisiko, Selesai, Tertunda, Terlambat',
      'Deadline countdown dengan urgency indicators',
      'Budget health tracking dengan color-coded percentages',
      'Gallery thumbnails di project cards',
    ],
  },
  {
    version: 'v2.2.0',
    date: '2024-12-28',
    type: 'feature',
    title: 'Connected Data Store — Customer ↔ Project ↔ Estimate',
    changes: [
      'Shared data store menghubungkan Customer, Project, dan Estimate secara bidirectional',
      'Estimator bisa link ke project & customer yang ada atau buat baru',
      'CRM menampilkan project dan estimasi terkait per customer',
      'Finance menampilkan project name di setiap transaksi',
      'Activity log otomatis tercatat untuk setiap aksi di semua modul',
    ],
  },
  {
    version: 'v2.1.5',
    date: '2024-12-25',
    type: 'improvement',
    title: 'Dashboard UX Improvements',
    changes: [
      'KPI cards dengan period, helper text, dan sub-info yang lebih informatif',
      'Quick Actions diubah jadi action-oriented (New Project, Add Income, dll)',
      'Chart section dengan period toggle (6 Bulan, 12 Bulan, Tahun Ini)',
      'Activity panel dengan category badges dan action hints',
      'Pipeline section dengan project names dan budget context',
      'Attention Needed widget untuk items yang perlu tindakan',
    ],
  },
  {
    version: 'v2.1.2',
    date: '2024-12-22',
    type: 'fix',
    title: 'Bug Fixes — Navigation & Mobile Layout',
    changes: [
      'Fix: Bottom navigation active state tidak highlight saat di sub-page',
      'Fix: Mobile sidebar overlay tidak menutup saat tap di luar area',
      'Fix: Topbar search field terpotong di tablet landscape',
      'Fix: Card hover shadow terlalu besar di mobile, dikurangi intensitasnya',
      'Fix: Estimator table horizontal scroll tidak smooth di iOS Safari',
    ],
  },
  {
    version: 'v2.1.1',
    date: '2024-12-18',
    type: 'fix',
    title: 'Bug Fixes — Finance & Estimator',
    changes: [
      'Fix: AI parser salah menghitung harga dengan suffix "jt" (juta)',
      'Fix: Transaksi baru tidak langsung muncul di list tanpa refresh',
      'Fix: Estimator grand total tidak update saat hapus baris item',
      'Fix: PPN 11% toggle state reset saat switch tab',
      'Fix: Format Rupiah menampilkan desimal yang tidak perlu',
    ],
  },
  {
    version: 'v2.1.0',
    date: '2024-12-15',
    type: 'improvement',
    title: 'Rebranding Warna Hijau Tosca',
    changes: [
      'Skema warna utama kembali ke hijau tosca sesuai brand Omnifyi',
      'Brand tokens: tosca-500 (#14B8A6) sebagai primary',
      'Gradient accents dengan tosca untuk buttons dan highlights',
      'Semantic colors: hijau (sukses), merah (danger), amber (warning), biru (AI/info)',
      'Konsistensi warna di semua komponen dan halaman',
    ],
  },
  {
    version: 'v2.0.5',
    date: '2024-12-10',
    type: 'security',
    title: 'Security Patch — Session & Input Validation',
    changes: [
      'Perbaikan validasi input pada AI parser untuk mencegah injection',
      'Session timeout default diatur ke 4 jam untuk keamanan',
      'Sanitasi input pada semua form field (customer, project, transaction)',
      'CSRF token validation pada form submission',
      'Audit log mencatat IP address untuk setiap login',
    ],
  },
  {
    version: 'v2.0.0',
    date: '2024-12-01',
    type: 'feature',
    title: 'Omnifyi v2.0 — Major Release',
    changes: [
      'Arsitektur baru dengan React 18 + Vite + TailwindCSS',
      'Multi-modul: Dashboard, Projects, CRM, Finance, Estimator, Inventory, Admin',
      'AI-powered transaction parsing (NLP) untuk input bahasa Indonesia',
      'Project management: Kanban, Gantt Chart, Timeline, List view',
      'Estimator dengan kalkulasi HPP, margin, PPN, dan contingency',
      'Admin panel: Branding, API keys, Users & Roles, Billing, Security',
      'PWA-ready: Mobile-first design dengan bottom navigation',
    ],
  },
  {
    version: 'v1.5.0',
    date: '2024-11-15',
    type: 'improvement',
    title: 'Performance & Optimization',
    changes: [
      'Code splitting untuk lazy loading halaman',
      'Optimasi re-render dengan useCallback dan useMemo',
      'Custom scrollbar untuk consistency cross-browser',
      'Animasi staggered loading pada dashboard cards',
      'Kompresi gambar otomatis untuk gallery upload',
    ],
  },
  {
    version: 'v1.0.0',
    date: '2024-10-01',
    type: 'feature',
    title: 'Omnifyi v1.0 — Initial Release',
    changes: [
      'Dashboard dengan statistik bisnis real-time',
      'Manajemen project dasar (CRUD)',
      'CRM sederhana dengan database customer',
      'Pencatatan keuangan manual (income/expense)',
      'Halaman inventory untuk tracking stok',
      'Admin panel dasar dengan pengaturan workspace',
    ],
  },
];

export function Admin() {
  const [activeTab, setActiveTab] = useState('branding');
  const [primaryColor, setPrimaryColor] = useState('#0d9488');
  const [companyName, setCompanyName] = useState('Omnifyi Demo Workspace');
  const [tagline, setTagline] = useState('Infinite Business Possibilities');

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white shadow-md">
            <Settings className="w-5 h-5" />
          </div>
          Admin Panel
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage workspace settings, branding, and integrations</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0 animate-fade-in-up stagger-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 lg:sticky lg:top-20">
            {/* Mobile: horizontal scroll */}
            <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap min-w-fit",
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/20"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  )}
                >
                  <tab.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 animate-fade-in-up stagger-2">
          {activeTab === 'branding' && (
            <div className="space-y-5">
              {/* Logo Upload */}
              <Card title="Logo & Identity" desc="Customize your workspace branding">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer group">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-3xl font-bold mb-3 group-hover:scale-105 transition-transform shadow-lg">
                        ∞
                      </div>
                      <p className="text-sm text-gray-500">Click to upload logo</p>
                      <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG (max 2MB)</p>
                      <button className="mt-3 px-4 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-semibold hover:bg-brand-100 transition-all inline-flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 text-lg font-bold mb-3">
                        ∞
                      </div>
                      <p className="text-sm text-gray-500">Click to upload favicon</p>
                      <p className="text-xs text-gray-400 mt-1">ICO, PNG (32x32 or 16x16)</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Color Theme */}
              <Card title="Color Theme" desc="Set primary color for your workspace">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl shadow-md border-4 border-white ring-2 ring-gray-200 cursor-pointer"
                        style={{ background: primaryColor }}
                      />
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono w-32 focus:ring-2 focus:ring-brand-500/30 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preset Colors</label>
                    <div className="flex gap-3 flex-wrap">
                      {[
                        { color: '#0d9488', name: 'Teal' },
                        { color: '#059669', name: 'Emerald' },
                        { color: '#2563eb', name: 'Blue' },
                        { color: '#7c3aed', name: 'Violet' },
                        { color: '#db2777', name: 'Pink' },
                        { color: '#ea580c', name: 'Orange' },
                        { color: '#ca8a04', name: 'Amber' },
                        { color: '#374151', name: 'Slate' },
                      ].map((p) => (
                        <button
                          key={p.color}
                          onClick={() => setPrimaryColor(p.color)}
                          className={cn(
                            "w-12 h-12 rounded-2xl shadow-md transition-all hover:scale-110 active:scale-95 relative",
                            primaryColor === p.color && "ring-4 ring-offset-2 ring-brand-400"
                          )}
                          style={{ background: p.color }}
                        >
                          {primaryColor === p.color && (
                            <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-2xl">
                    <p className="text-xs font-medium text-gray-500 mb-3">Preview</p>
                    <div className="flex gap-3 flex-wrap">
                      <button
                        className="px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-md"
                        style={{ background: primaryColor }}
                      >
                        Primary Button
                      </button>
                      <button
                        className="px-4 py-2 rounded-xl text-sm font-semibold border-2"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        Outline Button
                      </button>
                      <span
                        className="px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ background: primaryColor + '15', color: primaryColor }}
                      >
                        Badge
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Company Name & Tagline */}
              <Card title="Workspace Identity" desc="Name and tagline shown across the platform">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Workspace Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all"
                    />
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <button className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-brand-500/25 transition-all active:scale-[0.98]">
                  Save Branding Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-5">
              <Card title="Company Information" desc="Business details for documents and invoices">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Company Name" value="PT Omnifyi Digital" />
                    <InputField label="Business Type" value="Construction & Services" />
                  </div>
                  <InputField label="Address" value="Jl. Gatot Subroto No. 123, Jakarta Selatan" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Phone" value="+62 21 555-1234" />
                    <InputField label="Email" value="info@omnifyi.id" />
                    <InputField label="Website" value="www.omnifyi.id" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="NPWP" value="01.234.567.8-901.000" />
                    <InputField label="Fiscal Year" value="January - December" />
                  </div>
                </div>
              </Card>
              <div className="flex justify-end">
                <button className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-brand-500/25 transition-all active:scale-[0.98]">
                  Save Company Info
                </button>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-5">
              <Card title="AI Services" desc="Configure AI providers for smart parsing">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-brand-50 rounded-2xl border border-brand-100">
                    <Zap className="w-5 h-5 text-brand-600" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-brand-800">Google Gemini API</p>
                      <p className="text-xs text-brand-600">Auto-detect: Gemini 2.0 Flash</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Active</span>
                  </div>
                  <InputField label="Primary API Key" value="AIza••••••••••••••••••••" type="password" />
                  <InputField label="Backup API Key (Optional)" value="" placeholder="Enter backup key for failover" />
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Auto-rotate keys</span>
                    <Toggle checked={true} />
                  </div>
                </div>
              </Card>

              <Card title="Communication" desc="WhatsApp and Email service configuration">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800">WhatsApp Business API</p>
                      <p className="text-xs text-green-600">Connected · +62 812-XXX-XXXX</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Active</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800">Email Service (SMTP)</p>
                      <p className="text-xs text-blue-600">smtp.gmail.com:587</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Active</span>
                  </div>
                </div>
              </Card>

              <Card title="External Services" desc="Payment gateway and storage">
                <div className="space-y-3">
                  <ServiceRow icon={CreditCard} name="Midtrans" status="Configured" color="indigo" />
                  <ServiceRow icon={Globe} name="Cloudinary (Storage)" status="Connected" color="orange" />
                  <ServiceRow icon={Database} name="Supabase" status="Connected" color="emerald" />
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-5">
              <Card title="Team Members" desc="Manage users and their access levels">
                <div className="space-y-3">
                  {[
                    { name: 'Admin User', email: 'admin@omnifyi.id', role: 'Owner', avatar: 'AD', status: 'Active' },
                    { name: 'John Smith', email: 'john@omnifyi.id', role: 'Manager', avatar: 'JS', status: 'Active' },
                    { name: 'Maria Kim', email: 'maria@omnifyi.id', role: 'Project Manager', avatar: 'MK', status: 'Active' },
                    { name: 'Lisa R.', email: 'lisa@omnifyi.id', role: 'Finance', avatar: 'LR', status: 'Invited' },
                  ].map((user) => (
                    <div key={user.email} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {user.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-bold hidden sm:block",
                        user.role === 'Owner' ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {user.role}
                      </span>
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        user.status === 'Active' ? "bg-emerald-500" : "bg-amber-400"
                      )} />
                      <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50/30 transition-all flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" /> Invite Team Member
                </button>
              </Card>

              <Card title="Roles & Permissions" desc="Configure access control for each role">
                <div className="space-y-3">
                  {[
                    { role: 'Owner/Admin', desc: 'Full access to everything', perms: 'All modules' },
                    { role: 'Manager', desc: 'All features except billing', perms: 'Dashboard, Projects, CRM, Finance, HR' },
                    { role: 'Project Manager', desc: 'Project & task management', perms: 'Projects, Tasks, Estimator' },
                    { role: 'Finance', desc: 'Finance module only', perms: 'Finance, Invoicing, Reports' },
                    { role: 'Employee', desc: 'Limited dashboard', perms: 'Attendance, Tasks, Profile' },
                  ].map((r) => (
                    <div key={r.role} className="p-4 border border-gray-100 rounded-xl hover:border-brand-200 hover:bg-brand-50/20 transition-all cursor-pointer group">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-gray-900">{r.role}</p>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-all" />
                      </div>
                      <p className="text-xs text-gray-400">{r.desc}</p>
                      <p className="text-xs text-brand-600 mt-1 font-medium">{r.perms}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-5">
              {/* Current Plan */}
              <div className="bg-gradient-to-br from-brand-700 to-brand-500 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider text-white/80">Current Plan</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-1">Professional</h2>
                  <p className="text-white/70 text-sm">Rp 799,000/month · Renews Dec 15, 2024</p>
                  <div className="mt-5 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold">12/15</p>
                      <p className="text-xs text-white/60">Users</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">∞</p>
                      <p className="text-xs text-white/60">Projects</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">32GB</p>
                      <p className="text-xs text-white/60">of 50GB</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plans */}
              <Card title="Available Plans" desc="Upgrade or change your subscription">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Starter', price: 'Rp 299K', desc: '5 users · 20 projects', current: false },
                    { name: 'Professional', price: 'Rp 799K', desc: '15 users · Unlimited', current: true },
                    { name: 'Business', price: 'Rp 2.499K', desc: 'Unlimited · Custom', current: false },
                    { name: 'Enterprise', price: 'Custom', desc: 'Contact sales', current: false },
                  ].map((plan) => (
                    <div key={plan.name} className={cn(
                      "p-4 border-2 rounded-2xl transition-all cursor-pointer",
                      plan.current ? "border-brand-500 bg-brand-50/50" : "border-gray-100 hover:border-gray-300"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-gray-900">{plan.name}</p>
                        {plan.current && <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold rounded-full">CURRENT</span>}
                      </div>
                      <p className="text-xl font-bold text-gray-900">{plan.price}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
                      <p className="text-xs text-gray-500 mt-1">{plan.desc}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Card title="Notification Preferences" desc="Choose how you want to be notified">
              <div className="space-y-4">
                {[
                  { label: 'New customer inquiry', email: true, push: true, wa: false },
                  { label: 'Task assigned to you', email: true, push: true, wa: false },
                  { label: 'Payment received', email: true, push: true, wa: true },
                  { label: 'Invoice overdue', email: true, push: true, wa: true },
                  { label: 'Low stock alert', email: true, push: false, wa: false },
                  { label: 'Project milestone completed', email: true, push: true, wa: false },
                  { label: 'Employee late/absent', email: false, push: true, wa: false },
                ].map((n) => (
                  <div key={n.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700 font-medium">{n.label}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Toggle checked={n.email} />
                        <span className="text-[10px] text-gray-400 font-medium hidden sm:block">Email</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Toggle checked={n.push} />
                        <span className="text-[10px] text-gray-400 font-medium hidden sm:block">Push</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Toggle checked={n.wa} />
                        <span className="text-[10px] text-gray-400 font-medium hidden sm:block">WA</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'templates' && (
            <Card title="Document Templates" desc="Manage templates for invoices, quotations, and more">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Quotation Template', desc: 'Professional quote with terms', icon: FileText, color: 'bg-blue-50 text-blue-600' },
                  { name: 'Invoice Template', desc: 'Standard invoice layout', icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
                  { name: 'Contract Template', desc: 'Service agreement format', icon: Shield, color: 'bg-purple-50 text-purple-600' },
                  { name: 'Purchase Order', desc: 'PO for suppliers', icon: FileText, color: 'bg-amber-50 text-amber-600' },
                ].map((t) => (
                  <div key={t.name} className="p-4 border border-gray-100 rounded-2xl hover:border-brand-200 hover:bg-brand-50/20 transition-all cursor-pointer group">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", t.color)}>
                      <t.icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                    <button className="mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
                      Edit Template <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <Card title="Security Settings" desc="Protect your workspace">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Two-Factor Authentication</p>
                      <p className="text-xs text-gray-400">Add extra security to your account</p>
                    </div>
                    <Toggle checked={false} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Session Timeout</p>
                      <p className="text-xs text-gray-400">Auto-logout after inactivity</p>
                    </div>
                    <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none">
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>4 hours</option>
                      <option>Never</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">IP Whitelisting</p>
                      <p className="text-xs text-gray-400">Restrict access to specific IPs</p>
                    </div>
                    <Toggle checked={false} />
                  </div>
                </div>
              </Card>
              <Card title="Backup & Data" desc="Manage data backup and export">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Auto Daily Backup</p>
                      <p className="text-xs text-emerald-600">Last backup: Today 03:00 AM</p>
                    </div>
                    <Toggle checked={true} />
                  </div>
                  <button className="w-full py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                    <Database className="w-4 h-4" />
                    Export All Data
                  </button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-5">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                      <Rocket className="w-4 h-4 text-brand-600" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{updateHistory.length}</p>
                  <p className="text-[10px] text-gray-400 font-medium">Total Releases</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{updateHistory.filter(u => u.type === 'feature').length}</p>
                  <p className="text-[10px] text-gray-400 font-medium">Features</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <Bug className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{updateHistory.filter(u => u.type === 'fix').length}</p>
                  <p className="text-[10px] text-gray-400 font-medium">Bug Fixes</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <ArrowUp className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{updateHistory.reduce((s, u) => s + u.changes.length, 0)}</p>
                  <p className="text-[10px] text-gray-400 font-medium">Total Changes</p>
                </div>
              </div>

              {/* Latest Version Banner */}
              <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/5 rounded-full" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    <Rocket className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xl font-bold">{updateHistory[0].version}</span>
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase">Latest</span>
                    </div>
                    <p className="text-sm text-white/80">{updateHistory[0].title}</p>
                    <p className="text-xs text-white/50 mt-0.5">{updateHistory[0].date}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-0">
                {updateHistory.map((entry, idx) => {
                  const typeConfig = {
                    feature: { icon: Sparkles, color: 'bg-purple-100 text-purple-600', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', label: 'Feature' },
                    fix: { icon: Bug, color: 'bg-red-50 text-red-500', border: 'border-red-200', badge: 'bg-red-100 text-red-600', label: 'Bug Fix' },
                    improvement: { icon: Wrench, color: 'bg-amber-50 text-amber-600', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'Improvement' },
                    security: { icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', label: 'Security' },
                  }[entry.type];
                  const TypeIcon = typeConfig.icon;

                  return (
                    <div key={entry.version} className="relative flex gap-4">
                      {/* Timeline Line */}
                      <div className="flex flex-col items-center flex-shrink-0 w-10">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center z-10 border-2 transition-all",
                          idx === 0 ? "bg-brand-50 text-brand-600 border-brand-200 shadow-md shadow-brand-500/10" : `${typeConfig.color} ${typeConfig.border}`
                        )}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        {idx < updateHistory.length - 1 && (
                          <div className="w-px flex-1 bg-gray-200 my-1 min-h-[20px]" />
                        )}
                      </div>

                      {/* Content Card */}
                      <div className={cn(
                        "flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden transition-all hover:shadow-md",
                        idx === 0 && "ring-1 ring-brand-100"
                      )}>
                        {/* Card Header */}
                        <div className="p-4 border-b border-gray-50">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-sm font-bold text-gray-900">{entry.version}</span>
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", typeConfig.badge)}>
                              {typeConfig.label}
                            </span>
                            {idx === 0 && (
                              <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full text-[10px] font-bold">
                                CURRENT
                              </span>
                            )}
                            <span className="text-[11px] text-gray-400 ml-auto font-medium">{entry.date}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-700">{entry.title}</p>
                        </div>

                        {/* Changes List */}
                        <div className="p-4">
                          <ul className="space-y-2">
                            {entry.changes.map((change, ci) => (
                              <li key={ci} className="flex items-start gap-2.5 text-sm text-gray-600">
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                                  entry.type === 'feature' ? 'bg-purple-400' :
                                  entry.type === 'fix' ? 'bg-red-400' :
                                  entry.type === 'improvement' ? 'bg-amber-400' :
                                  'bg-emerald-400'
                                )} />
                                <span className="leading-relaxed">{change}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Note */}
              <div className="text-center py-4">
                <p className="text-xs text-gray-400">
                  Menampilkan {updateHistory.length} rilis · Update terbaru: {updateHistory[0].date}
                </p>
                <p className="text-[10px] text-gray-300 mt-1">
                  Hanya Super Admin yang dapat melihat halaman ini
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover">
      <div className="p-5 border-b border-gray-50">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InputField({ label, value, placeholder, type = 'text' }: { label: string; value?: string; placeholder?: string; type?: string }) {
  const [val, setVal] = useState(value || '');
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all"
      />
    </div>
  );
}

function Toggle({ checked }: { checked: boolean }) {
  const [on, setOn] = useState(checked);
  return (
    <button
      onClick={() => setOn(!on)}
      className={cn(
        "relative w-9 h-5 rounded-full transition-all flex-shrink-0",
        on ? "bg-brand-500" : "bg-gray-200"
      )}
    >
      <div className={cn(
        "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
        on ? "left-[18px]" : "left-0.5"
      )} />
    </button>
  );
}

function ServiceRow({ icon: Icon, name, status, color }: { icon: any; name: string; status: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colorMap[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
      </div>
      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">{status}</span>
    </div>
  );
}
