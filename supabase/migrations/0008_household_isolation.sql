-- =====================================================================
-- Migration 0008 — per-household isolation.
--
-- Until now every household member could see every row, because
-- is_household_member() only checked "am I a member at all". That makes a
-- separate demo account impossible (it would see your data and vice versa).
--
-- This scopes sharing to an actual household: members get a household_id,
-- and a row is visible to you only if you OWN it or SHARE A HOUSEHOLD with
-- its owner. Existing members are backfilled into one shared household, so
-- you + Neelam keep sharing exactly as before.
--
-- Run in the Supabase SQL editor (clear the box first). Safe to re-run.
-- =====================================================================

-- 1) Group column on members.
alter table public.household_members add column if not exists household_id uuid;

-- 2) Backfill everyone who's already a member into ONE shared household.
do $$
declare hid uuid;
begin
  select household_id into hid from public.household_members where household_id is not null limit 1;
  if hid is null then hid := gen_random_uuid(); end if;
  update public.household_members set household_id = hid where household_id is null;
end $$;

-- 3) New members default to their own fresh household (isolated by default).
alter table public.household_members alter column household_id set default gen_random_uuid();
alter table public.household_members alter column household_id set not null;

-- 4) "Do we share a household?" — replaces the global is_household_member()
--    for row visibility. SECURITY DEFINER so the inner read bypasses RLS
--    (no recursion), exactly like the old helper.
create or replace function public.same_household(target uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members me
    join public.household_members them on them.household_id = me.household_id
    where me.user_id = auth.uid()
      and them.user_id = target
  );
$$;

-- 5) Re-apply RLS on every data table: owner OR same-household.
do $$
declare t text;
begin
  foreach t in array array[
    'bills','mortgages','savings_pots','savings_accounts','savings_contributions',
    'collections','inspiration','projects','purchases','purchase_options',
    'project_tasks','maintenance_tasks','documents'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists "hh_select" on public.%I;', t);
    execute format('create policy "hh_select" on public.%I for select
      using (auth.uid() = user_id or public.same_household(user_id));', t);

    execute format('drop policy if exists "hh_insert" on public.%I;', t);
    execute format('create policy "hh_insert" on public.%I for insert
      with check (auth.uid() = user_id);', t);

    execute format('drop policy if exists "hh_update" on public.%I;', t);
    execute format('create policy "hh_update" on public.%I for update
      using (auth.uid() = user_id or public.same_household(user_id));', t);

    execute format('drop policy if exists "hh_delete" on public.%I;', t);
    execute format('create policy "hh_delete" on public.%I for delete
      using (auth.uid() = user_id or public.same_household(user_id));', t);
  end loop;
end $$;

-- 6) Members list: only people in your own household.
drop policy if exists "members_read" on public.household_members;
create policy "members_read" on public.household_members for select
  using (auth.uid() = user_id or public.same_household(user_id));

-- 7) Change log: only your own household's activity.
drop policy if exists "activity_select" on public.activity_log;
create policy "activity_select" on public.activity_log for select
  using (auth.uid() = user_id or public.same_household(user_id));
