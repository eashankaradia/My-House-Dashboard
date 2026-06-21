-- =====================================================================
-- Migration 0004 — activity log (change log) for the Settings page.
-- Records who added / edited / deleted the main items. Run in the SQL
-- Editor (clear the box first). Safe to run more than once.
-- =====================================================================

create table if not exists public.activity_log (
  id           bigint generated always as identity primary key,
  user_id      uuid,
  action       text not null,           -- insert | update | delete
  entity_type  text not null,           -- table name
  entity_id    uuid,
  entity_label text,
  created_at   timestamptz not null default now()
);
create index if not exists activity_log_created_idx on public.activity_log (created_at desc);

alter table public.activity_log enable row level security;

drop policy if exists "activity_select" on public.activity_log;
create policy "activity_select" on public.activity_log for select
  using (auth.uid() = user_id or public.is_household_member());

-- Generic trigger that records a friendly label for the changed row.
create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec jsonb;
  lbl text;
  eid uuid;
begin
  if (tg_op = 'DELETE') then rec := to_jsonb(old); else rec := to_jsonb(new); end if;
  lbl := coalesce(rec->>'name', rec->>'title', rec->>'task', rec->>'property_name', '');
  eid := nullif(rec->>'id', '')::uuid;
  insert into public.activity_log (user_id, action, entity_type, entity_id, entity_label)
  values (auth.uid(), lower(tg_op), tg_table_name, eid, left(lbl, 160));
  if (tg_op = 'DELETE') then return old; else return new; end if;
end;
$$;

-- Attach to the main entity tables (not the high-churn option/task tables).
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
