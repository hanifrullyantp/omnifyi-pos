import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

type Props = {
  email: string;
  password: string;
  status: string;
  /** Untuk memicu animasi goyang ulang saat pesan error sama seperti sebelumnya */
  statusShakeKey: number;
  statusTone?: 'neutral' | 'error' | 'info';
  loginBusy: boolean;
  resetBusy: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onLogin: () => void;
  onResetDemo: () => void;
  onOpenCheckout: () => void;
  /** Lead form / Coba Gratis */
  onOpenCobaGratis: () => void;
  autoEnterApp: boolean;
  onAutoEnterAppChange: (next: boolean) => void;
  welcomeUserName: string;
  onEnterAppNow: () => void;
  /** Scroll ke tombol Coba Gratis di hero */
  scrollToCobaGratis: () => void;
  className?: string;
};

export function SalesLoginCard({
  email,
  password,
  status,
  statusShakeKey,
  statusTone = 'neutral',
  loginBusy,
  resetBusy,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onResetDemo,
  onOpenCheckout,
  onOpenCobaGratis,
  autoEnterApp,
  onAutoEnterAppChange,
  welcomeUserName,
  onEnterAppNow,
  scrollToCobaGratis,
  className,
}: Props) {
  const statusClass =
    statusTone === 'error'
      ? 'text-rose-300 border border-rose-500/35 bg-rose-950/35'
      : statusTone === 'info'
        ? 'text-amber-200 border border-amber-500/25 bg-amber-950/30'
        : 'text-teal-300 border border-teal-500/20 bg-teal-950/20';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginBusy) onLogin();
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-teal-500/20 bg-slate-900/90 backdrop-blur-sm p-6 md:p-7 scroll-mt-24 shadow-2xl shadow-teal-500/10 ring-1 ring-white/[0.04]',
        className,
      )}
    >
      {welcomeUserName ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/[0.12] px-3 py-2.5">
          <p className="text-emerald-100 text-sm leading-relaxed">
            Selamat Datang <span className="font-semibold">{welcomeUserName}</span>, silahkan{' '}
            <button
              type="button"
              className="underline decoration-emerald-300/80 hover:text-white font-medium"
              onClick={onEnterAppNow}
            >
              klik disini
            </button>{' '}
            untuk masuk ke aplikasi.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/[0.12] px-3 py-2.5">
          <p className="font-semibold text-amber-200 text-sm">Mode Demo:</p>
          <p className="mt-1.5 text-amber-100/85 text-xs leading-relaxed">
            Klik tombol{' '}
            <button type="button" className="text-amber-100 underline decoration-amber-400/60 hover:text-white" onClick={scrollToCobaGratis}>
              Coba Gratis
            </button>{' '}
            di atas, atau{' '}
            <button type="button" className="text-amber-100 underline decoration-amber-400/60 hover:text-white" onClick={onOpenCobaGratis}>
              klik di sini
            </button>{' '}
            untuk mencoba gratis aplikasi.
          </p>
        </div>
      )}
      <button
        type="button"
        disabled={resetBusy}
        onClick={onResetDemo}
        className="mt-3 w-full py-2 rounded-lg text-xs font-medium border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-50"
      >
        {resetBusy ? 'Memproses…' : 'Reset data ke demo'}
      </button>

      <h3 className="mt-6 text-lg font-bold text-white">Masuk ke aplikasi</h3>
      <p className="text-xs text-slate-500 mt-0.5">Cloud: Supabase. Demo hanya di perangkat ini.</p>
      <form onSubmit={submit} className="mt-4 space-y-2">
        <label className="block text-xs text-slate-400">Email</label>
        <input
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-teal-500/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        />
        <label className="block text-xs text-slate-400 mt-2">Password</label>
        <input
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Password"
          type="password"
          autoComplete="current-password"
          className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-teal-500/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        />
        <button
          type="submit"
          disabled={loginBusy}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold text-sm hover:from-teal-400 hover:to-emerald-500 shadow-lg shadow-teal-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loginBusy ? 'Memverifikasi…' : 'Masuk'}
        </button>
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-300 select-none">
          <input
            type="checkbox"
            className="accent-emerald-500 w-4 h-4"
            checked={autoEnterApp}
            onChange={(e) => onAutoEnterAppChange(e.target.checked)}
          />
          Langsung masuk aplikasi
        </label>
      </form>
      <p className="mt-4 text-center text-sm text-slate-400">
        Belum punya akun?{' '}
        <button type="button" onClick={onOpenCheckout} className="text-teal-400 hover:text-teal-300 font-medium">
          Daftar / beli paket
        </button>
      </p>
      <AnimatePresence mode="wait">
        {!!status && (
          <motion.div
            key={statusShakeKey}
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{
              opacity: 1,
              y: 0,
              x: statusTone === 'error' ? [0, -10, 10, -8, 8, -4, 4, 0] : 0,
            }}
            exit={{ opacity: 0, y: -4 }}
            transition={{
              opacity: { duration: 0.2 },
              y: { duration: 0.2 },
              x: { duration: 0.45, ease: 'easeInOut' },
            }}
            className={cn('mt-4 rounded-xl px-3 py-2.5 text-sm leading-snug', statusClass)}
          >
            {status}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
