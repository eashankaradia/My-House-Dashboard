-- Purchase options can now have a photo gallery instead of a single image.
-- image_url is kept in sync as image_urls[0] (the "cover" photo) so
-- existing thumbnail usages elsewhere (Purchases rows, Ready to buy, the
-- Room Designer's saved-option picker) keep working unchanged.
alter table public.purchase_options
  add column if not exists image_urls text[] not null default '{}';

update public.purchase_options
  set image_urls = array[image_url]
  where image_url is not null and array_length(image_urls, 1) is null;
