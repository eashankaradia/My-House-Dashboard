-- Low-priority "when bored" tasks: a flag on project_tasks so a task can be
-- tucked away in a separate "When bored" list instead of cluttering the main
-- to-do list.
alter table public.project_tasks
  add column if not exists is_bored_task boolean not null default false;
