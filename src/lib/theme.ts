export type ThemeMode = 'dark' | 'light' | 'system';

export const THEME_STORAGE_KEY = 'omnifyipos:theme';

export function getStoredThemeMode(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === 'dark' || raw === 'light' || raw === 'system') return raw;
  return null;
}

export function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'dark' || mode === 'light') return mode;
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getInitialThemeMode(): ThemeMode {
  return getStoredThemeMode() ?? 'system';
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.classList.toggle('dark', resolved === 'dark');
}

export function persistThemeMode(mode: ThemeMode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
}

