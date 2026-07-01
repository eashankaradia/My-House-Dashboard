-- Habits gain freeform tags, primarily used for time-of-day (Morning/Day/Evening)
-- so those can be derived sections instead of a separately-maintained routine list.
alter table habits
  add column if not exists tags text[] not null default '{}';
