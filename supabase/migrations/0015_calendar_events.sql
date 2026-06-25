-- =====================================================================
-- Migration 0015 — custom calendar events.
--
-- Lets a user add their own dated events to the calendar, optionally
-- recurring weekly / monthly / yearly. (Other calendar entries are still
-- derived from bills, tasks, projects, etc.)
--
-- Run in the Supabase SQL editor (clear the box first). Safe to re-run.
-- =====================================================================

create table if not exists public.calendar_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  event_date date not null,
  recurrence text not null default 'none' check (recurrence in ('none','weekly','monthly','yearly')),
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists calendar_events_date_idx on public.calendar_events (event_date);

drop trigger if exists set_updated_at on public.calendar_events;
create trigger set_updated_at before update on public.calendar_events
  for each row execute function public.set_updated_at();

alter table public.calendar_events enable row level security;

drop policy if exists "cal_select" on public.calendar_events;
create policy "cal_select" on public.calendar_events for select
  using (auth.uid() = user_id or public.same_household(user_id));

drop policy if exists "cal_insert" on public.calendar_events;
create policy "cal_insert" on public.calendar_events for insert with check (auth.uid() = user_id);

drop policy if exists "cal_update" on public.calendar_events;
create policy "cal_update" on public.calendar_events for update
  using (auth.uid() = user_id or public.same_household(user_id));

drop policy if exists "cal_delete" on public.calendar_events;
create policy "cal_delete" on public.calendar_events for delete
  using (auth.uid() = user_id or public.same_household(user_id));
