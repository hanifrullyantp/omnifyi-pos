import React from 'react';
import { useCms } from '../context/CmsContext';
import { Save, Eye, CheckCircle, DatabaseZap, RotateCcw } from 'lucide-react';
import { cn } from './EditableElements';

export const AdminToolbar = () => {
  const { data, toggleAdmin } = useCms();

  if (!data.isAdmin) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-900 border-t border-slate-700 shadow-2xl p-3 flex flex-wrap items-center justify-between text-sm text-slate-300">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-md font-medium border border-emerald-500/20">
          <DatabaseZap size={16} className="animate-pulse" />
          <span>Connected</span>
        </div>
        <span className="text-slate-500 hidden sm:inline">Last saved: Just now</span>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 hover:bg-slate-800 px-3 py-1.5 rounded transition">
          <RotateCcw size={16} /> Undo
        </button>
        <button className="flex items-center gap-2 hover:bg-slate-800 px-3 py-1.5 rounded transition text-blue-400">
          <Eye size={16} /> Preview
        </button>
        <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-1.5 rounded text-white transition">
          <Save size={16} /> Save Draft
        </button>
        <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-1.5 rounded text-white font-medium transition shadow-lg shadow-emerald-500/20">
          <CheckCircle size={16} /> Publish
        </button>
        <button 
          onClick={toggleAdmin}
          className="ml-2 flex items-center gap-2 hover:bg-red-500/10 hover:text-red-400 px-3 py-1.5 rounded transition text-slate-400"
        >
          Exit Admin
        </button>
      </div>
    </div>
  );
};
