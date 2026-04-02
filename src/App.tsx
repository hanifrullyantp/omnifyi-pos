import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useSyncStore } from './lib/store';
import { db, seedInitialData, seedDemoWorkspace, Cashier, resetDemoData } from './lib/db';
import { logActivity, formatActivityAction } from './lib/activityLog';
import { supabase } from './lib/supabaseClient';
import { ensureLocalCoreRows, provisionTenantAndBusiness } from './lib/cloudProvision';
import { installSyncHooks } from './lib/syncHooks';
import { pullAllChangesForTenant } from './lib/pullChanges';
import { applyTheme, getInitialThemeMode, persistThemeMode, resolveTheme, ThemeMode } from './lib/theme';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  TrendingUp,
  LogOut,
  ChevronDown,
  Store,
  Settings,
  Bell,
  Banknote,
  Plus,
  Check,
  X,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  Boxes,
  History,
  CalendarDays,
  Wallet,
  Users,
  Briefcase,
  AlertCircle,
  Receipt,
  UserPlus,
  FilePlus,
  ClipboardList,
  BarChart3,
  ChevronRight,
  Package as PackageIcon,
  PackageX,
  Clock3,
  UserCog,
  CalendarCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  Shield,
  Sparkles,
  Play,
  Sun,
  Moon,
  type LucideIcon,
} from 'lucide-react';
import { cn, formatCurrency } from './lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import POSScreen from './components/pos/POSScreen';
import CashierDashboardScreen from './components/pos/CashierDashboardScreen';
import { ProductsPage } from './pages/ProductsPage';
import { MaterialsPage } from './components/materials';
import { FinanceRouteLayout } from './pages/FinancePage';
import {
  FinanceAccountsTab,
  FinanceCashflowTab,
  FinanceDebtTab,
  FinancePLTab,
  FinanceRetainedTab,
} from './components/finance/financeTabs';
import HistoryPage from './pages/HistoryPage';
import ShiftsPage from './pages/ShiftsPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import TransactionsPage from './pages/TransactionsPage';
import SuperAdminPage from './pages/SuperAdminPage';
import MembersPage from './pages/MembersPage';
import StorePage from './pages/StorePage';
import StockOpnamePage from './pages/StockOpnamePage';
import TasksKanbanPage from './pages/TasksKanbanPage';
import StoreShiftsPage from './pages/store/StoreShiftsPage';
import StoreRolesPage from './pages/store/StoreRolesPage';
import StoreStaffPage from './pages/store/StoreStaffPage';
import StoreAttendancePage from './pages/store/StoreAttendancePage';
import StorePayrollPage from './pages/store/StorePayrollPage';
import StoreBusinessSettingsPage from './pages/store/StoreBusinessSettingsPage';
import { PwaInstallBanner } from './components/shared/PwaInstallBanner';
import { SyncStatusChip } from './components/shared/SyncStatusChip';
import { checkMidtransPaid, runLocalBillingFlow, startMidtransCheckout } from './lib/billingFlow';
import { loadSuperAdminSettings, SuperAdminSettings } from './lib/superAdminSettings';
import LoginLandingPage from './pages/LoginLandingPage';
import LandingAdminPage from './pages/LandingAdminPage';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, errorMessage: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown) {
    // Keep a console trace for diagnostics without blank screen.
    // eslint-disable-next-line no-console
    console.error('AppErrorBoundary caught error', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h1 className="font-bold text-lg">Terjadi error</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Aplikasi tidak menampilkan blank lagi. Silakan refresh, atau kembali ke Dashboard.
              </p>
              {this.state.errorMessage ? (
                <pre className="mt-3 text-xs whitespace-pre-wrap break-words rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 text-gray-700 dark:text-gray-300">
                  {this.state.errorMessage}
                </pre>
              ) : null}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => (window.location.href = '/dashboard')}
                >
                  Ke Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// ============================================
// AUTHENTICATION SCREENS
// ============================================

// Owner Login Screen (glassmorphism — Omnifyi POS)
const OwnerLoginScreen = () => {
  const [email, setEmail] = useState('owner@example.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoSignupOpen, setDemoSignupOpen] = useState(false);
  const [demoName, setDemoName] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoBusinessType, setDemoBusinessType] = useState('');
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutPackage, setCheckoutPackage] = useState<'starter' | 'growth' | 'pro'>('growth');
  const [checkoutStatus, setCheckoutStatus] = useState('');
  const [checkoutOrderId, setCheckoutOrderId] = useState('');
  const [checkoutRedirectUrl, setCheckoutRedirectUrl] = useState('');
  const [checkoutLeadId, setCheckoutLeadId] = useState('');
  const midtransEnabled = (import.meta.env.VITE_MIDTRANS_ENABLED as string | undefined) === 'true';
  const [buyerMessage, setBuyerMessage] = useState('');
  const [cms, setCms] = useState<SuperAdminSettings>(() => loadSuperAdminSettings());
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const syncSettings = () => setCms(loadSuperAdminSettings());
    syncSettings();
    window.addEventListener('storage', syncSettings);
    return () => window.removeEventListener('storage', syncSettings);
  }, []);

  useEffect(() => {
    document.title = `${cms.brandName || 'Omnifyi POS'} — Kelola Bisnis & Keuangan`;

    if (cms.faviconUrl) {
      let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = cms.faviconUrl;
    }

    if (cms.thumbnailUrl) {
      let og = document.querySelector("meta[property='og:image']") as HTMLMetaElement | null;
      if (!og) {
        og = document.createElement('meta');
        og.setAttribute('property', 'og:image');
        document.head.appendChild(og);
      }
      og.setAttribute('content', cms.thumbnailUrl);
    }
  }, [cms.brandName, cms.faviconUrl, cms.thumbnailUrl]);

  useEffect(() => {
    const existing = document.getElementById('omnifyi-pixel-script');
    if (existing) existing.remove();
    if (!cms.facebookPixelId) return;
    const script = document.createElement('script');
    script.id = 'omnifyi-pixel-script';
    script.async = true;
    script.src = `https://connect.facebook.net/en_US/fbevents.js?id=${encodeURIComponent(cms.facebookPixelId)}`;
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById('omnifyi-pixel-script');
      if (el) el.remove();
    };
  }, [cms.facebookPixelId]);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const loginCredentials = async (e: string, p: string) => {
    const emailNorm = e.trim().toLowerCase();
    const pass = p.trim();
    if (!supabase) {
      setError('Supabase env belum diset. Isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di .env.local lalu restart dev server.');
      return false;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailNorm, password: pass });
    if (error || !data.user) {
      setError('Email atau password salah');
      return false;
    }
    const { tenantId, businessId } = await provisionTenantAndBusiness({ businessName: 'Usaha Baru' });
    const { user, tenant, business } = await ensureLocalCoreRows({
      userId: data.user.id,
      email: emailNorm,
      tenantId,
      businessId,
      businessName: 'Usaha Baru',
    });
    setAuth(user, tenant, business, [business]);
    return true;
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginCredentials(email.trim(), password);
    } catch (err) {
      setError('Terjadi kesalahan');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('owner@example.com');
    setPassword('password');
    setIsLoading(true);
    setError('');
    try {
      await seedInitialData();
      await seedDemoWorkspace();
      // Demo stays local.
      const user = await db.users.where('email').equals('owner@example.com').first();
      if (!user) throw new Error('demo_missing');
      const tenant = await db.tenants.where('ownerId').equals(user.id!).first();
      const businesses = tenant?.id ? await db.businesses.where('tenantId').equals(tenant.id).toArray() : [];
      if (!tenant || businesses.length === 0) throw new Error('demo_missing');
      setAuth(user, tenant, businesses[0], businesses);
    } catch (err) {
      setError('Terjadi kesalahan');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignup = async () => {
    if (!demoName.trim() || !demoPhone.trim() || !isValidEmail(demoEmail) || !demoBusinessType.trim()) {
      setError('Lengkapi data demo: nama, no HP, email valid, dan jenis usaha.');
      return;
    }
    await db.crmLeads.add({
      id: crypto.randomUUID(),
      fullName: demoName.trim(),
      email: demoEmail.trim(),
      phone: demoPhone.trim(),
      businessType: demoBusinessType.trim(),
      source: 'LANDING_DEMO',
      stage: 'DEMO',
      notes: 'Signup demo dari landing',
      createdAt: new Date(),
    });
    setDemoSignupOpen(false);
    await handleDemoLogin();
  };

  const requestCheckout = async () => {
    if (!checkoutName.trim() || !checkoutPhone.trim() || !isValidEmail(checkoutEmail)) {
      setCheckoutStatus('Isi data checkout dengan benar (nama, HP, email valid).');
      return;
    }
    const amountMap = { starter: 99000, growth: 149000, pro: 249000 } as const;
    const amount = amountMap[checkoutPackage];

    const leadId = crypto.randomUUID();
    await db.crmLeads.add({
      id: leadId,
      fullName: checkoutName.trim(),
      email: checkoutEmail.trim(),
      phone: checkoutPhone.trim(),
      businessType: 'Belum diisi',
      source: 'LANDING_CHECKOUT',
      stage: 'CHECKOUT',
      amount,
      createdAt: new Date(),
    });

    setCheckoutLeadId(leadId);

    if (midtransEnabled) {
      setCheckoutStatus('Membuat invoice Midtrans…');
      const r = await startMidtransCheckout({
        leadId,
        packageId: checkoutPackage,
        buyerName: checkoutName.trim(),
        buyerEmail: checkoutEmail.trim(),
        buyerPhone: checkoutPhone.trim(),
        amount,
      });
      setCheckoutOrderId(r.orderId);
      setCheckoutRedirectUrl(r.redirectUrl);
      await db.crmLeads.update(leadId, { orderId: r.orderId, updatedAt: new Date() });
      window.open(r.redirectUrl, '_blank', 'noopener,noreferrer');
      setCheckoutStatus('Silakan selesaikan pembayaran di Midtrans, lalu klik “Saya sudah bayar”.');
      return;
    }

    const orderId = `OMN-${Date.now()}`;
    await db.crmLeads.update(leadId, { orderId, updatedAt: new Date() });
    setCheckoutStatus('Checkout dibuat. Menunggu pembayaran...');
    const provision = await runLocalBillingFlow({
      leadId,
      orderId,
      packageId: checkoutPackage,
      buyerName: checkoutName.trim(),
      buyerEmail: checkoutEmail.trim(),
    });
    setCheckoutStatus(`Pembayaran terdeteksi. Akun usaha kosong siap: login dengan ${checkoutEmail.trim()} — password sementara ${provision.tempPassword}. Atur password: ${provision.setPasswordLink}`);
  };

  const confirmCheckoutPaid = async () => {
    if (!midtransEnabled) return;
    if (!checkoutOrderId || !checkoutLeadId) return;
    setCheckoutStatus('Mengecek status pembayaran…');
    const s = await checkMidtransPaid(checkoutOrderId);
    if (!s.paid) {
      setCheckoutStatus(`Belum terdeteksi lunas (status: ${s.transaction_status ?? 'unknown'}). Coba lagi sebentar.`);
      return;
    }
    const provision = await runLocalBillingFlow({
      leadId: checkoutLeadId,
      orderId: checkoutOrderId,
      packageId: checkoutPackage,
      buyerName: checkoutName.trim(),
      buyerEmail: checkoutEmail.trim(),
    });
    setCheckoutStatus(`Pembayaran terverifikasi. Login dengan ${checkoutEmail.trim()} — password sementara ${provision.tempPassword}. Atur password: ${provision.setPasswordLink}`);
  };

  const submitBuyerMessage = async () => {
    if (!buyerMessage.trim()) return;
    await db.buyerInbox.add({
      id: crypto.randomUUID(),
      senderName: checkoutName.trim() || demoName.trim() || 'Pengunjung Landing',
      senderEmail: checkoutEmail.trim() || demoEmail.trim() || undefined,
      message: buyerMessage.trim(),
      createdAt: new Date(),
      status: 'NEW',
    });
    setBuyerMessage('');
    setCheckoutStatus('Masukan kamu sudah dikirim ke inbox admin. Terima kasih!');
  };

  const handleResetDemo = async () => {
    const ok = confirm('Reset Data Demo? Ini akan menghapus seluruh data lokal (IndexedDB) dan mengisi ulang data demo.');
    if (!ok) return;
    setIsLoading(true);
    setError('');
    try {
      await resetDemoData();
      const user = await db.users.where('email').equals('owner@example.com').first();
      if (!user) throw new Error('demo_missing');
      const tenant = await db.tenants.where('ownerId').equals(user.id!).first();
      const businesses = tenant?.id ? await db.businesses.where('tenantId').equals(tenant.id).toArray() : [];
      if (!tenant || businesses.length === 0) throw new Error('demo_missing');
      setAuth(user, tenant, businesses[0], businesses);
    } catch (err) {
      setError('Gagal mereset data demo');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const glassPanel = 'rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-xl';

  return (
    <div
      className="min-h-screen min-h-[100dvh] relative overflow-x-hidden text-white"
      style={{
        background:
          'radial-gradient(ellipse 120% 80% at 80% 100%, rgba(13,148,136,0.25) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 10% 20%, rgba(15,118,110,0.12) 0%, transparent 45%), #0a0f1a',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_90%,rgba(34,197,94,0.12),transparent_40%)]" />
      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen min-h-[100dvh] max-w-7xl mx-auto px-4 py-8 md:px-8 md:py-10 lg:px-12 lg:py-12 gap-10 lg:gap-16">
        {/* Kolom kiri — brand & fitur (di mobile: setelah login) */}
        <div className="flex-1 flex flex-col justify-center order-2 lg:order-1 lg:max-w-xl pt-4 lg:pt-0">
          <div className="flex items-center gap-3 mb-8">
            {cms.brandLogoDataUrl ? (
              <img
                src={cms.brandLogoDataUrl}
                alt="Brand logo"
                className="w-12 h-12 rounded-2xl object-cover border border-white/20 shadow-lg shadow-emerald-500/30"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-1 ring-white/20">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">{cms.brandName || 'Omnifyi POS'}</h1>
              <p className="text-xs font-medium text-emerald-300/80">Business &amp; Project Management</p>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold leading-tight text-white mb-4">
            {cms.heroTitle || 'Kelola Keuangan Bisnis & Project dalam Satu Sistem'}
          </h2>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed mb-10 max-w-md">
            {cms.heroSubtitle ||
              'Pantau penjualan, kasir, stok, dan laporan keuangan secara real time. Satu dashboard untuk tim Anda — dari toko ritel hingga manajemen proyek.'}
          </p>

          <div className="space-y-3">
            {[
              {
                icon: Building2,
                title: 'Multi-Project',
                desc: 'Kelola beberapa cabang atau proyek dengan data terpisah dan rapi.',
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                desc: 'Grafik dan KPI yang diperbarui saat transaksi masuk.',
              },
              {
                icon: Shield,
                title: 'Audit Trail',
                desc: 'Riwayat aktivitas dan shift kasir untuk akuntabilitas.',
              },
            ].map((f) => (
              <div key={f.title} className={cn('flex gap-4 p-4', glassPanel)}>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{f.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom kanan — demo + login (di mobile: pertama) */}
        <div className="flex-1 flex flex-col justify-center order-1 lg:order-2 w-full lg:max-w-md mx-auto lg:mx-0">
          <div
            className={cn(
              'mb-6 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
              'rounded-2xl border border-amber-500/20 bg-amber-950/40 backdrop-blur-md'
            )}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-200">Mode Demo Tersedia</p>
                <p className="text-[11px] text-amber-200/70">Coba langsung dengan akun demo</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDemoSignupOpen(true)}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md border border-amber-400/30 hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 active:scale-[0.98] whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {cms.primaryCtaText || 'Mulai Demo'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDemo}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            Reset Data Demo
          </button>

          <div className={cn(glassPanel, 'p-6 md:p-8')}>
            <h3 className="text-xl font-bold text-white mb-1">Selamat Datang di {cms.brandName || 'Omnifyi POS'}</h3>
            <p className="text-sm text-slate-400 mb-6">Landing + login untuk `{cms.landingUrl || 'https://pos.omnifyi.com'}`</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter') void handleLogin();
                    }}
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-black/25 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
                    placeholder="nama@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter') void handleLogin();
                    }}
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-white/10 bg-black/25 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleLogin()}
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 text-slate-900 shadow-lg shadow-emerald-500/25 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500">
              Belum punya akun?{' '}
              <button
                type="button"
                className="font-semibold text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
                onClick={() => setError('Pendaftaran online segera hadir — gunakan Mode Demo untuk mencoba.')}
              >
                Daftar Sekarang
              </button>
            </p>
          </div>

          <div className={cn(glassPanel, 'p-6 mt-6')}>
            <h4 className="text-base font-bold text-white mb-2">Kenapa banyak bisnis kacau tanpa POS?</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Catatan manual bikin stok ngaco, laporan telat, dan kasir sering salah input. Omnifyi POS bantu
              tim Anda kerja rapi: transaksi cepat, stok akurat, laporan realtime, dan owner bisa kontrol dari satu dashboard.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {[
                'POS cepat + mode offline',
                'Dashboard KPI + grafik bisnis',
                'Manajemen member & promo',
                'Laporan, shift, history lengkap',
              ].map((x) => (
                <div key={x} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
                  {x}
                </div>
              ))}
            </div>
          </div>

          <div className={cn(glassPanel, 'p-6 mt-6')}>
            <h4 className="text-base font-bold text-white mb-3">Checkout Langganan (Midtrans ready)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} placeholder="Nama lengkap" className="px-3 py-2 rounded-xl border border-white/10 bg-black/25 text-white text-sm" />
              <input value={checkoutPhone} onChange={(e) => setCheckoutPhone(e.target.value)} placeholder="No. HP" className="px-3 py-2 rounded-xl border border-white/10 bg-black/25 text-white text-sm" />
              <input value={checkoutEmail} onChange={(e) => setCheckoutEmail(e.target.value)} placeholder="Email aktif" className="sm:col-span-2 px-3 py-2 rounded-xl border border-white/10 bg-black/25 text-white text-sm" />
              <select value={checkoutPackage} onChange={(e) => setCheckoutPackage(e.target.value as 'starter' | 'growth' | 'pro')} className="sm:col-span-2 px-3 py-2 rounded-xl border border-white/10 bg-black/25 text-white text-sm">
                <option value="starter">Starter - Rp99.000</option>
                <option value="growth">Growth - Rp149.000</option>
                <option value="pro">Pro - Rp249.000</option>
              </select>
            </div>
            <button type="button" onClick={requestCheckout} className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-400 text-slate-900 font-bold text-sm">
              Checkout & Bayar
            </button>
            {midtransEnabled && checkoutRedirectUrl && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={checkoutRedirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 rounded-xl border border-white/15 text-white text-center text-sm font-semibold"
                >
                  Buka pembayaran
                </a>
                <button
                  type="button"
                  onClick={() => void confirmCheckoutPaid()}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
                >
                  Saya sudah bayar
                </button>
              </div>
            )}
            {checkoutStatus && <p className="mt-2 text-xs text-emerald-300">{checkoutStatus}</p>}
            <p className="mt-2 text-[11px] text-slate-400">
              Flow: checkout → pembayaran terdeteksi → email konfirmasi → sistem kirim mekanisme login otomatis.
            </p>
            {cms.supportWhatsapp && (
              <p className="mt-2 text-[11px] text-emerald-300">
                Butuh bantuan cepat? WhatsApp support: {cms.supportWhatsapp}
              </p>
            )}
          </div>

          <div className={cn(glassPanel, 'p-6 mt-6')}>
            <h4 className="text-base font-bold text-white mb-2">Saran & Masukan</h4>
            <p className="text-xs text-slate-400 mb-3">Masukan dari buyer akan masuk ke inbox di halaman admin.</p>
            <textarea
              value={buyerMessage}
              onChange={(e) => setBuyerMessage(e.target.value)}
              placeholder="Tulis saran atau pertanyaan kamu..."
              className="w-full min-h-[92px] px-3 py-2 rounded-xl border border-white/10 bg-black/25 text-white text-sm"
            />
            <button
              type="button"
              onClick={() => void submitBuyerMessage()}
              className="mt-3 w-full py-2.5 rounded-xl border border-white/15 text-slate-100 hover:bg-white/10"
            >
              Kirim Masukan
            </button>
          </div>
        </div>
      </div>

      {demoSignupOpen && (
        <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/95 p-5">
            <h4 className="text-white font-bold text-lg">Daftar Demo Omnifyi POS</h4>
            <p className="text-xs text-slate-400 mt-1">Wajib isi data diri sebelum akses demo.</p>
            <div className="mt-4 space-y-2">
              <input value={demoName} onChange={(e) => setDemoName(e.target.value)} placeholder="Nama lengkap" className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/25 text-white text-sm" />
              <input value={demoPhone} onChange={(e) => setDemoPhone(e.target.value)} placeholder="No. HP" className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/25 text-white text-sm" />
              <input value={demoEmail} onChange={(e) => setDemoEmail(e.target.value)} placeholder="Email valid" className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/25 text-white text-sm" />
              <input value={demoBusinessType} onChange={(e) => setDemoBusinessType(e.target.value)} placeholder="Jenis usaha" className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/25 text-white text-sm" />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setDemoSignupOpen(false)} className="flex-1 py-2 rounded-xl border border-white/20 text-slate-200">Batal</button>
              <button onClick={() => void handleDemoSignup()} className="flex-1 py-2 rounded-xl bg-brand-600 text-white font-semibold">Lanjut Demo</button>
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-10 px-6 pb-6 pt-2 text-center lg:text-left lg:max-w-7xl lg:mx-auto text-[11px] text-slate-500">
        © {new Date().getFullYear()} {cms.brandName || 'Omnifyi POS'}. Dibangun dengan{' '}
        <span className="text-rose-400" aria-hidden>
          ♥
        </span>{' '}
        untuk bisnis Indonesia.
      </footer>
    </div>
  );
};

// Cashier Login Screen
const CashierLoginScreen = ({
  onBackToDashboard,
  onGoToCashierDashboard,
}: {
  onBackToDashboard: () => void;
  onGoToCashierDashboard: () => void;
}) => {
  const { currentBusiness, setCashier } = useAuthStore();
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);

  const cashiers = useLiveQuery(
    () => currentBusiness 
      ? db.cashiers.where('businessId').equals(currentBusiness.id!).filter(c => c.isActive).toArray()
      : [],
    [currentBusiness]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkCashierId = params.get('cashier');
    if (!linkCashierId || !cashiers?.length || selectedCashier) return;
    const match = cashiers.find((c) => c.id === linkCashierId);
    if (match) setSelectedCashier(match);
  }, [cashiers, selectedCashier]);

  const isLockedOut = lockoutUntil && new Date() < lockoutUntil;

  const handlePinInput = (digit: string) => {
    if (isLockedOut) return;
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      
      if (newPin.length === 6) {
        void verifyPin(newPin, 'pos');
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const verifyPin = async (enteredPin: string, next: 'pos' | 'cashier-dashboard') => {
    if (!selectedCashier) return;

    // In production, compare hashed PIN
    if (selectedCashier.pinHash === enteredPin) {
      const sessionId = crypto.randomUUID();
      await db.cashierSessions.add({
        id: sessionId,
        cashierId: selectedCashier.id!,
        businessId: currentBusiness!.id!,
        clockIn: new Date(),
        pinVerifiedAt: new Date(),
        status: 'ACTIVE',
        deviceInfo: navigator.userAgent
      });
      await logActivity({
        tenantId: currentBusiness!.tenantId,
        businessId: currentBusiness!.id!,
        actorType: 'CASHIER',
        actorId: selectedCashier.id!,
        action: 'CLOCK_IN',
        entityType: 'SESSION',
        entityId: sessionId,
        description: `${selectedCashier.name} masuk (clock-in)`,
      });

      setCashier(selectedCashier);
      if (next === 'cashier-dashboard') onGoToCashierDashboard();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError('PIN salah');
      setPin('');

      if (newAttempts >= 5) {
        setLockoutUntil(new Date(Date.now() + 5 * 60 * 1000));
        setError('Terlalu banyak percobaan. Coba lagi dalam 5 menit.');
      }
    }
  };

  if (!selectedCashier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-600 via-emerald-600 to-teal-700 
                    flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-xl mx-auto mb-4 
                          flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-brand-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{currentBusiness?.name}</h1>
            <p className="text-white/80">Pilih Kasir</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <div className="grid grid-cols-2 gap-4">
              {cashiers?.map(cashier => (
                <button
                  key={cashier.id}
                  onClick={() => setSelectedCashier(cashier)}
                  className="flex flex-col items-center p-6 rounded-2xl border-2 border-gray-100
                           hover:border-brand-600 hover:bg-brand-50 transition-all"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-emerald-600 
                                flex items-center justify-center text-white text-2xl font-bold mb-3">
                    {cashier.name.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-900">{cashier.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={onBackToDashboard}
              className="mt-6 w-full py-3 text-gray-500 text-sm font-medium 
                       hover:text-brand-600 transition-colors"
            >
              ← Ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 via-emerald-600 to-teal-700 
                  flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-white shadow-xl mx-auto mb-4 
                        flex items-center justify-center text-3xl font-bold text-brand-600">
            {selectedCashier.name.charAt(0)}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{selectedCashier.name}</h1>
          <p className="text-white/80">Masukkan PIN 6 digit</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6">
          {/* PIN Display */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all",
                  pin.length > i 
                    ? "border-brand-600 bg-brand-600" 
                    : "border-gray-200"
                )}
              >
                {pin.length > i && <div className="w-3 h-3 rounded-full bg-white" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 text-center text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key, idx) => {
              if (key === '') return <div key={idx} />;
              if (key === 'back') {
                return (
                  <button
                    key={idx}
                    onClick={handleBackspace}
                    disabled={isLockedOut || false}
                    className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center
                             text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <X className="w-6 h-6" />
                  </button>
                );
              }
              return (
                <button
                  key={idx}
                  onClick={() => handlePinInput(key)}
                  disabled={isLockedOut || false}
                  className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center
                           text-2xl font-bold text-gray-800 hover:bg-brand-50 hover:text-brand-600 
                           transition-colors disabled:opacity-50 active:scale-95"
                >
                  {key}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void verifyPin(pin, 'cashier-dashboard')}
            disabled={isLockedOut || pin.length !== 6}
            className="mt-4 w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50"
          >
            Dashboard Kasir
          </button>

          <button
            onClick={() => {
              setSelectedCashier(null);
              setPin('');
              setError('');
            }}
            className="mt-6 w-full py-3 text-gray-500 text-sm font-medium 
                     hover:text-brand-600 transition-colors"
          >
            ← Pilih Kasir Lain
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Dashboard (OMNIFYI-aligned) helpers ---

/** Short money labels — same idea as OMNIFYI Dashboard (B / M / K). */
function formatRpShort(n: number) {
  const v = Math.abs(n);
  if (v >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`;
  return `Rp ${Math.round(n)}`;
}

const DASH_CHART_6M = [
  { name: 'Feb', revenue: 3000, profit: 1398 },
  { name: 'Mar', revenue: 5200, profit: 3800 },
  { name: 'Apr', revenue: 4780, profit: 3208 },
  { name: 'May', revenue: 5890, profit: 4800 },
  { name: 'Jun', revenue: 6390, profit: 4200 },
  { name: 'Jul', revenue: 7490, profit: 5300 },
];

const DASH_CHART_12M = [
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

function OmnifyiStatCard({
  title,
  value,
  trend,
  up,
  icon,
  color,
  d,
  subInfo,
  period,
  helper,
}: {
  title: string;
  value: string;
  trend: string;
  up: boolean;
  icon: React.ReactNode;
  color: string;
  d: number;
  subInfo?: string;
  period?: string;
  helper?: string;
}) {
  const colors: Record<string, { bg: string; text: string }> = {
    brand: { bg: 'bg-teal-50', text: 'text-brand-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  };
  const c = colors[color] || colors.brand;
  const stagger =
    d === 1 ? 'stagger-1' : d === 2 ? 'stagger-2' : d === 3 ? 'stagger-3' : d === 4 ? 'stagger-4' : 'stagger-5';
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 p-3.5 md:p-4 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-700 card-hover animate-fade-in-up group relative',
        stagger
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-[11px] font-medium">{title}</p>
          {period && (
            <p className="text-xs md:text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 tracking-wide">{period}</p>
          )}
        </div>
        <div className={`p-1.5 ${c.bg} rounded-lg ${c.text} flex-shrink-0 dark:opacity-90`}>{icon}</div>
      </div>
      <div className="mt-2">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <h3 className="text-xl md:text-xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</h3>
          {helper && (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium hidden md:inline">{helper}</span>
          )}
        </div>
        <span
          className={`flex items-center text-xs md:text-[11px] font-semibold mt-0.5 ${up ? 'text-emerald-600' : 'text-rose-500'}`}
        >
          {up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
          {trend}
        </span>
        {subInfo && (
          <p className="text-xs md:text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-tight border-t border-gray-100 dark:border-gray-700 pt-1.5">
            {subInfo}
          </p>
        )}
      </div>
    </div>
  );
}

type MobileCardMode = {
  id: string;
  label: string;
  hero: { value: string; label: string; trend?: { text: string; positive: boolean } };
  metrics: Array<{
    label: string;
    value: string;
    trend?: string;
    tone?: 'pos' | 'neg' | 'warn' | 'muted';
    onClick?: () => void;
  }>;
};

function MobileSmartCard({
  icon,
  title,
  accent,
  modes,
  modeIndex,
  setModeIndex,
  periodLabel,
  onPickPeriod,
}: {
  icon: React.ReactNode;
  title: string;
  accent: { fg: string; ring: string; bg: string };
  modes: MobileCardMode[];
  modeIndex: number;
  setModeIndex: (i: number) => void;
  periodLabel: string;
  onPickPeriod: () => void;
}) {
  const [open, setOpen] = useState(false);
  const mode = modes[Math.max(0, Math.min(modes.length - 1, modeIndex))]!;

  const dot = (active: boolean) =>
    active ? `w-2 h-2 rounded-full ${accent.bg}` : 'w-1.5 h-1.5 rounded-full bg-[#30363D]';

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#161B22] to-[#1C2333] p-4 relative overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', accent.ring)}>{icon}</div>
          <p className={cn('text-xs font-bold tracking-widest', accent.fg)}>{title}</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-11 h-11 grid place-items-center rounded-xl hover:bg-white/5 active:scale-[0.98]"
            aria-label="Ganti mode"
          >
            <span className="text-xl text-[#8B949E]">⊞</span>
          </button>
          {open && (
            <div className="absolute right-0 top-12 w-[200px] rounded-xl bg-[#21262D] border border-[#30363D] shadow-xl p-2 z-50">
              <p className="text-[11px] text-[#8B949E] px-2 py-1">Tampilkan:</p>
              {modes.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setModeIndex(idx);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 text-left"
                >
                  <span className={cn('w-2 h-2 rounded-full', idx === modeIndex ? accent.bg : 'bg-[#30363D]')} />
                  <span className="text-sm text-[#F0F6FC]">{m.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[28px] leading-none font-extrabold text-[#F0F6FC] tracking-tight">{mode.hero.value}</p>
          {mode.hero.trend && (
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-md',
                mode.hero.trend.positive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
              )}
            >
              {mode.hero.trend.text}
            </span>
          )}
        </div>
        <p className="text-sm text-[#8B949E] mt-0.5">{mode.hero.label}</p>
      </div>

      <div className="mt-3 flex items-stretch gap-2">
        {mode.metrics.slice(0, 3).map((m, i) => {
          const tone =
            m.tone === 'pos'
              ? 'text-emerald-400'
              : m.tone === 'neg'
                ? 'text-red-400'
                : m.tone === 'warn'
                  ? 'text-amber-400'
                  : 'text-[#8B949E]';
          return (
            <button
              key={m.label}
              type="button"
              onClick={m.onClick}
              className={cn(
                'flex-1 min-w-0 rounded-xl px-2.5 py-2 text-left bg-black/20 hover:bg-white/5 active:scale-[0.99]'
              )}
            >
              <p className="text-[11px] text-[#8B949E]">{m.label}</p>
              <p className="text-base font-bold text-[#F0F6FC] mt-0.5 truncate">{m.value}</p>
              {m.trend && <p className={cn('text-[11px] font-semibold mt-0.5', tone)}>{m.trend}</p>}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {modes.map((_, idx) => (
            <div key={idx} className={dot(idx === modeIndex)} />
          ))}
        </div>
        <button
          type="button"
          onClick={onPickPeriod}
          className="h-7 px-2.5 rounded-lg bg-[#21262D] border border-[#30363D] text-[11px] text-[#8B949E] flex items-center gap-1"
        >
          {periodLabel} <span className="text-[#8B949E]">▾</span>
        </button>
      </div>
    </div>
  );
}

function DashboardAttentionWidget({
  lowStockCount,
  upcomingDebts,
  receivableOverdueCount,
  debtOverdueCount,
  formatRp,
  onNavigate,
}: {
  lowStockCount: number;
  upcomingDebts: { id?: string; partyName: string; type: string; remainingAmount: number }[];
  receivableOverdueCount: number;
  debtOverdueCount: number;
  formatRp: (n: number) => string;
  onNavigate: (path: string) => void;
}) {
  type Item = {
    icon: React.ElementType;
    label: string;
    detail: string;
    severity: 'red' | 'amber' | 'blue';
    path: string;
    count: number;
  };
  const items: Item[] = [];

  const dueAmt = upcomingDebts.reduce((s, d) => s + d.remainingAmount, 0);
  if (upcomingDebts.length > 0) {
    items.push({
      icon: Clock3,
      label: 'Jatuh tempo mendekat',
      detail: `${upcomingDebts.length} catatan · ${formatRp(dueAmt)}`,
      severity: debtOverdueCount > 0 ? 'red' : 'amber',
      path: '/dashboard/finance/hutang-piutang',
      count: upcomingDebts.length,
    });
  }

  if (receivableOverdueCount > 0) {
    items.push({
      icon: AlertCircle,
      label: 'Piutang perlu ditagih',
      detail: `${receivableOverdueCount} piutang belum lunas`,
      severity: 'amber',
      path: '/dashboard/finance/hutang-piutang',
      count: receivableOverdueCount,
    });
  }

  if (lowStockCount > 0) {
    items.push({
      icon: PackageX,
      label: 'Stok menipis',
      detail: `${lowStockCount} produk di bawah minimum`,
      severity: 'blue',
      path: '#',
      count: lowStockCount,
    });
  }

  if (items.length === 0) return null;

  const sevColors = {
    red: { bg: 'bg-rose-950/20', border: 'border-rose-500/30', text: 'text-rose-300', badge: 'bg-rose-500/20 text-rose-200', dot: 'bg-rose-400' },
    amber: { bg: 'bg-amber-950/20', border: 'border-amber-500/30', text: 'text-amber-300', badge: 'bg-amber-500/20 text-amber-200', dot: 'bg-amber-400' },
    blue: { bg: 'bg-blue-950/20', border: 'border-blue-500/30', text: 'text-blue-300', badge: 'bg-blue-500/20 text-blue-200', dot: 'bg-blue-400' },
  };

  const totalIssues = items.reduce((s, i) => s + i.count, 0);
  const hasUrgent = items.some(i => i.severity === 'red');

  return (
    <div
      className={`rounded-2xl border p-3 md:p-4 animate-fade-in-up stagger-5 min-w-0 max-w-full ${
        hasUrgent
          ? 'bg-gray-900/80 border-rose-500/30'
          : 'bg-gray-900/80 border-amber-500/30'
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center ${hasUrgent ? 'bg-rose-500/20' : 'bg-amber-500/20'}`}>
            <AlertCircle className={`w-3 h-3 md:w-3.5 md:h-3.5 ${hasUrgent ? 'text-rose-300' : 'text-amber-300'}`} />
          </div>
          <div>
            <h2 className="text-[11px] md:text-xs font-bold text-white">Perlu Perhatian</h2>
            <p className="text-xs text-gray-300">{totalIssues} hal perlu ditindaklanjuti</p>
          </div>
        </div>
        {hasUrgent && (
          <span className="text-[10px] font-bold bg-rose-500/20 text-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
            Urgent
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 min-w-0 w-full max-w-full">
        {items.map((item, i) => {
          const sc = sevColors[item.severity];
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (item.path === '#') return;
                onNavigate(item.path);
              }}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${sc.bg} ${sc.border} hover:shadow-md transition-all text-left group active:scale-[0.98] ${item.path === '#' ? 'cursor-default opacity-90' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg ${sc.badge} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-bold text-gray-100 truncate">{item.label}</p>
                  <span className={`text-xs font-bold ${sc.badge} px-1.5 py-0.5 rounded-full flex-shrink-0`}>{item.count}</span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5 truncate leading-tight">{item.detail}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-200 transition-colors flex-shrink-0 mt-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function DashboardChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 min-w-[160px]">
      <p className="text-[11px] font-bold text-gray-800 dark:text-gray-100 mb-1.5 border-b border-gray-100 dark:border-gray-700 pb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-xs text-gray-500 capitalize">{p.dataKey === 'revenue' ? 'Omzet' : 'Laba kotor'}</span>
          </div>
          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-100">Rp {(p.value / 1000).toFixed(0)}K</span>
        </div>
      ))}
      {payload.length >= 2 && payload[0].value > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-400">Margin</span>
          <span className="text-xs font-bold text-emerald-600">{Math.round((payload[1].value / payload[0].value) * 100)}%</span>
        </div>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const dashChartPeriods = [
  { id: '6m' as const, label: '6 Bulan' },
  { id: '12m' as const, label: '12 Bulan' },
  { id: 'ytd' as const, label: 'Tahun Ini' },
];

function DashboardChartSection({
  series,
  formatRp,
  usingSample,
}: {
  series: { name: string; revenue: number; profit: number }[];
  formatRp: (n: number) => string;
  usingSample: boolean;
}) {
  const [period, setPeriod] = useState<(typeof dashChartPeriods)[number]['id']>('6m');
  const fallback = period === '12m' ? DASH_CHART_12M : period === 'ytd' ? DASH_CHART_12M.slice(5) : DASH_CHART_6M;
  const activeData =
    series.length >= 2
      ? period === '12m'
        ? series.slice(-12)
        : period === 'ytd'
          ? series.slice(-12)
          : series.slice(-6)
      : fallback;

  const totalRev = activeData.reduce((s, d) => s + d.revenue, 0);
  const totalProfit = activeData.reduce((s, d) => s + d.profit, 0);
  const avgMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 100) : 0;

  return (
    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-700 p-4 md:p-5 card-hover animate-fade-in-up stagger-5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Omzet &amp; Laba Kotor</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Tren performa penjualan{usingSample ? ' · contoh (data belum cukup)' : ''}
          </p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700/80 rounded-lg p-0.5 flex-shrink-0">
          {dashChartPeriods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`text-xs font-semibold px-2 md:px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                period === p.id ? 'bg-white dark:bg-gray-800 text-brand-700 dark:text-brand-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 mt-2">
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-2 h-2 rounded-full bg-brand-500" />
          <span className="text-gray-400">Omzet</span>
          <span className="font-bold text-gray-700 dark:text-gray-200 tabular-nums">{formatRp(totalRev * 1000)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-gray-400">Laba kotor</span>
          <span className="font-bold text-gray-700 dark:text-gray-200 tabular-nums">{formatRp(totalProfit * 1000)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
          <span className="text-emerald-600 font-bold">{avgMargin}%</span>
          <span className="text-emerald-500 dark:text-emerald-400/80">margin</span>
        </div>
      </div>

      <div className="h-[220px] md:h-[260px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activeData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="gDashRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gDashProf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              dx={-5}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}rb`}
            />
            <Tooltip content={<DashboardChartTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#0d9488"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#gDashRev)"
              dot={false}
              activeDot={{ r: 5, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#818CF8"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#gDashProf)"
              dot={false}
              activeDot={{ r: 5, fill: '#818CF8', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DashboardTxnPipeline({
  counts,
  formatRpShort: fmt,
  onNavigate,
}: {
  counts: { label: string; status: string; color: string; bg: string; text: string; barColor: string; transactions: { total: number; id?: string; invoiceNumber: string }[] }[];
  formatRpShort: (n: number) => string;
  onNavigate: () => void;
}) {
  const total = counts.reduce((s, c) => s + c.transactions.length, 0) || 1;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-700 p-4 md:p-5 card-hover animate-fade-in-up stagger-7 min-w-0 max-w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Alur transaksi</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">Status transaksi di periode ini</p>
        </div>
        <button
          type="button"
          onClick={onNavigate}
          className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-0.5"
        >
          Riwayat <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex h-2 rounded-full overflow-hidden mb-3 bg-gray-100 dark:bg-gray-700">
        {counts
          .filter((s) => s.transactions.length > 0)
          .map((s) => (
            <div
              key={s.status}
              className={`${s.barColor} transition-all duration-500`}
              style={{ width: `${(s.transactions.length / total) * 100}%` }}
              title={`${s.label}: ${s.transactions.length}`}
            />
          ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 min-w-0 max-w-full">
        {counts.map((s) => {
          const sum = s.transactions.reduce((a, t) => a + t.total, 0);
          return (
            <button
              key={s.label}
              type="button"
              onClick={onNavigate}
              className={`${s.bg} dark:opacity-95 rounded-xl p-2.5 transition-all hover:shadow-md cursor-pointer active:scale-[0.98] text-left ${s.transactions.length === 0 ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                <span className={`text-xs font-bold ${s.text} uppercase tracking-wide`}>{s.label}</span>
              </div>
              <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight">{s.transactions.length}</p>
              {s.transactions.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {s.transactions.slice(0, 2).map((t) => (
                    <p key={t.id} className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight" title={t.invoiceNumber}>
                      • {t.invoiceNumber}
                    </p>
                  ))}
                  {s.transactions.length > 2 && <p className="text-[10px] text-gray-400">+{s.transactions.length - 2} lainnya</p>}
                  {sum > 0 && <p className={`text-[10px] font-semibold ${s.text} mt-0.5`}>{fmt(sum)}</p>}
                </div>
              )}
              {s.transactions.length === 0 && <p className="text-xs text-gray-400 mt-0.5">—</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CashierShiftMonitoringWidget({
  activeSessions,
  cashiers,
  todayRevenue,
  formatRp,
  onNavigateShifts,
}: {
  activeSessions: { id?: string; cashierId: string }[];
  cashiers: { id?: string; name: string }[];
  todayRevenue: number;
  formatRp: (n: number) => string;
  onNavigateShifts: () => void;
}) {
  const name = (id: string) => cashiers.find((c) => c.id === id)?.name ?? 'Kasir';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-700 p-4 md:p-5 card-hover animate-fade-in-up stagger-8 min-w-0 max-w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
            <UserCog className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">Kasir &amp; shift</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">Sesi aktif &amp; omzet hari ini</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onNavigateShifts}
          className="text-[11px] text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-0.5 flex-shrink-0"
        >
          Kelola <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/30 rounded-xl p-3 mb-4 border border-violet-100 dark:border-violet-900/50">
        <div className="flex items-center gap-2 mb-2">
          <CalendarCheck className="w-4 h-4 text-violet-600" />
          <span className="text-xs font-semibold text-violet-800 dark:text-violet-200">Sesi kasir</span>
          <span className="text-xs bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-full font-medium ml-auto">
            {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{activeSessions.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Aktif</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatRp(todayRevenue)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Omzet hari ini</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-hide">
        {activeSessions.length === 0 && <p className="text-[11px] text-gray-400 text-center py-4">Tidak ada kasir aktif</p>}
        {activeSessions.slice(0, 6).map((s) => (
          <div key={s.id ?? s.cashierId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
              {name(s.cashierId).charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{name(s.cashierId)}</p>
              <p className="text-xs text-emerald-600 font-medium">On shift</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD
// ============================================

type SidebarNavItem =
  | { id: string; label: string; icon: LucideIcon; href?: undefined }
  | { id: string; label: string; icon: LucideIcon; href: string };

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, currentCashier, currentBusiness, currentTenant, businesses, setBusiness, setBusinesses, logout } = useAuthStore();
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days'>('today');
  const [showBusinessSelector, setShowBusinessSelector] = useState(false);
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newBusinessAddress, setNewBusinessAddress] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifBubbles, setNotifBubbles] = useState<{ id: string; title: string; detail: string }[]>([]);
  const seenNotifRef = useRef<Set<string>>(new Set());
  const [monthlyChartSeries, setMonthlyChartSeries] = useState<{ name: string; revenue: number; profit: number }[]>([]);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialThemeMode());
  const currentThemeResolved = resolveTheme(themeMode);
  const [perfMode, setPerfMode] = useState(0);
  const [finMode, setFinMode] = useState(0);

  useEffect(() => {
    applyTheme(themeMode);
    persistThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themeMode]);

  const toggleTheme = () => setThemeMode((prev) => (resolveTheme(prev) === 'dark' ? 'light' : 'dark'));

  const { start, end, prevStart, prevEnd } = useMemo(() => {
    const now = new Date();
    const endD = new Date(now);
    endD.setHours(23, 59, 59, 999);
    let startD = new Date(now);
    switch (dateRange) {
      case 'today':
        startD.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startD.setDate(startD.getDate() - 7);
        startD.setHours(0, 0, 0, 0);
        break;
      case '30days':
        startD.setDate(startD.getDate() - 30);
        startD.setHours(0, 0, 0, 0);
        break;
    }
    const len = endD.getTime() - startD.getTime();
    const pEnd = new Date(startD.getTime() - 1);
    pEnd.setHours(23, 59, 59, 999);
    const pStart = new Date(pEnd.getTime() - len);
    pStart.setHours(0, 0, 0, 0);
    return { start: startD, end: endD, prevStart: pStart, prevEnd: pEnd };
  }, [dateRange]);

  // Live queries
  const transactions = useLiveQuery(
    () => currentBusiness
      ? db.transactions
          .where('businessId')
          .equals(currentBusiness.id!)
          .filter(tx => {
            const txDate = new Date(tx.createdAt);
            return txDate >= start && txDate <= end && tx.status === 'COMPLETED';
          })
          .toArray()
      : [],
    [currentBusiness, start, end]
  );

  const prevTransactions = useLiveQuery(
    () =>
      currentBusiness
        ? db.transactions
            .where('businessId')
            .equals(currentBusiness.id!)
            .filter((tx) => {
              const txDate = new Date(tx.createdAt);
              return txDate >= prevStart && txDate <= prevEnd && tx.status === 'COMPLETED';
            })
            .toArray()
        : [],
    [currentBusiness, prevStart, prevEnd]
  );

  const transactionsInRangeAll = useLiveQuery(
    () =>
      currentBusiness
        ? db.transactions
            .where('businessId')
            .equals(currentBusiness.id!)
            .filter((tx) => {
              const txDate = new Date(tx.createdAt);
              return txDate >= start && txDate <= end;
            })
            .toArray()
        : [],
    [currentBusiness, start, end]
  );

  const chartWindowStart = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const chartTransactions = useLiveQuery(
    () =>
      currentBusiness
        ? db.transactions
            .where('businessId')
            .equals(currentBusiness.id!)
            .filter((tx) => tx.status === 'COMPLETED' && new Date(tx.createdAt) >= chartWindowStart)
            .toArray()
        : [],
    [currentBusiness, chartWindowStart]
  );

  const productsAll = useLiveQuery(
    () => (currentBusiness ? db.products.where('businessId').equals(currentBusiness.id!).toArray() : []),
    [currentBusiness]
  );

  const cashiersAll = useLiveQuery(
    () =>
      currentBusiness
        ? db.cashiers.where('businessId').equals(currentBusiness.id!).filter((c) => c.isActive).toArray()
        : [],
    [currentBusiness]
  );

  const todayRange = useMemo(() => {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    const e = new Date();
    e.setHours(23, 59, 59, 999);
    return { s, e };
  }, []);

  const bizTodayMap = useLiveQuery(
    async () => {
      const out: Record<string, { revenue: number; profit: number }> = {};
      const biz = businesses ?? [];
      if (biz.length === 0) return out;
      for (const b of biz) {
        if (!b.id) continue;
        const txs = await db.transactions
          .where('businessId')
          .equals(b.id)
          .filter((tx) => {
            const d = new Date(tx.createdAt);
            return d >= todayRange.s && d <= todayRange.e && tx.status === 'COMPLETED';
          })
          .toArray();
        let revenue = 0;
        let hpp = 0;
        for (const tx of txs) {
          revenue += tx.total;
          const items = await db.transactionItems.where('transactionId').equals(tx.id!).toArray();
          for (const it of items) {
            const p = await db.products.get(it.productId);
            if (p) hpp += p.hpp * it.quantity;
          }
        }
        out[b.id] = { revenue, profit: revenue - hpp };
      }
      return out;
    },
    [businesses, todayRange.s.getTime(), todayRange.e.getTime()]
  );

  const activeSessions = useLiveQuery(
    () =>
      currentBusiness
        ? db.cashierSessions
            .where('businessId')
            .equals(currentBusiness.id!)
            .filter((s) => s.status === 'ACTIVE')
            .toArray()
        : [],
    [currentBusiness]
  );

  const receivablesOpen = useLiveQuery(
    () =>
      currentBusiness
        ? db.debtReceivables
            .where('businessId')
            .equals(currentBusiness.id!)
            .filter((d) => d.type === 'RECEIVABLE' && d.status !== 'PAID' && d.remainingAmount > 0)
            .toArray()
        : [],
    [currentBusiness]
  );

  const transactionsToday = useLiveQuery(
    () => {
      if (!currentBusiness) return [];
      const t0 = new Date();
      t0.setHours(0, 0, 0, 0);
      const t1 = new Date();
      t1.setHours(23, 59, 59, 999);
      return db.transactions
        .where('businessId')
        .equals(currentBusiness.id!)
        .filter((tx) => {
          const td = new Date(tx.createdAt);
          return td >= t0 && td <= t1 && tx.status === 'COMPLETED';
        })
        .toArray();
    },
    [currentBusiness]
  );

  const lowStockProducts = useLiveQuery(
    () => currentBusiness
      ? db.products
          .where('businessId')
          .equals(currentBusiness.id!)
          .filter(p => p.stockQuantity <= p.minStockAlert && p.isActive)
          .toArray()
      : [],
    [currentBusiness]
  );

  const upcomingDebts = useLiveQuery(
    () => {
      if (!currentBusiness) return [];
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return db.debtReceivables
        .where('businessId')
        .equals(currentBusiness.id!)
        .filter(d => d.status !== 'PAID' && d.dueDate !== undefined && new Date(d.dueDate) <= weekFromNow)
        .toArray();
    },
    [currentBusiness]
  );

  const recentActivities = useLiveQuery(
    () => currentBusiness
      ? db.activityLogs
          .where('businessId')
          .equals(currentBusiness.id!)
          .reverse()
          .limit(5)
          .toArray()
      : [],
    [currentBusiness]
  );

  const notifications = useMemo(() => {
    const newestTx = (transactions ?? []).reduce((acc, tx) => {
      if (!acc) return tx;
      return new Date(tx.createdAt) > new Date(acc.createdAt) ? tx : acc;
    }, undefined as (typeof transactions extends (infer U)[] ? U : never) | undefined);
    const orderNotifs = newestTx
      ? [
          {
            id: `order-${newestTx.id}`,
            title: 'Orderan baru masuk',
            detail: `${newestTx.invoiceNumber ?? 'INV'} · ${formatCurrency(newestTx.total)}`,
            tone: 'info' as const,
          },
        ]
      : [];
    const lowStockNotifs = (lowStockProducts ?? []).slice(0, 4).map((p) => ({
      id: `stock-${p.id}`,
      title: `Stok menipis: ${p.name}`,
      detail: `Sisa ${p.stockQuantity} ${p.unit}`,
      tone: 'warn' as const,
    }));
    const debtNotifs = (upcomingDebts ?? []).slice(0, 4).map((d) => ({
      id: `debt-${d.id}`,
      title: `${d.type === 'DEBT' ? 'Hutang' : 'Piutang'} jatuh tempo`,
      detail: `${d.partyName} · ${formatCurrency(d.remainingAmount)}`,
      tone: 'danger' as const,
    }));
    const activityNotifs = (recentActivities ?? []).slice(0, 3).map((a) => ({
      id: `act-${a.id}`,
      title: formatActivityAction(a.action),
      detail: a.description,
      tone: 'info' as const,
    }));
    return [...orderNotifs, ...lowStockNotifs, ...debtNotifs, ...activityNotifs];
  }, [transactions, lowStockProducts, upcomingDebts, recentActivities]);

  useEffect(() => {
    if (!isNotificationOpen) return;
    const incoming = notifications.filter((n) => !seenNotifRef.current.has(n.id)).slice(0, 3);
    if (!incoming.length) return;
    incoming.forEach((n) => seenNotifRef.current.add(n.id));
    setNotifBubbles(incoming.map((n) => ({ id: n.id, title: n.title, detail: n.detail })));
    const t = setTimeout(() => {
      setNotifBubbles([]);
      setIsNotificationOpen(false);
    }, 3500);
    return () => clearTimeout(t);
  }, [isNotificationOpen, notifications]);

  const todoItems = useLiveQuery(
    () => currentBusiness
      ? db.todoItems
          .where('businessId')
          .equals(currentBusiness.id!)
          .filter(t => !t.isCompleted)
          .toArray()
      : [],
    [currentBusiness]
  );

  // Calculate metrics
  const totalRevenue = transactions?.reduce((sum, tx) => sum + tx.total, 0) || 0;
  const totalTransactions = transactions?.length || 0;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  
  // Calculate gross profit (revenue - HPP)
  const [grossProfit, setGrossProfit] = useState(0);
  useEffect(() => {
    const calculateProfit = async () => {
      if (!transactions || transactions.length === 0) {
        setGrossProfit(0);
        return;
      }

      let totalHpp = 0;
      for (const tx of transactions) {
        const items = await db.transactionItems.where('transactionId').equals(tx.id!).toArray();
        for (const item of items) {
          const product = await db.products.get(item.productId);
          if (product) {
            totalHpp += product.hpp * item.quantity;
          }
        }
      }
      setGrossProfit(totalRevenue - totalHpp);
    };
    calculateProfit();
  }, [transactions, totalRevenue]);

  const grossMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0;

  useEffect(() => {
    if (!chartTransactions || chartTransactions.length === 0) {
      setMonthlyChartSeries([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const bucket: Record<string, { revenue: number; ids: string[] }> = {};
      for (const tx of chartTransactions) {
        const d = new Date(tx.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!bucket[key]) bucket[key] = { revenue: 0, ids: [] };
        bucket[key].revenue += tx.total;
        if (tx.id) bucket[key].ids.push(tx.id);
      }
      const keys = Object.keys(bucket).sort();
      const out: { name: string; revenue: number; profit: number }[] = [];
      for (const key of keys) {
        const { revenue, ids } = bucket[key];
        let hpp = 0;
        for (const tid of ids) {
          const items = await db.transactionItems.where('transactionId').equals(tid).toArray();
          for (const item of items) {
            const product = await db.products.get(item.productId);
            if (product) hpp += product.hpp * item.quantity;
          }
        }
        const [y, m] = key.split('-');
        const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('id-ID', { month: 'short' });
        out.push({
          name: label,
          revenue: Math.max(0, Math.round(revenue / 1000)),
          profit: Math.max(0, Math.round((revenue - hpp) / 1000)),
        });
      }
      if (!cancelled) setMonthlyChartSeries(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [chartTransactions]);

  const prevRevenue = prevTransactions?.reduce((s, t) => s + t.total, 0) ?? 0;
  const revDeltaPct = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
  const txPrevCount = prevTransactions?.length ?? 0;
  const txDeltaPct = txPrevCount > 0 ? ((totalTransactions - txPrevCount) / txPrevCount) * 100 : null;

  const activeProducts = productsAll?.filter((p) => p.isActive).length ?? 0;
  const totalProducts = productsAll?.length ?? 0;
  const lowStockCount = lowStockProducts?.length ?? 0;
  const totalReceivable = receivablesOpen?.reduce((s, d) => s + d.remainingAmount, 0) ?? 0;
  const receivableOverdueCount =
    receivablesOpen?.filter((d) => d.dueDate && new Date(d.dueDate) < new Date()).length ?? 0;
  const debtOverdueCount = upcomingDebts?.filter((d) => d.type === 'DEBT').length ?? 0;
  const pendingReceivableFollowups = receivablesOpen?.length ?? 0;
  const todayRevenueTotal = transactionsToday?.reduce((s, t) => s + t.total, 0) ?? 0;

  const pipelineData = useMemo(() => {
    const rows = transactionsInRangeAll ?? [];
    const stages = [
      {
        label: 'Pending',
        status: 'PENDING' as const,
        color: 'bg-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        text: 'text-amber-700 dark:text-amber-300',
        barColor: 'bg-amber-400',
      },
      {
        label: 'Selesai',
        status: 'COMPLETED' as const,
        color: 'bg-brand-500',
        bg: 'bg-teal-50 dark:bg-teal-950/30',
        text: 'text-brand-700 dark:text-brand-300',
        barColor: 'bg-brand-400',
      },
      {
        label: 'Batal',
        status: 'VOIDED' as const,
        color: 'bg-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-950/30',
        text: 'text-rose-700 dark:text-rose-300',
        barColor: 'bg-rose-400',
      },
    ];
    return stages.map((s) => ({
      ...s,
      transactions: rows
        .filter((t) => t.status === s.status)
        .map((t) => ({ total: t.total, id: t.id, invoiceNumber: t.invoiceNumber })),
    }));
  }, [transactionsInRangeAll]);

  const dashboardShortcuts: {
    icon: LucideIcon;
    label: string;
    desc: string;
    color: string;
    bg: string;
    onClick: () => void;
  }[] = [
    {
      icon: Plus,
      label: 'Produk',
      desc: 'Katalog',
      color: 'from-brand-600 to-brand-700',
      bg: 'bg-teal-50 dark:bg-teal-950/20',
      onClick: () => setActiveTab('products'),
    },
    {
      icon: FileText,
      label: 'Laba Rugi',
      desc: 'Laporan',
      color: 'from-brand-500 to-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      onClick: () => navigate('/dashboard/finance/laba-rugi'),
    },
    {
      icon: UserPlus,
      label: 'Piutang',
      desc: 'Tagihan',
      color: 'from-indigo-500 to-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/20',
      onClick: () => navigate('/dashboard/finance/hutang-piutang'),
    },
    {
      icon: Receipt,
      label: 'Pemasukan',
      desc: 'Cashflow',
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
      onClick: () => navigate('/dashboard/finance/cashflow'),
    },
    {
      icon: ClipboardList,
      label: 'Pengeluaran',
      desc: 'Cashflow',
      color: 'from-rose-500 to-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      onClick: () => navigate('/dashboard/finance/cashflow'),
    },
    {
      icon: PackageIcon,
      label: 'Stok',
      desc: 'Produk',
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      onClick: () => setActiveTab('products'),
    },
    {
      icon: BarChart3,
      label: 'History',
      desc: 'Log',
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      onClick: () => navigate('/dashboard/history'),
    },
    {
      icon: Settings,
      label: 'Pengaturan',
      desc: 'Bisnis',
      color: 'from-gray-500 to-gray-600',
      bg: 'bg-gray-100 dark:bg-gray-700/50',
      onClick: () => navigate('/dashboard/settings'),
    },
  ];

  type DashActivityCat = 'finance' | 'pos' | 'product' | 'inventory' | 'shift' | 'system';

  const dashCategoryMeta: Record<
    DashActivityCat,
    { label: string; icon: LucideIcon; color: string; bg: string; dot: string; path: string }
  > = {
    finance: {
      label: 'Keuangan',
      icon: Banknote,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      dot: 'bg-emerald-500',
      path: '/dashboard/finance/cashflow',
    },
    pos: {
      label: 'Kasir',
      icon: ShoppingCart,
      color: 'text-brand-600',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      dot: 'bg-brand-500',
      path: '/dashboard',
    },
    product: {
      label: 'Produk',
      icon: PackageIcon,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      dot: 'bg-indigo-500',
      path: '/dashboard',
    },
    inventory: {
      label: 'Bahan',
      icon: Boxes,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      dot: 'bg-amber-500',
      path: '/dashboard',
    },
    shift: {
      label: 'Shift',
      icon: CalendarDays,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      dot: 'bg-violet-500',
      path: '/dashboard/shifts',
    },
    system: {
      label: 'Sistem',
      icon: Settings,
      color: 'text-gray-500',
      bg: 'bg-gray-50 dark:bg-gray-700/40',
      dot: 'bg-gray-400',
      path: '/dashboard/settings',
    },
  };

  const mapActionToDashCat = (action: string): DashActivityCat => {
    if (action.includes('FINANCE') || action === 'FINANCE_ENTRY') return 'finance';
    if (action.includes('TRANSACTION') || action.includes('CLOCK')) return 'pos';
    if (action.includes('PRODUCT') || action.includes('STOCK')) return 'product';
    if (action.includes('MATERIAL')) return 'inventory';
    if (action.includes('SHIFT')) return 'shift';
    return 'system';
  };

  const activityFeed = useMemo(() => {
    return (recentActivities ?? []).map((a) => {
      const cat = mapActionToDashCat(a.action);
      const isSuccess = a.action === 'CREATE_TRANSACTION';
      const isWarn = a.action === 'VOID_TRANSACTION';
      return {
        id: a.id,
        title: formatActivityAction(a.action),
        desc: a.description,
        time: new Date(a.createdAt).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: (isSuccess ? 'success' : isWarn ? 'warning' : 'info') as 'success' | 'warning' | 'info' | 'neutral',
        category: cat,
      };
    });
  }, [recentActivities]);

  const quickActionStagger = (i: number) =>
    (
      ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5', 'stagger-6', 'stagger-7', 'stagger-8'] as const
    )[Math.min(i, 7)];

  const handleAddBusiness = async () => {
    if (!currentTenant?.id || !newBusinessName.trim()) return;
    const biz = {
      id: crypto.randomUUID(),
      tenantId: currentTenant.id,
      name: newBusinessName.trim(),
      address: newBusinessAddress.trim() || undefined,
      taxPercentage: 11,
      serviceChargePercentage: 0,
      isActive: true,
      createdAt: new Date(),
      taxEnabled: true,
      serviceChargeEnabled: false,
      receiptShowTax: true,
      notifyLowStock: true,
      notifyDebtDue: true,
      emailDailySummary: false,
      defaultProductTaxPercent: 11,
      skuAutoPrefix: 'PRD',
      defaultUnit: 'pcs',
      printerPaperMm: 58 as 58,
    };
    await db.businesses.add(biz);
    const updated = [...businesses, biz];
    setBusinesses(updated);
    setBusiness(biz);
    setShowAddBusiness(false);
    setShowBusinessSelector(false);
    setNewBusinessName('');
    setNewBusinessAddress('');
  };

  // Sidebar items
  const cashierCanViewReports = !!currentCashier?.canViewReports;
  const sidebarItems: SidebarNavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: ShoppingCart },
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'members', label: 'Member', icon: UserPlus },
    { id: 'materials', label: 'Bahan Baku', icon: Boxes },
    { id: 'store', label: 'Toko', icon: Store, href: currentBusiness?.id ? `/dashboard/store/${encodeURIComponent(currentBusiness.id)}` : '/dashboard' },
    { id: 'opname', label: 'Stock Opname', icon: ClipboardList, href: '/dashboard/stock-opname' },
    { id: 'tasks', label: 'Tugas', icon: ClipboardList, href: '/dashboard/tasks' },
    { id: 'finance', label: 'Keuangan', icon: Banknote, href: '/dashboard/finance' },
    { id: 'history', label: 'History', icon: History, href: '/dashboard/history' },
    { id: 'shifts', label: 'Shift', icon: CalendarDays, href: '/dashboard/shifts' },
    { id: 'reports', label: 'Laporan', icon: TrendingUp, href: '/dashboard/reports' },
    { id: 'settings', label: 'Pengaturan', icon: Settings, href: '/dashboard/settings' },
    { id: 'super-admin', label: 'Super Admin', icon: Shield, href: '/dashboard/super-admin' },
  ].filter((it) => {
    // Cashier mode: restrict sensitive menus.
    if (!currentCashier) return true;
    if (it.id === 'reports') return cashierCanViewReports;
    if (it.id === 'finance' || it.id === 'settings' || it.id === 'super-admin') return false;
    return true;
  });

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50/80 dark:bg-gray-900 w-full max-w-full min-w-0">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 
                       px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-gray-900 dark:text-white">{currentBusiness?.name}</h1>
        <div className="flex items-center gap-1">
          <SyncStatusChip />
          <button
            type="button"
            onClick={toggleTheme}
            title={`Tema: ${currentThemeResolved === 'dark' ? 'Dark' : 'Light'}`}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {currentThemeResolved === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => setIsNotificationOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
          >
            <Bell className="w-6 h-6" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </header>
      {notifBubbles.length > 0 && (
        <div className="fixed top-16 right-3 z-[70] space-y-2 w-[min(86vw,320px)]">
          {notifBubbles.map((n) => (
            <div key={n.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur shadow-lg px-3 py-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{n.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{n.detail}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex min-w-0 w-full max-w-full">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200",
          "dark:border-gray-700 transform transition-transform duration-200 lg:translate-x-0 lg:static",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Logo */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-800 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/25">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 dark:text-white tracking-tight">Omnifyi POS</h1>
                  <p className="text-[10px] text-brand-600 font-medium">Retail Dashboard</p>
                </div>
              </div>
            </div>

            {/* Business Selector */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowBusinessSelector(!showBusinessSelector)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 
                         dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                    <Store className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                      {currentBusiness?.name}
                    </p>
                    <p className="text-xs text-gray-500">{businesses.length} usaha</p>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-gray-400 transition-transform",
                  showBusinessSelector && "rotate-180"
                )} />
              </button>

              {showBusinessSelector && (
                <div className="mt-2 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 
                              dark:border-gray-700 shadow-lg">
                  {businesses.map(biz => (
                    <button
                      key={biz.id}
                      onClick={() => {
                        setBusiness(biz);
                        setShowBusinessSelector(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700",
                        currentBusiness?.id === biz.id && "bg-brand-50 dark:bg-brand-900/20"
                      )}
                    >
                      <Store className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{biz.name}</span>
                      {currentBusiness?.id === biz.id && (
                        <Check className="w-4 h-4 text-brand-600 ml-auto" />
                      )}
                    </button>
                  ))}
                  <div className="px-2 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                    <button
                      onClick={() => setShowAddBusiness(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-sm font-semibold hover:bg-brand-100 dark:hover:bg-brand-900/30"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Bisnis
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 min-h-0 p-4 space-y-1">
              {sidebarItems.map((item) => {
                const routeActive = item.href && location.pathname.startsWith(item.href);
                const isActiveTab = item.href ? routeActive : activeTab === item.id;
                const className = cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium',
                  isActiveTab
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                );
                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={className}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={className}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold">
                  {currentUser?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {currentUser?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 
                           dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 max-w-full min-h-screen lg:min-h-0 pb-36 lg:pb-0">
          {/* Products Page */}
          {activeTab === 'products' && (
            <ProductsPage />
          )}

          {activeTab === 'members' && (
            <MembersPage />
          )}

          {/* Materials Page */}
          {activeTab === 'materials' && currentBusiness && (
            <MaterialsPage 
              tenantId={currentBusiness.tenantId}
              businessId={currentBusiness.id!}
            />
          )}

          {/* Dashboard Overview — OMNIFYI-aligned shell, POS data */}
          {activeTab === 'overview' && (
            <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full min-w-0 max-w-full">
              {/* Mobile: compact, data-dense dashboard */}
              <div className="lg:hidden space-y-4">
                <div className="h-10 flex items-center px-0.5">
                  <p className="text-[13px] text-[#8B949E] truncate">
                    Hai, {currentUser?.name?.split(' ')[0] ?? 'Owner'} ·{' '}
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })} ·{' '}
                    {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {(() => {
                  const pendingCount = pipelineData.find((s) => s.status === 'PENDING')?.transactions.length ?? 0;
                  const voidedCount = pipelineData.find((s) => s.status === 'VOIDED')?.transactions.length ?? 0;
                  const soldHint = totalTransactions > 0 ? 'Aktif' : '—';

                  const cards = [
                    {
                      id: 'perf',
                      node: (
                        <MobileSmartCard
                          icon={<Wallet className="w-5 h-5 text-emerald-400" />}
                          title="PERFORMA"
                          accent={{ fg: 'text-emerald-400', ring: 'bg-emerald-500/20', bg: 'bg-emerald-400' }}
                          modes={[
                            {
                              id: 'revprofit',
                              label: 'Omzet & Profit',
                              hero: {
                                value: formatRpShort(totalRevenue),
                                label: dateRange === 'today' ? 'Omzet Hari Ini' : dateRange === '7days' ? 'Omzet 7 Hari' : 'Omzet 30 Hari',
                                trend:
                                  revDeltaPct !== null
                                    ? { text: `${revDeltaPct >= 0 ? '↑' : '↓'}${Math.abs(revDeltaPct).toFixed(1)}%`, positive: revDeltaPct >= 0 }
                                    : undefined,
                              },
                              metrics: [
                                { label: 'Profit', value: formatRpShort(grossProfit), trend: `${grossMarginPercent}%`, tone: 'pos', onClick: () => navigate('/dashboard/finance/laba-rugi') },
                                { label: 'Produk', value: `${activeProducts}/${totalProducts}`, trend: soldHint, tone: 'muted', onClick: () => setActiveTab('products') },
                                {
                                  label: 'Trx',
                                  value: String(totalTransactions),
                                  trend: txDeltaPct !== null ? `${txDeltaPct >= 0 ? '↑' : '↓'}${Math.abs(txDeltaPct).toFixed(1)}%` : '—',
                                  tone: txDeltaPct !== null ? (txDeltaPct >= 0 ? 'pos' : 'neg') : 'muted',
                                  onClick: () => setActiveTab('transactions'),
                                },
                              ],
                            },
                            {
                              id: 'productstock',
                              label: 'Produk & Stok',
                              hero: { value: `${activeProducts}`, label: 'Produk Aktif' },
                              metrics: [
                                { label: 'Katalog', value: `${activeProducts}/${totalProducts}`, tone: 'muted', onClick: () => setActiveTab('products') },
                                { label: 'Stok kritis', value: String(lowStockCount), tone: lowStockCount > 0 ? 'warn' : 'pos', onClick: () => setActiveTab('products') },
                                { label: 'Piutang', value: formatRpShort(totalReceivable), tone: receivableOverdueCount > 0 ? 'warn' : 'muted', onClick: () => navigate('/dashboard/finance/hutang-piutang') },
                              ],
                            },
                            {
                              id: 'txdetail',
                              label: 'Transaksi Detail',
                              hero: { value: String(totalTransactions), label: 'Transaksi Selesai' },
                              metrics: [
                                { label: 'Pending', value: String(pendingCount), tone: pendingCount > 0 ? 'warn' : 'pos', onClick: () => setActiveTab('transactions') },
                                { label: 'Batal', value: String(voidedCount), tone: voidedCount > 0 ? 'neg' : 'pos', onClick: () => setActiveTab('transactions') },
                                { label: 'Rata²', value: formatRpShort(avgTransaction), tone: 'muted', onClick: () => setActiveTab('transactions') },
                              ],
                            },
                            {
                              id: 'compare',
                              label: 'Perbandingan',
                              hero: { value: revDeltaPct !== null ? `${revDeltaPct >= 0 ? '↑' : '↓'}${Math.abs(revDeltaPct).toFixed(1)}%` : '—', label: 'vs periode sebelumnya' },
                              metrics: [
                                { label: 'Omzet ini', value: formatRpShort(totalRevenue), tone: 'muted' },
                                { label: 'Omzet lalu', value: formatRpShort(prevRevenue), tone: 'muted' },
                                { label: 'Selisih', value: formatRpShort(totalRevenue - prevRevenue), tone: totalRevenue - prevRevenue >= 0 ? 'pos' : 'neg' },
                              ],
                            },
                          ]}
                          modeIndex={perfMode}
                          setModeIndex={setPerfMode}
                          periodLabel={dateRange === 'today' ? 'Hari Ini' : dateRange === '7days' ? '7 Hari' : '30 Hari'}
                          onPickPeriod={() => setDateRange((v) => (v === 'today' ? '7days' : v === '7days' ? '30days' : 'today'))}
                        />
                      ),
                    },
                    {
                      id: 'fin',
                      node: (
                        <MobileSmartCard
                          icon={<Banknote className="w-5 h-5 text-blue-300" />}
                          title="KEUANGAN"
                          accent={{ fg: 'text-blue-300', ring: 'bg-blue-500/20', bg: 'bg-blue-300' }}
                          modes={[
                            {
                              id: 'cashflow',
                              label: 'Ringkasan',
                              hero: { value: formatRpShort(grossProfit), label: 'Laba kotor (range)' },
                              metrics: [
                                { label: 'Omzet', value: formatRpShort(totalRevenue), tone: 'muted', onClick: () => navigate('/dashboard/finance') },
                                { label: 'Margin', value: `${grossMarginPercent}%`, tone: grossMarginPercent >= 50 ? 'pos' : grossMarginPercent >= 20 ? 'warn' : 'neg', onClick: () => navigate('/dashboard/finance/laba-rugi') },
                                { label: 'Hari ini', value: formatRpShort(todayRevenueTotal), tone: 'muted', onClick: () => setActiveTab('transactions') },
                              ],
                            },
                            {
                              id: 'debts',
                              label: 'Piutang & Hutang',
                              hero: { value: formatRpShort(totalReceivable), label: 'Piutang Berjalan' },
                              metrics: [
                                { label: 'Piutang', value: formatRpShort(totalReceivable), tone: 'muted', onClick: () => navigate('/dashboard/finance/hutang-piutang') },
                                { label: 'Overdue', value: String(receivableOverdueCount), tone: receivableOverdueCount > 0 ? 'neg' : 'pos', onClick: () => navigate('/dashboard/finance/hutang-piutang') },
                                { label: 'Jatuh tempo', value: String((upcomingDebts ?? []).length), tone: (upcomingDebts ?? []).length > 0 ? 'warn' : 'muted', onClick: () => navigate('/dashboard/finance/hutang-piutang') },
                              ],
                            },
                            {
                              id: 'pl',
                              label: 'Laba Rugi',
                              hero: { value: formatRpShort(grossProfit), label: 'Laba kotor (range)' },
                              metrics: [
                                { label: 'Omzet', value: formatRpShort(totalRevenue), tone: 'muted', onClick: () => navigate('/dashboard/finance/laba-rugi') },
                                { label: 'Piutang', value: formatRpShort(totalReceivable), tone: 'muted', onClick: () => navigate('/dashboard/finance/hutang-piutang') },
                                { label: 'Stok kritis', value: String(lowStockCount), tone: lowStockCount > 0 ? 'warn' : 'pos', onClick: () => setActiveTab('products') },
                              ],
                            },
                            {
                              id: 'assets',
                              label: 'Aset (proxy)',
                              hero: { value: formatRpShort(totalRevenue + totalReceivable), label: 'Omzet + Piutang' },
                              metrics: [
                                { label: 'Omzet', value: formatRpShort(totalRevenue), tone: 'muted' },
                                { label: 'Piutang', value: formatRpShort(totalReceivable), tone: 'muted' },
                                { label: 'Trend', value: revDeltaPct !== null ? `${revDeltaPct >= 0 ? '+' : ''}${revDeltaPct.toFixed(1)}%` : '—', tone: revDeltaPct !== null ? (revDeltaPct >= 0 ? 'pos' : 'neg') : 'muted' },
                              ],
                            },
                          ]}
                          modeIndex={finMode}
                          setModeIndex={setFinMode}
                          periodLabel={dateRange === 'today' ? 'Hari Ini' : dateRange === '7days' ? '7 Hari' : '30 Hari'}
                          onPickPeriod={() => setDateRange((v) => (v === 'today' ? '7days' : v === '7days' ? '30days' : 'today'))}
                        />
                      ),
                    },
                  ] as const;

                  return (
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
                      {cards.map((c) => (
                        <div key={c.id} className="snap-center w-[calc(100vw-2rem)] flex-shrink-0">
                          {c.node}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="mt-2 grid grid-cols-6 gap-2">
                  {[
                    { id: 'pos', label: 'POS', icon: ShoppingCart, tone: 'text-emerald-400', onClick: () => setActiveTab('transactions') },
                    { id: 'pl', label: 'L/R', icon: BarChart3, tone: 'text-blue-300', onClick: () => navigate('/dashboard/finance/laba-rugi') },
                    { id: 'stock', label: 'Stok', icon: Package, tone: 'text-purple-300', onClick: () => setActiveTab('products') },
                    { id: 'cash', label: 'Kas', icon: Wallet, tone: 'text-emerald-300', onClick: () => navigate('/dashboard/finance/cashflow') },
                    { id: 'todo', label: 'ToDo', icon: ClipboardList, tone: 'text-amber-300', onClick: () => navigate('/dashboard/settings') },
                    { id: 'more', label: 'More', icon: Menu, tone: 'text-[#8B949E]', onClick: () => setIsMobileMenuOpen(true) },
                  ].map((s) => (
                    <button key={s.id} type="button" onClick={s.onClick} className="flex flex-col items-center gap-1 active:scale-95">
                      <div className="w-11 h-11 rounded-xl bg-[#161B22] border border-[#30363D] grid place-items-center">
                        <s.icon className={cn('w-5 h-5', s.tone)} />
                      </div>
                      <span className="text-[10px] font-medium text-[#8B949E]">{s.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between px-0.5">
                    <p className="text-base font-semibold text-[#F0F6FC]">Gerai Kamu</p>
                    <button type="button" onClick={() => setShowAddBusiness(true)} className="text-sm font-semibold text-emerald-400">
                      + Tambah Gerai
                    </button>
                  </div>
                  <div className="mt-3 flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
                    {businesses.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBusiness(b);
                          navigate(`/dashboard/store/${encodeURIComponent(b.id!)}`);
                        }}
                        className={cn(
                          'snap-start w-[170px] h-[130px] flex-shrink-0 rounded-2xl bg-[#161B22] p-3 text-left overflow-hidden',
                          b.isActive !== false
                            ? 'shadow-[0_8px_22px_rgba(16,185,129,0.20)]'
                            : 'shadow-[0_8px_22px_rgba(239,68,68,0.20)]',
                          currentBusiness?.id === b.id && 'ring-2 ring-white/15'
                        )}
                      >
                        <p className="text-sm font-semibold text-[#F0F6FC] truncate">{b.name}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', b.isActive !== false ? 'bg-emerald-400' : 'bg-red-400')} />
                          <span className={cn('text-[11px] font-semibold truncate', b.isActive !== false ? 'text-emerald-300' : 'text-red-300')}>
                            {b.isActive !== false ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/10">
                          {(() => {
                            const m = b.id ? bizTodayMap?.[b.id] : undefined;
                            const rev = m?.revenue ?? 0;
                            const prof = m?.profit ?? 0;
                            return (
                              <>
                                <p className="text-[10px] text-[#8B949E]">Omzet/Profit</p>
                                <p className="text-[12px] font-bold text-[#F0F6FC] tabular-nums truncate">
                                  {formatCurrency(rev)}/{formatCurrency(prof)}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowAddBusiness(true)}
                      className="snap-start w-[160px] h-[180px] flex-shrink-0 rounded-2xl border border-dashed border-[#30363D] p-4 grid place-items-center text-[#8B949E]"
                    >
                      <div className="w-10 h-10 rounded-xl border border-[#30363D] grid place-items-center">
                        <Plus className="w-5 h-5" />
                      </div>
                      <p className="mt-2 text-sm font-semibold">Tambah Gerai</p>
                    </button>
                  </div>
                </div>

                <DashboardAttentionWidget
                  lowStockCount={lowStockCount}
                  upcomingDebts={upcomingDebts ?? []}
                  receivableOverdueCount={receivableOverdueCount}
                  debtOverdueCount={debtOverdueCount}
                  formatRp={formatCurrency}
                  onNavigate={(path) => navigate(path)}
                />

                <div className="space-y-4">
                  <DashboardChartSection series={monthlyChartSeries} formatRp={formatRpShort} usingSample={monthlyChartSeries.length < 2} />
                </div>
              </div>

              {/* Desktop: keep existing layout */}
              <div className="hidden lg:block space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in-up">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-xl font-bold text-gray-900 dark:text-white truncate">
                      {(() => {
                        const h = new Date().getHours();
                        return h < 12 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam';
                      })()}
                      , {currentUser?.name?.split(' ')[0] ?? 'Owner'}
                    </h1>
                    <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full hidden sm:inline-block border border-brand-100">
                      Owner
                    </span>
                  </div>
                  <p className="text-sm md:text-[13px] text-gray-500 dark:text-gray-300 mt-0.5 leading-relaxed">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      {new Date().toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    {totalTransactions > 0 && (
                      <span className="hidden sm:inline">
                        {' '}
                        · {totalTransactions} transaksi selesai
                        {lowStockCount > 0 ? `, ${lowStockCount} stok perlu perhatian` : ''}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm rounded-xl px-2.5 py-2 shadow-sm focus:ring-2 focus:ring-brand-500/30 outline-none cursor-pointer font-medium text-gray-600 dark:text-gray-300 w-fit max-w-[100vw]"
                  >
                    <option value="today">Hari ini</option>
                    <option value="7days">7 hari terakhir</option>
                    <option value="30days">30 hari terakhir</option>
                  </select>
                  <span className="hidden lg:inline-flex">
                    <SyncStatusChip />
                  </span>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    title={`Tema: ${currentThemeResolved === 'dark' ? 'Dark' : 'Light'}`}
                    className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm rounded-xl px-3 py-2 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                  >
                    {currentThemeResolved === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <span className="hidden sm:inline">{currentThemeResolved === 'dark' ? 'Dark' : 'Light'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-0 max-w-full">
                <OmnifyiStatCard
                  title="Omzet (periode)"
                  value={formatCurrency(totalRevenue)}
                  trend={
                    revDeltaPct !== null
                      ? `${revDeltaPct >= 0 ? '+' : ''}${revDeltaPct.toFixed(1)}% vs periode sebelumnya`
                      : '— belum ada pembanding'
                  }
                  up={totalRevenue >= prevRevenue}
                  icon={<Wallet className="w-4 h-4" />}
                  color="brand"
                  d={1}
                  period={
                    dateRange === 'today'
                      ? 'Hari ini'
                      : dateRange === '7days'
                        ? '7 hari terakhir'
                        : '30 hari terakhir'
                  }
                  helper="total masuk"
                  subInfo={`Margin kotor ${grossMarginPercent}% · Laba kotor ${formatCurrency(grossProfit)}`}
                />
                <OmnifyiStatCard
                  title="Transaksi selesai"
                  value={String(totalTransactions)}
                  trend={
                    txDeltaPct !== null
                      ? `${txDeltaPct >= 0 ? '+' : ''}${txDeltaPct.toFixed(1)}% vs periode sebelumnya`
                      : '—'
                  }
                  up={(txDeltaPct ?? 0) >= 0}
                  icon={<Briefcase className="w-4 h-4" />}
                  color="blue"
                  d={2}
                  period="Dalam rentang filter"
                  helper="transaksi"
                  subInfo={`Rata-rata keranjang ${formatCurrency(avgTransaction)}`}
                />
                <OmnifyiStatCard
                  title="Produk aktif"
                  value={`${activeProducts} / ${totalProducts}`}
                  trend={lowStockCount > 0 ? `${lowStockCount} stok kritis` : 'Stok OK'}
                  up={lowStockCount === 0}
                  icon={<Users className="w-4 h-4" />}
                  color={lowStockCount > 0 ? 'amber' : 'indigo'}
                  d={3}
                  period="Katalog"
                  helper="aktif / total"
                  subInfo={lowStockCount > 0 ? `${lowStockCount} SKU di bawah minimum` : 'Semua di atas minimum'}
                />
                <OmnifyiStatCard
                  title="Piutang berjalan"
                  value={formatCurrency(totalReceivable)}
                  trend={
                    receivableOverdueCount > 0 ? `${receivableOverdueCount} lewat jatuh tempo` : 'Tidak overdue'
                  }
                  up={receivableOverdueCount === 0}
                  icon={<AlertCircle className="w-4 h-4" />}
                  color="rose"
                  d={4}
                  period="Belum tertagih"
                  helper="sisa tagihan"
                  subInfo={
                    pendingReceivableFollowups > 0
                      ? `${pendingReceivableFollowups} piutang terbuka · butuh tindakan`
                      : 'Tidak ada piutang terbuka'
                  }
                />
              </div>

              <div className="animate-fade-in-up stagger-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs md:text-[11px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi Cepat</h2>
                  <span className="text-xs text-gray-400 hidden md:block">Klik untuk aksi langsung</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2 w-full min-w-0 max-w-full">
                  {dashboardShortcuts.map((item, i) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-2.5 md:p-3 rounded-2xl hover:shadow-md transition-all duration-300 active:scale-95 group animate-fade-in-up min-w-0 w-full max-w-full',
                        item.bg,
                        quickActionStagger(i)
                      )}
                    >
                      <div
                        className={`w-10 h-10 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all group-hover:-translate-y-0.5`}
                      >
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs md:text-[11px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight line-clamp-2 break-words px-0.5 w-full">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-gray-400 text-center leading-tight hidden xl:block line-clamp-2 px-0.5">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <DashboardAttentionWidget
                lowStockCount={lowStockCount}
                upcomingDebts={upcomingDebts ?? []}
                receivableOverdueCount={receivableOverdueCount}
                debtOverdueCount={debtOverdueCount}
                formatRp={formatCurrency}
                onNavigate={(path) => navigate(path)}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0 max-w-full">
                <DashboardChartSection
                  series={monthlyChartSeries}
                  formatRp={formatRpShort}
                  usingSample={monthlyChartSeries.length < 2}
                />

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-700 p-4 md:p-5 card-hover animate-fade-in-up stagger-6 flex flex-col min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white">Aktivitas Terkini</h2>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Update operasional toko</p>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/60 rounded-lg px-2 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-gray-400">LIVE</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-2.5 overflow-x-auto scrollbar-hide">
                    {(() => {
                      const counts: Record<string, number> = {};
                      activityFeed.forEach((a) => {
                        counts[a.category] = (counts[a.category] || 0) + 1;
                      });
                      return Object.entries(counts).map(([key, count]) => {
                        const cat = dashCategoryMeta[key as DashActivityCat] ?? dashCategoryMeta.system;
                        return (
                          <span
                            key={key}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md ${cat.bg} flex-shrink-0`}
                          >
                            <div className={`w-1 h-1 rounded-full ${cat.dot}`} />
                            <span className={`text-[10px] font-bold ${cat.color}`}>{count}</span>
                            <span className="text-[10px] text-gray-400">{cat.label}</span>
                          </span>
                        );
                      });
                    })()}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    {activityFeed.map((act, i) => {
                      const cat = dashCategoryMeta[act.category] ?? dashCategoryMeta.system;
                      const CatIcon = cat.icon;
                      const statusDot =
                        act.type === 'success'
                          ? 'bg-emerald-400'
                          : act.type === 'warning'
                            ? 'bg-amber-400'
                            : 'bg-gray-300';
                      return (
                        <div
                          key={act.id ?? `activity-${i}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(cat.path)}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(cat.path)}
                          className="flex items-start gap-2 p-1.5 md:p-2 -mx-1 rounded-xl cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-all group active:scale-[0.99]"
                        >
                          <div className="relative flex flex-col items-center pt-0.5 flex-shrink-0">
                            <div
                              className={`w-7 h-7 rounded-lg ${cat.bg} flex items-center justify-center transition-transform group-hover:scale-110 relative`}
                            >
                              <CatIcon className={`w-3.5 h-3.5 ${cat.color}`} />
                              <div
                                className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${statusDot} border border-white dark:border-gray-800`}
                              />
                            </div>
                            {i < activityFeed.length - 1 && <div className="w-px flex-1 bg-gray-100 dark:bg-gray-700 mt-1 min-h-[8px]" />}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{act.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight">{act.desc}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{act.time}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-200 group-hover:text-brand-400 transition-colors flex-shrink-0 mt-1" />
                        </div>
                      );
                    })}
                  </div>
                  {activityFeed.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">Belum ada aktivitas</p>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/history')}
                    className="w-full mt-2.5 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
                  >
                    Lihat semua aktivitas <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <DashboardTxnPipeline
                counts={pipelineData}
                formatRpShort={formatRpShort}
                onNavigate={() => setActiveTab('transactions')}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0 max-w-full">
                <CashierShiftMonitoringWidget
                  activeSessions={activeSessions ?? []}
                  cashiers={cashiersAll ?? []}
                  todayRevenue={todayRevenueTotal}
                  formatRp={formatCurrency}
                  onNavigateShifts={() => navigate('/dashboard/shifts')}
                />
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-700 p-4 md:p-5 card-hover">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white">To-Do</h2>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Tugas operasional</p>
                    </div>
                    <button
                      type="button"
                      className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600"
                      aria-label="Tambah tugas"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {todoItems?.map((todo) => (
                      <TodoItem key={todo.id} todo={todo} />
                    ))}
                    {(!todoItems || todoItems.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-4">Tidak ada tugas</p>
                    )}
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <TransactionsPage />
          )}

        </main>
      </div>
      {showAddBusiness && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tambah Bisnis Baru</h3>
            <p className="text-xs text-gray-500 mt-1">Buat cabang/usaha baru langsung dari selector bisnis.</p>
            <div className="mt-4 space-y-2">
              <input
                value={newBusinessName}
                onChange={(e) => setNewBusinessName(e.target.value)}
                placeholder="Nama bisnis"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <input
                value={newBusinessAddress}
                onChange={(e) => setNewBusinessAddress(e.target.value)}
                placeholder="Alamat (opsional)"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowAddBusiness(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
              >
                Batal
              </button>
              <button
                onClick={() => void handleAddBusiness()}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-5 gap-1">
          {[
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'transactions', label: 'Transaksi', icon: ShoppingCart },
            { id: 'products', label: 'Produk', icon: Package },
            { id: 'materials', label: 'Bahan', icon: Boxes },
            { id: 'settings', label: 'Pengaturan', icon: Settings },
          ].map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'settings') {
                    navigate('/dashboard/settings');
                    return;
                  }
                  setActiveTab(item.id);
                }}
                className={cn(
                  'rounded-xl py-2 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                  active
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

// Todo Item Component
const TodoItem = ({ todo }: { todo: any }) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    await db.todoItems.update(todo.id, { isCompleted: true });
  };

  const priorityColors = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-green-100 text-green-700'
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 group">
      <button
        onClick={handleComplete}
        disabled={isCompleting}
        className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center
                 hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
      >
        {isCompleting && <Check className="w-3 h-3 text-emerald-500" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{todo.title}</p>
        {todo.dueDate && (
          <p className="text-xs text-gray-500">
            {new Date(todo.dueDate).toLocaleDateString('id-ID')}
          </p>
        )}
      </div>
      <span className={cn(
        "px-2 py-0.5 text-xs font-medium rounded-full",
        priorityColors[todo.priority as keyof typeof priorityColors]
      )}>
        {todo.priority}
      </span>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

type AppScreen = 'dashboard' | 'pos-login' | 'pos' | 'cashier-dashboard';

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [screen, setScreen] = useState<AppScreen>('dashboard');
  const { currentUser, currentTenant, currentCashier, currentBusiness, businesses, logoutCashier, setBusiness, setAuth, logout } = useAuthStore();
  const location = useLocation();
  const processSyncQueue = useSyncStore((s) => s.processSyncQueue);

  // When switching cashier, never close the store-day. Just clear cashier session state.
  const handleLogoutCashier = () => {
    logoutCashier();
    setScreen(currentBusiness?.id ? 'pos-login' : 'dashboard');
  };

  useEffect(() => {
    const init = async () => {
      await seedInitialData();
      installSyncHooks();
      // Restore Supabase session -> ensure tenant/business exists -> ensure local core rows exist.
      try {
        if (!supabase) throw new Error('supabase_disabled');
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user;
        if (u?.id && u.email) {
          const { tenantId, businessId } = await provisionTenantAndBusiness({ businessName: 'Usaha Baru' });
          await ensureLocalCoreRows({
            userId: u.id,
            email: u.email,
            tenantId,
            businessId,
            businessName: 'Usaha Baru',
          });
          await pullAllChangesForTenant(tenantId);
        }
      } catch {
        // Ignore: app can still run in demo/local mode.
      }
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      const businessId = params.get('business');
      if (mode === 'cashier' && businessId) {
        const biz = await db.businesses.get(businessId);
        if (biz) {
          setBusiness(biz);
          setScreen('pos-login');
        }
      }
      setIsInitialized(true);
    };
    init();
  }, [setBusiness]);

  useEffect(() => {
    const t = setInterval(() => {
      void processSyncQueue();
    }, 10_000);
    return () => clearInterval(t);
  }, [processSyncQueue]);

  // Guard against partial persisted auth state (user exists but business/tenant missing),
  // which can crash dashboard pages that assume currentBusiness is set.
  useEffect(() => {
    const fixAuth = async () => {
      if (!currentUser?.id) return;
      if (currentBusiness?.id && currentTenant?.id && businesses.length > 0) return;
      try {
        const tenant = currentTenant?.id
          ? await db.tenants.get(currentTenant.id)
          : await db.tenants.where('ownerId').equals(currentUser.id).first();
        if (!tenant?.id) return;
        const bizList = await db.businesses.where('tenantId').equals(tenant.id).toArray();
        const activeBiz = bizList[0];
        if (!activeBiz?.id) return;
        setAuth(currentUser, tenant, activeBiz, bizList);
      } catch {
        // If local DB is inconsistent, log out to avoid blank screen loop.
        logout();
      }
    };
    void fixAuth();
  }, [currentUser?.id, currentBusiness?.id, currentTenant?.id, businesses.length, setAuth, logout, currentTenant, currentUser, currentBusiness, businesses]);

  // When cashier logs in, go to POS
  useEffect(() => {
    if (currentCashier) {
      setScreen('pos');
    }
  }, [currentCashier]);

  const handleGoToPOS = () => {
    if (currentCashier) {
      setScreen('pos');
    } else {
      setScreen('pos-login');
    }
  };

  const FinanceWithPosButton = () => (
    <div className="relative">
      <FinanceRouteLayout />
      <button
        type="button"
        onClick={handleGoToPOS}
        className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] lg:bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 md:right-6 z-50 flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 
                 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold
                 rounded-2xl shadow-lg shadow-brand-500/25 hover:shadow-xl 
                 hover:from-brand-700 hover:to-brand-600 transition-all
                 active:scale-95"
      >
        <ShoppingCart className="w-5 h-5" />
        Buka Kasir
      </button>
    </div>
  );

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 
                        rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  // Show screens based on state
  if (screen === 'pos-login' && currentBusiness) {
    return (
      <AppErrorBoundary>
        <CashierLoginScreen
          onBackToDashboard={() => setScreen('dashboard')}
          onGoToCashierDashboard={() => setScreen('cashier-dashboard')}
        />
      </AppErrorBoundary>
    );
  }

  // Cashier logged in - show POS
  if (screen === 'pos' && currentCashier) {
    return (
      <AppErrorBoundary>
        <POSScreen
          onLogout={handleLogoutCashier}
          onGoToCashierDashboard={() => setScreen('cashier-dashboard')}
        />
      </AppErrorBoundary>
    );
  }

  if (screen === 'cashier-dashboard' && currentCashier) {
    return (
      <AppErrorBoundary>
        <CashierDashboardScreen
          onGoToPOS={() => setScreen('pos')}
          onSwitchCashier={handleLogoutCashier}
        />
      </AppErrorBoundary>
    );
  }

  // Not logged in
  if (!currentUser) {
    if (location.pathname === '/admin') {
      return (
        <AppErrorBoundary>
          <LandingAdminPage />
        </AppErrorBoundary>
      );
    }
    return (
      <AppErrorBoundary>
        <LoginLandingPage />
      </AppErrorBoundary>
    );
  }

  if (location.pathname === '/admin') {
    return (
      <AppErrorBoundary>
        <LandingAdminPage />
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <>
        <PwaInstallBanner />
        <Routes>
          <Route path="/dashboard/finance" element={<FinanceWithPosButton />}>
            <Route index element={<Navigate to="cashflow" replace />} />
            <Route path="cashflow" element={<FinanceCashflowTab />} />
            <Route path="hutang-piutang" element={<FinanceDebtTab />} />
            <Route path="laba-rugi" element={<FinancePLTab />} />
            <Route path="laba-ditahan" element={<FinanceRetainedTab />} />
            <Route path="akun" element={<FinanceAccountsTab />} />
            <Route path="*" element={<Navigate to="cashflow" replace />} />
          </Route>
          <Route
            path="/dashboard/store/:storeId"
            element={<DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<StorePage />} />}
          />
          <Route
            path="/dashboard/store/:storeId/shifts"
            element={<DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<StoreShiftsPage />} />}
          />
          <Route
            path="/dashboard/store/:storeId/roles"
            element={<DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<StoreRolesPage />} />}
          />
          <Route
            path="/dashboard/store/:storeId/staff"
            element={<DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<StoreStaffPage />} />}
          />
          <Route
            path="/dashboard/store/:storeId/attendance"
            element={<DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<StoreAttendancePage />} />}
          />
          <Route
            path="/dashboard/store/:storeId/payroll"
            element={<DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<StorePayrollPage />} />}
          />
          <Route
            path="/dashboard/store/:storeId/settings"
            element={<DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<StoreBusinessSettingsPage />} />}
          />
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />
          <Route
            path="/dashboard/history"
            element={<DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<HistoryPage />} />}
          />
          <Route
            path="/dashboard/shifts"
            element={<DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<ShiftsPage />} />}
          />
          <Route
            path="/dashboard/stock-opname"
            element={<DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<StockOpnamePage />} />}
          />
          <Route
            path="/dashboard/tasks"
            element={<DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<TasksKanbanPage />} />}
          />
          <Route
            path="/dashboard/settings"
            element={<DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<SettingsPage />} />}
          />
          <Route
            path="/dashboard/reports"
            element={
              currentCashier && !currentCashier.canViewReports ? (
                <DashboardWithPOS
                  onGoToPOS={handleGoToPOS}
                  screenChild={
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 text-center">
                      <p className="text-sm text-gray-500">Akses laporan tidak diizinkan untuk kasir ini.</p>
                    </div>
                  }
                />
              ) : (
                <DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<ReportsPage />} />
              )
            }
          />
          <Route
            path="/dashboard/super-admin"
            element={<DashboardWithPOS onGoToPOS={handleGoToPOS} screenChild={<SuperAdminPage />} />}
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </>
    </AppErrorBoundary>
  );
};

// Wrapper to add POS button to dashboard
const DashboardWithPOS = ({
  onGoToPOS,
  screenChild,
}: {
  onGoToPOS: () => void;
  screenChild: React.ReactNode;
}) => {
  const { currentUser, currentBusiness, currentCashier } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cashierCanViewReports = !!currentCashier?.canViewReports;

  const sidebarItems: SidebarNavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'transactions', label: 'Transaksi', icon: ShoppingCart, href: '/dashboard' },
    { id: 'products', label: 'Produk', icon: Package, href: '/dashboard' },
    { id: 'members', label: 'Member', icon: UserPlus, href: '/dashboard' },
    { id: 'materials', label: 'Bahan Baku', icon: Boxes, href: '/dashboard' },
    { id: 'store', label: 'Toko', icon: Store, href: currentBusiness?.id ? `/dashboard/store/${encodeURIComponent(currentBusiness.id)}` : '/dashboard' },
    { id: 'opname', label: 'Stock Opname', icon: ClipboardList, href: '/dashboard/stock-opname' },
    { id: 'tasks', label: 'Tugas', icon: ClipboardList, href: '/dashboard/tasks' },
    { id: 'finance', label: 'Keuangan', icon: Banknote, href: '/dashboard/finance' },
    { id: 'history', label: 'History', icon: History, href: '/dashboard/history' },
    { id: 'shifts', label: 'Shift', icon: CalendarDays, href: '/dashboard/shifts' },
    { id: 'reports', label: 'Laporan', icon: TrendingUp, href: '/dashboard/reports' },
    { id: 'settings', label: 'Pengaturan', icon: Settings, href: '/dashboard/settings' },
    { id: 'super-admin', label: 'Super Admin', icon: Shield, href: '/dashboard/super-admin' },
  ].filter((it) => {
    if (!currentCashier) return true;
    if (it.id === 'reports') return cashierCanViewReports;
    if (it.id === 'finance' || it.id === 'settings' || it.id === 'super-admin') return false;
    return true;
  });

  return (
    <div className="relative min-h-screen min-h-[100dvh] bg-gray-50/80 dark:bg-gray-900 w-full max-w-full min-w-0">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 
                       px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Menu className="w-6 h-6" />
        </button>
        <button type="button" onClick={() => navigate('/dashboard')} className="font-bold text-gray-900 dark:text-white">
          {currentBusiness?.name || 'Omnifyi POS'}
        </button>
        <SyncStatusChip />
      </header>

      <div className="flex min-w-0 w-full max-w-full">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200",
            "dark:border-gray-700 transform transition-transform duration-200 lg:translate-x-0 lg:static",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-800 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/25">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 dark:text-white tracking-tight">Omnifyi POS</h1>
                  <p className="text-[10px] text-brand-600 font-medium">Retail Dashboard</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 min-h-0 p-4 space-y-1">
              {sidebarItems.map((item) => {
                const routeActive = item.href && location.pathname.startsWith(item.href);
                const className = cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium',
                  routeActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                );
                return (
                  <Link key={item.id} to={item.href || '/dashboard'} onClick={() => setIsMobileMenuOpen(false)} className={className}>
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {currentUser ? (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold">
                    {currentUser?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        <main className="flex-1 min-w-0 max-w-full min-h-screen lg:min-h-0 pb-36 lg:pb-0">
          {screenChild}
        </main>
      </div>

      <button
        type="button"
        onClick={onGoToPOS}
        className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] lg:bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 md:right-6 z-50 flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 
                 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold
                 rounded-2xl shadow-lg shadow-brand-500/25 hover:shadow-xl 
                 hover:from-brand-700 hover:to-brand-600 transition-all
                 active:scale-95"
      >
        <ShoppingCart className="w-5 h-5" />
        Buka Kasir
      </button>
    </div>
  );
};

export default App;
