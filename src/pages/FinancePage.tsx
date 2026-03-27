import { NavLink, useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { ArrowLeft, FileSpreadsheet, FileText, Store } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { FinanceShellProvider, useFinanceShell } from '../components/finance/FinanceShellContext';
import { cn } from '../lib/utils';

export const FINANCE_NAV = [
  { to: 'cashflow', label: 'Cashflow' },
  { to: 'hutang-piutang', label: 'Hutang & Piutang' },
  { to: 'laba-rugi', label: 'Laba Rugi' },
  { to: 'laba-ditahan', label: 'Laba Ditahan' },
  { to: 'akun', label: 'Chart of Accounts' },
] as const;

function FinanceChrome() {
  const { exportExcel, exportPdf, month, setMonth } = useFinanceShell();
  const navigate = useNavigate();
  const location = useLocation();

  const paths = FINANCE_NAV.map((n) => n.to);
  const segment = location.pathname.split('/').pop() || 'cashflow';
  const idx = Math.max(0, paths.indexOf(segment as (typeof paths)[number]));

  const swipe = useSwipeable({
    onSwipedLeft: () => {
      if (idx < paths.length - 1) navigate(paths[idx + 1]);
    },
    onSwipedRight: () => {
      if (idx > 0) navigate(paths[idx - 1]);
    },
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'shrink-0 snap-start px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
      isActive
        ? 'border-emerald-500 text-emerald-600'
        : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
    );

  const asideLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
      isActive
        ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-600'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/80'
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row">
      <nav
        className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-b border-gray-200 dark:border-gray-700"
        aria-label="Sub halaman keuangan"
      >
        <div className="flex overflow-x-auto snap-x snap-mandatory">
          {FINANCE_NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={tabClass} replace>
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <aside
        className="hidden lg:flex w-60 shrink-0 flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        aria-label="Navigasi keuangan desktop"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <p className="mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Keuangan</p>
        </div>
        <div className="flex-1 p-3 space-y-1 overflow-y-auto">
          {FINANCE_NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={asideLink}>
              <Store className="w-4 h-4 opacity-60" />
              {n.label}
            </NavLink>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 lg:hidden">
            <Link
              to="/dashboard"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Kembali ke dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </Link>
            <span className="font-semibold text-gray-900 dark:text-white">FINANCE</span>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            Periode
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exportExcel()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button
              type="button"
              onClick={() => exportPdf()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow-sm hover:bg-gray-800 dark:bg-gray-700"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        <main
          {...swipe}
          className="flex-1 overflow-auto p-4 lg:p-8 touch-pan-y"
          style={{ touchAction: 'pan-y' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Layout + provider for `/dashboard/finance` child routes (Outlet di dalam shell). */
export function FinanceRouteLayout() {
  const { currentBusiness } = useAuthStore();
  if (!currentBusiness?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 text-gray-500">
        Pilih usaha terlebih dahulu dari dashboard.
      </div>
    );
  }

  return (
    <FinanceShellProvider business={currentBusiness}>
      <FinanceChrome />
    </FinanceShellProvider>
  );
}
