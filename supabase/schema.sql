-- ============================================================================
-- My House Dashboard — Complete Supabase schema
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL Editor (or via the CLI) on a fresh project.
-- It is idempotent-ish: safe to run once on a new project. It creates every
-- table, row-level-security policy, storage bucket and trigger the app needs.
--
-- Design notes:
--   * Every domain table carries a `user_id` FK to auth.users and is protected
--     by RLS so a user can only ever see and mutate their own rows. This keeps
--     the app single-user today but multi-tenant-ready from day one.
--   * Status/category style fields use TEXT + CHECK constraints (instead of
--     Postgres enums) so they map cleanly to TypeScript string unions and can
--     be extended with a one-line migration.
--   * `updated_at` is maintained automatically by a trigger.
--   * AI tables are created now (empty) so future AI features need no migration.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared helper: keep updated_at fresh on every UPDATE.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — 1:1 with auth.users, populated automatically on signup.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- bills — recurring household costs.
-- ---------------------------------------------------------------------------
create table if not exists public.bills (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  category        text not null default 'Other'
                    check (category in ('Mortgage','Utilities','Council Tax','Broadband',
                      'Mobile','Insurance','Subscriptions','Maintenance','Other')),
  amount          numeric(12,2) not null default 0,
  frequency       text not null default 'monthly'
                    check (frequency in ('weekly','monthly','quarterly','annually','one-off')),
  due_date        date,
  payment_account text,
  is_fixed        boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- mortgages — typically one row, but supports several properties.
-- ---------------------------------------------------------------------------
create table if not exists public.mortgages (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  property_name       text not null default 'My Home',
  property_value      numeric(14,2) not null default 0,
  mortgage_balance    numeric(14,2) not null default 0,
  interest_rate       numeric(6,3) not null default 0,
  monthly_payment     numeric(12,2) not null default 0,
  term_months         integer,
  start_date          date,
  fixed_term_end_date date,
  provider            text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- savings_pots — virtual savings buckets.
-- ---------------------------------------------------------------------------
create table if not exists public.savings_pots (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  name                 text not null,
  target_amount        numeric(12,2) not null default 0,
  current_amount       numeric(12,2) not null default 0,
  monthly_contribution numeric(12,2) not null default 0,
  target_date          date,
  color                text not null default 'emerald',
  icon                 text,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- savings_accounts — named accounts that hold a pot's money (Marcus, ISA…).
-- A pot can have several; an account's balance is derived from its
-- contributions.
create table if not exists public.savings_accounts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  pot_id     uuid not null references public.savings_pots (id) on delete cascade,
  name       text not null,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- savings_contributions — dated ledger of deposits / withdrawals per pot.
-- Amount is signed (+ deposit, − withdrawal); occurred_on can be back-dated.
create table if not exists public.savings_contributions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  pot_id      uuid not null references public.savings_pots (id) on delete cascade,
  account_id  uuid references public.savings_accounts (id) on delete set null,
  amount      numeric(12,2) not null,
  occurred_on date not null default current_date,
  note        text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- collections — group inspiration links (Dream Kitchen, Garden Ideas...).
-- Declared before inspiration so the FK resolves.
-- ---------------------------------------------------------------------------
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  cover_image text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- inspiration — personal Pinterest-style board.
-- ---------------------------------------------------------------------------
create table if not exists public.inspiration (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  link          text,
  source        text not null default 'Other'
                  check (source in ('Instagram','TikTok','Pinterest','YouTube','Blog','Store','Other')),
  category      text,
  room          text,
  tags          text[] not null default '{}',
  notes         text,
  priority      text not null default 'Medium' check (priority in ('Low','Medium','High')),
  status        text not null default 'Saved'
                  check (status in ('Saved','Considering','Planned','Implemented')),
  image_url     text,
  collection_id uuid references public.collections (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- projects — home improvement projects (kanban + list).
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  name                   text not null,
  category               text not null default 'General'
                           check (category in ('Garden','Kitchen','Bathroom','Bedroom',
                             'Living Room','Exterior','Storage','General')),
  description            text,
  estimated_cost        numeric(12,2) not null default 0,
  actual_cost           numeric(12,2) not null default 0,
  priority              text not null default 'Medium' check (priority in ('Low','Medium','High')),
  status                text not null default 'Idea'
                           check (status in ('Idea','Planning','Quoting','Scheduled','In Progress','Completed')),
  target_completion_date date,
  notes                 text,
  image_url             text,
  source_inspiration_id  uuid references public.inspiration (id) on delete set null,
  archived_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- purchases — wishlist of future home purchases.
-- ---------------------------------------------------------------------------
create table if not exists public.purchases (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  name                  text not null,
  url                   text,
  store                 text,
  price                 numeric(12,2) not null default 0,
  category              text not null default 'Other'
                          check (category in ('Furniture','Appliances','Technology',
                            'Garden','Decor','Tools','Storage','Other')),
  sub_category          text,
  room                  text,
  priority              text not null default 'Medium' check (priority in ('Low','Medium','High')),
  non_negotiables       text,
  notes                 text,
  status                text not null default 'Considering'
                          check (status in ('Interesting','Considering','Shortlisted','Ready To Buy','Purchased')),
  image_url             text,
  purchased_at          date,
  source_inspiration_id uuid references public.inspiration (id) on delete set null,
  archived_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- purchase_stars — per-member "favourite" stars on a purchase (who starred).
create table if not exists public.purchase_stars (
  id          uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (purchase_id, user_id)
);
create index if not exists purchase_stars_purchase_idx on public.purchase_stars (purchase_id);
alter table public.purchase_stars enable row level security;
drop policy if exists "stars_select" on public.purchase_stars;
create policy "stars_select" on public.purchase_stars for select
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "stars_insert" on public.purchase_stars;
create policy "stars_insert" on public.purchase_stars for insert with check (auth.uid() = user_id);
drop policy if exists "stars_delete" on public.purchase_stars;
create policy "stars_delete" on public.purchase_stars for delete using (auth.uid() = user_id);

-- links — generic associations between items (task<->purchase, project<->bill…).
create table if not exists public.links (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  a_type     text not null check (a_type in ('task','project','purchase','bill','inspiration')),
  a_id       uuid not null,
  b_type     text not null check (b_type in ('task','project','purchase','bill','inspiration')),
  b_id       uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists links_a_idx on public.links (a_type, a_id);
create index if not exists links_b_idx on public.links (b_type, b_id);
alter table public.links enable row level security;
drop policy if exists "links_select" on public.links;
create policy "links_select" on public.links for select
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "links_insert" on public.links;
create policy "links_insert" on public.links for insert with check (auth.uid() = user_id);
drop policy if exists "links_delete" on public.links;
create policy "links_delete" on public.links for delete
  using (auth.uid() = user_id or public.same_household(user_id));

-- ---------------------------------------------------------------------------
-- purchase_options — competing products/options for a wishlist item, so you
-- can compare prices and pick a favourite (e.g. three sofas for one "Sofa").
-- ---------------------------------------------------------------------------
create table if not exists public.purchase_options (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  name        text not null,
  store       text,
  url         text,
  price       numeric(12,2) not null default 0,
  image_url   text,
  notes       text,
  is_chosen   boolean not null default false,
  rank        integer not null default 0,
  start_price numeric(12,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- project_tasks — sub-tasks / checklist items under a project.
-- ---------------------------------------------------------------------------
create table if not exists public.project_tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  project_id  uuid references public.projects (id) on delete cascade,
  title       text not null,
  is_done     boolean not null default false,
  due_date    date,
  position    integer not null default 0,
  assigned_to uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists project_tasks_project_idx on public.project_tasks (project_id);

-- ---------------------------------------------------------------------------
-- household_members — shared access between members of the same home, while
-- each row keeps its creator (user_id) for "Added by …" attribution.
-- ---------------------------------------------------------------------------
create table if not exists public.household_members (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  -- Members sharing a household_id can see each other's data. New members
  -- default to their own fresh household (isolated until explicitly grouped).
  household_id uuid not null default gen_random_uuid(),
  created_at   timestamptz not null default now()
);
alter table public.household_members enable row level security;

-- Kept for backwards compatibility; row visibility uses same_household() below.
create or replace function public.is_household_member()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.household_members where user_id = auth.uid());
$$;

-- True when the current user shares a household with `target` (the row owner).
create or replace function public.same_household(target uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from public.household_members me
    join public.household_members them on them.household_id = me.household_id
    where me.user_id = auth.uid()
      and them.user_id = target
  );
$$;

drop policy if exists "members_read" on public.household_members;
create policy "members_read" on public.household_members for select
  using (auth.uid() = user_id or public.same_household(user_id));

-- ---------------------------------------------------------------------------
-- maintenance_tasks — recurring home maintenance + reminders.
-- ---------------------------------------------------------------------------
create table if not exists public.maintenance_tasks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  task                text not null,
  frequency           text not null default 'annually'
                        check (frequency in ('weekly','monthly','quarterly','biannually','annually')),
  last_completed_date date,
  next_due_date       date,
  cost                numeric(12,2) not null default 0,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- documents — important home paperwork stored in Supabase Storage.
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  category    text not null default 'Other'
                check (category in ('Mortgage','Insurance','Warranties','Manuals',
                  'Quotes','Certificates','Receipts','Other')),
  file_path   text,
  file_size   bigint,
  mime_type   text,
  expiry_date date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ===========================================================================
-- Idempotent migrations for existing databases (safe to re-run).
-- ===========================================================================
alter table public.purchases add column if not exists sub_category text;

-- ===========================================================================
-- updated_at triggers for every mutable table.
-- ===========================================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','bills','mortgages','savings_pots','savings_accounts','collections',
    'inspiration','projects','purchases','purchase_options','project_tasks',
    'maintenance_tasks','documents'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end;
$$;

-- ===========================================================================
-- Row Level Security — a row is visible/editable by its creator OR any member
-- of the household (so two people can share one home's data).
-- ===========================================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'bills','mortgages','savings_pots','savings_accounts','savings_contributions',
    'collections','inspiration','projects','purchases','purchase_options',
    'project_tasks','maintenance_tasks','documents'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists "owner_select" on public.%I;', t);
    execute format('drop policy if exists "hh_select" on public.%I;', t);
    execute format(
      'create policy "hh_select" on public.%I for select
         using (auth.uid() = user_id or public.same_household(user_id));', t);

    execute format('drop policy if exists "owner_insert" on public.%I;', t);
    execute format('drop policy if exists "hh_insert" on public.%I;', t);
    execute format(
      'create policy "hh_insert" on public.%I for insert with check (auth.uid() = user_id);', t);

    execute format('drop policy if exists "owner_update" on public.%I;', t);
    execute format('drop policy if exists "hh_update" on public.%I;', t);
    execute format(
      'create policy "hh_update" on public.%I for update
         using (auth.uid() = user_id or public.same_household(user_id));', t);

    execute format('drop policy if exists "owner_delete" on public.%I;', t);
    execute format('drop policy if exists "hh_delete" on public.%I;', t);
    execute format(
      'create policy "hh_delete" on public.%I for delete
         using (auth.uid() = user_id or public.same_household(user_id));', t);
  end loop;
end;
$$;

-- ===========================================================================
-- Activity log (change log) — records who added/edited/removed each item.
-- ===========================================================================
create table if not exists public.activity_log (
  id           bigint generated always as identity primary key,
  user_id      uuid,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  entity_label text,
  created_at   timestamptz not null default now()
);
create index if not exists activity_log_created_idx on public.activity_log (created_at desc);
alter table public.activity_log enable row level security;

drop policy if exists "activity_select" on public.activity_log;
create policy "activity_select" on public.activity_log for select
  using (auth.uid() = user_id or public.same_household(user_id));

create or replace function public.log_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare rec jsonb; lbl text; eid uuid;
begin
  if (tg_op = 'DELETE') then rec := to_jsonb(old); else rec := to_jsonb(new); end if;
  lbl := coalesce(rec->>'name', rec->>'title', rec->>'task', rec->>'property_name', '');
  eid := nullif(rec->>'id', '')::uuid;
  insert into public.activity_log (user_id, action, entity_type, entity_id, entity_label)
  values (auth.uid(), lower(tg_op), tg_table_name, eid, left(lbl, 160));
  if (tg_op = 'DELETE') then return old; else return new; end if;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'bills','mortgages','savings_pots','collections','inspiration',
    'projects','purchases','maintenance_tasks','documents'
  ]
  loop
    execute format('drop trigger if exists log_activity on public.%I;', t);
    execute format(
      'create trigger log_activity after insert or update or delete on public.%I
         for each row execute function public.log_activity();', t);
  end loop;
end;
$$;

-- ===========================================================================
-- Helpful indexes.
-- ===========================================================================
create index if not exists bills_user_idx on public.bills (user_id);
create index if not exists savings_pots_user_idx on public.savings_pots (user_id);
create index if not exists savings_accounts_pot_idx on public.savings_accounts (pot_id);
create index if not exists savings_contributions_pot_idx on public.savings_contributions (pot_id);
create index if not exists savings_contributions_account_idx on public.savings_contributions (account_id);
create index if not exists savings_contributions_date_idx on public.savings_contributions (occurred_on);
create index if not exists projects_user_status_idx on public.projects (user_id, status);
create index if not exists purchases_user_status_idx on public.purchases (user_id, status);
create index if not exists purchase_options_purchase_idx on public.purchase_options (purchase_id);
create index if not exists inspiration_user_idx on public.inspiration (user_id);
create index if not exists inspiration_collection_idx on public.inspiration (collection_id);
create index if not exists maintenance_user_due_idx on public.maintenance_tasks (user_id, next_due_date);
create index if not exists documents_user_idx on public.documents (user_id);

-- ===========================================================================
-- Storage — private buckets for documents and inspiration/purchase images.
-- ===========================================================================
insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('images', 'images', true)
  on conflict (id) do nothing;

-- Documents bucket: each user may only touch files under a folder named
-- after their own uid (e.g. "<uid>/insurance.pdf").
drop policy if exists "documents_select" on storage.objects;
create policy "documents_select" on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents_insert" on storage.objects;
create policy "documents_insert" on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents_update" on storage.objects;
create policy "documents_update" on storage.objects for update
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents_delete" on storage.objects;
create policy "documents_delete" on storage.objects for delete
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Images bucket is publicly readable (for preview cards) but only the owner
-- may write into their own uid folder.
drop policy if exists "images_public_read" on storage.objects;
create policy "images_public_read" on storage.objects for select
  using (bucket_id = 'images');

drop policy if exists "images_insert" on storage.objects;
create policy "images_insert" on storage.objects for insert
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "images_delete" on storage.objects;
create policy "images_delete" on storage.objects for delete
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Done.
