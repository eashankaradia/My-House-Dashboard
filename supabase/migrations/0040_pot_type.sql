-- Distinguish savings pots from investment pots. Same pot/account/
-- contribution infrastructure (migration 0007) is reused for both.
alter table public.savings_pots add column if not exists pot_type text not null default 'savings';
