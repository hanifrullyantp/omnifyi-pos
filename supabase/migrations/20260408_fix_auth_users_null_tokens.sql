-- =============================================================================
-- Perbaiki: Login → "Database error querying schema" (GoTrue / Auth API 500)
-- =============================================================================
-- Penyebab umum: baris di auth.users dibuat lewat SQL tanpa mengisi kolom token
-- teks. GoTrue memindai ke string — NULL memicu error (lihat supabase/auth#1940).
--
-- Jalankan di Supabase → SQL Editor (Production) sekali setelah deploy migrasi ini,
-- atau salin isi UPDATE ke editor jika tidak pakai CLI migrate.
-- =============================================================================

begin;

-- Hanya baris yang punya NULL (penyebab error GoTrue); tidak mengubah user yang sudah valid.
update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, '')
where
  confirmation_token is null
  or recovery_token is null
  or email_change is null
  or email_change_token_new is null;

-- Beberapa versi punya kolom ini; abaikan jika migration error di baris berikutnya.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'users'
      and column_name = 'email_change_token_current'
  ) then
    execute 'update auth.users set email_change_token_current = coalesce(email_change_token_current, '''') where email_change_token_current is null';
  end if;
end $$;

commit;
