-- Business Creationality schema
-- Run in the Supabase SQL editor or with `supabase db push`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users: one row per auth user, created by trigger on signup
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'monthly', 'lifetime')),
  plan_status text not null default 'inactive',
  is_admin boolean not null default false,
  banned boolean not null default false,
  -- Stripe Connect (seller payouts)
  stripe_account_id text,
  stripe_connect_ready boolean not null default false,
  -- Email marketing integrations
  convertkit_api_key text,
  convertkit_form_id text,
  mailerlite_api_key text,
  mailerlite_group_id text,
  -- Custom domain for sales pages
  custom_domain text unique,
  created_at timestamptz not null default now()
);

-- Copy new auth users into public.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own profile but never billing, admin or ban columns
create or replace function public.protect_user_columns()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), 'service_role') <> 'service_role' then
    new.plan := old.plan;
    new.plan_status := old.plan_status;
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.stripe_account_id := old.stripe_account_id;
    new.stripe_connect_ready := old.stripe_connect_ready;
    new.is_admin := old.is_admin;
    new.banned := old.banned;
    new.email := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_user_columns on public.users;
create trigger protect_user_columns
  before update on public.users
  for each row execute function public.protect_user_columns();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  slug text not null unique,
  title text not null default 'Untitled product',
  subtitle text,
  description text,
  brand_colors jsonb not null default '{"primary":"#7C3AED","secondary":"#1F1B2E","accent":"#F5F3FF"}',
  font text not null default 'playfair-inter',
  cover_url text,
  cover_prompt text,
  cover_overlay boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sales_page_template text not null default 'classic',
  sales_page jsonb not null default '{}',
  views integer not null default 0,
  sales_count integer not null default 0,
  revenue_cents integer not null default 0,
  price_cents integer not null default 2700,
  currency text not null default 'usd',
  -- AI inputs and suggestions
  idea text,
  audience text,
  tone text,
  title_options jsonb not null default '[]',
  brand_names jsonb not null default '[]',
  brand_name text,
  color_suggestions jsonb not null default '[]',
  -- Delivery
  pdf_path text,
  pdf_generated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_user_id_idx on public.products(user_id);

-- ---------------------------------------------------------------------------
-- chapters
-- ---------------------------------------------------------------------------
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  chapter_number integer not null,
  title text not null,
  summary text,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, chapter_number)
);

-- ---------------------------------------------------------------------------
-- subscribers (buyers of a product)
-- ---------------------------------------------------------------------------
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  email text not null,
  name text,
  purchased_at timestamptz not null default now(),
  unique (product_id, email)
);

-- ---------------------------------------------------------------------------
-- sales
-- ---------------------------------------------------------------------------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_email text not null,
  buyer_name text,
  amount integer not null,                      -- cents charged to the buyer
  platform_fee integer not null default 0,      -- cents kept by the platform
  currency text not null default 'usd',
  stripe_payment_id text,                       -- payment intent id
  stripe_checkout_session_id text unique,
  payout_mode text not null default 'platform' check (payout_mode in ('connect', 'platform')),
  payout_status text not null default 'pending' check (payout_status in ('pending', 'paid', 'not_applicable')),
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists sales_product_id_idx on public.sales(product_id);

-- ---------------------------------------------------------------------------
-- page_views (daily analytics)
-- ---------------------------------------------------------------------------
create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists page_views_product_idx on public.page_views(product_id, viewed_at);

-- ---------------------------------------------------------------------------
-- payments: what creators pay the platform ($20/mo or $190 lifetime)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  kind text not null check (kind in ('monthly', 'lifetime')),
  amount integer not null,
  currency text not null default 'usd',
  stripe_payment_intent_id text,
  stripe_invoice_id text unique,
  stripe_checkout_session_id text unique,
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists chapters_touch on public.chapters;
create trigger chapters_touch before update on public.chapters
  for each row execute function public.touch_updated_at();

