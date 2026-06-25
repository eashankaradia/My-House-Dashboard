-- =====================================================================
-- Migration 0014 — notes on tasks.
--
-- Lets a task carry free-text notes (progress, context). "Clearing" a
-- completed task archives it (existing archived_at column) so it still
-- counts toward the project's progress but drops out of the active list.
--
-- Run in the Supabase SQL editor (clear the box first). Safe to re-run.
-- =====================================================================

alter table public.project_tasks add column if not exists notes text;
