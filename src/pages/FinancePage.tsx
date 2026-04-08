import { NavLink, useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { ArrowLeft, FileSpreadsheet, FileText, Landmark, Wallet, HandCoins, ChartNoAxesCombined, BookOpenText } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { FinanceShellProvider, useFinanceShell } from '../components/finance/FinanceShellContext';
import { cn } from '../lib/utils';
import { Button, Input } from '../components/ui';

export const FINANCE_NAV = [
  { to: 'cashflow', label: 'Cashflow', icon: Wallet },
  { to: 'hutang-piutang', label: 'Hutang & Piutang', icon: HandCoins },
  { to: 'laba-rugi', label: 'Laba Rugi', icon: ChartNoAxesCombined },
  { to: 'laba-ditahan', label: 'Laba Ditahan', icon: Landmark },
  { to: 'akun', label: 'Chart of Accounts', icon: BookOpenText },
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
        ? 'border-brand-500 text-brand-300'
        : 'border-transparent text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]'
    );

  const asideLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
      isActive
        ? 'bg-[var(--ui-surface-3)] text-brand-300 border border-brand-600/40'
        : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-2)]'
    );

  return (
    <div className="ui-page flex flex-col lg:flex-row">
      <nav
        className="lg:hidden sticky top-0 z-30 bg-[var(--ui-surface)]/95 backdrop-blur border-b border-[var(--ui-border)]"
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
        className="hidden lg:flex w-60 shrink-0 flex-col border-r border-[var(--ui-border)] bg-[var(--ui-surface)]"
        aria-label="Navigasi keuangan desktop"
      >
        <div className="p-4 border-b border-[var(--ui-border)]">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-300 hover:text-brand-200"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <p className="mt-3 text-xs font-semibold text-[var(--ui-text-dim)] uppercase tracking-wide">Keuangan</p>
        </div>
        <div className="flex-1 p-3 space-y-1 overflow-y-auto">
          {FINANCE_NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={asideLink}>
              <n.icon className="w-4 h-4 opacity-80" />
              {n.label}
            </NavLink>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <div className="sticky top-0 z-20 bg-[var(--ui-surface)]/90 backdrop-blur border-b border-[var(--ui-border)] px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 lg:hidden">
            <Link
              to="/dashboard"
              className="p-2 rounded-lg hover:bg-[var(--ui-surface-2)]"
              aria-label="Kembali ke dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--ui-text)]" />
            </Link>
            <span className="font-semibold text-[var(--ui-text)]">FINANCE</span>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
            Periode
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-auto"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => exportExcel()} variant="primary">
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
            <Button onClick={() => exportPdf()} variant="secondary">
              <FileText className="w-4 h-4" />
              PDF
            </Button>
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
