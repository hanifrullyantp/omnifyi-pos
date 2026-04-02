import { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  CircleDollarSign,
  Users,
  Bell,
  Search,
  Plus,
  X,
  Settings,
  ChevronLeft,
  Calculator,
  Package,
  UserCircle,
  LogOut,
  ChevronDown,
  Menu,
  PieChart,
  Target,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AICommandCenter } from '../components/AICommandCenter';
import { useData } from '../store/dataStore';

export function MainLayout() {
  const { currentUser, setCurrentUser, users } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isEmployee = currentUser?.role === 'Employee';

  const canAccessPayroll = ['Admin', 'HR', 'Finance'].includes(currentUser?.role || '');

  const sidebarNav = useMemo(() => [
    { section: 'MAIN' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', visible: true },
    { icon: Briefcase, label: 'Projects', path: '/projects', visible: true },
    { section: 'BUSINESS', visible: !isEmployee },
    { icon: Users, label: 'CRM', path: '/crm', visible: !isEmployee },
    { icon: Target, label: 'Pipeline', path: '/pipeline', visible: !isEmployee },
    { icon: CircleDollarSign, label: 'Finance', path: '/finance', visible: !isEmployee },
    { icon: Users, label: 'Karyawan', path: '/employees', visible: canAccessPayroll },
    { icon: Package, label: 'Inventory', path: '/inventory', visible: !isEmployee },
    { icon: Calculator, label: 'Estimator', path: '/estimator', visible: !isEmployee },
    { icon: PieChart, label: 'Laporan', path: '/reports', visible: !isEmployee && (currentUser?.role === 'Admin' || currentUser?.role === 'Finance') },
    { section: 'SYSTEM', visible: !isEmployee },
    { icon: Settings, label: 'Admin', path: '/admin', visible: !isEmployee },
  ], [isEmployee, canAccessPayroll]);

  const bottomNavItems = useMemo(() => [
    { icon: LayoutDashboard, label: 'Home', path: '/', visible: true },
    { icon: Briefcase, label: 'Projects', path: '/projects', visible: true },
    { icon: Plus, label: 'AI', path: '__ai__', isCenter: true, visible: !isEmployee },
    { icon: CircleDollarSign, label: 'Finance', path: '/finance', visible: !isEmployee },
    { icon: Calculator, label: 'Estimator', path: '/estimator', visible: !isEmployee },
  ], [isEmployee]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => setProfileOpen(false);
    if (profileOpen) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [profileOpen]);

  const handleBottomNavClick = (item: typeof bottomNavItems[0]) => {
    if (item.path === '__ai__') {
      setAiOpen(true);
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50/80 flex flex-col md:flex-row font-sans">
      {/* === DESKTOP SIDEBAR === */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-white/95 backdrop-blur-xl border-r border-gray-100/80 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-[72px]" : "w-[250px]"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-gray-100/60 flex-shrink-0 transition-all duration-300",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/25 flex-shrink-0">
              ∞
            </div>
            {!sidebarCollapsed && (
              <div className="animate-fade-in overflow-hidden">
                <span className="font-bold text-lg text-gray-900 tracking-tight block leading-tight">Omnifyi</span>
                <span className="text-[10px] text-brand-600 font-medium leading-none">Business Platform</span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(true)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {sidebarCollapsed && (
          <button onClick={() => setSidebarCollapsed(false)} className="mx-auto mt-3 p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all">
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 custom-scrollbar">
          {sidebarNav.filter(item => item.visible !== false).map((item, i) => {
            if ('section' in item && item.section) {
              if (sidebarCollapsed) return <div key={i} className="h-3" />;
              return <p key={i} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-5 pb-1.5">{item.section}</p>;
            }
            const nav = item as { icon: any; label: string; path: string };
            const isActive = nav.path === '/' ? location.pathname === '/' : location.pathname.startsWith(nav.path);
            return (
              <NavLink
                key={nav.path}
                to={nav.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative",
                  sidebarCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/20"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                )}
              >
                <nav.icon className={cn("w-[18px] h-[18px] flex-shrink-0", sidebarCollapsed && "w-5 h-5")} />
                {!sidebarCollapsed && <span>{nav.label}</span>}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                    {nav.label}
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* AI Command Button (Desktop Sidebar) */}
        {!isEmployee && (
          <div className={cn("px-3 pb-2", sidebarCollapsed && "flex justify-center")}>
            <button
              onClick={() => setAiOpen(true)}
              className={cn(
                "flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-brand-500/25 active:scale-[0.97]",
                sidebarCollapsed ? "w-10 h-10 justify-center" : "w-full px-4 py-2.5 text-sm"
              )}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>AI Command</span>}
            </button>
          </div>
        )}

        {/* Profile */}
        <div className={cn("border-t border-gray-100/60 p-2.5 flex-shrink-0", sidebarCollapsed && "flex justify-center")}>
          <div
            onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
            className={cn("flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-all relative", sidebarCollapsed && "p-1")}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {currentUser?.name.split(' ').map(n => n[0]).join('')}
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{currentUser?.name}</p>
                  <p className="text-[11px] text-gray-400 font-medium">{currentUser?.role}</p>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", profileOpen && "rotate-180")} />
              </>
            )}
            {profileOpen && (
              <div className={cn(
                "absolute bottom-full mb-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-scale-in z-50 min-w-[220px]",
                sidebarCollapsed ? "left-full ml-2 bottom-0" : "left-0 right-0"
              )}>
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Switch Account</p>
                </div>
                {users.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => { setCurrentUser(u); navigate('/'); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                      currentUser?.id === u.id ? "bg-brand-50 text-brand-700 font-bold" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-[10px]">{u.name.split(' ').map(n => n[0]).join('')}</div>
                    <div className="text-left">
                      <p className="leading-none">{u.name}</p>
                      <p className="text-[9px] opacity-70 uppercase tracking-tighter mt-0.5">{u.role}</p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-gray-100 my-1" />
                {!isEmployee && (
                  <NavLink to="/admin" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </NavLink>
                )}
                <NavLink to="/" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <UserCircle className="w-4 h-4" /> Profile
                </NavLink>
                <div className="border-t border-gray-100 my-1" />
                <button className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* === MOBILE SIDEBAR OVERLAY === */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-[280px] bg-white shadow-2xl animate-slide-in-left flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center text-white font-bold text-lg shadow-md">∞</div>
                <div>
                  <span className="font-bold text-lg text-gray-900 tracking-tight block leading-tight">Omnifyi</span>
                  <span className="text-[10px] text-brand-600 font-medium">Business Platform</span>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              {sidebarNav.filter(item => item.visible !== false).map((item, i) => {
                if ('section' in item && item.section) return <p key={i} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-5 pb-2">{item.section}</p>;
                const nav = item as { icon: any; label: string; path: string };
                const isActive = nav.path === '/' ? location.pathname === '/' : location.pathname.startsWith(nav.path);
                return (
                  <NavLink
                    key={nav.path}
                    to={nav.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/20"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <nav.icon className="w-5 h-5" />
                    <span>{nav.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
                  {currentUser?.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{currentUser?.name}</p>
                  <p className="text-xs text-gray-400">{currentUser?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === MAIN CONTENT === */}
      <main className={cn(
        "flex-1 flex flex-col min-h-0 overflow-hidden relative pb-[68px] md:pb-0 transition-all duration-300",
        sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[250px]"
      )}>
        {/* Desktop Topbar */}
        <header className="hidden md:flex items-center justify-between h-14 px-6 bg-white/80 backdrop-blur-md border-b border-gray-100/60 flex-shrink-0 sticky top-0 z-30">
          <div className="flex-1 flex items-center">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEmployee && (
              <button onClick={() => setAiOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-brand-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0">
                <Plus className="w-4 h-4" /><span>AI Command</span>
              </button>
            )}
            <button className="relative p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Mobile Topbar (minimal) */}
        <header className="md:hidden flex items-center justify-between px-4 py-2.5 bg-white/90 backdrop-blur-md border-b border-gray-100/40 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all -ml-1">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center text-white font-bold text-xs shadow-md">∞</div>
            <span className="font-bold text-gray-900 text-sm">Omnifyi</span>
          </div>
          <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-xl transition-all -mr-1">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>

      {/* === MOBILE BOTTOM NAV === */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40">
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/50 pb-safe">
          <div className="flex items-center justify-around h-[60px] px-1 max-w-lg mx-auto">
            {bottomNavItems.filter(item => item.visible !== false).map((item) => {
              if (item.isCenter) {
                return (
                  <button key={item.label} onClick={() => handleBottomNavClick(item)} className="relative -top-3 group">
                    <div className="w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 transition-all duration-300 active:scale-90 hover:shadow-xl group-active:shadow-md">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-brand-600 whitespace-nowrap">AI</span>
                  </button>
                );
              }
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <button
                  key={item.label}
                  onClick={() => handleBottomNavClick(item)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 active:scale-90",
                    isActive ? "text-brand-600" : "text-gray-400"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 transition-all", isActive && "w-[21px] h-[21px]")} />
                  <span className={cn("text-[10px] font-medium", isActive && "font-bold text-brand-700")}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* === AI COMMAND CENTER === */}
      <AICommandCenter
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onNavigate={(path) => { setAiOpen(false); navigate(path); }}
      />
    </div>
  );
}
