-- Fix #1: make resource_permissions grants actually ENFORCE access. Each owned
-- resource table's read/write RLS is widened to: own it OR team-admin (decision B)
-- OR an active, team-bound grant. view_only -> SELECT, edit -> SELECT+UPDATE.
--
-- design_templates is intentionally excluded: it is a global catalog (no owner /
-- team_id columns, already world-readable via users_read_active_templates), so the
-- 'template' resource_type has no per-team table to enforce.
--
-- The two pre-existing "Team members can view team <x>" policies are DROPPED: they
-- let every team member read every team resource (team_id IN (my team)), which
-- contradicts the zero-trust model (a member must see nothing until granted).

-- ── mailing_lists (owner: created_by; resource_type 'mailing_list') ────────────
drop policy if exists "Team members can view team mailing lists" on public.mailing_lists;
drop policy if exists mailing_lists_grant_select on public.mailing_lists;
create policy mailing_lists_grant_select on public.mailing_lists for select to authenticated
  using (created_by = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('mailing_list', id::text, team_id) is not null);
drop policy if exists mailing_lists_grant_update on public.mailing_lists;
create policy mailing_lists_grant_update on public.mailing_lists for update to authenticated
  using (created_by = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('mailing_list', id::text, team_id) = 'edit');

-- ── saved_designs (owner: user_id; resource_type 'design') ────────────────────
drop policy if exists saved_designs_grant_select on public.saved_designs;
create policy saved_designs_grant_select on public.saved_designs for select to authenticated
  using (user_id = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('design', id::text, team_id) is not null);
drop policy if exists saved_designs_grant_update on public.saved_designs;
create policy saved_designs_grant_update on public.saved_designs for update to authenticated
  using (user_id = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('design', id::text, team_id) = 'edit');

-- ── contact_cards (owner: user_id; resource_type 'contact_card') ──────────────
drop policy if exists "Team members can view team contact cards" on public.contact_cards;
drop policy if exists contact_cards_grant_select on public.contact_cards;
create policy contact_cards_grant_select on public.contact_cards for select to authenticated
  using (user_id = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('contact_card', id::text, team_id) is not null);
drop policy if exists contact_cards_grant_update on public.contact_cards;
create policy contact_cards_grant_update on public.contact_cards for update to authenticated
  using (user_id = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('contact_card', id::text, team_id) = 'edit');

-- ── user_assets (owner: user_id; resource_type 'asset') ───────────────────────
drop policy if exists user_assets_grant_select on public.user_assets;
create policy user_assets_grant_select on public.user_assets for select to authenticated
  using (user_id = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('asset', id::text, team_id) is not null);
drop policy if exists user_assets_grant_update on public.user_assets;
create policy user_assets_grant_update on public.user_assets for update to authenticated
  using (user_id = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('asset', id::text, team_id) = 'edit');
