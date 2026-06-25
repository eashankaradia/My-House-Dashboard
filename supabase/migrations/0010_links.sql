-- =====================================================================
-- Migration 0010 — generic links between items.
--
-- Lets any of these reference any other: tasks, projects, purchases, bills
-- and inspiration. e.g. a task "Buy the sofa" can link to that purchase, or
-- a project can link to the ideas and bills behind it.
--
-- A link is an unordered pair (a_type,a_id) <-> (b_type,b_id). We don't use
-- foreign keys (the target lives in different tables); the app skips links
-- whose target no longer exists.
--
-- Run in the Supabase SQL editor (clear the box first). Safe to re-run.
-- =====================================================================

create table if not exists public.links (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  a_type     text not null check (a_type in ('task','project','purchase','bill','inspiration')),
  a_id       uuid not null,
  b_type     text not null check (b_type in ('task','project','purchase','bill','inspiration')),
  b_id       uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists links_a_idx on public.links (a_type, a_id);
create index if not exists links_b_idx on public.links (b_type, b_id);

alter table public.links enable row level security;

drop policy if exists "links_select" on public.links;
create policy "links_select" on public.links for select
  using (auth.uid() = user_id or public.same_household(user_id));

drop policy if exists "links_insert" on public.links;
create policy "links_insert" on public.links for insert with check (auth.uid() = user_id);

drop policy if exists "links_delete" on public.links;
create policy "links_delete" on public.links for delete
  using (auth.uid() = user_id or public.same_household(user_id));
