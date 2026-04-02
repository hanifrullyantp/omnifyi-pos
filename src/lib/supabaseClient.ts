import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function optionalEnv(name: string): string | null {
  const v = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[name];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export function getSupabase(): SupabaseClient | null {
  const url = optionalEnv('VITE_SUPABASE_URL');
  const anon = optionalEnv('VITE_SUPABASE_ANON_KEY');
  if (!url || !anon) {
    console.error(
      `[supabase] Missing env: ${!url ? 'VITE_SUPABASE_URL' : ''}${!url && !anon ? ', ' : ''}${!anon ? 'VITE_SUPABASE_ANON_KEY' : ''}`,
    );
    return null;
  }
  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = getSupabase();

