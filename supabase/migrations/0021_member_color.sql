-- Each household member can pick a personal colour; their name shows in it
-- across the app.

alter table public.household_members add column if not exists color text;
