-- Weekly/monthly reviews — a lightweight GTD-style review flow. Both period
-- types share one shape (went_well/stuck/stop_doing/priorities); the UI
-- labels the prompts differently per type and shows a data rollup alongside.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('weekly', 'monthly')),
  period_start date not null,
  went_well text,
  stuck text,
  stop_doing text,
  priorities text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_type, period_start)
);

alter table public.reviews enable row level security;

create policy "reviews_select_own" on public.reviews
  for select using (auth.uid() = user_id);
create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() = user_id);
create policy "reviews_update_own" on public.reviews
  for update using (auth.uid() = user_id);
create policy "reviews_delete_own" on public.reviews
  for delete using (auth.uid() = user_id);
