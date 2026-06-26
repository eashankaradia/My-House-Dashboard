-- =====================================================================
-- Migration 0022 — comments, read tracking and reactions.
--
-- Generic, polymorphic tables so any item across the app (inspiration,
-- purchases, projects, tasks, bills…) can carry a comment thread and
-- emoji reactions. `comment_reads` tracks when each user last opened a
-- thread, which powers unread counts and (for inspiration) "seen" sorting.
--
-- Run in the Supabase SQL editor (clear the box first). Safe to re-run.
-- =====================================================================

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  entity_type text not null,
  entity_id   uuid not null,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists comments_entity_idx on public.comments (entity_type, entity_id, created_at);

alter table public.comments enable row level security;
drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments for select
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert" on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists "comments_delete" on public.comments;
create policy "comments_delete" on public.comments for delete
  using (auth.uid() = user_id or public.same_household(user_id));

create table if not exists public.comment_reads (
  user_id      uuid not null references auth.users (id) on delete cascade,
  entity_type  text not null,
  entity_id    uuid not null,
  last_read_at timestamptz not null default now(),
  primary key (user_id, entity_type, entity_id)
);
alter table public.comment_reads enable row level security;
drop policy if exists "comment_reads_own" on public.comment_reads;
create policy "comment_reads_own" on public.comment_reads for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.reactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  entity_type text not null,
  entity_id   uuid not null,
  emoji       text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, entity_type, entity_id, emoji)
);
create index if not exists reactions_entity_idx on public.reactions (entity_type, entity_id);
alter table public.reactions enable row level security;
drop policy if exists "reactions_select" on public.reactions;
create policy "reactions_select" on public.reactions for select
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "reactions_insert" on public.reactions;
create policy "reactions_insert" on public.reactions for insert with check (auth.uid() = user_id);
drop policy if exists "reactions_delete" on public.reactions;
create policy "reactions_delete" on public.reactions for delete using (auth.uid() = user_id);
