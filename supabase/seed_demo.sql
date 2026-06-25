-- =====================================================================
-- Demo data seed (flat version — no DO block, runs cleanly in the
-- Supabase SQL editor).
--
-- PREREQUISITES (run once, in order):
--   1. Run migration 0008_household_isolation.sql first.
--   2. In Supabase → Authentication → Users → Add user, create:
--        email: demo@myhouse.local   password: demohouse   ☑ Auto Confirm User
--      (the login username is "demo").
--   3. Run THIS whole script in the SQL editor (clear the box first).
--
-- Idempotent: re-running wipes and reseeds only the demo user's rows.
-- =====================================================================

-- 0. Clean any previous demo data (pots/projects cascade to their children).
delete from public.activity_log      where user_id in (select id from auth.users where email = 'demo@myhouse.local');
delete from public.documents         where user_id in (select id from auth.users where email = 'demo@myhouse.local');
delete from public.maintenance_tasks where user_id in (select id from auth.users where email = 'demo@myhouse.local');
delete from public.inspiration       where user_id in (select id from auth.users where email = 'demo@myhouse.local');
delete from public.collections       where user_id in (select id from auth.users where email = 'demo@myhouse.local');
delete from public.purchases         where user_id in (select id from auth.users where email = 'demo@myhouse.local');
delete from public.savings_pots      where user_id in (select id from auth.users where email = 'demo@myhouse.local');
delete from public.projects          where user_id in (select id from auth.users where email = 'demo@myhouse.local');
delete from public.bills             where user_id in (select id from auth.users where email = 'demo@myhouse.local');
delete from public.mortgages         where user_id in (select id from auth.users where email = 'demo@myhouse.local');
delete from public.household_members where user_id in (select id from auth.users where email = 'demo@myhouse.local');

-- 1. The demo lives in its OWN household (isolated from everyone else).
insert into public.household_members (user_id, display_name, household_id)
select id, 'Demo', gen_random_uuid() from auth.users where email = 'demo@myhouse.local';

-- 2. Mortgage
insert into public.mortgages
  (user_id, property_name, property_value, mortgage_balance, interest_rate, monthly_payment,
   term_months, start_date, fixed_term_end_date, provider, notes)
select id, 'Maple Cottage', 425000, 268500, 4.290, 1485, 300,
       date '2022-09-01', date '2027-09-01', 'Halifax', 'Sample mortgage for the demo.'
from auth.users where email = 'demo@myhouse.local';

-- 3. Bills
insert into public.bills (user_id, name, category, amount, frequency, due_date, payment_account, is_fixed, notes)
select u.id, b.* from auth.users u cross join (values
  ('Council Tax',     'Council Tax',     198,   'monthly',  current_date + 1,  'Joint account', true,  'Band D'),
  ('Mortgage payment','Mortgage',        1485,  'monthly',  current_date + 5,  'Joint account', true,  null),
  ('Octopus Energy',  'Utilities',       142,   'monthly',  current_date + 8,  'Joint account', false, 'Variable tariff'),
  ('Thames Water',    'Utilities',       41,    'monthly',  current_date + 12, 'Joint account', true,  null),
  ('BT Broadband',    'Broadband',       38,    'monthly',  current_date + 3,  'Joint account', true,  null),
  ('Netflix',         'Subscriptions',   15.99, 'monthly',  current_date + 20, 'Personal',      true,  null),
  ('Home Insurance',  'Insurance',       320,   'annually', current_date + 60, 'Joint account', true,  'Buildings + contents')
) as b(name, category, amount, frequency, due_date, payment_account, is_fixed, notes)
where u.email = 'demo@myhouse.local';

-- 4. Savings pots
insert into public.savings_pots (user_id, name, target_amount, current_amount, monthly_contribution, target_date, color, notes)
select u.id, p.* from auth.users u cross join (values
  ('Emergency Fund', 10000, 6500, 300, (current_date + interval '12 months')::date, 'emerald', '3-6 months of outgoings'),
  ('New Kitchen',    15000, 4200, 500, (current_date + interval '18 months')::date, 'violet',  'Saving up for the renovation')
) as p(name, target_amount, current_amount, monthly_contribution, target_date, color, notes)
where u.email = 'demo@myhouse.local';

