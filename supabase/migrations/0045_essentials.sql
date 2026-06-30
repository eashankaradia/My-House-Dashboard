-- Essentials: a personal checklist of items needed, grouped by category,
-- each with a RAG status and what you currently have for it.

create table if not exists public.essentials (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    text not null,
  name        text not null,
  rag         text not null default 'red',  -- red | amber | green
  have_notes  text,
  order_index int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists essentials_user_idx on public.essentials (user_id, category);

alter table public.essentials enable row level security;
create policy "essentials_owner" on public.essentials
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger essentials_updated_at before update on public.essentials
  for each row execute function public.set_updated_at();
