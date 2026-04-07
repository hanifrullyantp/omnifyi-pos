import React from 'react';
import { useCms } from '../context/CmsContext';
import { Settings, LogOut, LogIn, LayoutDashboard } from 'lucide-react';
import { cn } from './EditableElements';

export const Header = () => {
  const { data, toggleAdmin, toggleLogin } = useCms();
  const { isAdmin, isLoggedIn, settings } = data;

  const handleAuthClick = () => {
    if (isLoggedIn) {
      window.location.href = settings.appUrlAfterLogin;
    } else {
      window.location.href = settings.loginUrl;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Omnifyi</span>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Developer/Demo Controls - Hidden in real life, but needed to toggle modes */}
            <div className="hidden sm:flex items-center gap-2 mr-4 border-r border-white/20 pr-4">
               <button 
                onClick={toggleLogin}
                className="text-xs text-slate-400 hover:text-white transition"
               >
                 {isLoggedIn ? 'Simulate Logout' : 'Simulate Login'}
               </button>
               <button 
                onClick={toggleAdmin}
                className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
               >
                 <Settings size={14} /> Admin Mode
               </button>
            </div>

            {isAdmin && (
               <button className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition" title="Admin Settings">
                  <Settings size={20} />
               </button>
            )}

            <button
              onClick={handleAuthClick}
              className={cn(
                "px-6 py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2",
                isLoggedIn 
                  ? "bg-slate-800 text-white hover:bg-slate-700 border border-white/10" 
                  : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
              )}
            >
              {isLoggedIn ? (
                <>
                  <LayoutDashboard size={18} />
                  Buka Omnifyi
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Log In
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
