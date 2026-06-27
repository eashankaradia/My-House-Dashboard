-- Furniture placed on the floor plan can come from a saved purchase option and
-- carry its footprint shape (rectangle/square/round) and a link to the option.
alter table public.room_design_layout_items add column if not exists shape text;
alter table public.room_design_layout_items add column if not exists option_id uuid;
