-- =============================================================================
-- Platform super admin: hanif.rullyant@gmail.com / 88888888
-- =============================================================================
-- Login cloud memakai Supabase Auth. Tabel `auth.users` tidak diisi oleh
-- migrasi aplikasi POS — user harus dibuat di Auth.
--
-- CARA TERMUDAH (disarankan)
-- ----------------------------
-- 1. Buka Supabase Dashboard → Authentication → Users → "Add user" → "Create new user"
-- 2. Email: hanif.rullyant@gmail.com
-- 3. Password: 88888888
-- 4. Centang "Auto Confirm User" (jika ada)
-- 5. Authentication → URL Configuration: pastikan Site URL = URL produksi / localhost
--
-- Setelah login, aplikasi memanggil RPC `provision_tenant` dan menyimpan role
-- `ADMIN_SYSTEM` di IndexedDB untuk email ini (lihat `SUPER_ADMIN_EMAIL` di src/lib/db.ts).
--
-- OPSIONAL: SQL di bawah — hanya jika Dashboard tidak dipakai.
-- Jalankan sekali di SQL Editor. Jika error kolom/tipe, gunakan Dashboard saja.
-- =============================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_user_id uuid := gen_random_uuid();
  v_email text := 'hanif.rullyant@gmail.com';
  v_password text := '88888888';
  v_instance_id uuid;
  v_encrypted_pw text := crypt(v_password, gen_salt('bf'));
begin
  if exists (select 1 from auth.users where lower(email) = lower(v_email)) then
    raise notice 'User % sudah ada — tidak ada perubahan.', v_email;
    return;
  end if;

  select u.instance_id into v_instance_id from auth.users u limit 1;
  if v_instance_id is null then
    v_instance_id := '00000000-0000-0000-0000-000000000000'::uuid;
  end if;

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    v_user_id,
    v_instance_id,
    'authenticated',
    'authenticated',
    v_email,
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    now(),
    now(),
    now()
  );

  raise notice 'User % dibuat (id: %).', v_email, v_user_id;
end $$;
