-- Eisenhower "important" axis on tasks, alongside the existing due date
-- (urgency) and is_bored_task (deliberately low priority) flags.
alter table public.project_tasks
  add column if not exists is_important boolean not null default false;
