-- Adds the sub_category column to existing purchases tables.
-- Run this in the Supabase SQL Editor if your database was created before
-- sub-categories were added. Safe to run more than once.
alter table public.purchases add column if not exists sub_category text;
