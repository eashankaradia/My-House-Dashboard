-- Adds the purchase_options table so each wishlist item can have multiple
-- competing products/options to compare (e.g. three sofas under one "Sofa").
-- Run this in the Supabase SQL Editor. Safe to run more than once.

create table if not exists public.purchase_options (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  name        text not null,
  store       text,
  url         text,
  price       numeric(12,2) not null default 0,
  image_url   text,
  notes       text,
  is_chosen   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists purchase_options_purchase_idx on public.purchase_options (purchase_id);

alter table public.purchase_options enable row level security;

drop policy if exists "owner_select" on public.purchase_options;
create policy "owner_select" on public.purchase_options for select using (auth.uid() = user_id);

drop policy if exists "owner_insert" on public.purchase_options;
create policy "owner_insert" on public.purchase_options for insert with check (auth.uid() = user_id);

drop policy if exists "owner_update" on public.purchase_options;
create policy "owner_update" on public.purchase_options for update using (auth.uid() = user_id);

drop policy if exists "owner_delete" on public.purchase_options;
create policy "owner_delete" on public.purchase_options for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.purchase_options;
create trigger set_updated_at before update on public.purchase_options
  for each row execute function public.set_updated_at();
