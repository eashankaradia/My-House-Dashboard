-- Milestone 3: Finance — personal budget tracking and income settings
-- finance_settings: one row per user (monthly income + label)
-- budgets: monthly spend limits per category per user

create table if not exists finance_settings (
  id             uuid         primary key default gen_random_uuid(),
  user_id        uuid         not null unique references auth.users(id) on delete cascade,
  monthly_income numeric(12, 2),
  income_label   text         not null default 'Monthly income',
  updated_at     timestamptz  not null default now()
);

alter table finance_settings enable row level security;
create policy "Users manage own finance settings" on finance_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists budgets (
  id            uuid         primary key default gen_random_uuid(),
  user_id       uuid         not null references auth.users(id) on delete cascade,
  category      text         not null,
  monthly_limit numeric(12, 2) not null default 0,
  notes         text,
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now(),
  unique (user_id, category)
);

alter table budgets enable row level security;
create policy "Users manage own budgets" on budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger set_finance_settings_updated_at
  before update on finance_settings
  for each row execute function set_updated_at();

create trigger set_budgets_updated_at
  before update on budgets
  for each row execute function set_updated_at();
