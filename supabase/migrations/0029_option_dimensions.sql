-- Furniture purchase options can carry a shape + real dimensions so they can be
-- dropped straight into the Room Designer's 2D plan.

alter table public.purchase_options add column if not exists shape     text;
alter table public.purchase_options add column if not exists width_cm  numeric;
alter table public.purchase_options add column if not exists depth_cm  numeric;
alter table public.purchase_options add column if not exists height_cm numeric;
