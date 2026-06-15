-- Membership & invitation RPCs. All SECURITY DEFINER; team-mutating ones are
-- gated by is_team_admin(). teams.plan is a dead column constrained to
-- ('team','enterprise') — we always write 'team'.

create or replace function public.lookup_user_by_email(p_email text)
returns uuid language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

-- Lazy team creation: team + owner membership + cache sync.
create or replace function public.create_team_and_owner(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare caller uuid := auth.uid(); tid uuid;
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  if exists (select 1 from public.team_members where user_id = caller and status='active')
    then raise exception 'already on a team'; end if;
  insert into public.teams(name, plan, max_seats, owner_id) values (coalesce(p_name,'My Team'), 'team', 25, caller)
    returning id into tid;
  insert into public.team_members(team_id, user_id, role, invited_by) values (tid, caller, 'owner', caller);
  update public.user_profiles set team_id = tid where user_id = caller;
  insert into public.team_activity_log(team_id, actor_id, action_type) values (tid, caller, 'team_created');
  return tid;
end; $$;

-- Invite: seat-cap enforced; branches existing-user (added) vs pending invite.
create or replace function public.invite_member(p_team_id uuid, p_email text, p_role text, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare caller uuid := auth.uid(); existing uuid; used int; cap int;
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  if not public.is_team_admin(p_team_id) then raise exception 'not authorized'; end if;
  if p_role not in ('admin','member') then raise exception 'invalid role'; end if;
  select max_seats into cap from public.teams where id = p_team_id;
  select (select count(*) from public.team_members where team_id=p_team_id and status='active')
       + (select count(*) from public.team_invitations where team_id=p_team_id and status='pending') into used;
  if used >= cap then raise exception 'seat limit reached (%)', cap; end if;
  existing := public.lookup_user_by_email(p_email);
  if existing is not null then
    if exists (select 1 from public.team_members where user_id = existing and status='active')
      then raise exception 'user already belongs to a team'; end if;
    insert into public.team_members(team_id,user_id,role,invited_by) values (p_team_id, existing, p_role, caller);
    update public.user_profiles set team_id = p_team_id where user_id = existing;
    insert into public.team_activity_log(team_id, actor_id, action_type, target_user_id)
      values (p_team_id, caller, 'member_added', existing);
    return jsonb_build_object('mode','added');
  else
    insert into public.team_invitations(team_id,email,role,invited_by,token) values (p_team_id, p_email, p_role, caller, p_token);
    insert into public.team_activity_log(team_id, actor_id, action_type, metadata)
      values (p_team_id, caller, 'member_invited', jsonb_build_object('email', p_email));
    return jsonb_build_object('mode','invited','token', p_token);
  end if;
end; $$;

-- Accept invite at signup: validates token + email match, creates membership.
create or replace function public.accept_invite(p_token text, p_email text)
returns uuid language plpgsql security definer set search_path = public as $$
declare caller uuid := auth.uid(); inv public.team_invitations;
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  select * into inv from public.team_invitations where token = p_token and status='pending';
  if inv.id is null then raise exception 'invalid or used invitation'; end if;
  if inv.expires_at < now() then
    update public.team_invitations set status='expired' where id=inv.id;
    raise exception 'invitation expired';
  end if;
  if lower(inv.email) <> lower(p_email) then raise exception 'invitation email mismatch'; end if;
  if exists (select 1 from public.team_members where user_id=caller and status='active')
    then raise exception 'already on a team'; end if;
  insert into public.team_members(team_id,user_id,role,invited_by) values (inv.team_id, caller, inv.role, inv.invited_by);
  update public.user_profiles set team_id = inv.team_id where user_id = caller;
  update public.team_invitations set status='accepted', accepted_at=now() where id=inv.id;
  insert into public.team_activity_log(team_id, actor_id, action_type, target_user_id)
    values (inv.team_id, caller, 'member_joined', caller);
  return inv.team_id;
end; $$;

create or replace function public.remove_member(p_team_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare caller uuid := auth.uid();
begin
  if not public.is_team_admin(p_team_id) then raise exception 'not authorized'; end if;
  if (select role from public.team_members where team_id=p_team_id and user_id=p_user_id) = 'owner'
    then raise exception 'cannot remove the owner'; end if;
  update public.resource_permissions set revoked_at=now(), revoked_by=caller
    where user_id=p_user_id and team_id=p_team_id and revoked_at is null;
  delete from public.team_members where team_id=p_team_id and user_id=p_user_id;
  update public.user_profiles set team_id=null where user_id=p_user_id and team_id=p_team_id;
  insert into public.team_activity_log(team_id, actor_id, action_type, target_user_id)
    values (p_team_id, caller, 'member_removed', p_user_id);
end; $$;

create or replace function public.change_member_role(p_team_id uuid, p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare caller uuid := auth.uid();
begin
  if not public.is_team_admin(p_team_id) then raise exception 'not authorized'; end if;
  if p_role not in ('admin','member') then raise exception 'invalid role'; end if;
  if (select role from public.team_members where team_id=p_team_id and user_id=p_user_id) = 'owner'
    then raise exception 'cannot change the owner role here; use transfer_ownership'; end if;
  update public.team_members set role=p_role, updated_at=now() where team_id=p_team_id and user_id=p_user_id;
  insert into public.team_activity_log(team_id, actor_id, action_type, target_user_id, metadata)
    values (p_team_id, caller, 'role_changed', p_user_id, jsonb_build_object('role', p_role));
end; $$;

create or replace function public.transfer_ownership(p_team_id uuid, p_new_owner uuid)
returns void language plpgsql security definer set search_path = public as $$
declare caller uuid := auth.uid();
begin
  if (select owner_id from public.teams where id=p_team_id) <> caller then raise exception 'only the owner can transfer'; end if;
  if not exists (select 1 from public.team_members where team_id=p_team_id and user_id=p_new_owner and status='active')
    then raise exception 'new owner must be an active team member'; end if;
  update public.team_members set role='admin', updated_at=now() where team_id=p_team_id and user_id=caller;
  update public.team_members set role='owner', updated_at=now() where team_id=p_team_id and user_id=p_new_owner;
  update public.teams set owner_id=p_new_owner, updated_at=now() where id=p_team_id;
  insert into public.team_activity_log(team_id, actor_id, action_type, target_user_id)
    values (p_team_id, caller, 'ownership_transferred', p_new_owner);
end; $$;

create or replace function public.delete_team(p_team_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare caller uuid := auth.uid();
begin
  if (select owner_id from public.teams where id=p_team_id) <> caller then raise exception 'only the owner can delete'; end if;
  update public.resource_permissions set revoked_at=now(), revoked_by=caller where team_id=p_team_id and revoked_at is null;
  update public.team_invitations set status='revoked' where team_id=p_team_id and status='pending';
  update public.user_profiles set team_id=null where team_id=p_team_id;
  delete from public.team_members where team_id=p_team_id;     -- resources keep created_by; not deleted
  delete from public.teams where id=p_team_id;
end; $$;

create or replace function public.set_max_seats(p_team_id uuid, p_seats int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'only a platform admin can change seat limits'; end if;
  update public.teams set max_seats=p_seats, updated_at=now() where id=p_team_id;
end; $$;

grant execute on function public.lookup_user_by_email(text), public.create_team_and_owner(text),
  public.invite_member(uuid,text,text,text), public.accept_invite(text,text),
  public.remove_member(uuid,uuid), public.change_member_role(uuid,uuid,text),
  public.transfer_ownership(uuid,uuid), public.delete_team(uuid), public.set_max_seats(uuid,int) to authenticated;
