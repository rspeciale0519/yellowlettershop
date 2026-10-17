-- Close default EXECUTE on older SECURITY DEFINER functions. Drop accept_invite
-- (it trusted a caller-supplied email). Harden remove_member. Accept-by-token
-- uses the invitee's auth.users email, not a client argument.
begin;

drop function if exists public.accept_invite(text, text);

create or replace function public.accept_team_invitation(p_token text)
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
  if p_token is null or btrim(p_token) = '' then raise exception 'invalid or expired invitation'; end if;
  select email into caller_email from auth.users where id = caller;
  select * into inv from public.team_invitations where token = p_token and status = 'pending';
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
  return inv.team_id;
end;
$$;

create or replace function public.remove_member(p_team_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  if not public.is_team_admin(p_team_id) then raise exception 'not authorized'; end if;
  if (select role from public.team_members where team_id = p_team_id and user_id = p_user_id) = 'owner'
    then raise exception 'cannot remove the owner'; end if;
  update public.resource_permissions set revoked_at = now(), revoked_by = caller
    where user_id = p_user_id and team_id = p_team_id and revoked_at is null;
  delete from public.team_members where team_id = p_team_id and user_id = p_user_id;
  update public.user_profiles set team_id = null where user_id = p_user_id and team_id = p_team_id;
  insert into public.team_activity_log(team_id, actor_id, action_type, target_user_id)
    values (p_team_id, caller, 'member_removed', p_user_id);
end;
$$;

do $$
declare
  r record;
  sig text;
  grant_auth text[] := array[
    'accept_team_invitation(uuid)',
    'accept_team_invitation(text)',
    'add_team_member(uuid,uuid,text)',
    'apply_permission_template(uuid,uuid,uuid)',
    'approve_access_request(uuid,uuid,text)',
    'change_member_role(uuid,uuid,text)',
    'create_team_and_owner(text)',
    'delete_team(uuid)',
    'deny_access_request(uuid,text)',
    'get_my_sessions()',
    'invite_member(uuid,text,text,text)',
    'is_super_admin()',
    'is_team_admin(uuid)',
    'is_team_member(uuid)',
    'my_resource_permission(text,text,uuid)',
    'remove_member(uuid,uuid)',
    'resend_invitation(uuid,text)',
    'revoke_expired_permissions()',
    'revoke_invitation(uuid)',
    'revoke_resource_permission(uuid)',
    'set_max_seats(uuid,integer)',
    'team_role(uuid)',
    'transfer_ownership(uuid,uuid)',
    'update_team_member_permissions(uuid,uuid,text)'
  ];
  grant_service text[] := array[
    'cleanup_rate_limit_counters()',
    'generate_share_token()',
    'increment_rate_limit(text,integer)'
  ];
begin
  for r in
    select p.oid::regprocedure as reg
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke all on function %s from public, anon', r.reg);
  end loop;
  foreach sig in array grant_auth
  loop
    if to_regprocedure('public.' || sig) is not null then
      execute format('grant execute on function public.%s to authenticated', sig);
    end if;
  end loop;
  foreach sig in array grant_service
  loop
    if to_regprocedure('public.' || sig) is not null then
      execute format('grant execute on function public.%s to service_role', sig);
    end if;
  end loop;
end $$;

commit;
