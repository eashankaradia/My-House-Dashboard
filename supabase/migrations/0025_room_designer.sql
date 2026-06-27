-- =====================================================================
-- Migration 0025 — Room Designer foundation.
--
-- Promotes the existing `rooms` table (a name list) into real room entities
-- with dimensions, colours and openings, and adds the design-planning tables.
-- Nothing here duplicates rooms / purchases / inspiration / projects / tasks —
-- it extends and references them by their existing ids / fields.
--
-- Run in the Supabase SQL editor (clear the box first). Safe to re-run.
-- =====================================================================

-- --- Extend rooms ----------------------------------------------------------
alter table public.rooms add column if not exists shape         text not null default 'rectangle';
alter table public.rooms add column if not exists width_cm      numeric;
alter table public.rooms add column if not exists length_cm     numeric;
alter table public.rooms add column if not exists height_cm     numeric;
alter table public.rooms add column if not exists wall_color    text;
alter table public.rooms add column if not exists ceiling_color text;
alter table public.rooms add column if not exists floor_color   text;
alter table public.rooms add column if not exists trim_color    text;
alter table public.rooms add column if not exists flooring      text;
alter table public.rooms add column if not exists doors         jsonb not null default '[]'::jsonb;
alter table public.rooms add column if not exists windows       jsonb not null default '[]'::jsonb;
alter table public.rooms add column if not exists notes         text;
alter table public.rooms add column if not exists project_id    uuid references public.projects (id) on delete set null;
alter table public.rooms add column if not exists updated_at    timestamptz not null default now();

-- Rooms previously had no UPDATE policy, so they couldn't be edited at all.
drop policy if exists "rooms_update" on public.rooms;
create policy "rooms_update" on public.rooms for update
  using (auth.uid() = user_id or public.same_household(user_id));

drop trigger if exists set_updated_at on public.rooms;
create trigger set_updated_at before update on public.rooms
  for each row execute function public.set_updated_at();

-- --- Design versions -------------------------------------------------------
create table if not exists public.room_design_versions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  room_id       uuid not null references public.rooms (id) on delete cascade,
  name          text not null,
  description   text,
  status        text not null default 'draft' check (status in ('draft','comparing','chosen','archived')),
  is_final      boolean not null default false,
  cost_estimate numeric,
  width_cm      numeric,
  length_cm     numeric,
  height_cm     numeric,
  wall_color    text,
  ceiling_color text,
  floor_color   text,
  trim_color    text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists rdv_room_idx on public.room_design_versions (room_id);

-- --- Layout items (furniture placed within a version) ----------------------
create table if not exists public.room_design_layout_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  version_id  uuid not null references public.room_design_versions (id) on delete cascade,
  name        text not null,
  category    text,
  width_cm    numeric not null default 60,
  depth_cm    numeric not null default 60,
  height_cm   numeric,
  x_cm        numeric not null default 0,
  y_cm        numeric not null default 0,
  rotation    integer not null default 0,
  color       text,
  material    text,
  notes       text,
  cost        numeric,
  priority    text,
  status      text not null default 'idea',
  purchase_id uuid references public.purchases (id) on delete set null,
  image_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists rdli_version_idx on public.room_design_layout_items (version_id);

-- --- Colour palettes + swatches -------------------------------------------
create table if not exists public.room_colour_palettes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  room_id    uuid not null references public.rooms (id) on delete cascade,
  version_id uuid references public.room_design_versions (id) on delete set null,
  name       text not null,
  created_at timestamptz not null default now()
);
create index if not exists rcp_room_idx on public.room_colour_palettes (room_id);

create table if not exists public.room_colour_swatches (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  palette_id uuid not null references public.room_colour_palettes (id) on delete cascade,
  hex        text not null,
  label      text,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists rcs_palette_idx on public.room_colour_swatches (palette_id);

-- --- Inspiration ↔ design version links -----------------------------------
create table if not exists public.room_design_inspiration_links (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  version_id     uuid not null references public.room_design_versions (id) on delete cascade,
  inspiration_id uuid not null references public.inspiration (id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (version_id, inspiration_id)
);

-- --- updated_at triggers ---------------------------------------------------
drop trigger if exists set_updated_at on public.room_design_versions;
create trigger set_updated_at before update on public.room_design_versions
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.room_design_layout_items;
create trigger set_updated_at before update on public.room_design_layout_items
  for each row execute function public.set_updated_at();

-- --- RLS (household, matching the rest of the app) -------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'room_design_versions','room_design_layout_items','room_colour_palettes',
    'room_colour_swatches','room_design_inspiration_links'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_select" on public.%I', t, t);
    execute format('create policy "%s_select" on public.%I for select using (auth.uid() = user_id or public.same_household(user_id))', t, t);
    execute format('drop policy if exists "%s_insert" on public.%I', t, t);
    execute format('create policy "%s_insert" on public.%I for insert with check (auth.uid() = user_id)', t, t);
    execute format('drop policy if exists "%s_update" on public.%I', t, t);
    execute format('create policy "%s_update" on public.%I for update using (auth.uid() = user_id or public.same_household(user_id))', t, t);
    execute format('drop policy if exists "%s_delete" on public.%I', t, t);
    execute format('create policy "%s_delete" on public.%I for delete using (auth.uid() = user_id or public.same_household(user_id))', t, t);
  end loop;
end $$;
