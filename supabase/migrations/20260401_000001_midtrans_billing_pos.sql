-- Midtrans Billing + POS QRIS tables (Supabase Postgres)
-- Source-of-truth for payment/subscription state (server-side only)

begin;

create extension if not exists pgcrypto;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_context') then
    create type public.payment_context as enum ('SUBSCRIPTION', 'POS');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_order_status') then
    create type public.payment_order_status as enum ('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('ACTIVE', 'INACTIVE', 'PAST_DUE');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_plan') then
    create type public.subscription_plan as enum ('MONTHLY', 'LIFETIME');
  end if;
end $$;

-- Payment orders
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  context public.payment_context not null,
  order_id text not null unique,
  tenant_id uuid references public.tenants(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  pos_transaction_id text,
  invoice_number text,
  gross_amount numeric not null,
  currency text not null default 'IDR',
  status public.payment_order_status not null default 'PENDING',
  midtrans_transaction_id text,
  payment_type text,
  acquirer text,
  qr_string text,
  qr_url text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payment_orders_context_idx on public.payment_orders(context);
create index if not exists payment_orders_business_idx on public.payment_orders(business_id);
create index if not exists payment_orders_status_idx on public.payment_orders(status);

-- Reuse updated_at trigger if exists
do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    drop trigger if exists trg_payment_orders_updated_at on public.payment_orders;
    create trigger trg_payment_orders_updated_at
    before update on public.payment_orders
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- Payment events (webhook log)
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id text,
  received_at timestamptz not null default now(),
  signature_verified boolean not null default false,
  transaction_status text,
  status_code text,
  gross_amount text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists payment_events_order_id_idx on public.payment_events(order_id);
create index if not exists payment_events_received_at_idx on public.payment_events(received_at);

-- Subscriptions (simple entitlements)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  tenant_id uuid references public.tenants(id) on delete set null,
  status public.subscription_status not null default 'INACTIVE',
  plan public.subscription_plan not null,
  valid_until timestamptz,
  activated_at timestamptz,
  last_payment_order_id text references public.payment_orders(order_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
    create trigger trg_subscriptions_updated_at
    before update on public.subscriptions
    for each row execute function public.set_updated_at();
  end if;
end $$;

create index if not exists subscriptions_tenant_id_idx on public.subscriptions(tenant_id);
create index if not exists subscriptions_owner_user_id_idx on public.subscriptions(owner_user_id);

-- RLS: only service role should write these tables (frontend should not access directly).
alter table public.payment_orders enable row level security;
alter table public.payment_events enable row level security;
alter table public.subscriptions enable row level security;

-- Deny by default. (No select/insert/update policies created.)

commit;

