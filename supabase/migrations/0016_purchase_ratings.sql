-- Out-of-5 star ratings for purchase items and their options.
-- null = unrated; 1..5 otherwise.

alter table public.purchases add column if not exists rating smallint;
alter table public.purchase_options add column if not exists rating smallint;
