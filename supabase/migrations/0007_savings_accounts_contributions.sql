-- =====================================================================
-- Migration 0007 — savings accounts + contributions ledger.
--
-- Adds two tables so a pot can hold money across more than one account
-- and track its balance over time:
--   * savings_accounts      — named accounts inside a pot (Marcus, ISA…)
--   * savings_contributions — dated ledger of deposits / withdrawals
--
-- The pot's stored `current_amount` stays the running total; each
-- contribution adjusts it. An account's balance is derived from the sum
-- of its contributions. Contributions can be back-dated (occurred_on).
--
-- Run in the Supabase SQL editor (clear the box first). Safe to re-run.
-- =====================================================================

create table if not exists public.savings_accounts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  pot_id     uuid not null references public.savings_pots (id) on delete cascade,
  name       text not null,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.savings_contributions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  pot_id      uuid not null references public.savings_pots (id) on delete cascade,
  account_id  uuid references public.savings_accounts (id) on delete set null,
  amount      numeric(12,2) not null,        -- signed: + deposit, − withdrawal
  occurred_on date not null default current_date,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists savings_accounts_pot_idx on public.savings_accounts (pot_id);
create index if not exists savings_contributions_pot_idx on public.savings_contributions (pot_id);
create index if not exists savings_contributions_account_idx on public.savings_contributions (account_id);
create index if not exists savings_contributions_date_idx on public.savings_contributions (occurred_on);

-- updated_at trigger for accounts (contributions are append-only).
drop trigger if exists set_updated_at on public.savings_accounts;
create trigger set_updated_at before update on public.savings_accounts
  for each row execute function public.set_updated_at();

-- Row Level Security — owner OR household member (same as every other table).
do $$
declare t text;
begin
  foreach t in array array['savings_accounts','savings_contributions']
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists "hh_select" on public.%I;', t);
    execute format(
      'create policy "hh_select" on public.%I for select
         using (auth.uid() = user_id or public.is_household_member());', t);

    execute format('drop policy if exists "hh_insert" on public.%I;', t);
    execute format(
      'create policy "hh_insert" on public.%I for insert with check (auth.uid() = user_id);', t);

    execute format('drop policy if exists "hh_update" on public.%I;', t);
    execute format(
      'create policy "hh_update" on public.%I for update
         using (auth.uid() = user_id or public.is_household_member());', t);

    execute format('drop policy if exists "hh_delete" on public.%I;', t);
    execute format(
      'create policy "hh_delete" on public.%I for delete
         using (auth.uid() = user_id or public.is_household_member());', t);
  end loop;
end;
$$;
