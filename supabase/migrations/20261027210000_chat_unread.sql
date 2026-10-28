alter table public.conversations
  add column buyer_read_at timestamptz,
  add column seller_read_at timestamptz;

create or replace function public.mark_conversation_read(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

  update public.conversations
  set buyer_read_at = now()
  where id = target_id
    and buyer_id = auth.uid();

  if found then
    return;
  end if;

  update public.conversations as conversation
  set seller_read_at = now()
  from public.listings
  where conversation.id = target_id
    and conversation.listing_id = listings.id
    and listings.user_id = auth.uid();

  if not found then
    raise exception 'Not a member of this conversation';
  end if;
end;
$$;

create or replace function public.unread_message_counts()
returns table (conversation_id uuid, unread_count integer)
language sql
stable
security invoker
set search_path = public
as $$
  select
    messages.conversation_id,
    count(*)::integer as unread_count
  from public.messages
  join public.conversations on conversations.id = messages.conversation_id
  join public.listings on listings.id = conversations.listing_id
  where messages.sender_id is distinct from auth.uid()
    and (
      (
        conversations.buyer_id = auth.uid()
        and (
          conversations.buyer_read_at is null
          or messages.created_at > conversations.buyer_read_at
        )
      )
      or (
        listings.user_id = auth.uid()
        and conversations.buyer_id is distinct from auth.uid()
        and (
          conversations.seller_read_at is null
          or messages.created_at > conversations.seller_read_at
        )
      )
    )
  group by messages.conversation_id;
$$;

revoke all on function public.mark_conversation_read(uuid) from public, anon, authenticated;
revoke all on function public.unread_message_counts() from public, anon, authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.unread_message_counts() to authenticated;
