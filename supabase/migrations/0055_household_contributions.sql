-- Household-wide contribution split (not tied to any single bill) — how much
-- each person puts toward the household's costs overall. Mirrors
-- bill_contributors' shape (fixed amount or "pays the rest", date-ranged).
create table if not exists public.household_contributions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  member_id   uuid not null references auth.users(id) on delete cascade,
  amount      numeric(12, 2),
  start_date  date,
  end_date    date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists household_contributions_member_idx on public.household_contributions (member_id);

alter table public.household_contributions enable row level security;

create policy "hh_select" on public.household_contributions for select
  using (auth.uid() = user_id or public.same_household(user_id));
create policy "hh_insert" on public.household_contributions for insert
  with check (auth.uid() = user_id);
create policy "hh_update" on public.household_contributions for update
  using (auth.uid() = user_id or public.same_household(user_id));
create policy "hh_delete" on public.household_contributions for delete
  using (auth.uid() = user_id or public.same_household(user_id));

create trigger household_contributions_updated_at before update on public.household_contributions
  for each row execute function public.set_updated_at();
