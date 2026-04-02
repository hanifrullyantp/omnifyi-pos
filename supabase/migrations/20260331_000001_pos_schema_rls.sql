-- POS Schema + RLS for Omnifyi POS (offline-first sync)
-- This migration creates a thin-row model:
-- - Core routing columns: id, tenant_id, business_id
-- - Payload in data jsonb (mirrors Dexie rows without re-modeling every column)
-- - Soft delete via deleted_at
-- - updated_at maintained by trigger

begin;

-- Extensions
create extension if not exists pgcrypto;

-- Helper: updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tenants: owned by auth user
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  name text not null default '',
  slug text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists tenants_owner_user_id_idx on public.tenants(owner_user_id);
create index if not exists tenants_updated_at_idx on public.tenants(updated_at);

drop trigger if exists trg_tenants_updated_at on public.tenants;
create trigger trg_tenants_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

-- Businesses: belong to tenant
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists businesses_tenant_id_idx on public.businesses(tenant_id);
create index if not exists businesses_updated_at_idx on public.businesses(updated_at);

drop trigger if exists trg_businesses_updated_at on public.businesses;
create trigger trg_businesses_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

-- Generic entity tables (Dexie mirrors) as jsonb payloads.
-- Each table name matches Dexie table name in src/lib/db.ts.
create table if not exists public.users (
  id uuid primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- All remaining Dexie tables:
-- cashiers, cashierSessions, shifts, categories, products, materials, productMaterials,
-- transactions, transactionItems, debtReceivables, businessCosts, cashflowEntries,
-- debtPayments, financeAccounts, activityLogs, todoItems, materialRestockHistory,
-- shiftAssignments, shiftCloses, members, crmLeads, buyerInbox

create table if not exists public.cashiers (like public.users including all);
create table if not exists public.cashierSessions (like public.users including all);
create table if not exists public.shifts (like public.users including all);
create table if not exists public.categories (like public.users including all);
create table if not exists public.products (like public.users including all);
create table if not exists public.materials (like public.users including all);
create table if not exists public.productMaterials (like public.users including all);
create table if not exists public.transactions (like public.users including all);
create table if not exists public.transactionItems (like public.users including all);
create table if not exists public.debtReceivables (like public.users including all);
create table if not exists public.businessCosts (like public.users including all);
create table if not exists public.cashflowEntries (like public.users including all);
create table if not exists public.debtPayments (like public.users including all);
create table if not exists public.financeAccounts (like public.users including all);
create table if not exists public.activityLogs (like public.users including all);
create table if not exists public.todoItems (like public.users including all);
create table if not exists public.materialRestockHistory (like public.users including all);
create table if not exists public.shiftAssignments (like public.users including all);
create table if not exists public.shiftCloses (like public.users including all);
create table if not exists public.members (like public.users including all);
create table if not exists public.crmLeads (like public.users including all);
create table if not exists public.buyerInbox (like public.users including all);

-- Triggers for updated_at on all entity tables
do $$
declare
  t text;
  tables text[] := array[
    'users','cashiers','cashierSessions','shifts','categories','products','materials','productMaterials',
    'transactions','transactionItems','debtReceivables','businessCosts','cashflowEntries','debtPayments',
    'financeAccounts','activityLogs','todoItems','materialRestockHistory','shiftAssignments','shiftCloses',
    'members','crmLeads','buyerInbox'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$s;', t);
    execute format('create trigger trg_%1$s_updated_at before update on public.%1$s for each row execute function public.set_updated_at();', t);
    execute format('create index if not exists %1$s_tenant_id_idx on public.%1$s(tenant_id);', t);
    execute format('create index if not exists %1$s_updated_at_idx on public.%1$s(updated_at);', t);
  end loop;
end $$;

-- RLS: tenant ownership via tenants.owner_user_id = auth.uid()
alter table public.tenants enable row level security;
alter table public.businesses enable row level security;

do $$
declare
  t text;
  tables text[] := array[
    'users','cashiers','cashierSessions','shifts','categories','products','materials','productMaterials',
    'transactions','transactionItems','debtReceivables','businessCosts','cashflowEntries','debtPayments',
    'financeAccounts','activityLogs','todoItems','materialRestockHistory','shiftAssignments','shiftCloses',
    'members','crmLeads','buyerInbox'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%1$s enable row level security;', t);
  end loop;
end $$;

-- Tenants policies
drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants
for select
using (owner_user_id = auth.uid() and deleted_at is null);

drop policy if exists tenants_insert on public.tenants;
create policy tenants_insert on public.tenants
for insert
with check (owner_user_id = auth.uid());

drop policy if exists tenants_update on public.tenants;
create policy tenants_update on public.tenants
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists tenants_delete on public.tenants;
create policy tenants_delete on public.tenants
for delete
using (owner_user_id = auth.uid());

-- Businesses policies
drop policy if exists businesses_rw on public.businesses;
create policy businesses_rw on public.businesses
for all
using (
  exists (
    select 1 from public.tenants t
    where t.id = businesses.tenant_id
      and t.owner_user_id = auth.uid()
      and t.deleted_at is null
  )
)
with check (
  exists (
    select 1 from public.tenants t
    where t.id = businesses.tenant_id
      and t.owner_user_id = auth.uid()
      and t.deleted_at is null
  )
);

-- Generic policies for all entity tables
do $$
declare
  tn text;
begin
  foreach tn in array array[
    'users','cashiers','cashierSessions','shifts','categories','products','materials','productMaterials',
    'transactions','transactionItems','debtReceivables','businessCosts','cashflowEntries','debtPayments',
    'financeAccounts','activityLogs','todoItems','materialRestockHistory','shiftAssignments','shiftCloses',
    'members','crmLeads','buyerInbox'
  ] loop
    execute format('drop policy if exists %1$s_rw on public.%1$s;', tn);
    execute format($p$
      create policy %1$s_rw on public.%1$s
      for all
      using (
        exists (
          select 1 from public.tenants t
          where t.id = %1$s.tenant_id
            and t.owner_user_id = auth.uid()
            and t.deleted_at is null
        )
      )
      with check (
        exists (
          select 1 from public.tenants t
          where t.id = %1$s.tenant_id
            and t.owner_user_id = auth.uid()
            and t.deleted_at is null
        )
      );
    $p$, tn);
  end loop;
end $$;

-- RPC: ensure tenant + business for the logged-in user
create or replace function public.provision_tenant(business_name text default 'Usaha Baru')
returns table (tenant_id uuid, business_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  t_id uuid;
  b_id uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  select id into t_id
  from public.tenants
  where owner_user_id = uid and deleted_at is null
  order by created_at asc
  limit 1;

  if t_id is null then
    insert into public.tenants (owner_user_id, name, slug, data)
    values (uid, 'Tenant', 'tenant-' || substr(replace(gen_random_uuid()::text,'-',''),1,8), '{}'::jsonb)
    returning id into t_id;
  end if;

  select id into b_id
  from public.businesses
  where tenant_id = t_id and deleted_at is null
  order by created_at asc
  limit 1;

  if b_id is null then
    insert into public.businesses (tenant_id, name, data)
    values (t_id, business_name, '{}'::jsonb)
    returning id into b_id;
  end if;

  return query select t_id, b_id;
end;
$$;

-- Allow authenticated users to call RPC
revoke all on function public.provision_tenant(text) from public;
grant execute on function public.provision_tenant(text) to authenticated;

commit;

