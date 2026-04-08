-- =============================================================================
-- Reset password user Auth TANPA email (jika "Send password recovery" gagal)
-- =============================================================================
-- Jika setelah ini login masih "email/password salah", pakai Admin API (paling andal):
--   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
--   node scripts/supabase-set-user-password.mjs hanif.rullyant@gmail.com 88888888
-- =============================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_email text := 'hanif.rullyant@gmail.com';
  v_new_password text := '88888888';  -- ubah jika perlu
  v_uid uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower(v_email) limit 1;
  if v_uid is null then
    raise exception 'Email tidak ditemukan di auth.users: %', v_email;
  end if;

  update auth.users
  set
    encrypted_password = crypt(v_new_password, gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now(),
    confirmation_token = coalesce(confirmation_token, ''),
    recovery_token = coalesce(recovery_token, ''),
    email_change = coalesce(email_change, ''),
    email_change_token_new = coalesce(email_change_token_new, '')
  where id = v_uid;

  if not exists (select 1 from auth.identities i where i.user_id = v_uid and i.provider = 'email') then
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_uid,
      v_uid::text,
      jsonb_build_object('sub', v_uid::text, 'email', v_email),
      'email',
      now(),
      now(),
      now()
    );
  end if;

  raise notice 'Password untuk % sudah di-reset; identitas email dicek.', v_email;
end $$;
