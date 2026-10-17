-- Team create / invite / add-member / accept / role update after authenticated
-- table writes were revoked. SECURITY DEFINER, search_path='', owner/admin
-- or invitee checks. PUBLIC/anon never keep default EXECUTE.
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
  select id into existing from auth.users where lower(email) = lower(p_email) limit 1;
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

create or replace function public.accept_team_invitation(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  caller_email text;
  inv public.team_invitations%rowtype;
  mid uuid;
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  select email into caller_email from auth.users where id = caller;
  select * into inv from public.team_invitations where id = p_invitation_id and status = 'pending';
  if inv.id is null then raise exception 'invalid or expired invitation'; end if;
  if inv.expires_at < now() then raise exception 'invitation has expired'; end if;
  if caller_email is null or lower(caller_email) <> lower(inv.email::text) then
    raise exception 'not authorized';
  end if;
  if exists (
    select 1 from public.team_members where user_id = caller and status = 'active'
  ) then
    raise exception 'already on a team';
  end if;
  insert into public.team_members(team_id, user_id, role, invited_by)
    values (inv.team_id, caller, inv.role, inv.invited_by)
    returning id into mid;
  update public.team_invitations
    set status = 'accepted', accepted_at = now()
    where id = inv.id;
  update public.user_profiles set team_id = inv.team_id where user_id = caller;
  insert into public.team_activity_log(team_id, actor_id, action_type)
    values (inv.team_id, caller, 'invitation_accepted');
  return mid;
end;
$$;

create or replace function public.update_team_member_permissions(p_team_id uuid, p_member_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  updated integer;
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  if not public.is_team_admin(p_team_id) then raise exception 'not authorized'; end if;
  if p_role is not null and p_role not in ('admin', 'member') then raise exception 'invalid role'; end if;
  update public.team_members
    set role = coalesce(p_role, role), updated_at = now()
    where id = p_member_id and team_id = p_team_id and role <> 'owner';
  get diagnostics updated = row_count;
  if updated = 0 then raise exception 'not authorized'; end if;
  insert into public.team_activity_log(team_id, actor_id, action_type, metadata)
    values (p_team_id, caller, 'member_permissions_updated', jsonb_build_object('member_id', p_member_id));
end;
$$;

drop function if exists public.lookup_user_by_email(text);

revoke all on function public.team_role(uuid) from public, anon;
revoke all on function public.is_super_admin() from public, anon;
revoke all on function public.is_team_admin(uuid) from public, anon;
revoke all on function public.create_team_and_owner(text) from public, anon;
revoke all on function public.invite_member(uuid, text, text, text) from public, anon;
revoke all on function public.add_team_member(uuid, uuid, text) from public, anon;
revoke all on function public.accept_team_invitation(uuid) from public, anon;
revoke all on function public.update_team_member_permissions(uuid, uuid, text) from public, anon;

grant execute on function public.team_role(uuid),
  public.is_super_admin(),
  public.is_team_admin(uuid),
  public.create_team_and_owner(text),
  public.invite_member(uuid, text, text, text),
  public.add_team_member(uuid, uuid, text),
  public.accept_team_invitation(uuid),
  public.update_team_member_permissions(uuid, uuid, text)
  to authenticated;

commit;
