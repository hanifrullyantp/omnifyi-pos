import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Ditampilkan saat URL/anon key kosong (lokal atau build produksi tanpa env). */
export const SUPABASE_ENV_SETUP_HINT =
  'Supabase env belum diset. Lokal: isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di .env.local lalu restart dev. Vercel: set variabel di Environment Variables lalu Redeploy; pastikan Root Directory repo ini (bukan subfolder OMNIFYI/). Produksi juga memuat config dari /api/supabase-config.';

/** Wajib akses literal `import.meta.env.VITE_*` — bracket dinamis tidak di-inline Vite saat build. */
function readSupabaseEnv(): { url: string | null; anon: string | null } {
  const u = import.meta.env.VITE_SUPABASE_URL;
  const a = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const url = typeof u === 'string' && u.trim() ? u.trim() : null;
  const anon = typeof a === 'string' && a.trim() ? a.trim() : null;
  return { url, anon };
}

function createSupabase(url: string, anon: string): SupabaseClient {
  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

let supabaseClient: SupabaseClient | null = null;

function initFromImportMeta() {
  const { url, anon } = readSupabaseEnv();
  if (url && anon) supabaseClient = createSupabase(url, anon);
}

initFromImportMeta();

export function getSupabase(): SupabaseClient | null {
  return supabaseClient;
}

let hydratePromise: Promise<void> | null = null;

/** Panggil sebelum render app (lihat main.tsx). Mengisi client dari /api/supabase-config jika build tanpa env. */
export function hydrateSupabaseFromApi(): Promise<void> {
  if (supabaseClient) return Promise.resolve();
  if (!hydratePromise) {
    hydratePromise = (async () => {
      try {
        const res = await fetch('/api/supabase-config');
        if (!res.ok) return;
        const data = (await res.json()) as { url?: string | null; anonKey?: string | null };
        const url = typeof data.url === 'string' ? data.url.trim() : '';
        const anon = typeof data.anonKey === 'string' ? data.anonKey.trim() : '';
        if (url && anon) supabaseClient = createSupabase(url, anon);
      } catch {
        /* vite dev tanpa proxy API, dll. */
      }
    })();
  }
  return hydratePromise;
}
