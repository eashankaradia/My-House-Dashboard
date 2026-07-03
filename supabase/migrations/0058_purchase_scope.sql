-- Personal vs household purchases: MyHouse purchases are always household-scoped;
-- MyLife can mark a purchase personal so it never shows in MyHouse.
alter table purchases
  add column scope text not null default 'household' check (scope in ('personal', 'household'));
