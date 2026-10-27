alter table public.listings
  drop constraint if exists listings_kind_check;

alter table public.listings
  add constraint listings_kind_check
  check (kind in ('for_sale', 'wishlist', 'housing'));

alter table public.listings
  add column people_needed integer,
  add column address text,
  add constraint listings_people_needed_positive check (
    people_needed is null or (people_needed > 0 and people_needed <= 99)
  ),
  add constraint listings_address_length check (
    address is null or char_length(address) between 1 and 200
  );
