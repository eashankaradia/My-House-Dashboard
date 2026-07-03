-- Private section: a personal-only area (never shared with the household)
-- for the journal, freeform private notes, and private photos — plus
-- per-exercise reference links (multiple per exercise, alongside the
-- existing per-muscle-group links).

-- ─── Exercise links (multiple links per exercise) ──────────────────────────
create table if not exists public.exercise_links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  exercise_id uuid references public.exercises (id) on delete cascade not null,
  url         text not null,
  label       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists exercise_links_exercise_idx on public.exercise_links (exercise_id);

alter table public.exercise_links enable row level security;
create policy "exercise_links_owner" on public.exercise_links
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger exercise_links_updated_at before update on public.exercise_links
  for each row execute function public.set_updated_at();

-- ─── Private notes ──────────────────────────────────────────────────────────
-- Distinct from the shared "Notes & links" (documents/category=Note) — these
-- never become visible to other household members.
create table if not exists public.private_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  title      text not null,
  content    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists private_notes_user_idx on public.private_notes (user_id, created_at desc);

alter table public.private_notes enable row level security;
create policy "private_notes_owner" on public.private_notes
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger private_notes_updated_at before update on public.private_notes
  for each row execute function public.set_updated_at();

-- ─── Private photos ─────────────────────────────────────────────────────────
-- Distinct from the shared "Photos" shoebox (quick_photos) — stored in the
-- private `documents` storage bucket (owner-only folder policy already in
-- place) rather than the public `images` bucket, and never visible to other
-- household members.
create table if not exists public.private_photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  file_path  text not null,
  caption    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists private_photos_user_idx on public.private_photos (user_id, created_at desc);

alter table public.private_photos enable row level security;
create policy "private_photos_owner" on public.private_photos
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger private_photos_updated_at before update on public.private_photos
  for each row execute function public.set_updated_at();
