import type { AuthError } from '@supabase/supabase-js';

/** Pesan untuk error signInWithPassword (bukan generik jika Supabase mengirim kode jelas). */
export function formatSupabaseSignInError(error: AuthError): string {
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();

  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Di Supabase: Authentication → Users → pilih user → atau jalankan SQL yang mengisi email_confirmed_at.';
  }
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'Email atau password salah. Jika password sudah di-reset lewat SQL, pakai skrip Node (lihat scripts/supabase-set-user-password.mjs) agar hash sama dengan GoTrue.';
  }
  if (code === 'too_many_requests' || msg.includes('too many')) {
    return 'Terlalu banyak percobaan login. Tunggu beberapa menit lalu coba lagi.';
  }
  if (code === 'user_banned' || msg.includes('banned')) {
    return 'Akun ini dinonaktifkan. Cek Supabase Authentication → Users.';
  }

  const trimmed = (error.message ?? '').trim();
  if (trimmed) return `Login gagal: ${trimmed}`;
  return 'Email atau password salah';
}

/** Error setelah login sukses: RPC provision_tenant / penyimpanan lokal. */
export function formatProvisionError(err: unknown): string {
  const o = err as { message?: string; code?: string; details?: string; hint?: string };
  const m = (o?.message ?? (err instanceof Error ? err.message : String(err))).trim();
  const lower = m.toLowerCase();

  if (lower.includes('not_authenticated') || lower.includes('jwt')) {
    return 'Gagal menyambung ke workspace cloud (sesi tidak dikenali). Muat ulang halaman lalu coba lagi.';
  }
  if (
    lower.includes('could not find the function') ||
    lower.includes('function public.provision_tenant') ||
    lower.includes('pgrst202')
  ) {
    return 'Database cloud belum memiliki fungsi provision_tenant. Jalankan migrasi SQL di folder supabase/migrations pada project Supabase ini, lalu coba login lagi.';
  }
  if (lower.includes('permission denied') || o?.code === '42501') {
    return 'Gagal menyiapkan workspace: izin database ditolak. Pastikan migrasi RLS + GRANT untuk provision_tenant sudah dijalankan.';
  }

  const detail = [o?.details, o?.hint].filter(Boolean).join(' ');
  return `Gagal menyiapkan akun setelah login: ${m}${detail ? ` (${detail})` : ''}`;
}
