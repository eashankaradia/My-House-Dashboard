-- Personal vs household bills: MyHouse bills are always household-scoped;
-- MyLife can mark a bill personal so it isn't shared or split with the household.
alter table bills
  add column scope text not null default 'household' check (scope in ('personal', 'household'));