-- Atomic counters used by the webhook and the public page
create or replace function public.increment_product_views(p_product_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.products set views = views + 1 where id = p_product_id;
  insert into public.page_views (product_id) values (p_product_id);
$$;

create or replace function public.record_product_sale(p_product_id uuid, p_amount integer)
returns void language sql security definer set search_path = public as $$
  update public.products
     set sales_count = sales_count + 1,
         revenue_cents = revenue_cents + p_amount
   where id = p_product_id;
$$;

create or replace function public.reverse_product_sale(p_product_id uuid, p_amount integer)
returns void language sql security definer set search_path = public as $$
  update public.products
     set sales_count = greatest(sales_count - 1, 0),
         revenue_cents = greatest(revenue_cents - p_amount, 0)
   where id = p_product_id;
$$;

revoke execute on function public.increment_product_views(uuid) from public, anon, authenticated;
revoke execute on function public.record_product_sale(uuid, integer) from public, anon, authenticated;
revoke execute on function public.reverse_product_sale(uuid, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- Public sales pages, webhooks and admin screens run on the server with the
-- service role key, so anonymous visitors get no direct table access.
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.chapters enable row level security;
alter table public.subscribers enable row level security;
alter table public.sales enable row level security;
alter table public.page_views enable row level security;
alter table public.payments enable row level security;

drop policy if exists "users read own" on public.users;
create policy "users read own" on public.users for select using (auth.uid() = id);
drop policy if exists "users update own" on public.users;
create policy "users update own" on public.users for update using (auth.uid() = id);

drop policy if exists "products owner all" on public.products;
create policy "products owner all" on public.products for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "chapters owner all" on public.chapters;
create policy "chapters owner all" on public.chapters for all
  using (exists (select 1 from public.products p where p.id = product_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.products p where p.id = product_id and p.user_id = auth.uid()));

drop policy if exists "subscribers owner read" on public.subscribers;
create policy "subscribers owner read" on public.subscribers for select
  using (exists (select 1 from public.products p where p.id = product_id and p.user_id = auth.uid()));

drop policy if exists "sales owner read" on public.sales;
create policy "sales owner read" on public.sales for select
  using (exists (select 1 from public.products p where p.id = product_id and p.user_id = auth.uid()));

drop policy if exists "page_views owner read" on public.page_views;
create policy "page_views owner read" on public.page_views for select
  using (exists (select 1 from public.products p where p.id = product_id and p.user_id = auth.uid()));

drop policy if exists "payments owner read" on public.payments;
create policy "payments owner read" on public.payments for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: covers are public images, ebooks stay private (signed URLs only)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('ebooks', 'ebooks', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Daily analytics for the signed-in creator (last N days)
-- ---------------------------------------------------------------------------
create or replace function public.creator_daily_stats(p_days integer default 30, p_product_id uuid default null)
returns table (day date, views bigint, sales bigint, revenue bigint, subscribers bigint)
language sql
stable
security definer
set search_path = public
as $$
  with mine as (
    select id from public.products
     where user_id = auth.uid() and (p_product_id is null or id = p_product_id)
  ),
  days as (
    select generate_series(current_date - (p_days - 1), current_date, interval '1 day')::date as day
  )
  select
    d.day,
    (select count(*) from public.page_views v where v.product_id in (select id from mine) and v.viewed_at::date = d.day),
    (select count(*) from public.sales s where s.product_id in (select id from mine) and s.status = 'paid' and s.created_at::date = d.day),
    (select coalesce(sum(s.amount), 0) from public.sales s where s.product_id in (select id from mine) and s.status = 'paid' and s.created_at::date = d.day),
    (select count(*) from public.subscribers b where b.product_id in (select id from mine) and b.purchased_at::date = d.day)
  from days d
  order by d.day;
$$;

grant execute on function public.creator_daily_stats(integer, uuid) to authenticated;

-- Platform totals for the admin panel
create or replace function public.admin_daily_revenue(p_days integer default 30)
returns table (day date, plan_revenue bigint, sales_volume bigint, platform_fees bigint, signups bigint)
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select generate_series(current_date - (p_days - 1), current_date, interval '1 day')::date as day
  )
  select
    d.day,
    (select coalesce(sum(amount), 0) from public.payments p where p.status = 'paid' and p.created_at::date = d.day),
    (select coalesce(sum(amount), 0) from public.sales s where s.status = 'paid' and s.created_at::date = d.day),
    (select coalesce(sum(platform_fee), 0) from public.sales s where s.status = 'paid' and s.created_at::date = d.day),
    (select count(*) from public.users u where u.created_at::date = d.day)
  from days d
  order by d.day;
$$;

revoke execute on function public.admin_daily_revenue(integer) from public, anon, authenticated;

create or replace function public.admin_totals()
returns table (
  users bigint,
  paying_users bigint,
  products bigint,
  published_products bigint,
  plan_revenue bigint,
  sales_count bigint,
  sales_volume bigint,
  platform_fees bigint,
  pending_payouts bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.users),
    (select count(*) from public.users where plan = 'lifetime' or (plan = 'monthly' and plan_status in ('active', 'trialing', 'past_due'))),
    (select count(*) from public.products),
    (select count(*) from public.products where status = 'published'),
    (select coalesce(sum(amount), 0) from public.payments where status = 'paid'),
    (select count(*) from public.sales where status = 'paid'),
    (select coalesce(sum(amount), 0) from public.sales where status = 'paid'),
    (select coalesce(sum(platform_fee), 0) from public.sales where status = 'paid'),
    (select coalesce(sum(amount - platform_fee), 0) from public.sales where status = 'paid' and payout_mode = 'platform' and payout_status = 'pending');
$$;

revoke execute on function public.admin_totals() from public, anon, authenticated;
