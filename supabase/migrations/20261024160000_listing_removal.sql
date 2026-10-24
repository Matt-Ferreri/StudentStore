alter table public.listings
  add column status text not null default 'open',
  add column sold_to_id uuid references auth.users (id) on delete set null,
  add constraint listings_status_check check (status in ('open', 'sold')),
  add constraint listings_open_has_no_buyer check (
    status <> 'open' or sold_to_id is null
  );

create index listings_sold_to_id_idx on public.listings (sold_to_id);

create or replace function public.mark_listing_sold(target_listing uuid, target_buyer uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_buyer is null or target_buyer = auth.uid() then
    raise exception 'Choose the student who bought this';
  end if;

  if not exists (
    select 1
    from public.listings
    where id = target_listing
      and user_id = auth.uid()
      and kind = 'for_sale'
      and status in ('open', 'sold')
  ) then
    raise exception 'Only the seller can mark this listing sold';
  end if;

  if not exists (
    select 1
    from public.conversations
    where listing_id = target_listing
      and buyer_id = target_buyer
  ) then
    raise exception 'That student has not messaged you about this listing';
  end if;

  update public.listings
  set status = 'sold',
      sold_to_id = target_buyer
  where id = target_listing;
end;
$$;

revoke all on function public.mark_listing_sold(uuid, uuid) from public, anon, authenticated;
grant execute on function public.mark_listing_sold(uuid, uuid) to authenticated;

create policy "buyers delete listings sold to them"
  on public.listings
  for delete
  to authenticated
  using (status = 'sold' and sold_to_id = auth.uid());

create policy "buyers delete images on listings sold to them"
  on public.listing_images
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.listings
      where listings.id = listing_id
        and listings.status = 'sold'
        and listings.sold_to_id = auth.uid()
    )
  );

create policy "buyers delete files for listings sold to them"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1
      from public.listings
      where listings.id::text = (storage.foldername(name))[1]
        and listings.status = 'sold'
        and listings.sold_to_id = auth.uid()
    )
  );
