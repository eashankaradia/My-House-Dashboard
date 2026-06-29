-- Useful links: a shared household bookmark list (council site, insurance portal,
-- meter readings page…). Lives alongside Notes in the new Notes & Links section.

create table if not exists public.useful_links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  url         text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists useful_links_created_idx on public.useful_links (created_at desc);

drop trigger if exists set_updated_at on public.useful_links;
create trigger set_updated_at before update on public.useful_links
  for each row execute function public.set_updated_at();

alter table public.useful_links enable row level security;
drop policy if exists "useful_links_select" on public.useful_links;
create policy "useful_links_select" on public.useful_links for select
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "useful_links_insert" on public.useful_links;
create policy "useful_links_insert" on public.useful_links for insert with check (auth.uid() = user_id);
drop policy if exists "useful_links_update" on public.useful_links;
create policy "useful_links_update" on public.useful_links for update
  using (auth.uid() = user_id or public.same_household(user_id));
drop policy if exists "useful_links_delete" on public.useful_links;
create policy "useful_links_delete" on public.useful_links for delete
  using (auth.uid() = user_id or public.same_household(user_id));
