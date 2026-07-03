-- Share holdings: ticker, quantity, and purchase price. Live prices are
-- fetched at read time by the app (not stored) via a swappable price
-- provider — see src/lib/price-providers/.

create table if not exists public.shares (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  ticker          text not null,
  quantity        numeric(14, 4) not null,
  purchase_price  numeric(12, 4) not null,
  purchase_date   date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists shares_user_idx on public.shares (user_id);

alter table public.shares enable row level security;
create policy "shares_owner" on public.shares
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger shares_updated_at before update on public.shares
  for each row execute function public.set_updated_at();
