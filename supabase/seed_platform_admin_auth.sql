-- =============================================================================
-- Platform super admin: hanif.rullyant@gmail.com / 88888888
-- =============================================================================
-- PENTING
-- -------
-- Versi lama skrip ini: jika user SUDAH ADA di Auth, skrip tidak mengubah apa-apa
-- (hanya NOTICE) — password tetap yang lama → login "88888888" gagal.
-- Sekarang: user yang sudah ada akan di-UPDATE password + konfirmasi email +
-- baris auth.identities untuk provider `email` jika belum ada.
--
-- Cara paling andal (disarankan jika SQL masih bermasalah):
--   npm run supabase:set-password -- hanif.rullyant@gmail.com 88888888
--   dengan env SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (lihat scripts/supabase-set-user-password.mjs).
--
-- Atau Dashboard → Authentication → Users → Add user (email + password, auto-confirm).
-- =============================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_user_id uuid;
  v_email text := 'hanif.rullyant@gmail.com';
  v_password text := '88888888';
  v_instance_id uuid;
  v_encrypted_pw text := crypt(v_password, gen_salt('bf'));
begin
  select id into v_user_id from auth.users where lower(email) = lower(v_email) limit 1;

  -- Sudah terdaftar: paksa password & pastikan bisa login email/password
  if v_user_id is not null then
    update auth.users
    set
      encrypted_password = v_encrypted_pw,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;

    if not exists (
      select 1 from auth.identities i where i.user_id = v_user_id and i.provider = 'email'
    ) then
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
    end if;

    raise notice 'User % sudah ada — password diset ulang & identitas email dicek.', v_email;
    return;
  end if;

  -- Belum ada: buat user baru
  v_user_id := gen_random_uuid();

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
