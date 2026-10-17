-- Team create / invite / add-member must keep working after authenticated
-- table writes were revoked. SECURITY DEFINER RPCs with an empty search_path
-- and an explicit owner/admin check are the only write path.
begin;

create or replace function public.team_role(p_team_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.team_members
  where team_id = p_team_id and user_id = auth.uid() and status = 'active'
  limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role from public.user_profiles where user_id = auth.uid()),
    'user'
  ) = 'super_admin';
$$;

create or replace function public.is_team_admin(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.team_role(p_team_id) in ('owner', 'admin'), false)
    or public.is_super_admin();
$$;

create or replace function public.create_team_and_owner(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  tid uuid;
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  if exists (
    select 1 from public.team_members where user_id = caller and status = 'active'
  ) then
    raise exception 'already on a team';
  end if;
  insert into public.teams(name, plan, max_seats, owner_id)
    values (coalesce(nullif(btrim(p_name), ''), 'My Team'), 'team', 25, caller)
    returning id into tid;
  insert into public.team_members(team_id, user_id, role, invited_by)
    values (tid, caller, 'owner', caller);
  update public.user_profiles set team_id = tid where user_id = caller;
  insert into public.team_activity_log(team_id, actor_id, action_type)
    values (tid, caller, 'team_created');
  return tid;
end;
$$;

create or replace function public.lookup_user_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

create or replace function public.invite_member(p_team_id uuid, p_email text, p_role text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  existing uuid;
  used integer;
  cap integer;
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  if not public.is_team_admin(p_team_id) then raise exception 'not authorized'; end if;
  if p_role not in ('admin', 'member') then raise exception 'invalid role'; end if;
  select max_seats into cap from public.teams where id = p_team_id;
  select (select count(*) from public.team_members where team_id = p_team_id and status = 'active')
       + (select count(*) from public.team_invitations where team_id = p_team_id and status = 'pending')
    into used;
  if cap is not null and used >= cap then
    raise exception 'seat limit reached (%)', cap;
  end if;
  existing := public.lookup_user_by_email(p_email);
  if existing is not null then
    if exists (
      select 1 from public.team_members where user_id = existing and status = 'active'
    ) then
      raise exception 'user already belongs to a team';
    end if;
    insert into public.team_members(team_id, user_id, role, invited_by)
      values (p_team_id, existing, p_role, caller);
    update public.user_profiles set team_id = p_team_id where user_id = existing;
    insert into public.team_activity_log(team_id, actor_id, action_type, target_user_id)
      values (p_team_id, caller, 'member_added', existing);
    return jsonb_build_object('mode', 'added');
  end if;
  insert into public.team_invitations(team_id, email, role, invited_by, token)
    values (p_team_id, p_email, p_role, caller, p_token);
  insert into public.team_activity_log(team_id, actor_id, action_type, metadata)
    values (p_team_id, caller, 'member_invited', jsonb_build_object('email', p_email));
  return jsonb_build_object('mode', 'invited', 'token', p_token);
end;
$$;

create or replace function public.add_team_member(p_team_id uuid, p_user_id uuid, p_role text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  mid uuid;
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  if not public.is_team_admin(p_team_id) then raise exception 'not authorized'; end if;
  if p_role not in ('admin', 'member') then raise exception 'invalid role'; end if;
  if exists (
    select 1 from public.team_members where user_id = p_user_id and status = 'active'
  ) then
    raise exception 'user already belongs to a team';
  end if;
  insert into public.team_members(team_id, user_id, role, invited_by)
    values (p_team_id, p_user_id, p_role, caller)
    returning id into mid;
  update public.user_profiles set team_id = p_team_id where user_id = p_user_id;
  insert into public.team_activity_log(team_id, actor_id, action_type, target_user_id)
    values (p_team_id, caller, 'member_added', p_user_id);
  return mid;
end;
$$;

grant execute on function public.team_role(uuid),
  public.is_super_admin(),
  public.is_team_admin(uuid),
  public.create_team_and_owner(text),
  public.lookup_user_by_email(text),
  public.invite_member(uuid, text, text, text),
  public.add_team_member(uuid, uuid, text)
  to authenticated;

commit;
