delete from public.listings;

alter table public.listings
  add column user_id uuid not null references auth.users (id) on delete cascade;

create index listings_user_id_idx on public.listings (user_id);

create or replace function public.enforce_marist_email(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  email text := lower(event->'user'->>'email');
begin
  if email is null
    or email !~ '^[a-z]+(-[a-z]+)*\.[a-z]+(-[a-z]+)*@marist\.edu$' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 400,
        'message', 'Use a Marist email like first.last@marist.edu.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.enforce_marist_email to supabase_auth_admin;
revoke execute on function public.enforce_marist_email from public, anon, authenticated;

grant insert, delete on table public.listings to authenticated;
grant insert, delete on table public.listing_images to authenticated;

create policy "users insert their own listings"
  on public.listings
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users delete their own listings"
  on public.listings
  for delete
  to authenticated
  using (user_id = auth.uid());

create policy "users insert images on their listings"
  on public.listing_images
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

create policy "users delete images on their listings"
  on public.listing_images
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

create policy "users upload their listing images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and exists (
      select 1
      from public.listings
      where listings.id::text = (storage.foldername(name))[1]
        and listings.user_id = auth.uid()
    )
  );

create policy "users delete their listing images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1
      from public.listings
      where listings.id::text = (storage.foldername(name))[1]
        and listings.user_id = auth.uid()
    )
  );
