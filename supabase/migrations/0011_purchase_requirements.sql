alter table public.purchases
  add column if not exists non_negotiables text;
