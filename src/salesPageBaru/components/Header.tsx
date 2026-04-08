import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCms } from '../context/CmsContext';
import { Settings, LogIn, LayoutDashboard } from 'lucide-react';
import { cn } from './EditableElements';
import { useLandingLoginView } from '../context/LandingLoginViewContext';
import { useAuthStore } from '../../lib/store';

export const Header = () => {
  const { data, toggleAdmin } = useCms();
  const { isAdmin } = data;
  const { revealLogin } = useLandingLoginView();
  const authUser = useAuthStore((s) => s.currentUser);
  const navigate = useNavigate();
  const showCmsToggle = import.meta.env.DEV || authUser?.role === 'ADMIN_SYSTEM';
  const onBukaAppClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (authUser) return;
    e.preventDefault();
    revealLogin();
    navigate('/', { replace: false });
  };


  const onMasukClick = () => {
    revealLogin();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Omnifyi</span>
          </div>

          <div className="flex items-center gap-4">
            {showCmsToggle && (
              <div className="hidden sm:flex items-center gap-2 mr-4 border-r border-white/20 pr-4">
                <button
                  type="button"
                  onClick={toggleAdmin}
                  className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
                >
                  <Settings size={14} /> Admin mode
                </button>
                {authUser?.role === 'ADMIN_SYSTEM' ? (
                  <Link
                    to="/kelola-sales-landing"
                    className="text-xs text-slate-400 hover:text-emerald-300 transition"
                  >
                    Kelola LP
                  </Link>
                ) : null}
              </div>
            )}

            {isAdmin && (
              <button
                type="button"
                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition"
                title="Admin"
              >
                <Settings size={20} />
              </button>
            )}

            <a
              href="/dashboard"
              onClick={onBukaAppClick}
              className={cn(
                'hidden sm:inline-flex px-5 py-2.5 rounded-full font-medium transition-all duration-300 items-center gap-2',
                'bg-slate-800 text-white hover:bg-slate-700 border border-white/10',
              )}
            >
              <LayoutDashboard size={18} />
              Buka app
            </a>

            <button
              type="button"
              onClick={onMasukClick}
              className="px-6 py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
            >
              <LogIn size={18} />
              Masuk
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
