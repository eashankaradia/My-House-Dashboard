-- Key contacts: a household-visible directory of important people / services.

create table if not exists contacts (
  id          uuid         default gen_random_uuid() primary key,
  user_id     uuid         not null references auth.users(id) on delete cascade,
  name        text         not null check (char_length(name)    <= 120),
  role        text                  check (char_length(role)    <= 80),
  phone       text                  check (char_length(phone)   <= 40),
  email       text                  check (char_length(email)   <= 160),
  address     text                  check (char_length(address) <= 300),
  url         text                  check (char_length(url)     <= 2000),
  notes       text                  check (char_length(notes)   <= 2000),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

alter table contacts enable row level security;

drop policy if exists "contacts: household read" on contacts;
drop policy if exists "contacts: owner write"    on contacts;

create policy "contacts: household read" on contacts
  for select using (public.same_household(user_id));

create policy "contacts: owner write" on contacts
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger set_updated_at before update on contacts
  for each row execute procedure public.set_updated_at();
