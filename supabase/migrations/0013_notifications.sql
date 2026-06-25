create table if not exists public.notification_preferences (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  entity_type text not null,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, entity_type)
);

create table if not exists public.notifications (
  id                uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  sender_user_id    uuid references auth.users (id) on delete set null,
  entity_type       text,
  entity_id         uuid,
  title             text not null,
  message           text,
  href              text,
  read_at           timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_user_id, created_at desc);

drop trigger if exists set_updated_at on public.notification_preferences;
create trigger set_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "preferences_own" on public.notification_preferences;
create policy "preferences_own" on public.notification_preferences for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications_read" on public.notifications;
create policy "notifications_read" on public.notifications for select
  using (auth.uid() = recipient_user_id);
drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications for insert
  with check (
    auth.uid() = sender_user_id
    and (auth.uid() = recipient_user_id or public.same_household(recipient_user_id))
  );
drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications for update
  using (auth.uid() = recipient_user_id);
drop policy if exists "notifications_delete" on public.notifications;
create policy "notifications_delete" on public.notifications for delete
  using (auth.uid() = recipient_user_id);

create or replace function public.notify_household_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rec jsonb;
  actor uuid;
  label text;
  member record;
begin
  actor := auth.uid();
  if actor is null then return new; end if;
  rec := to_jsonb(new);
  label := coalesce(rec->>'name', rec->>'title', rec->>'task', rec->>'property_name', tg_table_name);

  for member in
    select hm.user_id
    from public.household_members hm
    join public.household_members me on me.household_id = hm.household_id
    left join public.notification_preferences np
      on np.user_id = hm.user_id and np.entity_type = tg_table_name
    where me.user_id = actor
      and hm.user_id <> actor
      and coalesce(np.enabled, true)
  loop
    insert into public.notifications (
      recipient_user_id, sender_user_id, entity_type, entity_id, title, message, href
    ) values (
      member.user_id,
      actor,
      tg_table_name,
      nullif(rec->>'id', '')::uuid,
      'Household update',
      left(label, 160),
      case tg_table_name
        when 'bills' then '/bills'
        when 'mortgages' then '/mortgage'
        when 'savings_pots' then '/savings'
        when 'projects' then '/projects'
        when 'project_tasks' then '/projects'
        when 'purchases' then '/purchases'
        when 'inspiration' then '/inspiration'
        when 'maintenance_tasks' then '/maintenance'
        when 'documents' then '/documents'
        else null
      end
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists notify_household_update on public.bills;
create trigger notify_household_update after insert or update on public.bills
  for each row execute function public.notify_household_update();
drop trigger if exists notify_household_update on public.mortgages;
create trigger notify_household_update after insert or update on public.mortgages
  for each row execute function public.notify_household_update();
drop trigger if exists notify_household_update on public.savings_pots;
create trigger notify_household_update after insert or update on public.savings_pots
  for each row execute function public.notify_household_update();
drop trigger if exists notify_household_update on public.projects;
create trigger notify_household_update after insert or update on public.projects
  for each row execute function public.notify_household_update();
drop trigger if exists notify_household_update on public.project_tasks;
create trigger notify_household_update after insert or update on public.project_tasks
  for each row execute function public.notify_household_update();
drop trigger if exists notify_household_update on public.purchases;
create trigger notify_household_update after insert or update on public.purchases
  for each row execute function public.notify_household_update();
drop trigger if exists notify_household_update on public.inspiration;
create trigger notify_household_update after insert or update on public.inspiration
  for each row execute function public.notify_household_update();
drop trigger if exists notify_household_update on public.maintenance_tasks;
create trigger notify_household_update after insert or update on public.maintenance_tasks
  for each row execute function public.notify_household_update();
drop trigger if exists notify_household_update on public.documents;
create trigger notify_household_update after insert or update on public.documents
  for each row execute function public.notify_household_update();
