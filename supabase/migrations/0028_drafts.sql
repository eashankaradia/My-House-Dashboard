-- Drafts: a place to jot something half-formed and finish it later. A draft is
-- tagged with the kind of thing it will become (purchase, idea, task…).

create table if not exists public.drafts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null default 'note',
  title      text not null,
  notes      text,
  image_url  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists drafts_created_idx on public.drafts (created_at desc);

drop trigger if exists set_updated_at on public.drafts;
create trigger set_updated_at before update on public.drafts
  for each row execute function public.set_updated_at();

alter table public.drafts enable row level security;
drop policy if exists "drafts_select" on public.drafts;
create policy "drafts_select" on public.drafts for select
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "drafts_insert" on public.drafts;
create policy "drafts_insert" on public.drafts for insert with check (auth.uid() = user_id);
drop policy if exists "drafts_update" on public.drafts;
create policy "drafts_update" on public.drafts for update
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "drafts_delete" on public.drafts;
create policy "drafts_delete" on public.drafts for delete
  using (auth.uid() = user_id or public.same_household(user_id));
