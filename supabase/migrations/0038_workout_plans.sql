-- Replace per-session workout logging with a reusable exercise library +
-- workout plan builder. Old `workouts`/`workout_exercises` tables are left
-- in place (unused) — nothing else references them.

create table if not exists public.exercises (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users not null,
  name           text not null,
  muscle_groups  text[] not null default '{}',
  technique      text,
  inspiration    text,
  pb_value       numeric,
  pb_unit        text,
  pb_date        date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists exercises_user_idx on public.exercises (user_id);

alter table public.exercises enable row level security;
create policy "exercises_owner" on public.exercises
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.workout_plans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  name         text not null,
  description  text,
  is_active    bool not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists workout_plans_user_idx on public.workout_plans (user_id);

alter table public.workout_plans enable row level security;
create policy "workout_plans_owner" on public.workout_plans
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.workout_plan_exercises (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users not null,
  plan_id           uuid references public.workout_plans(id) on delete cascade not null,
  exercise_id       uuid references public.exercises(id) on delete cascade not null,
  sets              int,
  reps              int,
  target_weight_kg  numeric,
  order_index       int not null default 0,
  notes             text,
  created_at        timestamptz not null default now()
);

create index if not exists workout_plan_exercises_plan_idx on public.workout_plan_exercises (plan_id);
create index if not exists workout_plan_exercises_exercise_idx on public.workout_plan_exercises (exercise_id);

alter table public.workout_plan_exercises enable row level security;
create policy "workout_plan_exercises_owner" on public.workout_plan_exercises
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger exercises_updated_at      before update on public.exercises      for each row execute function public.set_updated_at();
create trigger workout_plans_updated_at  before update on public.workout_plans  for each row execute function public.set_updated_at();
