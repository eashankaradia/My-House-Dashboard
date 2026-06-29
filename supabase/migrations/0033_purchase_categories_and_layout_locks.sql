alter table public.purchases drop constraint if exists purchases_category_check;

create table if not exists public.purchase_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

insert into public.purchase_categories (user_id, name)
select distinct p.user_id, p.category
from public.purchases p
where p.category is not null
on conflict (user_id, name) do nothing;

alter table public.purchase_categories enable row level security;

drop policy if exists "purchase_categories_select" on public.purchase_categories;
create policy "purchase_categories_select" on public.purchase_categories
  for select to authenticated
  using ((select auth.uid()) = user_id or public.same_household(user_id));

drop policy if exists "purchase_categories_insert" on public.purchase_categories;
create policy "purchase_categories_insert" on public.purchase_categories
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "purchase_categories_delete" on public.purchase_categories;
create policy "purchase_categories_delete" on public.purchase_categories
  for delete to authenticated
  using ((select auth.uid()) = user_id);

alter table public.room_design_layout_items
  add column if not exists locked boolean not null default false;
