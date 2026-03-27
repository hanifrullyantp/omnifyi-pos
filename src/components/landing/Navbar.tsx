import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

type Props = {
  onLoginClick: () => void;
  onTryClick: () => void;
};

export default function Navbar({ onLoginClick, onTryClick }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <p className="font-bold text-white">Omnifyi POS</p>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <a href="#fitur" className="hover:text-white">Fitur</a>
          <a href="#cara-kerja" className="hover:text-white">Cara Kerja</a>
          <a href="#harga" className="hover:text-white">Harga</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <button onClick={onLoginClick} className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm">Masuk</button>
          <button onClick={onTryClick} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold">Coba Gratis -&gt;</button>
        </div>
        <button className="md:hidden p-2 text-white" onClick={() => setOpen((v) => !v)}>{open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
      </div>
      {open && (
        <div className="md:hidden px-5 pb-4 space-y-2 text-sm">
          {['Fitur', 'Cara Kerja', 'Harga', 'FAQ'].map((x) => <p key={x} className="text-gray-300">{x}</p>)}
          <div className="flex gap-2 pt-2">
            <button onClick={onLoginClick} className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white">Masuk</button>
            <button onClick={onTryClick} className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold">Coba Gratis</button>
          </div>
        </div>
      )}
    </header>
  );
}

