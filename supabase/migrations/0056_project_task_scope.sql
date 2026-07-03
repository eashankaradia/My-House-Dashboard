-- Personal vs household scope for projects/tasks. MyHouse only ever shows
-- 'household' scope (hard boundary — a personal MyLife project/task must
-- never leak into MyHouse); MyLife can create and filter by either.
alter table public.projects
  add column if not exists scope text not null default 'household' check (scope in ('personal', 'household'));
alter table public.project_tasks
  add column if not exists scope text not null default 'household' check (scope in ('personal', 'household'));
