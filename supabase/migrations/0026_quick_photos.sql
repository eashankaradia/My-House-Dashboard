-- Quick photos: snap something now, label it later. A simple shared shoebox of
-- miscellaneous photos.

create table if not exists public.quick_photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  image_url  text not null,
  label      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quick_photos_created_idx on public.quick_photos (created_at desc);

drop trigger if exists set_updated_at on public.quick_photos;
create trigger set_updated_at before update on public.quick_photos
  for each row execute function public.set_updated_at();

alter table public.quick_photos enable row level security;
drop policy if exists "quick_photos_select" on public.quick_photos;
create policy "quick_photos_select" on public.quick_photos for select
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "quick_photos_insert" on public.quick_photos;
create policy "quick_photos_insert" on public.quick_photos for insert with check (auth.uid() = user_id);
drop policy if exists "quick_photos_update" on public.quick_photos;
create policy "quick_photos_update" on public.quick_photos for update
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "quick_photos_delete" on public.quick_photos;
create policy "quick_photos_delete" on public.quick_photos for delete
  using (auth.uid() = user_id or public.same_household(user_id));
