-- =====================================================================
-- Migration 0009 — task assignees, purchase favourites, archiving.
--
--  * project_tasks.assigned_to  — assign a task to a household member
--  * archived_at columns        — archive tasks / projects / purchases
--  * purchase_stars             — per-user "favourite" stars (who starred what)
--
-- Run in the Supabase SQL editor (clear the box first). Safe to re-run.
-- =====================================================================

-- Task assignee + archiving -------------------------------------------------
alter table public.project_tasks add column if not exists assigned_to uuid references auth.users (id) on delete set null;
alter table public.project_tasks add column if not exists archived_at timestamptz;

-- Archiving for projects and purchases -------------------------------------
alter table public.projects  add column if not exists archived_at timestamptz;
alter table public.purchases add column if not exists archived_at timestamptz;

-- Purchase favourites — each member can star a purchase; we can show who. ----
create table if not exists public.purchase_stars (
  id          uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (purchase_id, user_id)
);
create index if not exists purchase_stars_purchase_idx on public.purchase_stars (purchase_id);

alter table public.purchase_stars enable row level security;

-- Everyone in the household can see the stars; you only add/remove your own.
drop policy if exists "stars_select" on public.purchase_stars;
create policy "stars_select" on public.purchase_stars for select
  using (auth.uid() = user_id or public.same_household(user_id));

drop policy if exists "stars_insert" on public.purchase_stars;
create policy "stars_insert" on public.purchase_stars for insert
  with check (auth.uid() = user_id);

drop policy if exists "stars_delete" on public.purchase_stars;
create policy "stars_delete" on public.purchase_stars for delete
  using (auth.uid() = user_id);
