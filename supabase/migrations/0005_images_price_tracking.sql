-- =====================================================================
-- Migration 0005 — photo uploads, price tracking, and standalone tasks.
-- Run in the Supabase SQL Editor (clear the box first). Safe to re-run.
-- =====================================================================

-- Project cover image.
alter table public.projects add column if not exists image_url text;

-- Track an option's starting price so we can show "↓ £x since added".
alter table public.purchase_options add column if not exists start_price numeric(12,2) not null default 0;
update public.purchase_options set start_price = price where start_price = 0 and price > 0;

-- Tasks can now stand alone (no project) and carry a due date.
alter table public.project_tasks alter column project_id drop not null;
alter table public.project_tasks add column if not exists due_date date;
