create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  buyer_name text not null,
  buyer_email text not null,
  last_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, buyer_id),
  constraint conversations_buyer_name_present check (char_length(btrim(buyer_name)) > 0),
  constraint conversations_buyer_email_marist check (
    buyer_email ~ '^[a-z]+(-[a-z]+)*[0-9]*\.[a-z]+(-[a-z]+)*[0-9]*@marist\.edu$'
  )
);

create index conversations_listing_updated_idx
  on public.conversations (listing_id, updated_at desc);

create index conversations_buyer_updated_idx
  on public.conversations (buyer_id, updated_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint messages_body_length check (char_length(btrim(body)) between 1 and 2000)
);

create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create or replace function public.set_conversation_buyer()
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
  local_part text;
  word text;
  display_name text := '';
begin
  if new.buyer_id is distinct from auth.uid() then
    raise exception 'buyer_id must be the signed-in user';
  end if;

  if email !~ '^[a-z]+(-[a-z]+)*[0-9]*\.[a-z]+(-[a-z]+)*[0-9]*@marist\.edu$' then
    raise exception 'A Marist email is required';
  end if;

  local_part := split_part(email, '@', 1);
  foreach word in array regexp_split_to_array(local_part, '[.\-]')
  loop
    if word <> '' then
      display_name := display_name
        || case when display_name = '' then '' else ' ' end
        || upper(left(word, 1))
        || substring(word from 2);
    end if;
  end loop;

  new.buyer_email := email;
  new.buyer_name := display_name;
  return new;
end;
$$;

create trigger conversations_set_buyer
  before insert on public.conversations
  for each row
  execute function public.set_conversation_buyer();

create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now(),
      last_message = new.body
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row
  execute function public.touch_conversation();

create or replace function public.is_conversation_member(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations
    join public.listings on listings.id = conversations.listing_id
    where conversations.id = target_id
      and (
        conversations.buyer_id = auth.uid()
        or listings.user_id = auth.uid()
      )
  );
$$;

revoke all on function public.set_conversation_buyer() from public, anon, authenticated;
revoke all on function public.touch_conversation() from public, anon, authenticated;
revoke all on function public.is_conversation_member(uuid) from public, anon, authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "members read conversations"
  on public.conversations
  for select
  to authenticated
  using (
    buyer_id = auth.uid()
    or exists (
      select 1
      from public.listings
      where listings.id = conversations.listing_id
        and listings.user_id = auth.uid()
    )
  );

create policy "buyers start conversations"
  on public.conversations
  for insert
  to authenticated
  with check (
    buyer_id = auth.uid()
    and exists (
      select 1
      from public.listings
      where listings.id = listing_id
        and listings.user_id <> auth.uid()
    )
  );

create policy "members read messages"
  on public.messages
  for select
  to authenticated
  using (public.is_conversation_member(conversation_id));

create policy "members send messages"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_member(conversation_id)
  );

grant select, insert on table public.conversations to authenticated;
grant select, insert on table public.messages to authenticated;
grant all on table public.conversations to service_role;
grant all on table public.messages to service_role;
