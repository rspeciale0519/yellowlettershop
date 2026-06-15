-- Admin-gated invitation lifecycle RPCs (revoke / resend). Mutations on
-- team_invitations go through SECURITY DEFINER functions (no direct write policy);
-- resend refreshes token+expiry in place to avoid the one-live-invite unique index.
create or replace function public.revoke_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare inv public.team_invitations; caller uuid := auth.uid();
begin
  select * into inv from public.team_invitations where id = p_invitation_id;
  if inv.id is null then raise exception 'invitation not found'; end if;
  if not public.is_team_admin(inv.team_id) then raise exception 'not authorized'; end if;
  update public.team_invitations set status='revoked' where id=p_invitation_id and status='pending';
  insert into public.team_activity_log(team_id, actor_id, action_type, metadata)
    values (inv.team_id, caller, 'invite_revoked', jsonb_build_object('email', inv.email));
end; $$;

create or replace function public.resend_invitation(p_invitation_id uuid, p_token text)
returns text language plpgsql security definer set search_path = public as $$
declare inv public.team_invitations; caller uuid := auth.uid();
begin
  select * into inv from public.team_invitations where id = p_invitation_id;
  if inv.id is null then raise exception 'invitation not found'; end if;
  if not public.is_team_admin(inv.team_id) then raise exception 'not authorized'; end if;
  if inv.status <> 'pending' then raise exception 'invitation is not pending'; end if;
  update public.team_invitations set token=p_token, expires_at=now()+interval '7 days' where id=p_invitation_id;
  insert into public.team_activity_log(team_id, actor_id, action_type, metadata)
    values (inv.team_id, caller, 'invite_resent', jsonb_build_object('email', inv.email));
  return inv.email;
end; $$;

grant execute on function public.revoke_invitation(uuid), public.resend_invitation(uuid, text) to authenticated;
