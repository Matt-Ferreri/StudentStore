create table public.listing_trades (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  label text not null,
  sort_order integer not null check (sort_order >= 0 and sort_order < 8),
  constraint listing_trades_label_length check (
    char_length(btrim(label)) between 1 and 80
  ),
  unique (listing_id, sort_order)
);

create index listing_trades_listing_sort_idx
  on public.listing_trades (listing_id, sort_order);

alter table public.listing_trades enable row level security;

create policy "listing trades are publicly readable"
  on public.listing_trades
  for select
  to anon, authenticated
  using (true);

create policy "users insert trades on their listings"
  on public.listing_trades
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

grant select on table public.listing_trades to anon, authenticated;
grant insert on table public.listing_trades to authenticated;
grant all on table public.listing_trades to service_role;
