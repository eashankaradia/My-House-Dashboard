-- Habits v2: habit types (yes/no, numeric, timer), inspiration ("why"),
-- a unit for numeric habits, value/duration on logs, and multi-period targets.

alter table public.habits add column if not exists habit_type text not null default 'yes_no';
alter table public.habits add column if not exists why text;
alter table public.habits add column if not exists unit text;

alter table public.habit_logs add column if not exists value numeric(12, 2);
alter table public.habit_logs add column if not exists duration_seconds int;

create table if not exists public.habit_targets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  habit_id     uuid references public.habits(id) on delete cascade not null,
  period       text not null,
  target_value numeric(12, 2) not null,
  created_at   timestamptz not null default now(),
  unique (habit_id, period)
);

create index if not exists habit_targets_habit_idx on public.habit_targets (habit_id);

alter table public.habit_targets enable row level security;
create policy "habit_targets_owner" on public.habit_targets
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
