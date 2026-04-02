import { useState, useMemo } from 'react';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText,
  Download,
  Plus,
  Wallet,
  Check,
  X,
  Send,
  Eye,
  Briefcase,
  Search,
  UserCheck,
  UserX,
  Shield,
  BarChart3,
  Edit3,
  ChevronRight,
  Star,
  Settings,
} from 'lucide-react';
import { useData, type Employee } from '../store/dataStore';
import { cn } from '../lib/utils';

type EmployeeTab = 'directory' | 'attendance' | 'payroll' | 'performance' | 'access';
type EmployeeFilter = 'all' | 'active' | 'inactive' | 'monthly' | 'daily' | 'project-based';
type PayrollFilter = 'all' | 'draft' | 'processed' | 'approved' | 'paid';

// KPI Configuration
const KPI_TEMPLATES = [
  { id: 'attendance', name: 'Kehadiran', target: 95, unit: '%', icon: Calendar },
  { id: 'ontime', name: 'Tepat Waktu', target: 90, unit: '%', icon: Clock },
  { id: 'tasks', name: 'Tugas Selesai', target: 100, unit: '%', icon: CheckCircle2 },
  { id: 'quality', name: 'Kualitas Kerja', target: 85, unit: 'skor', icon: Star },
  { id: 'teamwork', name: 'Kerjasama Tim', target: 80, unit: 'skor', icon: Users },
];

// Role permissions
const ROLE_PERMISSIONS = {
  Admin: { dashboard: true, projects: true, finance: true, crm: true, hr: true, settings: true },
  HR: { dashboard: true, projects: false, finance: false, crm: false, hr: true, settings: false },
  Finance: { dashboard: true, projects: true, finance: true, crm: true, hr: false, settings: false },
  Employee: { dashboard: true, projects: true, finance: false, crm: false, hr: false, settings: false },
};

