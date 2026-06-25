-- =====================================================================
-- Demo data seed — a self-contained "show people how it works" account.
--
-- PREREQUISITES (run once, in order):
--   1. Run migration 0008_household_isolation.sql first.
--   2. In Supabase → Authentication → Users → Add user, create:
--        email:    demo@myhouse.local
--        password: demohouse   (or your choice)
--        ☑ Auto Confirm User
--      The username on the login screen is "demo".
--   3. Run THIS script in the SQL editor (clear the box first).
--
-- It is idempotent: re-running wipes the demo's data and reseeds. It only
-- ever touches the demo user's rows — your real data is never affected.
-- =====================================================================

do $$
declare
  uid   uuid;
  hid   uuid := gen_random_uuid();
  pot1  uuid; pot2 uuid;
  acc1  uuid; acc2 uuid; acc3 uuid;
  proj1 uuid; proj2 uuid; proj3 uuid;
  coll1 uuid;
begin
  select id into uid from auth.users where email = 'demo@myhouse.local';
  if uid is null then
    raise exception 'Create the demo auth user first (email demo@myhouse.local), then re-run.';
  end if;

  -- Clean any previous demo data (savings_pots/projects cascade to children).
  delete from public.activity_log      where user_id = uid;
  delete from public.documents         where user_id = uid;
  delete from public.maintenance_tasks where user_id = uid;
  delete from public.inspiration       where user_id = uid;
  delete from public.collections       where user_id = uid;
  delete from public.purchases         where user_id = uid;
  delete from public.project_tasks     where user_id = uid;
  delete from public.projects          where user_id = uid;
  delete from public.savings_pots      where user_id = uid;
  delete from public.bills             where user_id = uid;
  delete from public.mortgages         where user_id = uid;
  delete from public.household_members where user_id = uid;

  -- The demo lives in its OWN household (isolated from everyone else).
  insert into public.household_members (user_id, display_name, household_id)
  values (uid, 'Demo', hid);

  -- Mortgage --------------------------------------------------------------
  insert into public.mortgages
    (user_id, property_name, property_value, mortgage_balance, interest_rate,
     monthly_payment, term_months, start_date, fixed_term_end_date, provider, notes)
  values
    (uid, 'Maple Cottage', 425000, 268500, 4.290, 1485, 300,
     '2022-09-01', '2027-09-01', 'Halifax', 'Sample mortgage for the demo.');

  -- Bills -----------------------------------------------------------------
  insert into public.bills (user_id, name, category, amount, frequency, due_date, payment_account, is_fixed, notes) values
    (uid, 'Mortgage payment', 'Mortgage',      1485,  'monthly',  current_date + 5,  'Joint account', true,  null),
    (uid, 'Council Tax',      'Council Tax',     198,  'monthly',  current_date + 1,  'Joint account', true,  'Band D'),
    (uid, 'Octopus Energy',   'Utilities',       142,  'monthly',  current_date + 8,  'Joint account', false, 'Variable tariff'),
    (uid, 'Thames Water',     'Utilities',        41,  'monthly',  current_date + 12, 'Joint account', true,  null),
    (uid, 'BT Broadband',     'Broadband',        38,  'monthly',  current_date + 3,  'Joint account', true,  null),
    (uid, 'Netflix',          'Subscriptions', 15.99,  'monthly',  current_date + 20, 'Personal',      true,  null),
    (uid, 'Home Insurance',   'Insurance',       320,  'annually', current_date + 60, 'Joint account', true,  'Buildings + contents');

  -- Savings pots + accounts + back-dated contributions --------------------
  insert into public.savings_pots
    (user_id, name, target_amount, current_amount, monthly_contribution, target_date, color, notes)
  values (uid, 'Emergency Fund', 10000, 6500, 300, current_date + interval '12 months', 'emerald', '3-6 months of outgoings')
  returning id into pot1;

  insert into public.savings_pots
    (user_id, name, target_amount, current_amount, monthly_contribution, target_date, color, notes)
  values (uid, 'New Kitchen', 15000, 4200, 500, current_date + interval '18 months', 'violet', 'Saving up for the renovation')
  returning id into pot2;

  insert into public.savings_accounts (user_id, pot_id, name, notes)
    values (uid, pot1, 'Marcus by Goldman Sachs', '4.5% easy access') returning id into acc1;
  insert into public.savings_accounts (user_id, pot_id, name, notes)
    values (uid, pot1, 'Chase Saver', 'Round-ups') returning id into acc2;
  insert into public.savings_accounts (user_id, pot_id, name, notes)
    values (uid, pot2, 'Cash ISA', null) returning id into acc3;

  insert into public.savings_contributions (user_id, pot_id, account_id, amount, occurred_on, note) values
    (uid, pot1, acc1, 5000, current_date - interval '5 months', 'Opening balance'),
    (uid, pot1, acc1,  300, current_date - interval '4 months', null),
    (uid, pot1, acc1,  300, current_date - interval '3 months', null),
    (uid, pot1, acc2,  200, current_date - interval '2 months', 'Round-ups'),
    (uid, pot1, acc1,  300, current_date - interval '1 months', null),
    (uid, pot1, acc2,  200, current_date - interval '10 days',  'Round-ups'),
    (uid, pot2, acc3, 3000, current_date - interval '6 months', 'Opening balance'),
    (uid, pot2, acc3,  500, current_date - interval '2 months', null),
    (uid, pot2, acc3,  500, current_date - interval '1 months', null),
    (uid, pot2, acc3,  200, current_date - interval '15 days',  'Birthday money');

  -- Projects + tasks (and a few standalone tasks) ------------------------
  insert into public.projects
    (user_id, name, category, description, estimated_cost, actual_cost, priority, status, target_completion_date, notes)
  values (uid, 'Kitchen renovation', 'Kitchen', 'New units, worktops and flooring.', 14000, 0, 'High', 'Quoting', current_date + interval '8 months', null)
  returning id into proj1;

  insert into public.projects
    (user_id, name, category, description, estimated_cost, actual_cost, priority, status, target_completion_date, notes)
  values (uid, 'Garden decking', 'Garden', 'Raised deck off the patio doors.', 3200, 0, 'Medium', 'Planning', current_date + interval '3 months', null)
  returning id into proj2;

  insert into public.projects
    (user_id, name, category, description, estimated_cost, actual_cost, priority, status, target_completion_date, notes)
  values (uid, 'Repaint hallway', 'Living Room', 'Farrow & Ball Cornforth White.', 250, 240, 'Low', 'Completed', current_date - interval '1 months', 'Done over a weekend')
  returning id into proj3;

  insert into public.project_tasks (user_id, project_id, title, is_done, due_date) values
    (uid, proj1, 'Get 3 quotes from fitters', false, current_date + 14),
    (uid, proj1, 'Choose worktop material',   false, current_date + 21),
    (uid, proj1, 'Finalise budget',            true,  current_date - 3),
    (uid, proj2, 'Order decking timber',       false, current_date + 10),
    (uid, proj2, 'Hire a skip',                false, null),
    (uid, proj3, 'Buy paint',                  true,  null),
    (uid, null,  'Bleed the radiators',        false, current_date + 2),
    (uid, null,  'Book the boiler service',    false, current_date + 30),
    (uid, null,  'Descale the kettle',         true,  null);

  -- Future purchases ------------------------------------------------------
  insert into public.purchases (user_id, name, url, store, price, category, sub_category, room, priority, status, notes) values
    (uid, 'Corner sofa',      'https://example.com/sofa', 'DFS',        1299, 'Furniture',  'Sofa',           'Living Room', 'High',   'Shortlisted',  'Grey, left-hand chaise'),
    (uid, 'Robot vacuum',     null,                       'Amazon',      349, 'Appliances', 'Vacuum Cleaner', 'Whole House', 'Medium', 'Considering',  null),
    (uid, 'Air fryer',        null,                       'Currys',       89, 'Appliances', 'Air Fryer',      'Kitchen',     'Medium', 'Ready To Buy', null),
    (uid, 'Garden parasol',   null,                       'B&Q',         120, 'Garden',     'Parasol',        'Garden',      'Low',    'Interesting',  null),
    (uid, '55" OLED TV',      null,                       'John Lewis',  999, 'Technology', 'TV',             'Living Room', 'Medium', 'Considering',  null),
    (uid, 'Billy bookcase',   null,                       'IKEA',         75, 'Furniture',  'Bookcase',       'Office',      'Low',    'Purchased',    null);

  -- Inspiration -----------------------------------------------------------
  insert into public.collections (user_id, name, description)
    values (uid, 'Kitchen ideas', 'Inspiration for the renovation') returning id into coll1;

  insert into public.inspiration (user_id, title, link, source, category, room, tags, priority, status, collection_id) values
    (uid, 'Shaker kitchen in sage green', 'https://pinterest.com/pin/123', 'Pinterest', 'Kitchen', 'Kitchen', array['sage','shaker'], 'High',   'Considering', coll1),
    (uid, 'Open shelving styling',        'https://instagram.com/p/abc',   'Instagram', 'Kitchen', 'Kitchen', array['shelving'],       'Medium', 'Saved',       coll1),
    (uid, 'Decking lighting ideas',       'https://youtube.com/watch?v=x', 'YouTube',   'Garden',  'Garden',  array['lighting'],       'Low',    'Saved',       null),
    (uid, 'Hallway runner rug',           null,                            'Store',     'Decor',   'Hallway', array['rug'],            'Low',    'Planned',     null);

  -- Maintenance -----------------------------------------------------------
  insert into public.maintenance_tasks (user_id, task, frequency, last_completed_date, next_due_date, cost, notes) values
    (uid, 'Boiler service',     'annually',   current_date - interval '11 months', current_date + interval '1 months', 90, 'British Gas'),
    (uid, 'Clean the gutters',  'biannually', current_date - interval '5 months',  current_date + interval '1 months',  0, null),
    (uid, 'Test smoke alarms',  'monthly',    current_date - interval '20 days',   current_date + 10,                   0, null),
    (uid, 'Service the lawnmower','annually',  null,                                current_date - 5,                    0, 'Overdue example');

  -- Documents (metadata only — no files attached) -------------------------
  insert into public.documents (user_id, name, category, expiry_date, notes) values
    (uid, 'Buildings & contents insurance', 'Insurance',  current_date + interval '7 months', 'Aviva policy'),
    (uid, 'Boiler warranty',                'Warranties', current_date + interval '2 years',  'Worcester Bosch, 5yr');

  -- A little change-log history so the Change log tab isn't empty ---------
  insert into public.activity_log (user_id, action, entity_type, entity_label, created_at) values
    (uid, 'insert', 'savings_pots',      'Emergency Fund',     now() - interval '5 months'),
    (uid, 'insert', 'projects',          'Kitchen renovation', now() - interval '3 weeks'),
    (uid, 'update', 'projects',          'Repaint hallway',    now() - interval '1 months'),
    (uid, 'insert', 'purchases',         'Corner sofa',        now() - interval '6 days'),
    (uid, 'insert', 'savings_pots',      'New Kitchen',        now() - interval '15 days'),
    (uid, 'update', 'maintenance_tasks', 'Boiler service',     now() - interval '2 days');
end $$;