-- 5. Savings accounts (linked to their pot by name)
insert into public.savings_accounts (user_id, pot_id, name, notes)
select u.id, pt.id, a.name, a.notes
from auth.users u
cross join (values
  ('Emergency Fund', 'Marcus by Goldman Sachs', '4.5% easy access'),
  ('Emergency Fund', 'Chase Saver',             'Round-ups'),
  ('New Kitchen',    'Cash ISA',                null::text)
) as a(pot, name, notes)
join public.savings_pots pt on pt.user_id = u.id and pt.name = a.pot
where u.email = 'demo@myhouse.local';

-- 6. Contributions (back-dated; linked to their account by name)
insert into public.savings_contributions (user_id, pot_id, account_id, amount, occurred_on, note)
select u.id, ac.pot_id, ac.id, c.amount, c.occurred_on, c.note
from auth.users u
cross join (values
  ('Marcus by Goldman Sachs', 5000, (current_date - interval '5 months')::date, 'Opening balance'),
  ('Marcus by Goldman Sachs', 300,  (current_date - interval '4 months')::date, null),
  ('Marcus by Goldman Sachs', 300,  (current_date - interval '3 months')::date, null),
  ('Chase Saver',             200,  (current_date - interval '2 months')::date, 'Round-ups'),
  ('Marcus by Goldman Sachs', 300,  (current_date - interval '1 months')::date, null),
  ('Chase Saver',             200,  (current_date - interval '10 days')::date,  'Round-ups'),
  ('Cash ISA',                3000, (current_date - interval '6 months')::date, 'Opening balance'),
  ('Cash ISA',                500,  (current_date - interval '2 months')::date, null),
  ('Cash ISA',                500,  (current_date - interval '1 months')::date, null),
  ('Cash ISA',                200,  (current_date - interval '15 days')::date,  'Birthday money')
) as c(acc, amount, occurred_on, note)
join public.savings_accounts ac on ac.user_id = u.id and ac.name = c.acc
where u.email = 'demo@myhouse.local';

-- 7. Projects
insert into public.projects
  (user_id, name, category, description, estimated_cost, actual_cost, priority, status, target_completion_date, notes)
select u.id, p.* from auth.users u cross join (values
  ('Kitchen renovation', 'Kitchen',     'New units, worktops and flooring.', 14000, 0,   'High',   'Quoting',   (current_date + interval '8 months')::date, null::text),
  ('Garden decking',     'Garden',      'Raised deck off the patio doors.',  3200,  0,   'Medium', 'Planning',  (current_date + interval '3 months')::date, null::text),
  ('Repaint hallway',    'Living Room', 'Farrow & Ball Cornforth White.',    250,   240, 'Low',    'Completed', (current_date - interval '1 months')::date, 'Done over a weekend')
) as p(name, category, description, estimated_cost, actual_cost, priority, status, target_completion_date, notes)
where u.email = 'demo@myhouse.local';

-- 8a. Project tasks (linked to their project by name)
insert into public.project_tasks (user_id, project_id, title, is_done, due_date)
select u.id, pr.id, t.title, t.is_done, t.due_date
from auth.users u
cross join (values
  ('Kitchen renovation', 'Get 3 quotes from fitters', false, (current_date + 14)::date),
  ('Kitchen renovation', 'Choose worktop material',   false, (current_date + 21)::date),
  ('Kitchen renovation', 'Finalise budget',           true,  (current_date - 3)::date),
  ('Garden decking',     'Order decking timber',      false, (current_date + 10)::date),
  ('Garden decking',     'Hire a skip',               false, null::date),
  ('Repaint hallway',    'Buy paint',                 true,  null::date)
) as t(proj, title, is_done, due_date)
join public.projects pr on pr.user_id = u.id and pr.name = t.proj
where u.email = 'demo@myhouse.local';

-- 8b. Standalone tasks (no project)
insert into public.project_tasks (user_id, project_id, title, is_done, due_date)
select u.id, null::uuid, t.title, t.is_done, t.due_date
from auth.users u
cross join (values
  ('Bleed the radiators',     false, (current_date + 2)::date),
  ('Book the boiler service', false, (current_date + 30)::date),
  ('Descale the kettle',      true,  null::date)
) as t(title, is_done, due_date)
where u.email = 'demo@myhouse.local';

