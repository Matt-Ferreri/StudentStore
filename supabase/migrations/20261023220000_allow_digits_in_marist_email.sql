create or replace function public.enforce_marist_email(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  email text := lower(event->'user'->>'email');
begin
  if email is null
    or email !~ '^[a-z]+(-[a-z]+)*[0-9]*\.[a-z]+(-[a-z]+)*[0-9]*@marist\.edu$' then
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
