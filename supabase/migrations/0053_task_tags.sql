-- Free-form tags on tasks — a generic array column rather than a join table,
-- since tag autocomplete/rename-everywhere isn't needed for v1.
alter table public.project_tasks
  add column if not exists tags text[] not null default '{}';
