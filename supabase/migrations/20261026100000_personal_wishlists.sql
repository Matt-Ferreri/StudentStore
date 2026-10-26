create table public.wish_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  contact text not null,
  phrase text not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint wish_items_contact_marist check (
    contact ~ '^[a-z]+(-[a-z]+)*[0-9]*\.[a-z]+(-[a-z]+)*[0-9]*@marist\.edu$'
  ),
  constraint wish_items_phrase_length check (
    char_length(btrim(phrase)) between 1 and 120
  ),
  constraint wish_items_notes_length check (
    notes is null or char_length(notes) between 1 and 4000
  )
);

create index wish_items_user_created_idx
  on public.wish_items (user_id, created_at desc);

create or replace function public.set_wish_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  email text := lower(coalesce(
    auth.jwt() ->> 'email',
    auth.jwt() -> 'user_metadata' ->> 'email',
    ''
  ));
begin
  if auth.uid() is null then
    return new;
  end if;

  if email !~ '^[a-z]+(-[a-z]+)*[0-9]*\.[a-z]+(-[a-z]+)*[0-9]*@marist\.edu$' then
    raise exception 'A Marist email is required';
  end if;

  new.user_id := auth.uid();
  new.contact := email;
  return new;
end;
$$;

create trigger wish_items_set_owner
  before insert on public.wish_items
  for each row
  execute function public.set_wish_owner();

revoke all on function public.set_wish_owner() from public, anon, authenticated;

alter table public.wish_items enable row level security;

create policy "users read their own wishes"
  on public.wish_items
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "users insert their own wishes"
  on public.wish_items
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users delete their own wishes"
  on public.wish_items
  for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.wish_items from public, anon, authenticated;
grant select, insert, delete on table public.wish_items to authenticated;
grant all on table public.wish_items to service_role;

insert into public.wish_items (user_id, contact, phrase, notes, created_at)
select
  user_id,
  lower(contact),
  title,
  nullif(left(btrim(description), 4000), ''),
  created_at
from public.listings
where kind = 'wishlist';

delete from public.listings
where kind = 'wishlist';
