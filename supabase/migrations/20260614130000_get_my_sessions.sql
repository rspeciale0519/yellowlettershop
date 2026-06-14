-- Read-only access to the caller's own auth sessions for Security > Login History.
-- auth.sessions lives in the auth schema (not client-readable), so this
-- SECURITY DEFINER function returns just the current user's sessions (scoped to
-- auth.uid()) and flags the current one via the JWT `session_id` claim.
create or replace function public.get_my_sessions()
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_agent text,
  ip text,
  aal text,
  is_current boolean
)
language sql
security definer
set search_path = ''
as $$
  select
    s.id,
    s.created_at,
    s.updated_at,
    s.user_agent,
    host(s.ip) as ip,
    s.aal::text as aal,
    (s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid) as is_current
  from auth.sessions s
  where s.user_id = auth.uid()
  order by s.updated_at desc nulls last, s.created_at desc;
$$;

revoke all on function public.get_my_sessions() from public;
grant execute on function public.get_my_sessions() to authenticated;
