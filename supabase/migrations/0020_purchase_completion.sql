-- When an item is marked Purchased, optionally record who bought it, how
-- much they actually paid, and a photo of the receipt. All optional.

alter table public.purchases add column if not exists purchased_by uuid;
alter table public.purchases add column if not exists purchased_price numeric;
alter table public.purchases add column if not exists receipt_url text;
