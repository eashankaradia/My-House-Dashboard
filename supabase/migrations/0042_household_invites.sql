-- Invite codes so a household member can invite someone else to join their
-- household (merging household_id), or join one using a code they were given.

create table if not exists public.household_invites (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null,
  code          text not null unique,
  created_by    uuid references auth.users not null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz
);

create index if not exists household_invites_household_idx on public.household_invites (household_id);

alter table public.household_invites enable row level security;

create policy "household_invites_owner_select" on public.household_invites
  for select using (auth.uid() = created_by);
create policy "household_invites_owner_insert" on public.household_invites
  for insert with check (auth.uid() = created_by);
create policy "household_invites_owner_delete" on public.household_invites
  for delete using (auth.uid() = created_by);

-- Redeem a code: moves the caller into the invite's household. SECURITY
-- DEFINER so the caller doesn't need read access to a household_invites row
-- outside their own (RLS above only lets you see invites you created).
create or replace function public.redeem_household_invite(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household uuid;
  updated_rows int;
begin
  select household_id into target_household
  from public.household_invites
  where code = p_code
    and (expires_at is null or expires_at > now());

  if target_household is null then
    return false;
  end if;

  update public.household_members
  set household_id = target_household
  where user_id = auth.uid();

  get diagnostics updated_rows = row_count;
  return updated_rows > 0;
end;
$$;
