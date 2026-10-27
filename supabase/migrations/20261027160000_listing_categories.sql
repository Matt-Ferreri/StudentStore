alter table public.listings
  add column category text;

update public.listings
set category = 'other'
where kind = 'for_sale';

alter table public.listings
  add constraint listings_category_check check (
    (
      kind = 'for_sale'
      and category in (
        'textbooks',
        'clothes',
        'school_supplies',
        'dorm',
        'athletic',
        'electronics',
        'furniture',
        'tickets',
        'transportation',
        'kitchen',
        'beauty',
        'entertainment',
        'other'
      )
    )
    or (
      kind <> 'for_sale'
      and category is null
    )
  );
