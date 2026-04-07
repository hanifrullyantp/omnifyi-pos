import React from 'react';
import type { LandingContent } from '../../lib/landingContent';
import { cn } from '../../utils/cn';

type Props = {
  content: LandingContent;
  onCoba: () => void;
  className?: string;
};

export function SalesLandingHeader({ content, onCoba, className }: Props) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-teal-500/15 bg-[#030712]/90 backdrop-blur-xl shadow-[0_1px_0_0_rgba(20,184,166,0.08)]',
        className,
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {content.logoUrl ? (
            <img src={content.logoUrl} className="w-8 h-8 rounded-lg object-cover shrink-0 ring-1 ring-teal-500/30" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-600 shrink-0 shadow-lg shadow-teal-500/25" />
          )}
          <div className="min-w-0">
            <p className="font-bold text-white text-sm sm:text-base truncate">{content.brandName}</p>
            <p className="text-[10px] sm:text-xs text-teal-200/70 truncate hidden sm:block">{content.tagline}</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-5 text-sm text-slate-400">
          <a href="#fitur" className="hover:text-teal-300 transition-colors">
            {content.nav.fitur}
          </a>
          <a href="#cara-kerja" className="hover:text-teal-300 transition-colors">
            {content.nav.caraKerja}
          </a>
          <a href="#harga" className="hover:text-teal-300 transition-colors">
            {content.nav.harga}
          </a>
          <a href="#faq" className="hover:text-teal-300 transition-colors">
            {content.nav.faq}
          </a>
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="#login-card"
            className="px-3 py-2 rounded-lg border border-white/15 text-slate-200 text-xs sm:text-sm hover:bg-white/5 transition-colors"
          >
            {content.nav.masuk}
          </a>
          <button
            type="button"
            onClick={onCoba}
            className="px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-teal-500/20"
          >
            {content.nav.coba}
          </button>
        </div>
      </div>
    </header>
  );
}
