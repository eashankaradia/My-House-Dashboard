alter table public.bills add column if not exists end_date date;
alter table public.bills add column if not exists account_id uuid;

create table if not exists public.payment_accounts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  owner_user_id uuid references auth.users (id) on delete set null,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.bills
  drop constraint if exists bills_account_id_fkey;
alter table public.bills
  add constraint bills_account_id_fkey
  foreign key (account_id) references public.payment_accounts (id) on delete set null;

create table if not exists public.bill_payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  bill_id         uuid not null references public.bills (id) on delete cascade,
  account_id      uuid references public.payment_accounts (id) on delete set null,
  payment_date    date not null default current_date,
  expected_amount numeric(12,2) not null default 0,
  actual_amount   numeric(12,2),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists payment_accounts_user_idx on public.payment_accounts (user_id);
create index if not exists bill_payments_bill_date_idx on public.bill_payments (bill_id, payment_date desc);

drop trigger if exists set_updated_at on public.payment_accounts;
create trigger set_updated_at before update on public.payment_accounts
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.bill_payments;
create trigger set_updated_at before update on public.bill_payments
  for each row execute function public.set_updated_at();

alter table public.payment_accounts enable row level security;
alter table public.bill_payments enable row level security;

drop policy if exists "hh_select" on public.payment_accounts;
create policy "hh_select" on public.payment_accounts for select
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "hh_insert" on public.payment_accounts;
create policy "hh_insert" on public.payment_accounts for insert with check (auth.uid() = user_id);
drop policy if exists "hh_update" on public.payment_accounts;
create policy "hh_update" on public.payment_accounts for update
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "hh_delete" on public.payment_accounts;
create policy "hh_delete" on public.payment_accounts for delete
  using (auth.uid() = user_id or public.same_household(user_id));

drop policy if exists "hh_select" on public.bill_payments;
create policy "hh_select" on public.bill_payments for select
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "hh_insert" on public.bill_payments;
create policy "hh_insert" on public.bill_payments for insert with check (auth.uid() = user_id);
drop policy if exists "hh_update" on public.bill_payments;
create policy "hh_update" on public.bill_payments for update
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "hh_delete" on public.bill_payments;
create policy "hh_delete" on public.bill_payments for delete
  using (auth.uid() = user_id or public.same_household(user_id));

drop trigger if exists log_activity on public.payment_accounts;
create trigger log_activity after insert or update or delete on public.payment_accounts
  for each row execute function public.log_activity();
drop trigger if exists log_activity on public.bill_payments;
create trigger log_activity after insert or update or delete on public.bill_payments
  for each row execute function public.log_activity();
