-- Categorise a purchase as a "Big" or "Small" purchase (null = unspecified).
alter table public.purchases add column if not exists size text;
