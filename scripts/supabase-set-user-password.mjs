#!/usr/bin/env node
/**
 * Set password user Auth lewat Admin API (kompatibel 100% dengan signInWithPassword).
 *
 * Usage:
 *   SUPABASE_URL="https://xxxx.supabase.co" \
 *   SUPABASE_SERVICE_ROLE_KEY="eyJhbG..." \
 *   node scripts/supabase-set-user-password.mjs hanif.rullyant@gmail.com 88888888
 *
 * Service role key: Supabase Dashboard → Project Settings → API → service_role (secret).
 * Jangan commit key ini atau push ke repo.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const email = process.argv[2]?.trim().toLowerCase();
const newPassword = process.argv[3];

if (!url || !serviceKey) {
  console.error('Set env SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
if (!email || !newPassword) {
  console.error('Usage: node scripts/supabase-set-user-password.mjs <email> <password-baru>');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const perPage = 200;
let page = 1;
let found = null;

while (!found && page < 50) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
  if (error) {
    console.error('listUsers:', error.message);
    process.exit(1);
  }
  const users = data?.users ?? [];
  found = users.find((u) => (u.email ?? '').toLowerCase() === email) ?? null;
  if (users.length < perPage) break;
  page += 1;
}

if (!found?.id) {
  console.error(`User tidak ditemukan: ${email}`);
  process.exit(1);
}

const { error: updErr } = await admin.auth.admin.updateUserById(found.id, {
  password: newPassword,
  email_confirm: true,
});

if (updErr) {
  console.error('updateUserById:', updErr.message);
  process.exit(1);
}

console.log(`OK — password di-set untuk ${email} (id: ${found.id}). Coba login lagi di app.`);
