alter table public.listings
  drop constraint listings_category_check;

alter table public.listings
  add column categories text[];

update public.listings
set categories = array[category]
where kind = 'for_sale' and category is not null;

alter table public.listings
  drop column category;

alter table public.listings
  add constraint listings_categories_check check (
    (
      kind = 'for_sale'
      and categories is not null
      and cardinality(categories) >= 1
      and categories <@ array[
        'textbooks',
        'clothes',
        'school_supplies',
        'dorm',
        'athletic',
        'sports',
        'electronics',
        'furniture',
        'tickets',
        'transportation',
        'kitchen',
        'beauty',
        'entertainment',
        'other'
      ]::text[]
    )
    or (
      kind <> 'for_sale'
      and categories is null
    )
  );
