-- =====================================================================
-- Migration 0018 — groceries / shopping list.
--
-- A simple shared shopping list: add items, tick them off once you've
-- got them (they sink to the bottom), or delete them. Shared across the
-- household like everything else.
--
-- Run in the Supabase SQL editor (clear the box first). Safe to re-run.
-- =====================================================================

create table if not exists public.shopping_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  quantity   text,
  category   text,
  is_got     boolean not null default false,
  got_at     timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shopping_items_created_idx on public.shopping_items (created_at desc);

drop trigger if exists set_updated_at on public.shopping_items;
create trigger set_updated_at before update on public.shopping_items
  for each row execute function public.set_updated_at();

alter table public.shopping_items enable row level security;

drop policy if exists "shopping_select" on public.shopping_items;
create policy "shopping_select" on public.shopping_items for select
  using (auth.uid() = user_id or public.same_household(user_id));

drop policy if exists "shopping_insert" on public.shopping_items;
create policy "shopping_insert" on public.shopping_items for insert with check (auth.uid() = user_id);

drop policy if exists "shopping_update" on public.shopping_items;
create policy "shopping_update" on public.shopping_items for update
  using (auth.uid() = user_id or public.same_household(user_id));

drop policy if exists "shopping_delete" on public.shopping_items;
create policy "shopping_delete" on public.shopping_items for delete
  using (auth.uid() = user_id or public.same_household(user_id));
