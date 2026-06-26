-- Bill payments now track whether they've actually been paid. Existing logged
-- payments are treated as paid; auto-generated due payments start unpaid.

alter table public.bill_payments add column if not exists is_paid boolean not null default false;
update public.bill_payments set is_paid = true where is_paid = false;
