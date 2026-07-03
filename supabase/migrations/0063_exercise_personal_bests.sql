-- Personal best log per exercise: a running history of PBs, not just a
-- single overwritable value, so progress over time is visible.

create table if not exists public.exercise_personal_bests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  exercise_id uuid references public.exercises (id) on delete cascade not null,
  value       numeric not null,
  unit        text not null,
  achieved_on date not null default current_date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists exercise_pbs_exercise_idx on public.exercise_personal_bests (exercise_id, achieved_on desc);

alter table public.exercise_personal_bests enable row level security;
create policy "exercise_pbs_owner" on public.exercise_personal_bests
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger exercise_pbs_updated_at before update on public.exercise_personal_bests
  for each row execute function public.set_updated_at();
