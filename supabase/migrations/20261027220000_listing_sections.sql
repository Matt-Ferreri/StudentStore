create table public.listing_sections (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  title text not null,
  sort_order integer not null check (sort_order >= 0 and sort_order < 6),
  constraint listing_sections_title_length check (
    char_length(btrim(title)) between 1 and 80
  ),
  unique (listing_id, sort_order)
);

create index listing_sections_listing_sort_idx
  on public.listing_sections (listing_id, sort_order);

create table public.listing_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.listing_sections (id) on delete cascade,
  label text not null,
  price_cents integer,
  sort_order integer not null check (sort_order >= 0 and sort_order < 12),
  constraint listing_items_label_length check (
    char_length(btrim(label)) between 1 and 80
  ),
  constraint listing_items_price_range check (
    price_cents is null or (price_cents >= 0 and price_cents <= 10000000)
  ),
  unique (section_id, sort_order)
);

create index listing_items_section_sort_idx
  on public.listing_items (section_id, sort_order);

alter table public.listing_sections enable row level security;
alter table public.listing_items enable row level security;

create policy "listing sections are publicly readable"
  on public.listing_sections
  for select
  to anon, authenticated
  using (true);

create policy "users insert sections on their listings"
  on public.listing_sections
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.listings
      where listings.id = listing_id
        and listings.user_id = auth.uid()
    )
  );

create policy "listing items are publicly readable"
  on public.listing_items
  for select
  to anon, authenticated
  using (true);

create policy "users insert items in their sections"
  on public.listing_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.listing_sections
      join public.listings on listings.id = listing_sections.listing_id
      where listing_sections.id = section_id
        and listings.user_id = auth.uid()
    )
  );

grant select on table public.listing_sections to anon, authenticated;
grant insert on table public.listing_sections to authenticated;
grant all on table public.listing_sections to service_role;

grant select on table public.listing_items to anon, authenticated;
grant insert on table public.listing_items to authenticated;
grant all on table public.listing_items to service_role;
