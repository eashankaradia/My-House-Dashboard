-- Purchase options can now be recurring costs (e.g. broadband, insurance),
-- not just one-off prices. Default stays 'one-off' so existing rows are
-- unchanged.

alter table public.purchase_options
  add column if not exists frequency text not null default 'one-off';
