create table public.admin_emails (
  email text primary key,
  constraint admin_emails_format check (
    email = lower(email)
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

alter table public.admin_emails enable row level security;

revoke all on table public.admin_emails from public, anon, authenticated;
grant select on table public.admin_emails to supabase_auth_admin;
grant all on table public.admin_emails to service_role;

create policy "auth hook reads admin emails"
  on public.admin_emails
  for select
  to supabase_auth_admin
  using (true);

create or replace function public.enforce_marist_email(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text := lower(event->'user'->>'email');
begin
  if user_email is not null and (
    user_email ~ '^[a-z]+(-[a-z]+)*[0-9]*\.[a-z]+(-[a-z]+)*[0-9]*@marist\.edu$'
    or exists (
      select 1
      from public.admin_emails
      where admin_emails.email = user_email
    )
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 400,
      'message', 'Use a Marist email like first.last@marist.edu.'
    )
  );
end;
$$;

create table public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint listing_reports_reason_length check (
    char_length(btrim(reason)) between 1 and 500
  ),
  constraint listing_reports_one_per_reporter unique (listing_id, reporter_id)
);

create index listing_reports_listing_id_idx
  on public.listing_reports (listing_id);

alter table public.listing_reports enable row level security;

revoke all on table public.listing_reports from public, anon, authenticated;
grant insert on table public.listing_reports to authenticated;
grant all on table public.listing_reports to service_role;

create policy "users insert their own reports"
  on public.listing_reports
  for insert
  to authenticated
  with check (reporter_id = auth.uid());