-- 9. Future purchases
insert into public.purchases (user_id, name, url, store, price, category, sub_category, room, priority, status, notes)
select u.id, p.* from auth.users u cross join (values
  ('Corner sofa',    'https://example.com/sofa', 'DFS',        1299, 'Furniture',  'Sofa',           'Living Room', 'High',   'Shortlisted',  'Grey, left-hand chaise'),
  ('Robot vacuum',   null,                       'Amazon',     349,  'Appliances', 'Vacuum Cleaner', 'Whole House', 'Medium', 'Considering',  null),
  ('Air fryer',      null,                       'Currys',     89,   'Appliances', 'Air Fryer',      'Kitchen',     'Medium', 'Ready To Buy', null),
  ('Garden parasol', null,                       'B&Q',        120,  'Garden',     'Parasol',        'Garden',      'Low',    'Interesting',  null),
  ('55" OLED TV',    null,                       'John Lewis', 999,  'Technology', 'TV',             'Living Room', 'Medium', 'Considering',  null),
  ('Billy bookcase', null,                       'IKEA',       75,   'Furniture',  'Bookcase',       'Office',      'Low',    'Purchased',    null)
) as p(name, url, store, price, category, sub_category, room, priority, status, notes)
where u.email = 'demo@myhouse.local';

-- 10. Inspiration
insert into public.collections (user_id, name, description)
select id, 'Kitchen ideas', 'Inspiration for the renovation' from auth.users where email = 'demo@myhouse.local';

insert into public.inspiration (user_id, title, link, source, category, room, tags, priority, status, collection_id)
select u.id, i.title, i.link, i.source, i.category, i.room, i.tags, i.priority, i.status,
       (select c.id from public.collections c where c.user_id = u.id and c.name = i.coll)
from auth.users u
cross join (values
  ('Shaker kitchen in sage green', 'https://pinterest.com/pin/123', 'Pinterest', 'Kitchen', 'Kitchen', array['sage','shaker'], 'High',   'Considering', 'Kitchen ideas'),
  ('Open shelving styling',        'https://instagram.com/p/abc',   'Instagram', 'Kitchen', 'Kitchen', array['shelving'],       'Medium', 'Saved',       'Kitchen ideas'),
  ('Decking lighting ideas',       'https://youtube.com/watch?v=x', 'YouTube',   'Garden',  'Garden',  array['lighting'],       'Low',    'Saved',       null),
  ('Hallway runner rug',           null,                            'Store',     'Decor',   'Hallway', array['rug'],            'Low',    'Planned',     null)
) as i(title, link, source, category, room, tags, priority, status, coll)
where u.email = 'demo@myhouse.local';

-- 11. Maintenance
insert into public.maintenance_tasks (user_id, task, frequency, last_completed_date, next_due_date, cost, notes)
select u.id, m.* from auth.users u cross join (values
  ('Boiler service',        'annually',   (current_date - interval '11 months')::date, (current_date + interval '1 months')::date, 90, 'British Gas'),
  ('Clean the gutters',     'biannually', (current_date - interval '5 months')::date,  (current_date + interval '1 months')::date, 0,  null),
  ('Test smoke alarms',     'monthly',    (current_date - interval '20 days')::date,   (current_date + 10)::date,                  0,  null),
  ('Service the lawnmower', 'annually',   null::date,                                  (current_date - 5)::date,                   0,  'Overdue example')
) as m(task, frequency, last_completed_date, next_due_date, cost, notes)
where u.email = 'demo@myhouse.local';

-- 12. Documents (metadata only — no files attached)
insert into public.documents (user_id, name, category, expiry_date, notes)
select u.id, d.* from auth.users u cross join (values
  ('Buildings & contents insurance', 'Insurance',  (current_date + interval '7 months')::date, 'Aviva policy'),
  ('Boiler warranty',                'Warranties', (current_date + interval '2 years')::date,  'Worcester Bosch, 5yr')
) as d(name, category, expiry_date, notes)
where u.email = 'demo@myhouse.local';

-- 13. A little change-log history so the Change log tab isn't empty
insert into public.activity_log (user_id, action, entity_type, entity_label, created_at)
select u.id, a.* from auth.users u cross join (values
  ('insert', 'savings_pots',      'Emergency Fund',     now() - interval '5 months'),
  ('insert', 'projects',          'Kitchen renovation', now() - interval '3 weeks'),
  ('update', 'projects',          'Repaint hallway',    now() - interval '1 months'),
  ('insert', 'purchases',         'Corner sofa',        now() - interval '6 days'),
  ('insert', 'savings_pots',      'New Kitchen',        now() - interval '15 days'),
  ('update', 'maintenance_tasks', 'Boiler service',     now() - interval '2 days')
) as a(action, entity_type, entity_label, created_at)
where u.email = 'demo@myhouse.local';