export function Employees() {
  const { 
    currentUser, 
    employees, 
    users,
    attendance,
    getAllPayroll, 
    processPayroll, 
    approvePayroll, 
    markPayrollPaid,
    generatePayrollForPeriod,
  } = useData();

  const [activeTab, setActiveTab] = useState<EmployeeTab>('directory');
  const [employeeFilter, setEmployeeFilter] = useState<EmployeeFilter>('all');
  const [payrollFilter, setPayrollFilter] = useState<PayrollFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [_showKpiModal, setShowKpiModal] = useState(false);
  void _showKpiModal; // Used in UI
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salaryScheme: 'monthly' as 'monthly' | 'daily' | 'project-based',
    baseSalary: 0,
    status: 'Active' as 'Active' | 'Inactive',
  });

  if (!currentUser) return null;
  
  // RLS check
  const canManage = ['Admin', 'HR'].includes(currentUser.role);
  const canViewPayroll = ['Admin', 'HR', 'Finance'].includes(currentUser.role);
  const canEditAccess = currentUser.role === 'Admin';

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search
      const user = users.find(u => u.id === emp.userId);
      const searchMatch = searchQuery === '' || 
        user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter
      let filterMatch = true;
      if (employeeFilter === 'active') filterMatch = emp.status === 'Active';
      else if (employeeFilter === 'inactive') filterMatch = emp.status === 'Inactive';
      else if (['monthly', 'daily', 'project-based'].includes(employeeFilter)) {
        filterMatch = emp.salaryScheme === employeeFilter;
      }
      
      return searchMatch && filterMatch;
    });
  }, [employees, users, searchQuery, employeeFilter]);

  // Payroll data
  const allPayroll = getAllPayroll();
  const filteredPayroll = allPayroll.filter(p => {
    if (payrollFilter === 'all') return true;
    return p.status.toLowerCase() === payrollFilter;
  });

  // Stats
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const inactiveCount = employees.filter(e => e.status === 'Inactive').length;
  const totalPayroll = filteredPayroll.reduce((s, p) => s + p.netPay, 0);
  const todayAttendance = attendance.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.date === today;
  });
  const presentToday = todayAttendance.filter(a => ['Present', 'Late'].includes(a.status)).length;

  const getUserInfo = (userId: string) => users.find(u => u.id === userId);
  const getEmployeeByUserId = (userId: string) => employees.find(e => e.userId === userId);

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  // Calculate employee KPIs
  const calculateKpis = (emp: Employee) => {
    const empAttendance = attendance.filter(a => a.userId === emp.userId);
    const presentDays = empAttendance.filter(a => a.status === 'Present').length;
    const lateDays = empAttendance.filter(a => a.status === 'Late').length;
    const totalDays = empAttendance.length || 1;
    
    return {
      attendance: Math.round((presentDays + lateDays) / totalDays * 100),
      ontime: Math.round(presentDays / totalDays * 100),
      tasks: Math.floor(Math.random() * 30) + 70, // Mock
      quality: Math.floor(Math.random() * 20) + 75, // Mock
      teamwork: Math.floor(Math.random() * 20) + 75, // Mock
    };
  };

  const tabs: { id: EmployeeTab; label: string; icon: typeof Users }[] = [
    { id: 'directory', label: 'Direktori', icon: Users },
    { id: 'attendance', label: 'Kehadiran', icon: Calendar },
    { id: 'payroll', label: 'Penggajian', icon: Wallet },
    { id: 'performance', label: 'Kinerja', icon: BarChart3 },
    { id: 'access', label: 'Akses', icon: Shield },
  ];

  const statusConfig = {
    Draft: { color: 'bg-gray-100 text-gray-700', icon: FileText },
    Processed: { color: 'bg-blue-100 text-blue-700', icon: Clock },
    Approved: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    Paid: { color: 'bg-brand-100 text-brand-700', icon: DollarSign },
  };

  const schemeLabels = {
    monthly: 'Bulanan',
    daily: 'Harian',
    'project-based': 'Per Project',
  };

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.position) return;
    
    // In real app, this would create both user and employee via API
    // For now, we'll just close the modal and show feedback
    console.log('New employee:', newEmployee);
    
    setShowAddEmployee(false);
    setNewEmployee({
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      salaryScheme: 'monthly',
      baseSalary: 0,
      status: 'Active',
    });
  };

  const handleGeneratePayroll = () => {
    generatePayrollForPeriod(selectedPeriod, 'monthly');
    setShowGenerateModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Karyawan</h1>
                <p className="text-xs text-gray-500">Manajemen tim & penggajian</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              {canManage && (
                <button 
                  onClick={() => setShowAddEmployee(true)}
                  className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-lg transition-shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Tambah</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all",
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Directory Tab */}
        {activeTab === 'directory' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-violet-600" />
                  </div>
                  <span className="text-xs text-gray-500">Total Karyawan</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{employees.length}</p>
                <p className="text-[10px] text-gray-400 mt-1">{activeCount} aktif · {inactiveCount} nonaktif</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-xs text-gray-500">Hadir Hari Ini</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{presentToday}</p>
                <p className="text-[10px] text-gray-400 mt-1">dari {activeCount} karyawan aktif</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-500">Departemen</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{new Set(employees.map(e => e.department).filter(Boolean)).size || 1}</p>
                <p className="text-[10px] text-gray-400 mt-1">unit kerja</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-xs text-gray-500">Total Gaji</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(employees.reduce((s, e) => s + (e.baseSalary || 0), 0))}</p>
                <p className="text-[10px] text-gray-400 mt-1">per bulan</p>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, jabatan, departemen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'active', label: 'Aktif' },
                    { id: 'inactive', label: 'Nonaktif' },
                    { id: 'monthly', label: 'Bulanan' },
                    { id: 'daily', label: 'Harian' },
                    { id: 'project-based', label: 'Project' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setEmployeeFilter(f.id as EmployeeFilter)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                        employeeFilter === f.id
                          ? "bg-violet-100 text-violet-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Employee List */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.map(emp => {
                const user = getUserInfo(emp.userId);
                const kpis = calculateKpis(emp);
                const avgKpi = Math.round((kpis.attendance + kpis.ontime + kpis.tasks + kpis.quality + kpis.teamwork) / 5);
                
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={cn(
                      "bg-white rounded-2xl p-4 border border-gray-100 cursor-pointer transition-all hover:shadow-md hover:border-violet-200",
                      selectedEmployee?.id === emp.id && "ring-2 ring-violet-500 border-violet-200"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{user?.name || 'Unknown'}</h3>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                            emp.status === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                          )}>
                            {emp.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{emp.position}</p>
                        <p className="text-[10px] text-gray-400">{emp.department || 'General'}</p>
                        
                        {/* Quick Info */}
                        <div className="flex items-center gap-3 mt-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                            emp.salaryScheme === 'monthly' ? "bg-blue-50 text-blue-600" :
                            emp.salaryScheme === 'daily' ? "bg-amber-50 text-amber-600" :
                            "bg-violet-50 text-violet-600"
                          )}>
                            {schemeLabels[emp.salaryScheme]}
                          </span>
                          
                          {/* KPI Score */}
                          <div className="flex items-center gap-1">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                              avgKpi >= 85 ? "bg-emerald-100 text-emerald-700" :
                              avgKpi >= 70 ? "bg-amber-100 text-amber-700" :
                              "bg-rose-100 text-rose-700"
                            )}>
                              {avgKpi}
                            </div>
                            <span className="text-[10px] text-gray-400">KPI</span>
                          </div>
                        </div>
                        
                        {/* Salary */}
                        <p className="text-sm font-semibold text-gray-900 mt-2">
                          {formatCurrency(emp.baseSalary || 0)}
                          <span className="text-[10px] text-gray-400 font-normal">
                            /{emp.salaryScheme === 'daily' ? 'hari' : 'bulan'}
                          </span>
                        </p>
                      </div>
                      
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <>
            {/* Attendance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-xs text-gray-500">Hadir</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {attendance.filter(a => a.status === 'Present').length}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-xs text-gray-500">Terlambat</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {attendance.filter(a => a.status === 'Late').length}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-500">Cuti/Izin</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {attendance.filter(a => ['Leave', 'Sick'].includes(a.status)).length}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <UserX className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="text-xs text-gray-500">Alfa</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {attendance.filter(a => a.status === 'Alfa').length}
                </p>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Riwayat Kehadiran</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Karyawan</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Tanggal</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Masuk</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Keluar</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendance.slice(0, 20).map(att => {
                      const user = getUserInfo(att.userId);
                      return (
                        <tr key={att.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {user?.name?.charAt(0) || 'U'}
                              </div>
                              <span className="text-sm text-gray-900">{user?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{att.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{att.checkInTime || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{att.checkOutTime || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              att.status === 'Present' ? "bg-emerald-100 text-emerald-700" :
                              att.status === 'Late' ? "bg-amber-100 text-amber-700" :
                              att.status === 'Leave' || att.status === 'Sick' ? "bg-blue-100 text-blue-700" :
                              "bg-rose-100 text-rose-700"
                            )}>
                              {att.status === 'Present' ? 'Hadir' :
                               att.status === 'Late' ? 'Terlambat' :
                               att.status === 'Leave' ? 'Cuti' :
                               att.status === 'Sick' ? 'Sakit' : 'Alfa'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Payroll Tab */}
        {activeTab === 'payroll' && (
          <>
            {/* Payroll Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-brand-600" />
                  </div>
                  <span className="text-xs text-gray-500">Total Payroll</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPayroll)}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-xs text-gray-500">Menunggu</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {allPayroll.filter(p => ['Draft', 'Processed'].includes(p.status)).length}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-xs text-gray-500">Disetujui</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {allPayroll.filter(p => p.status === 'Approved').length}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-brand-600" />
                  </div>
                  <span className="text-xs text-gray-500">Dibayar</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {allPayroll.filter(p => p.status === 'Paid').length}
                </p>
              </div>
            </div>

            {/* Filter & Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'draft', label: 'Draft' },
                  { id: 'processed', label: 'Diproses' },
                  { id: 'approved', label: 'Disetujui' },
                  { id: 'paid', label: 'Dibayar' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setPayrollFilter(f.id as PayrollFilter)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap",
                      payrollFilter === f.id
                        ? "bg-violet-100 text-violet-700"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              
              {canManage && (
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Generate Payroll
                </button>
              )}
            </div>

            {/* Payroll List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Karyawan</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Periode</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Gaji Pokok</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Potongan</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Total</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayroll.map(pr => {
                      const emp = employees.find(e => e.id === pr.employeeId);
                      const user = emp ? getUserInfo(emp.userId) : null;
                      const totalDeductions = pr.deductions.reduce((s, d) => s + d.amount, 0);
                      const StatusIcon = statusConfig[pr.status as keyof typeof statusConfig]?.icon || FileText;
                      
                      return (
                        <tr key={pr.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {user?.name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{user?.name || 'Unknown'}</p>
                                <p className="text-[10px] text-gray-400">{emp?.position}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{pr.period}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(pr.baseSalary)}</td>
                          <td className="px-4 py-3 text-sm text-rose-600">-{formatCurrency(totalDeductions)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(pr.netPay)}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                              statusConfig[pr.status as keyof typeof statusConfig]?.color
                            )}>
                              <StatusIcon className="w-3 h-3" />
                              {pr.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {pr.status === 'Draft' && canManage && (
                                <button
                                  onClick={() => processPayroll(pr.id)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Proses"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              )}
                              {pr.status === 'Processed' && canManage && (
                                <button
                                  onClick={() => approvePayroll(pr.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                  title="Setujui"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              {pr.status === 'Approved' && canViewPayroll && (
                                <button
                                  onClick={() => markPayrollPaid(pr.id)}
                                  className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg"
                                  title="Bayar"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                              )}
                              <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <>
            {/* KPI Overview */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">Kinerja Tim</h2>
                  <p className="text-violet-200 text-sm">Rata-rata KPI semua karyawan</p>
                </div>
                <button
                  onClick={() => setShowKpiModal(true)}
                  className="px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Atur KPI
                </button>
              </div>
              
              <div className="grid grid-cols-5 gap-4">
                {KPI_TEMPLATES.map(kpi => {
                  const avgScore = Math.round(employees.reduce((sum, emp) => {
                    const kpis = calculateKpis(emp);
                    return sum + (kpis[kpi.id as keyof typeof kpis] || 0);
                  }, 0) / employees.length);
                  
                  return (
                    <div key={kpi.id} className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-white/20 flex items-center justify-center mb-2">
                        <kpi.icon className="w-6 h-6" />
                      </div>
                      <p className="text-2xl font-bold">{avgScore}{kpi.unit === '%' ? '%' : ''}</p>
                      <p className="text-xs text-violet-200">{kpi.name}</p>
                      <p className="text-[10px] text-violet-300">Target: {kpi.target}{kpi.unit}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Performance */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Kinerja Individual</h3>
                <button className="text-sm text-violet-600 font-medium">Export</button>
              </div>
              
              <div className="divide-y divide-gray-100">
                {employees.map(emp => {
                  const user = getUserInfo(emp.userId);
                  const kpis = calculateKpis(emp);
                  const avgKpi = Math.round((kpis.attendance + kpis.ontime + kpis.tasks + kpis.quality + kpis.teamwork) / 5);
                  
                  return (
                    <div key={emp.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{user?.name}</h4>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium",
                              avgKpi >= 85 ? "bg-emerald-100 text-emerald-700" :
                              avgKpi >= 70 ? "bg-amber-100 text-amber-700" :
                              "bg-rose-100 text-rose-700"
                            )}>
                              {avgKpi >= 85 ? 'Excellent' : avgKpi >= 70 ? 'Good' : 'Needs Improvement'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{emp.position}</p>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          {KPI_TEMPLATES.map(kpiTpl => {
                            const score = kpis[kpiTpl.id as keyof typeof kpis] || 0;
                            const isGood = score >= kpiTpl.target * 0.9;
                            
                            return (
                              <div key={kpiTpl.id} className="text-center">
                                <p className={cn(
                                  "text-sm font-semibold",
                                  isGood ? "text-emerald-600" : "text-amber-600"
                                )}>
                                  {score}{kpiTpl.unit === '%' ? '%' : ''}
                                </p>
                                <p className="text-[10px] text-gray-400">{kpiTpl.name}</p>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                          avgKpi >= 85 ? "bg-emerald-100 text-emerald-700" :
                          avgKpi >= 70 ? "bg-amber-100 text-amber-700" :
                          "bg-rose-100 text-rose-700"
                        )}>
                          {avgKpi}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Access Control Tab */}
        {activeTab === 'access' && (
          <>
            {/* Role Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Admin', 'HR', 'Finance', 'Employee'].map(role => {
                const roleUsers = users.filter(u => u.role === role);
                const colors = {
                  Admin: 'from-rose-500 to-pink-600',
                  HR: 'from-violet-500 to-purple-600',
                  Finance: 'from-emerald-500 to-teal-600',
                  Employee: 'from-blue-500 to-indigo-600',
                };
                
                return (
                  <div key={role} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className={cn(
                      "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-3",
                      colors[role as keyof typeof colors]
                    )}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{role}</h3>
                    <p className="text-xs text-gray-500 mt-1">{roleUsers.length} pengguna</p>
                  </div>
                );
              })}
            </div>

            {/* Permissions Matrix */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Matriks Hak Akses</h3>
                <p className="text-xs text-gray-500 mt-1">Konfigurasi akses per role</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Modul</th>
                      <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Admin</th>
                      <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">HR</th>
                      <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Finance</th>
                      <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Employee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {['dashboard', 'projects', 'finance', 'crm', 'hr', 'settings'].map(module => (
                      <tr key={module} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900 capitalize">{module}</span>
                        </td>
                        {['Admin', 'HR', 'Finance', 'Employee'].map(role => {
                          const hasAccess = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]?.[module as keyof typeof ROLE_PERMISSIONS['Admin']];
                          return (
                            <td key={role} className="px-4 py-3 text-center">
                              {hasAccess ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100">
                                  <Check className="w-4 h-4 text-emerald-600" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
                                  <X className="w-4 h-4 text-gray-400" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Access List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Daftar Akses Pengguna</h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                {users.map(user => {
                  const emp = getEmployeeByUserId(user.id);
                  const roleColors = {
                    Admin: 'bg-rose-100 text-rose-700',
                    HR: 'bg-violet-100 text-violet-700',
                    Finance: 'bg-emerald-100 text-emerald-700',
                    Employee: 'bg-blue-100 text-blue-700',
                  };
                  
                  return (
                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{user.name}</h4>
                          <p className="text-xs text-gray-500">{emp?.position || 'No Position'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          roleColors[user.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-700'
                        )}>
                          {user.role}
                        </span>
                        
                        {canEditAccess && (
                          <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <Edit3 className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Tambah Karyawan</h2>
              <button onClick={() => setShowAddEmployee(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nama Lengkap *</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                  placeholder="Nama lengkap karyawan"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Telepon</label>
                  <input
                    type="tel"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                    placeholder="+62..."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Jabatan *</label>
                  <input
                    type="text"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                    placeholder="Jabatan"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Departemen</label>
                  <input
                    type="text"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                    placeholder="Departemen"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Skema Gaji</label>
                <div className="flex gap-2 mt-2">
                  {[
                    { id: 'monthly', label: 'Bulanan' },
                    { id: 'daily', label: 'Harian' },
                    { id: 'project-based', label: 'Per Project' },
                  ].map(scheme => (
                    <button
                      key={scheme.id}
                      onClick={() => setNewEmployee(prev => ({ ...prev, salaryScheme: scheme.id as any }))}
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm font-medium flex-1 transition-all",
                        newEmployee.salaryScheme === scheme.id
                          ? "bg-violet-100 text-violet-700 ring-2 ring-violet-500"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {scheme.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Gaji Pokok</label>
                <input
                  type="number"
                  value={newEmployee.baseSalary || ''}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, baseSalary: parseInt(e.target.value) || 0 }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowAddEmployee(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={!newEmployee.name || !newEmployee.position}
                className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Generate Payroll</h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Periode</label>
                <input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              
              <p className="text-sm text-gray-500">
                Akan membuat slip gaji untuk {employees.filter(e => e.status === 'Active').length} karyawan aktif.
              </p>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleGeneratePayroll}
                className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-medium"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;
