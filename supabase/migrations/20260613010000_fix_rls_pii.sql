-- Security fix: remove over-broad RLS policies inherited from DB1 that exposed
-- homeowner PII (mailing lists/records) to any caller — including anonymous.
-- Proper owner/team-scoped policies already exist on each table (verified), so
-- dropping the broad ones leaves correct coverage. The two `using(true)`
-- policies are replaced with scoped, authenticated-only versions.
begin;

-- mailing_lists: drop "OR is_active=true" SELECT (exposed every active list).
-- Coverage retained by "Users can manage own mailing lists" (ALL, owner+team)
-- + "Team members can view team mailing lists" (SELECT, team).
drop policy if exists "Users can view their own mailing lists" on public.mailing_lists;

-- mailing_list_records: drop "OR mailing_lists.is_active=true" SELECT (exposed
-- every record of any active list). Coverage retained by "Users can manage
-- records in own lists" (ALL, owner+team).
drop policy if exists "Users can view records of their lists" on public.mailing_list_records;

-- tags: replace world-readable `using(true)` with authenticated + scoped
-- (global tags where team_id is null stay visible; team tags scoped to team).
drop policy if exists "All users can view tags" on public.tags;
create policy "Users can view tags" on public.tags
  for select to authenticated
  using (
    team_id is null
    or created_by = auth.uid()
    or (team_id is not null and team_id in (
      select team_id from public.user_profiles where user_id = auth.uid()))
  );

-- mail_pieces: replace world-readable `using(true)` with owner-scoped.
drop policy if exists "All users can view mail pieces" on public.mail_pieces;
create policy "Users can view own mail pieces" on public.mail_pieces
  for select to authenticated
  using (created_by = auth.uid());

-- design_templates: active-template browse is intended, but restrict to
-- authenticated (no anonymous enumeration).
drop policy if exists "users_read_active_templates" on public.design_templates;
create policy "users_read_active_templates" on public.design_templates
  for select to authenticated
  using (is_active = true);

commit;
