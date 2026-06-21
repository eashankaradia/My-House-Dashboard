-- =====================================================================
-- Migration 0003 — ranking, "Interesting" status, shared household with
-- attribution, and project sub-tasks.
-- Run this whole file in the Supabase SQL Editor (clear the box first).
-- Safe to run more than once.
-- =====================================================================

-- 1) Rank for purchase options (lower number = higher preference) -------
alter table public.purchase_options add column if not exists rank integer not null default 0;

-- 2) New "Interesting" purchase status ----------------------------------
alter table public.purchases drop constraint if exists purchases_status_check;
alter table public.purchases add constraint purchases_status_check
  check (status in ('Interesting','Considering','Shortlisted','Ready To Buy','Purchased'));

-- 3) Project sub-tasks ---------------------------------------------------
create table if not exists public.project_tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title      text not null,
  is_done    boolean not null default false,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_tasks_project_idx on public.project_tasks (project_id);

drop trigger if exists set_updated_at on public.project_tasks;
create trigger set_updated_at before update on public.project_tasks
  for each row execute function public.set_updated_at();

-- 4) Shared household + attribution -------------------------------------
-- Members of the same household can see and edit everything; each row keeps
-- its creator (user_id) so we can show "Added by …".
create table if not exists public.household_members (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at   timestamptz not null default now()
);
alter table public.household_members enable row level security;

create or replace function public.is_household_member()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.household_members where user_id = auth.uid());
$$;

drop policy if exists "members_read" on public.household_members;
create policy "members_read" on public.household_members for select
  using (auth.uid() = user_id or public.is_household_member());

-- 5) Re-apply RLS on every data table: owner OR household member --------
do $$
declare t text;
begin
  foreach t in array array[
    'bills','mortgages','savings_pots','collections','inspiration','projects',
    'purchases','purchase_options','project_tasks','maintenance_tasks','documents',
    'ai_conversations','ai_messages','ai_cost_estimates','ai_categorizations'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists "owner_select" on public.%I;', t);
    execute format('drop policy if exists "owner_insert" on public.%I;', t);
    execute format('drop policy if exists "owner_update" on public.%I;', t);
    execute format('drop policy if exists "owner_delete" on public.%I;', t);

    execute format('drop policy if exists "hh_select" on public.%I;', t);
    execute format('create policy "hh_select" on public.%I for select
      using (auth.uid() = user_id or public.is_household_member());', t);

    execute format('drop policy if exists "hh_insert" on public.%I;', t);
    execute format('create policy "hh_insert" on public.%I for insert
      with check (auth.uid() = user_id);', t);

    execute format('drop policy if exists "hh_update" on public.%I;', t);
    execute format('create policy "hh_update" on public.%I for update
      using (auth.uid() = user_id or public.is_household_member());', t);

    execute format('drop policy if exists "hh_delete" on public.%I;', t);
    execute format('create policy "hh_delete" on public.%I for delete
      using (auth.uid() = user_id or public.is_household_member());', t);
  end loop;
end;
$$;

-- 6) Seed the household with everyone who already has an account ---------
-- Re-run this after creating Neelam's user so she's added too. Display name
-- defaults to the capitalised part of the email before "@" (edit if you like).
insert into public.household_members (user_id, display_name)
select id, initcap(split_part(coalesce(email, 'member'), '@', 1))
from auth.users
on conflict (user_id) do nothing;
