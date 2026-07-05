-- L-shaped furniture (e.g. corner sofas): the footprint is the width x depth
-- bounding box with a notch_w_cm x notch_d_cm rectangle removed from one
-- corner. `corner` picks which corner is cut ('tl' | 'tr' | 'bl' | 'br',
-- defaults to 'tr' in app code when null).
alter table public.room_design_layout_items
  add column if not exists corner text,
  add column if not exists notch_w_cm numeric,
  add column if not exists notch_d_cm numeric;
