create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campuses (id),
  kind text not null check (kind in ('for_sale', 'wishlist')),
  title text not null,
  description text not null,
  price_cents integer,
  poster_name text not null,
  contact text not null,
  created_at timestamptz not null default now(),
  constraint listings_price_nonnegative check (price_cents is null or price_cents >= 0)
);

create index listings_campus_kind_created_idx
  on public.listings (campus_id, kind, created_at desc);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  sort_order integer not null,
  unique (listing_id, sort_order)
);

insert into public.campuses (slug, name)
values ('marist', 'Marist University');

alter table public.campuses enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;

create policy "campuses are publicly readable"
  on public.campuses
  for select
  to anon, authenticated
  using (true);

create policy "listings are publicly readable"
  on public.listings
  for select
  to anon, authenticated
  using (true);

create policy "listing images are publicly readable"
  on public.listing_images
  for select
  to anon, authenticated
  using (true);

grant select on table public.campuses to anon, authenticated;
grant select on table public.listings to anon, authenticated;
grant select on table public.listing_images to anon, authenticated;
grant all on table public.campuses to service_role;
grant all on table public.listings to service_role;
grant all on table public.listing_images to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "listing image files are publicly readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'listing-images');
