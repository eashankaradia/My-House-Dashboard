-- Let accounts record which bank or trading platform they're held with.
alter table public.savings_accounts add column if not exists provider text;
