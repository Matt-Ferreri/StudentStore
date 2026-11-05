grant update on table public.listings to authenticated;
grant delete on table public.listing_trades to authenticated;
grant delete on table public.listing_sections to authenticated;
grant delete on table public.listing_items to authenticated;

create policy "users update their own listings"
  on public.listings
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users delete trades on their listings"
  on public.listing_trades
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.listings
      where listings.id = listing_id
        and listings.user_id = auth.uid()
    )
  );

create policy "users delete sections on their listings"
  on public.listing_sections
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.listings
      where listings.id = listing_id
        and listings.user_id = auth.uid()
    )
  );

create policy "users delete items in their sections"
  on public.listing_items
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.listing_sections
      join public.listings on listings.id = listing_sections.listing_id
      where listing_sections.id = section_id
        and listings.user_id = auth.uid()
    )
  );
