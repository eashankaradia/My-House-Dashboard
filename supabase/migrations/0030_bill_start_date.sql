-- A bill can record when it started (e.g. when a contract/subscription began),
-- alongside the existing next-due and end dates.
alter table public.bills add column if not exists start_date date;
