-- Capture health inspiration reels/videos and "how to be healthy" guides.

create table if not exists public.health_inspiration (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  kind        text not null default 'reel',  -- reel | guide
  title       text not null,
  url         text,
  image_url   text,
  source      text,
  content     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists health_inspiration_user_idx on public.health_inspiration (user_id);

alter table public.health_inspiration enable row level security;
create policy "health_inspiration_owner" on public.health_inspiration
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger health_inspiration_updated_at before update on public.health_inspiration
  for each row execute function public.set_updated_at();
