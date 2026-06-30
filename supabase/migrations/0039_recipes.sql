-- Replace meal logging with recipe capture: video, ingredients, nutritional value.

create table if not exists public.recipes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  name        text not null,
  video_url   text,
  image_url   text,
  servings    int,
  calories    int,
  protein_g   numeric,
  carbs_g     numeric,
  fat_g       numeric,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists recipes_user_idx on public.recipes (user_id);

alter table public.recipes enable row level security;
create policy "recipes_owner" on public.recipes
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.recipe_ingredients (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  recipe_id    uuid references public.recipes(id) on delete cascade not null,
  name         text not null,
  quantity     text,
  order_index  int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id);

alter table public.recipe_ingredients enable row level security;
create policy "recipe_ingredients_owner" on public.recipe_ingredients
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger recipes_updated_at before update on public.recipes for each row execute function public.set_updated_at();
