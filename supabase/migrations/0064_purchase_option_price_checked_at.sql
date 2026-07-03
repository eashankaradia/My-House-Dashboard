-- Tracks when a purchase option's price was last auto-refreshed from its
-- link, so the Purchases page can skip re-checking options that were
-- already checked recently (rather than re-fetching every option on every
-- single tab visit).
alter table purchase_options
  add column if not exists price_checked_at timestamptz;
