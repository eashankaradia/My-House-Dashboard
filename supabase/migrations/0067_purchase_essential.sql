-- Essential vs non-essential flag for Future Purchases, so the list can be
-- filtered down to just the must-haves.
alter table public.purchases
  add column if not exists is_essential boolean not null default true;
