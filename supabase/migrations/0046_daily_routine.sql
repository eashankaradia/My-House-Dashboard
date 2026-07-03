-- A daily routine checklist: items grouped into sections (what to consume,
-- what to do for mind/body, and a time-of-day routine), each toggled done
-- per day. Presence of a completion row = done for that date.

create table if not exists public.routine_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  section     text not null,  -- consume | mind | body | morning | day | evening
  name        text not null,
  order_index int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists routine_items_user_idx on public.routine_items (user_id, section, order_index);
alter table public.routine_items enable row level security;
create policy "routine_items_owner" on public.routine_items
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.routine_completions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  item_id         uuid not null references public.routine_items(id) on delete cascade,
  completed_date  date not null,
  created_at      timestamptz not null default now(),
  unique (item_id, completed_date)
);
create index if not exists routine_completions_date_idx on public.routine_completions (user_id, completed_date);
alter table public.routine_completions enable row level security;
create policy "routine_completions_owner" on public.routine_completions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger routine_items_updated_at before update on public.routine_items
  for each row execute function public.set_updated_at();
