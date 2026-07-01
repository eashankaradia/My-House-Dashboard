-- Save reference links (e.g. Instagram tutorials) per muscle group, so
-- "how do I grow this muscle" guides live right next to what you train.
create table if not exists public.muscle_links (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  muscle_group text not null,
  url          text not null,
  label        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists muscle_links_user_idx on public.muscle_links (user_id);

alter table public.muscle_links enable row level security;
create policy "muscle_links_owner" on public.muscle_links
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger muscle_links_updated_at before update on public.muscle_links
  for each row execute function public.set_updated_at();
