import React, { createContext, useContext, type ReactNode } from 'react';

type LandingLoginViewContextValue = {
  /** Tampilkan kartu login di hero (selain jika sudah login ke app). */
  showAuthPanel: boolean;
  /** Panggil dari tombol Masuk / tautan login: set flag, scroll, animasi. */
  revealLogin: () => void;
  /** Naikkan untuk memicu animasi perhatian pada kartu login. */
  formPulseKey: number;
  /** Popup "Coba Gratis" (lead form) — state di-hoist ke LoginLandingPage. */
  leadFormOpen: boolean;
  openLeadForm: () => void;
  closeLeadForm: () => void;
};

const LandingLoginViewContext = createContext<LandingLoginViewContextValue | null>(null);

export function LandingLoginViewProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: LandingLoginViewContextValue;
}) {
  return <LandingLoginViewContext.Provider value={value}>{children}</LandingLoginViewContext.Provider>;
}

export function useLandingLoginView(): LandingLoginViewContextValue {
  const ctx = useContext(LandingLoginViewContext);
  if (!ctx) {
    throw new Error('useLandingLoginView requires LandingLoginViewProvider');
  }
  return ctx;
}

/** Footer / bagian lain di luar provider — aman no-op. */
export function useLandingLoginViewOptional(): LandingLoginViewContextValue | null {
  return useContext(LandingLoginViewContext);
}
