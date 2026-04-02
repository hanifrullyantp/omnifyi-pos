import { useState, useMemo } from 'react';
import {
  FileText, TrendingUp, DollarSign,
  PieChart, BarChart3, ArrowUpRight, ArrowDownRight,
  Download, Filter, HelpCircle, X, FileSpreadsheet, Printer,
  Briefcase, Users, CreditCard, AlertTriangle,
  CheckCircle2, Clock, Building2, Wallet, Info,
} from 'lucide-react';
import {
  exportProfitLossCSV,
  exportCashFlowCSV,
  exportBalanceSheetCSV,
  exportAgingCSV,
  exportTransactionsCSV,
  exportProjectFinanceCSV,
  generatePrintablePDF,
  financialHelpers,
  formatDate,
} from '../lib/exportUtils';
import { cn } from '../lib/utils';
import { useData } from '../store/dataStore';
import { useNavigate } from 'react-router-dom';

type ReportType = 'profit-loss' | 'cash-flow' | 'balance-sheet' | 'project' | 'aging' | 'transactions';

export default function Reports() {
  const navigate = useNavigate();
  const { currentUser, projects } = useData();
  
  const [activeReport, setActiveReport] = useState<ReportType>('profit-loss');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [dateRange, setDateRange] = useState('month');
  const [agingType, setAgingType] = useState<'receivables' | 'payables'>('receivables');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // Role check
  if (!currentUser || !['Admin', 'Finance'].includes(currentUser.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Terbatas</h2>
          <p className="text-gray-500">Hanya Admin dan Finance yang dapat mengakses laporan.</p>
        </div>
      </div>
    );
  }
  
  const formatCurrency = (n: number, short = false) => {
    if (short) {
      if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toFixed(1)}B`;
      if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toFixed(1)}M`;
      if (Math.abs(n) >= 1e3) return `Rp ${(n / 1e3).toFixed(0)}K`;
    }
    return `Rp ${n.toLocaleString('id-ID')}`;
  };
  
  const reportTypes = [
    { id: 'profit-loss', label: 'Laba Rugi', icon: TrendingUp, color: 'emerald' },
    { id: 'cash-flow', label: 'Arus Kas', icon: DollarSign, color: 'blue' },
    { id: 'balance-sheet', label: 'Neraca', icon: BarChart3, color: 'violet' },
    { id: 'project', label: 'Per Project', icon: Briefcase, color: 'amber' },
    { id: 'aging', label: 'Hutang Piutang', icon: Clock, color: 'rose' },
    { id: 'transactions', label: 'Ringkasan', icon: FileText, color: 'gray' },
  ];
  
  // Get date range
  const getDateRange = () => {
    const today = new Date();
    let start: string, end: string;
    
    switch (dateRange) {
      case 'week':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterStart = Math.floor(today.getMonth() / 3) * 3;
        start = new Date(today.getFullYear(), quarterStart, 1).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      default:
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
    }
    
    return { start, end };
  };
  
  const { start, end } = getDateRange();
  
  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900">Laporan Keuangan</h1>
                <p className="text-xs text-gray-500">Analisis keuangan bisnis Anda</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowHelp(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Bantuan memahami laporan"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
          
          {/* Report Type Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
            {reportTypes.map(report => (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id as ReportType)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                  activeReport === report.id
                    ? "bg-brand-500 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                )}
              >
                <report.icon className="w-4 h-4" />
                {report.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="px-4 py-3 md:px-6 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Periode:</span>
          </div>
          
          <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg">
            {[
              { value: 'week', label: '7 Hari' },
              { value: 'month', label: 'Bulan Ini' },
              { value: 'quarter', label: 'Kuartal' },
              { value: 'year', label: 'Tahun' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  dateRange === opt.value
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          {activeReport === 'project' && (
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Pilih Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          
          {activeReport === 'aging' && (
            <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setAgingType('receivables')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  agingType === 'receivables'
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Piutang
              </button>
              <button
                onClick={() => setAgingType('payables')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  agingType === 'payables'
                    ? "bg-white text-rose-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Hutang
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Report Content */}
      <div className="px-4 py-4 md:px-6 max-w-7xl mx-auto">
        {activeReport === 'profit-loss' && <ProfitLossView start={start} end={end} formatCurrency={formatCurrency} />}
        {activeReport === 'cash-flow' && <CashFlowView start={start} end={end} formatCurrency={formatCurrency} />}
        {activeReport === 'balance-sheet' && <BalanceSheetView formatCurrency={formatCurrency} />}
        {activeReport === 'project' && <ProjectReportView projectId={selectedProject} formatCurrency={formatCurrency} navigate={navigate} />}
        {activeReport === 'aging' && <AgingReportView type={agingType} formatCurrency={formatCurrency} />}
        {activeReport === 'transactions' && <TransactionSummaryView start={start} end={end} formatCurrency={formatCurrency} />}
      </div>
      
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        activeReport={activeReport}
        dateRange={dateRange}
        selectedProject={selectedProject}
        agingType={agingType}
        projects={projects}
      />
      
      {/* Help Modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        activeReport={activeReport}
      />
    </div>
  );
}

// ============================================
// EXPORT MODAL
// ============================================
function ExportModal({ 
  isOpen, 
  onClose, 
  activeReport, 
  dateRange,
  selectedProject,
  agingType,
  projects
}: { 
  isOpen: boolean; 
  onClose: () => void;
  activeReport: string;
  dateRange: string;
  selectedProject: string;
  agingType: 'receivables' | 'payables';
  projects: { id: string; name: string }[];
}) {
  const { 
    getProfitLossReport, 
    getCashFlowReport, 
    getBalanceSheet, 
    getAgingReport,
    getProjectFinancialReport,
    transactions
  } = useData();
  
  if (!isOpen) return null;
  
  const getPeriodLabel = () => {
    const labels: Record<string, string> = {
      week: '7-Hari',
      month: 'Bulan-Ini',
      quarter: 'Kuartal',
      year: 'Tahun-Ini'
    };
    return labels[dateRange] || 'Custom';
  };
  
  const getDateRange = () => {
    const today = new Date();
    let start: string, end: string;
    switch (dateRange) {
      case 'week':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterStart = Math.floor(today.getMonth() / 3) * 3;
        start = new Date(today.getFullYear(), quarterStart, 1).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      default:
        start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
    }
    return { start, end };
  };
  
  const { start, end } = getDateRange();
  
  const handleExportCSV = () => {
    const period = getPeriodLabel();
    
    switch (activeReport) {
      case 'profit-loss': {
        const report = getProfitLossReport(start, end);
        exportProfitLossCSV({
          totalRevenue: report.revenue.total,
          totalCOGS: report.costOfSales.total,
          grossProfit: report.grossProfit,
          totalOperatingExpenses: report.operatingExpenses.total,
          netProfit: report.netProfit,
          revenueBreakdown: report.revenue.breakdown,
          expenseBreakdown: report.operatingExpenses.breakdown
        }, period);
        break;
      }
      case 'cash-flow': {
        const report = getCashFlowReport(start, end);
        exportCashFlowCSV({
          openingBalance: report.openingBalance,
          closingBalance: report.closingBalance,
          netCashFlow: report.netCashFlow,
          operating: report.operating,
          investing: report.investing
        }, period);
        break;
      }
      case 'balance-sheet': {
        const report = getBalanceSheet();
        exportBalanceSheetCSV({
          assets: report.assets,
          liabilities: report.liabilities,
          equity: report.equity
        }, formatDate(new Date()));
        break;
      }
      case 'aging': {
        const report = getAgingReport(agingType);
        const items = report.items.map(item => ({
          entityName: item.entityName,
          amount: item.outstandingAmount,
          dueDate: item.dueDate,
          daysOverdue: item.daysOverdue
        }));
        exportAgingCSV(agingType, items, report.summary);
        break;
      }
      case 'transactions': {
        const txList = transactions.filter(t => {
          const txDate = t.date;
          return txDate >= start && txDate <= end;
        }).map(t => ({
          date: t.date,
          description: t.desc,
          category: t.category,
          type: t.type,
          amount: t.amount,
          project: projects.find(p => p.id === t.projectId)?.name
        }));
        exportTransactionsCSV(txList, period);
        break;
      }
      case 'project': {
        if (!selectedProject) {
          alert('Pilih project terlebih dahulu');
          return;
        }
        const report = getProjectFinancialReport(selectedProject);
        const project = projects.find(p => p.id === selectedProject);
        if (report && project) {
          const budgetUsed = report.budget.total > 0 
            ? (report.expenses.total / report.budget.total * 100)
            : 0;
          exportProjectFinanceCSV(project.name, {
            totalIncome: report.income.collected,
            totalExpense: report.expenses.total,
            netProfit: report.profitability.netProfit,
            budgetUtilization: budgetUsed,
            categories: report.budget.categories.map((c: { name: string; budgeted: number; actual: number; variance: number }) => ({
              name: c.name,
              budgeted: c.budgeted,
              actual: c.actual,
              variance: c.variance
            }))
          });
        }
        break;
      }
    }
    onClose();
  };
  
  const handleExportPDF = () => {
    const period = getPeriodLabel();
    
    switch (activeReport) {
      case 'profit-loss': {
        const report = getProfitLossReport(start, end);
        generatePrintablePDF(
          'Laporan Laba Rugi',
          `Periode: ${period}`,
          [
            {
              heading: 'Ringkasan',
              rows: [
                { label: 'Total Pendapatan', value: `Rp ${report.revenue.total.toLocaleString('id-ID')}` },
                { label: 'Harga Pokok (HPP)', value: `Rp ${report.costOfSales.total.toLocaleString('id-ID')}` },
                { label: 'Laba Kotor', value: `Rp ${report.grossProfit.toLocaleString('id-ID')} (${report.grossMargin}%)` },
                { label: 'Beban Operasional', value: `Rp ${report.operatingExpenses.total.toLocaleString('id-ID')}` },
                { label: 'Laba Bersih', value: `Rp ${report.netProfit.toLocaleString('id-ID')} (${report.netMargin}%)` }
              ]
            },
            {
              heading: 'Rincian Pendapatan',
              rows: report.revenue.breakdown.map(r => ({
                label: r.category,
                value: `Rp ${r.amount.toLocaleString('id-ID')}`
              }))
            },
            {
              heading: 'Rincian Biaya',
              rows: [
                ...report.costOfSales.breakdown.map(c => ({ label: `HPP: ${c.category}`, value: `Rp ${c.amount.toLocaleString('id-ID')}` })),
                ...report.operatingExpenses.breakdown.map(e => ({ label: `Operasional: ${e.category}`, value: `Rp ${e.amount.toLocaleString('id-ID')}` }))
              ]
            }
          ]
        );
        break;
      }
      case 'cash-flow': {
        const report = getCashFlowReport(start, end);
        const totalInflow = report.operating.inflows.reduce((s, i) => s + i.amount, 0) + 
                           report.investing.inflows.reduce((s, i) => s + i.amount, 0);
        const totalOutflow = report.operating.outflows.reduce((s, i) => s + i.amount, 0) +
                            report.investing.outflows.reduce((s, i) => s + i.amount, 0);
        generatePrintablePDF(
          'Laporan Arus Kas',
          `Periode: ${period}`,
          [
            {
              heading: 'Ringkasan',
              rows: [
                { label: 'Saldo Awal', value: `Rp ${report.openingBalance.toLocaleString('id-ID')}` },
                { label: 'Total Uang Masuk', value: `Rp ${totalInflow.toLocaleString('id-ID')}` },
                { label: 'Total Uang Keluar', value: `Rp ${totalOutflow.toLocaleString('id-ID')}` },
                { label: 'Net Operasional', value: `Rp ${report.operating.netOperating.toLocaleString('id-ID')}` },
                { label: 'Net Investasi', value: `Rp ${report.investing.netInvesting.toLocaleString('id-ID')}` },
                { label: 'Arus Kas Bersih', value: `Rp ${report.netCashFlow.toLocaleString('id-ID')}` },
                { label: 'Saldo Akhir', value: `Rp ${report.closingBalance.toLocaleString('id-ID')}` }
              ]
            }
          ]
        );
        break;
      }
      case 'balance-sheet': {
        const report = getBalanceSheet();
        generatePrintablePDF(
          'Neraca / Balance Sheet',
          `Per: ${formatDate(new Date())}`,
          [
            {
              heading: 'Aset',
              rows: [
                ...report.assets.current.items.map((a: { name: string; balance: number }) => ({ label: a.name, value: `Rp ${a.balance.toLocaleString('id-ID')}` })),
                { label: 'Subtotal Aset Lancar', value: `Rp ${report.assets.current.total.toLocaleString('id-ID')}` },
                ...report.assets.fixed.items.map((a: { name: string; balance: number }) => ({ label: a.name, value: `Rp ${a.balance.toLocaleString('id-ID')}` })),
                { label: 'Subtotal Aset Tetap', value: `Rp ${report.assets.fixed.total.toLocaleString('id-ID')}` },
                { label: 'Total Aset', value: `Rp ${report.assets.totalAssets.toLocaleString('id-ID')}` }
              ]
            },
            {
              heading: 'Kewajiban',
              rows: [
                ...report.liabilities.current.items.map((l: { name: string; balance: number }) => ({ label: l.name, value: `Rp ${l.balance.toLocaleString('id-ID')}` })),
                { label: 'Subtotal Kewajiban Lancar', value: `Rp ${report.liabilities.current.total.toLocaleString('id-ID')}` },
                ...report.liabilities.longTerm.items.map((l: { name: string; balance: number }) => ({ label: l.name, value: `Rp ${l.balance.toLocaleString('id-ID')}` })),
                { label: 'Subtotal Jangka Panjang', value: `Rp ${report.liabilities.longTerm.total.toLocaleString('id-ID')}` },
                { label: 'Total Kewajiban', value: `Rp ${report.liabilities.totalLiabilities.toLocaleString('id-ID')}` }
              ]
            },
            {
              heading: 'Ekuitas',
              rows: [
                ...report.equity.items.map((e: { name: string; balance: number }) => ({ label: e.name, value: `Rp ${e.balance.toLocaleString('id-ID')}` })),
                { label: 'Total Ekuitas', value: `Rp ${report.equity.total.toLocaleString('id-ID')}` }
              ]
            }
          ]
        );
        break;
      }
      default:
        alert('Export PDF untuk laporan ini akan segera tersedia');
    }
    onClose();
  };
  
  const reportLabels: Record<string, string> = {
    'profit-loss': 'Laba Rugi',
    'cash-flow': 'Arus Kas',
    'balance-sheet': 'Neraca',
    'project': 'Per Project',
    'aging': 'Hutang Piutang',
    'transactions': 'Ringkasan Transaksi'
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Export Laporan</h3>
              <p className="text-xs text-gray-500">{reportLabels[activeReport]} • {getPeriodLabel()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Pilih format export untuk laporan <span className="font-semibold">{reportLabels[activeReport]}</span>:
          </p>
          
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
          >
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 transition-colors">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-gray-900">Export ke Excel / CSV</p>
              <p className="text-xs text-gray-500">Format spreadsheet yang bisa diedit di Excel atau Google Sheets</p>
            </div>
          </button>
          
          <button
            onClick={handleExportPDF}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all group"
          >
            <div className="p-3 rounded-xl bg-rose-100 text-rose-600 group-hover:bg-rose-200 transition-colors">
              <Printer className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-gray-900">Cetak / PDF</p>
              <p className="text-xs text-gray-500">Format siap cetak atau simpan sebagai PDF</p>
            </div>
          </button>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Laporan akan di-export sesuai filter periode yang dipilih
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELP MODAL
// ============================================
function HelpModal({ isOpen, onClose, activeReport }: { isOpen: boolean; onClose: () => void; activeReport: string }) {
  if (!isOpen) return null;
  
  const getHelpContent = () => {
    switch (activeReport) {
      case 'profit-loss':
        return {
          title: 'Memahami Laporan Laba Rugi',
          intro: 'Laporan ini menunjukkan apakah bisnis Anda menghasilkan keuntungan atau kerugian dalam periode tertentu.',
          items: [
            financialHelpers.revenue,
            financialHelpers.cogs,
            financialHelpers.grossProfit,
            financialHelpers.operatingExpense,
            financialHelpers.netProfit
          ]
        };
      case 'cash-flow':
        return {
          title: 'Memahami Arus Kas',
          intro: 'Laporan ini menunjukkan bagaimana uang mengalir masuk dan keluar dari bisnis Anda.',
          items: [
            financialHelpers.cashFlow,
            {
              title: 'Saldo Awal',
              description: 'Uang yang dimiliki di awal periode.',
              tip: 'Ini adalah titik mulai sebelum ada transaksi baru.'
            },
            {
              title: 'Uang Masuk',
              description: 'Semua pemasukan kas dari pelanggan, termasuk DP dan pembayaran.',
              tip: 'Semakin cepat uang masuk, semakin sehat cash flow.'
            },
            {
              title: 'Uang Keluar',
              description: 'Semua pengeluaran kas untuk operasional, pembelian, dan pembayaran.',
              tip: 'Kontrol pengeluaran agar tidak lebih besar dari pemasukan.'
            },
            {
              title: 'Saldo Akhir',
              description: 'Uang yang tersisa di akhir periode.',
              tip: 'Saldo positif = masih ada dana. Negatif = perlu tambahan modal.'
            }
          ]
        };
      case 'balance-sheet':
        return {
          title: 'Memahami Neraca',
          intro: 'Neraca menunjukkan kondisi keuangan bisnis pada satu titik waktu: apa yang dimiliki, apa yang dihutang, dan berapa nilai kepemilikan.',
          items: [
            financialHelpers.assets,
            financialHelpers.liabilities,
            financialHelpers.equity,
            {
              title: 'Rumus Dasar',
              description: 'Aset = Kewajiban + Ekuitas. Jika tidak seimbang, ada kesalahan pencatatan.',
              tip: 'Neraca yang seimbang menunjukkan pencatatan yang benar.'
            }
          ]
        };
      case 'aging':
        return {
          title: 'Memahami Hutang & Piutang',
          intro: 'Laporan ini mengelompokkan hutang dan piutang berdasarkan umur, membantu Anda memprioritaskan penagihan atau pembayaran.',
          items: [
            financialHelpers.receivables,
            financialHelpers.payables,
            {
              title: 'Aging Bucket',
              description: 'Pengelompokan berdasarkan berapa lama tagihan belum dibayar.',
              tip: 'Fokus pada tagihan > 60 hari karena semakin sulit ditagih.'
            }
          ]
        };
      default:
        return {
          title: 'Bantuan Laporan Keuangan',
          intro: 'Laporan keuangan membantu Anda memahami kondisi kesehatan bisnis.',
          items: [
            financialHelpers.revenue,
            financialHelpers.netProfit,
            financialHelpers.cashFlow
          ]
        };
    }
  };
  
  const content = getHelpContent();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-brand-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-100 text-brand-600">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900">{content.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-gray-600 mb-4 pb-3 border-b border-gray-100">
            {content.intro}
          </p>
          
          <div className="space-y-4">
            {content.items.map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                <div className="flex items-start gap-2 bg-white rounded-lg p-2 border border-gray-100">
                  <span className="text-amber-500 text-sm">💡</span>
                  <p className="text-xs text-gray-500">{item.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PROFIT & LOSS VIEW
// ============================================
function ProfitLossView({ start, end, formatCurrency }: { start: string; end: string; formatCurrency: (n: number, short?: boolean) => string }) {
  const { getProfitLossReport } = useData();
  const report = useMemo(() => getProfitLossReport(start, end), [getProfitLossReport, start, end]);
  
  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-100">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs text-gray-500">Pendapatan</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(report.revenue.total, true)}</p>
          <p className="text-[10px] text-gray-400">Total pemasukan</p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-rose-100">
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-xs text-gray-500">HPP</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(report.costOfSales.total, true)}</p>
          <p className="text-[10px] text-gray-400">Harga pokok penjualan</p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-100">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs text-gray-500">Laba Kotor</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(report.grossProfit, true)}</p>
          <p className="text-[10px] text-emerald-500 font-medium">Margin: {report.grossMargin}%</p>
        </div>
        
        <div className={cn(
          "rounded-2xl p-4 border",
          report.netProfit >= 0 
            ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200"
            : "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "p-1.5 rounded-lg",
              report.netProfit >= 0 ? "bg-emerald-200" : "bg-rose-200"
            )}>
              <DollarSign className={cn("w-4 h-4", report.netProfit >= 0 ? "text-emerald-700" : "text-rose-700")} />
            </div>
            <span className="text-xs text-gray-600">Laba Bersih</span>
          </div>
          <p className={cn(
            "text-lg font-bold",
            report.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"
          )}>
            {formatCurrency(report.netProfit, true)}
          </p>
          <p className={cn("text-[10px] font-medium", report.netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
            Margin: {report.netMargin}%
          </p>
        </div>
      </div>
      
      {/* Detailed Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            Rincian Pendapatan
          </h3>
          <div className="space-y-2">
            {report.revenue.breakdown.length > 0 ? report.revenue.breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm text-gray-700">{item.category}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount, true)}</p>
                  <p className="text-[10px] text-gray-400">{item.percentage}%</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada data pendapatan</p>
            )}
          </div>
        </div>
        
        {/* Expense Breakdown */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
            Rincian Biaya
          </h3>
          
          {/* COGS */}
          {report.costOfSales.breakdown.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase font-medium mb-2">Harga Pokok</p>
              {report.costOfSales.breakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm text-gray-700">{item.category}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount, true)}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Operating Expenses */}
          {report.operatingExpenses.breakdown.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-2">Operasional</p>
              {report.operatingExpenses.breakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-sm text-gray-700">{item.category}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount, true)}</span>
                </div>
              ))}
            </div>
          )}
          
          {report.costOfSales.breakdown.length === 0 && report.operatingExpenses.breakdown.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada data biaya</p>
          )}
        </div>
      </div>
      
      {/* Visual Summary */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Ringkasan Visual</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Pendapatan</span>
              <span className="font-medium text-emerald-600">{formatCurrency(report.revenue.total, true)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">HPP ({report.revenue.total > 0 ? Math.round((report.costOfSales.total / report.revenue.total) * 100) : 0}%)</span>
              <span className="font-medium text-amber-600">{formatCurrency(report.costOfSales.total, true)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full" 
                style={{ width: `${report.revenue.total > 0 ? (report.costOfSales.total / report.revenue.total) * 100 : 0}%` }} 
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Biaya Operasional ({report.revenue.total > 0 ? Math.round((report.operatingExpenses.total / report.revenue.total) * 100) : 0}%)</span>
              <span className="font-medium text-rose-600">{formatCurrency(report.operatingExpenses.total, true)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full" 
                style={{ width: `${report.revenue.total > 0 ? (report.operatingExpenses.total / report.revenue.total) * 100 : 0}%` }} 
              />
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-900 font-semibold">Laba Bersih ({report.netMargin}%)</span>
              <span className={cn("font-bold", report.netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {formatCurrency(report.netProfit, true)}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full", report.netProfit >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                style={{ width: `${Math.min(Math.abs(report.netMargin), 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CASH FLOW VIEW
// ============================================
function CashFlowView({ start, end, formatCurrency }: { start: string; end: string; formatCurrency: (n: number, short?: boolean) => string }) {
  const { getCashFlowReport } = useData();
  const report = useMemo(() => getCashFlowReport(start, end), [getCashFlowReport, start, end]);
  
  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">Saldo Awal</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(report.openingBalance, true)}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500">Kas Masuk</span>
          </div>
          <p className="text-lg font-bold text-emerald-600">
            {formatCurrency(report.operating.inflows.reduce((s, x) => s + x.amount, 0), true)}
          </p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
            <span className="text-xs text-gray-500">Kas Keluar</span>
          </div>
          <p className="text-lg font-bold text-rose-600">
            {formatCurrency(report.operating.outflows.reduce((s, x) => s + x.amount, 0) + report.investing.outflows.reduce((s, x) => s + x.amount, 0), true)}
          </p>
        </div>
        
        <div className={cn(
          "rounded-2xl p-4 border",
          report.netCashFlow >= 0 
            ? "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200"
            : "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={cn("w-4 h-4", report.netCashFlow >= 0 ? "text-blue-600" : "text-rose-600")} />
            <span className="text-xs text-gray-600">Saldo Akhir</span>
          </div>
          <p className={cn("text-lg font-bold", report.netCashFlow >= 0 ? "text-blue-700" : "text-rose-700")}>
            {formatCurrency(report.closingBalance, true)}
          </p>
        </div>
      </div>
      
      {/* Flow Breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Operating */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            Aktivitas Operasi
          </h3>
          
          <div className="space-y-2 mb-3">
            <p className="text-xs text-gray-500 uppercase font-medium">Kas Masuk</p>
            {report.operating.inflows.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.category}</span>
                <span className="text-emerald-600 font-medium">+{formatCurrency(item.amount, true)}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-2 mb-3">
            <p className="text-xs text-gray-500 uppercase font-medium">Kas Keluar</p>
            {report.operating.outflows.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.category}</span>
                <span className="text-rose-600 font-medium">-{formatCurrency(item.amount, true)}</span>
              </div>
            ))}
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between text-sm font-semibold">
              <span>Arus Kas Operasi</span>
              <span className={report.operating.netOperating >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {formatCurrency(report.operating.netOperating, true)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Investing */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            Aktivitas Investasi
          </h3>
          
          {report.investing.outflows.length > 0 ? (
            <div className="space-y-2">
              {report.investing.outflows.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1 mr-2">{item.description}</span>
                  <span className="text-rose-600 font-medium">-{formatCurrency(item.amount, true)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Tidak ada aktivitas investasi</p>
          )}
          
          <div className="pt-2 mt-3 border-t border-gray-100">
            <div className="flex justify-between text-sm font-semibold">
              <span>Arus Kas Investasi</span>
              <span className={report.investing.netInvesting >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {formatCurrency(report.investing.netInvesting, true)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Summary */}
        <div className={cn(
          "rounded-2xl p-4 border",
          report.netCashFlow >= 0 ? "bg-blue-50 border-blue-200" : "bg-rose-50 border-rose-200"
        )}>
          <h3 className="font-semibold text-gray-900 mb-4">Ringkasan Arus Kas</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Saldo Awal</span>
              <span className="font-medium">{formatCurrency(report.openingBalance, true)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Arus Operasi</span>
              <span className={cn("font-medium", report.operating.netOperating >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {report.operating.netOperating >= 0 ? '+' : ''}{formatCurrency(report.operating.netOperating, true)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Arus Investasi</span>
              <span className={cn("font-medium", report.investing.netInvesting >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {report.investing.netInvesting >= 0 ? '+' : ''}{formatCurrency(report.investing.netInvesting, true)}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Saldo Akhir</span>
                <span className={cn("text-lg font-bold", report.closingBalance >= 0 ? "text-blue-700" : "text-rose-700")}>
                  {formatCurrency(report.closingBalance, true)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// BALANCE SHEET VIEW
// ============================================
function BalanceSheetView({ formatCurrency }: { formatCurrency: (n: number, short?: boolean) => string }) {
  const { getBalanceSheet } = useData();
  const report = useMemo(() => getBalanceSheet(), [getBalanceSheet]);
  
  return (
    <div className="space-y-4">
      {/* Balance Check */}
      <div className={cn(
        "rounded-2xl p-4 border flex items-center justify-between",
        report.isBalanced 
          ? "bg-emerald-50 border-emerald-200"
          : "bg-amber-50 border-amber-200"
      )}>
        <div className="flex items-center gap-3">
          {report.isBalanced ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          )}
          <div>
            <p className={cn("font-semibold", report.isBalanced ? "text-emerald-800" : "text-amber-800")}>
              {report.isBalanced ? "Neraca Seimbang" : "Neraca Tidak Seimbang"}
            </p>
            <p className="text-xs text-gray-600">Per {new Date(report.asOfDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Aset</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(report.assets.totalAssets, true)}</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Assets */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            ASET
            <span className="ml-auto text-lg font-bold text-blue-600">{formatCurrency(report.assets.totalAssets, true)}</span>
          </h3>
          
          {/* Current Assets */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-500 uppercase font-medium">Aset Lancar</p>
              <span className="text-sm font-semibold text-gray-700">{formatCurrency(report.assets.current.total, true)}</span>
            </div>
            {report.assets.current.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1.5 pl-3 border-l-2 border-blue-200">
                <span className="text-gray-600">{item.name}</span>
                <span className="font-medium">{formatCurrency(item.balance, true)}</span>
              </div>
            ))}
          </div>
          
          {/* Fixed Assets */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-500 uppercase font-medium">Aset Tetap</p>
              <span className="text-sm font-semibold text-gray-700">{formatCurrency(report.assets.fixed.total, true)}</span>
            </div>
            {report.assets.fixed.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1.5 pl-3 border-l-2 border-blue-200">
                <span className="text-gray-600">{item.name}</span>
                <span className="font-medium">{formatCurrency(item.balance, true)}</span>
              </div>
            ))}
            {report.assets.fixed.items.length === 0 && (
              <p className="text-xs text-gray-400 pl-3">Tidak ada aset tetap</p>
            )}
          </div>
        </div>
        
        {/* Liabilities & Equity */}
        <div className="space-y-4">
          {/* Liabilities */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-100">
                <CreditCard className="w-4 h-4 text-rose-600" />
              </div>
              KEWAJIBAN
              <span className="ml-auto text-lg font-bold text-rose-600">{formatCurrency(report.liabilities.totalLiabilities, true)}</span>
            </h3>
            
            {/* Current Liabilities */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500 uppercase font-medium">Kewajiban Lancar</p>
                <span className="text-sm font-semibold text-gray-700">{formatCurrency(report.liabilities.current.total, true)}</span>
              </div>
              {report.liabilities.current.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1.5 pl-3 border-l-2 border-rose-200">
                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-medium">{formatCurrency(item.balance, true)}</span>
                </div>
              ))}
            </div>
            
            {/* Long-term Liabilities */}
            {report.liabilities.longTerm.total > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-gray-500 uppercase font-medium">Kewajiban Jangka Panjang</p>
                  <span className="text-sm font-semibold text-gray-700">{formatCurrency(report.liabilities.longTerm.total, true)}</span>
                </div>
                {report.liabilities.longTerm.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1.5 pl-3 border-l-2 border-rose-200">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.balance, true)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Equity */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-100">
                <Users className="w-4 h-4 text-violet-600" />
              </div>
              EKUITAS
              <span className="ml-auto text-lg font-bold text-violet-600">{formatCurrency(report.equity.total, true)}</span>
            </h3>
            
            {report.equity.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1.5 pl-3 border-l-2 border-violet-200">
                <span className="text-gray-600">{item.name}</span>
                <span className="font-medium">{formatCurrency(item.balance, true)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PROJECT REPORT VIEW
// ============================================
function ProjectReportView({ projectId, formatCurrency, navigate }: { projectId: string; formatCurrency: (n: number, short?: boolean) => string; navigate: (path: string) => void }) {
  const { getProjectFinancialReport, projects } = useData();
  
  if (!projectId) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pilih Project</h3>
        <p className="text-sm text-gray-500 mb-4">Pilih project dari dropdown di atas untuk melihat laporan keuangan</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-2xl mx-auto">
          {projects.slice(0, 4).map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="p-3 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
              <p className="text-xs text-gray-500">{p.status}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  const report = getProjectFinancialReport(projectId);
  
  return (
    <div className="space-y-4">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold">{report.projectName}</h2>
            <p className="text-sm text-white/80">Laporan Keuangan Project</p>
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold",
            report.health.isOnTrack ? "bg-white/20 text-white" : "bg-amber-400 text-amber-900"
          )}>
            {report.projectStatus}
          </span>
        </div>
        
        {/* Health Indicators */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <p className="text-xs text-white/70">Budget</p>
            <p className="text-sm font-bold">{report.health.budgetUtilization}%</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <p className="text-xs text-white/70">Collection</p>
            <p className="text-sm font-bold">{report.health.paymentCollection}%</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <p className="text-xs text-white/70">Margin</p>
            <p className="text-sm font-bold">{report.profitability.grossMargin}%</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <p className="text-xs text-white/70">Status</p>
            <p className="text-sm font-bold">{report.health.isOnBudget ? '✓' : '!'}</p>
          </div>
        </div>
      </div>
      
      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Nilai Kontrak</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(report.budget.total, true)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Terkumpul</p>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(report.income.collected, true)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Total Biaya</p>
          <p className="text-lg font-bold text-rose-600">{formatCurrency(report.expenses.total, true)}</p>
        </div>
        <div className={cn(
          "rounded-2xl p-4 border",
          report.profitability.grossProfit >= 0 
            ? "bg-emerald-50 border-emerald-200" 
            : "bg-rose-50 border-rose-200"
        )}>
          <p className="text-xs text-gray-600 mb-1">Profit</p>
          <p className={cn(
            "text-lg font-bold",
            report.profitability.grossProfit >= 0 ? "text-emerald-700" : "text-rose-700"
          )}>
            {formatCurrency(report.profitability.grossProfit, true)}
          </p>
        </div>
      </div>
      
      {/* Budget vs Actual */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Budget vs Realisasi</h3>
        <div className="space-y-3">
          {report.budget.categories.map((cat, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{cat.name}</span>
                <div className="text-right">
                  <span className="text-gray-500">{formatCurrency(cat.actual, true)}</span>
                  <span className="text-gray-400"> / </span>
                  <span className="font-medium">{formatCurrency(cat.budgeted, true)}</span>
                  <span className={cn(
                    "ml-2 text-xs font-medium",
                    cat.variance >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    ({cat.variance >= 0 ? '+' : ''}{cat.variancePercent}%)
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    cat.actual <= cat.budgeted ? "bg-brand-500" : "bg-rose-500"
                  )}
                  style={{ width: `${Math.min((cat.actual / cat.budgeted) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// AGING REPORT VIEW
// ============================================
function AgingReportView({ type, formatCurrency }: { type: 'receivables' | 'payables'; formatCurrency: (n: number, short?: boolean) => string }) {
  const { getAgingReport } = useData();
  const report = useMemo(() => getAgingReport(type), [getAgingReport, type]);
  
  const isReceivable = type === 'receivables';
  const colorClass = isReceivable ? 'emerald' : 'rose';
  
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className={cn("rounded-2xl p-4 border col-span-2 md:col-span-1", `bg-${colorClass}-50 border-${colorClass}-200`)}>
          <p className="text-xs text-gray-600 mb-1">Total Outstanding</p>
          <p className={cn("text-xl font-bold", `text-${colorClass}-700`)}>{formatCurrency(report.summary.total, true)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Current (0-30)</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(report.summary.current, true)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">31-60 Hari</p>
          <p className="text-lg font-bold text-amber-600">{formatCurrency(report.summary.days31to60, true)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">61-90 Hari</p>
          <p className="text-lg font-bold text-orange-600">{formatCurrency(report.summary.days61to90, true)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-rose-200 bg-rose-50">
          <p className="text-xs text-gray-600 mb-1">&gt;90 Hari</p>
          <p className="text-lg font-bold text-rose-600">{formatCurrency(report.summary.over90, true)}</p>
        </div>
      </div>
      
      {/* Aging Distribution Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">Distribusi Umur {isReceivable ? 'Piutang' : 'Hutang'}</h3>
        <div className="h-8 bg-gray-100 rounded-full overflow-hidden flex">
          {report.summary.total > 0 && (
            <>
              <div 
                className="h-full bg-emerald-500 transition-all" 
                style={{ width: `${(report.summary.current / report.summary.total) * 100}%` }}
                title="Current"
              />
              <div 
                className="h-full bg-amber-500 transition-all" 
                style={{ width: `${(report.summary.days31to60 / report.summary.total) * 100}%` }}
                title="31-60 days"
              />
              <div 
                className="h-full bg-orange-500 transition-all" 
                style={{ width: `${(report.summary.days61to90 / report.summary.total) * 100}%` }}
                title="61-90 days"
              />
              <div 
                className="h-full bg-rose-500 transition-all" 
                style={{ width: `${(report.summary.over90 / report.summary.total) * 100}%` }}
                title=">90 days"
              />
            </>
          )}
        </div>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Current</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> 31-60</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> 61-90</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /> &gt;90</span>
        </div>
      </div>
      
      {/* Items List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Detail {isReceivable ? 'Piutang' : 'Hutang'}</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {report.items.length > 0 ? report.items.map((item, idx) => (
            <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{item.entityName}</p>
                  {item.projectName && <p className="text-xs text-gray-500">{item.projectName}</p>}
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  item.agingBucket === 'Current' && "bg-emerald-100 text-emerald-700",
                  item.agingBucket === '31-60' && "bg-amber-100 text-amber-700",
                  item.agingBucket === '61-90' && "bg-orange-100 text-orange-700",
                  item.agingBucket === '90+' && "bg-rose-100 text-rose-700",
                )}>
                  {item.agingBucket === 'Current' ? 'Lancar' : `${item.daysOverdue} hari`}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Jatuh tempo: {new Date(item.dueDate).toLocaleDateString('id-ID')}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(item.outstandingAmount, true)}</span>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
              <p className="text-gray-500">Tidak ada {isReceivable ? 'piutang' : 'hutang'} outstanding</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// TRANSACTION SUMMARY VIEW
// ============================================
function TransactionSummaryView({ start, end, formatCurrency }: { start: string; end: string; formatCurrency: (n: number, short?: boolean) => string }) {
  const { getTransactionSummary } = useData();
  const [groupBy, setGroupBy] = useState<'category' | 'project' | 'day'>('category');
  
  const report = useMemo(() => getTransactionSummary(start, end, groupBy), [getTransactionSummary, start, end, groupBy]);
  
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Total Transaksi</p>
          <p className="text-2xl font-bold text-gray-900">{report.totals.transactionCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Pemasukan</p>
          <p className="text-lg font-bold text-emerald-600">+{formatCurrency(report.totals.income, true)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Pengeluaran</p>
          <p className="text-lg font-bold text-rose-600">-{formatCurrency(report.totals.expense, true)}</p>
        </div>
        <div className={cn(
          "rounded-2xl p-4 border",
          report.totals.net >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
        )}>
          <p className="text-xs text-gray-600 mb-1">Net</p>
          <p className={cn("text-lg font-bold", report.totals.net >= 0 ? "text-emerald-700" : "text-rose-700")}>
            {formatCurrency(report.totals.net, true)}
          </p>
        </div>
      </div>
      
      {/* Group By Toggle */}
      <div className="flex items-center gap-3 bg-white rounded-xl p-2 border border-gray-100 w-fit">
        <span className="text-sm text-gray-500 pl-2">Kelompokkan:</span>
        {[
          { value: 'category', label: 'Kategori' },
          { value: 'project', label: 'Project' },
          { value: 'day', label: 'Tanggal' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setGroupBy(opt.value as typeof groupBy)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
              groupBy === opt.value
                ? "bg-brand-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      
      {/* Groups */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {report.groups.map((group, idx) => (
            <div key={idx} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{group.key}</span>
                <span className="text-xs text-gray-400">{group.count} transaksi</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-emerald-600">+{formatCurrency(group.income, true)}</span>
                <span className="text-rose-600">-{formatCurrency(group.expense, true)}</span>
                <span className={cn("font-medium", group.net >= 0 ? "text-gray-900" : "text-rose-600")}>
                  = {formatCurrency(group.net, true)}
                </span>
              </div>
            </div>
          ))}
          {report.groups.length === 0 && (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Tidak ada transaksi di periode ini</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Top Transactions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            Top Pemasukan
          </h3>
          {report.topIncome.length > 0 ? report.topIncome.map((item, idx) => (
            <div key={idx} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm text-gray-700 truncate max-w-[200px]">{item.description}</p>
                <p className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('id-ID')}</p>
              </div>
              <span className="text-sm font-semibold text-emerald-600">+{formatCurrency(item.amount, true)}</span>
            </div>
          )) : (
            <p className="text-sm text-gray-400 text-center py-4">Tidak ada data</p>
          )}
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
            Top Pengeluaran
          </h3>
          {report.topExpense.length > 0 ? report.topExpense.map((item, idx) => (
            <div key={idx} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm text-gray-700 truncate max-w-[200px]">{item.description}</p>
                <p className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('id-ID')}</p>
              </div>
              <span className="text-sm font-semibold text-rose-600">-{formatCurrency(item.amount, true)}</span>
            </div>
          )) : (
            <p className="text-sm text-gray-400 text-center py-4">Tidak ada data</p>
          )}
        </div>
      </div>
    </div>
  );
}
