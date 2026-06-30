-- Finance overhaul: credit cards + statements, a proper income log (fixed
-- salary details + monthly net income/bonus with carry-forward), and
-- recurring pot contribution schedules with month overrides.

-- ─────────────────────────────────────────────────────────────────────────
-- Credit cards (personal, like finance_settings/budgets)
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.credit_cards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  last4         text,
  statement_day int,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists credit_cards_user_idx on public.credit_cards (user_id);
alter table public.credit_cards enable row level security;
create policy "credit_cards_owner" on public.credit_cards
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.credit_card_statements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  card_id         uuid not null references public.credit_cards(id) on delete cascade,
  statement_month date not null,
  amount          numeric(12, 2) not null,
  is_paid         boolean not null default false,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (card_id, statement_month)
);
create index if not exists credit_card_statements_card_idx on public.credit_card_statements (card_id);
alter table public.credit_card_statements enable row level security;
create policy "credit_card_statements_owner" on public.credit_card_statements
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Income: fixed salary details + a monthly net income/bonus log
-- ─────────────────────────────────────────────────────────────────────────

alter table public.finance_settings add column if not exists annual_salary numeric(12, 2);
alter table public.finance_settings add column if not exists employer text;
alter table public.finance_settings add column if not exists salary_notes text;

create table if not exists public.income_months (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  month       date not null,
  net_income  numeric(12, 2) not null default 0,
  bonus       numeric(12, 2) not null default 0,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, month)
);
create index if not exists income_months_user_idx on public.income_months (user_id, month desc);
alter table public.income_months enable row level security;
create policy "income_months_owner" on public.income_months
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Pot contribution schedules (household-shared, like savings_pots)
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.pot_contribution_schedules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  pot_id      uuid not null references public.savings_pots(id) on delete cascade,
  amount      numeric(12, 2) not null,
  start_date  date,
  end_date    date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists pot_contribution_schedules_pot_idx on public.pot_contribution_schedules (pot_id);
alter table public.pot_contribution_schedules enable row level security;
create policy "hh_select" on public.pot_contribution_schedules for select
  using (auth.uid() = user_id or public.same_household(user_id));
create policy "hh_insert" on public.pot_contribution_schedules for insert
  with check (auth.uid() = user_id);
create policy "hh_update" on public.pot_contribution_schedules for update
  using (auth.uid() = user_id or public.same_household(user_id));
create policy "hh_delete" on public.pot_contribution_schedules for delete
  using (auth.uid() = user_id or public.same_household(user_id));

create table if not exists public.pot_contribution_overrides (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  pot_id      uuid not null references public.savings_pots(id) on delete cascade,
  month       date not null,
  amount      numeric(12, 2) not null,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (pot_id, month)
);
create index if not exists pot_contribution_overrides_pot_idx on public.pot_contribution_overrides (pot_id);
alter table public.pot_contribution_overrides enable row level security;
create policy "hh_select" on public.pot_contribution_overrides for select
  using (auth.uid() = user_id or public.same_household(user_id));
create policy "hh_insert" on public.pot_contribution_overrides for insert
  with check (auth.uid() = user_id);
create policy "hh_update" on public.pot_contribution_overrides for update
  using (auth.uid() = user_id or public.same_household(user_id));
create policy "hh_delete" on public.pot_contribution_overrides for delete
  using (auth.uid() = user_id or public.same_household(user_id));

-- ─────────────────────────────────────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────────────────────────────────────

create trigger credit_cards_updated_at            before update on public.credit_cards            for each row execute function public.set_updated_at();
create trigger credit_card_statements_updated_at   before update on public.credit_card_statements   for each row execute function public.set_updated_at();
create trigger income_months_updated_at            before update on public.income_months            for each row execute function public.set_updated_at();
create trigger pot_contribution_schedules_updated_at before update on public.pot_contribution_schedules for each row execute function public.set_updated_at();
