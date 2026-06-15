-- RLS for team_members + team_invitations. Reads are membership/admin scoped;
-- all mutations go through the SECURITY DEFINER RPCs (no direct write policies).
drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members for select to authenticated
  using (public.is_team_member(team_id));

drop policy if exists team_invitations_select on public.team_invitations;
create policy team_invitations_select on public.team_invitations for select to authenticated
  using (public.is_team_admin(team_id));
