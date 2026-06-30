-- Split a bill's cost between household members. Each contributor has either
-- a fixed amount or is the "remainder" payer (amount = null). Date-ranged so
-- changes (e.g. Neelam's £900 becoming £950) are tracked as new rows rather
-- than overwritten.

create table if not exists public.bill_contributors (
  id          uuid primary key default gen_random_uuid(),
  bill_id     uuid not null references public.bills(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,   -- creator, for RLS/attribution
  member_id   uuid not null references auth.users(id) on delete cascade,  -- who is contributing
  amount      numeric(12, 2),                                              -- null = contributes the rest
  start_date  date,
  end_date    date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists bill_contributors_bill_idx on public.bill_contributors (bill_id);
create index if not exists bill_contributors_member_idx on public.bill_contributors (member_id);

alter table public.bill_contributors enable row level security;

create policy "hh_select" on public.bill_contributors for select
  using (auth.uid() = user_id or public.same_household(user_id));
create policy "hh_insert" on public.bill_contributors for insert
  with check (auth.uid() = user_id);
create policy "hh_update" on public.bill_contributors for update
  using (auth.uid() = user_id or public.same_household(user_id));
create policy "hh_delete" on public.bill_contributors for delete
  using (auth.uid() = user_id or public.same_household(user_id));

create trigger bill_contributors_updated_at before update on public.bill_contributors
  for each row execute function public.set_updated_at();
