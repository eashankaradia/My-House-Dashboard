-- Household-editable room list. When empty, the app falls back to the built-in
-- default rooms; the first add/remove seeds the defaults into this table so it
-- becomes the source of truth.

create table if not exists public.rooms (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
create index if not exists rooms_name_idx on public.rooms (name);

alter table public.rooms enable row level security;
drop policy if exists "rooms_select" on public.rooms;
create policy "rooms_select" on public.rooms for select
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "rooms_insert" on public.rooms;
create policy "rooms_insert" on public.rooms for insert with check (auth.uid() = user_id);
drop policy if exists "rooms_delete" on public.rooms;
create policy "rooms_delete" on public.rooms for delete
  using (auth.uid() = user_id or public.same_household(user_id));
