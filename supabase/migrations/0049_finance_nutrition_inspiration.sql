-- Capture reels/guides for finance and nutrition, same shape as
-- health_inspiration (migration 0041).

create table if not exists public.finance_inspiration (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null default 'reel',  -- reel | guide
  title       text not null,
  url         text,
  image_url   text,
  source      text,
  content     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists finance_inspiration_user_idx on public.finance_inspiration (user_id);
alter table public.finance_inspiration enable row level security;
create policy "finance_inspiration_owner" on public.finance_inspiration
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger finance_inspiration_updated_at before update on public.finance_inspiration
  for each row execute function public.set_updated_at();

create table if not exists public.nutrition_inspiration (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null default 'reel',  -- reel | guide
  title       text not null,
  url         text,
  image_url   text,
  source      text,
  content     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists nutrition_inspiration_user_idx on public.nutrition_inspiration (user_id);
alter table public.nutrition_inspiration enable row level security;
create policy "nutrition_inspiration_owner" on public.nutrition_inspiration
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger nutrition_inspiration_updated_at before update on public.nutrition_inspiration
  for each row execute function public.set_updated_at();
