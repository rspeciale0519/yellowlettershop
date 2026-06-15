-- Honor an "All [type]" grant: a resource_permissions row with resource_id = '*'
-- (bound to a team_id) grants the caller access to EVERY resource of that type in
-- that team. The team binding from 20260616000100 still applies, so a wildcard grant
-- stays scoped to its own team and cannot leak across teams. Specific-id grants are
-- unchanged. Only the WHERE predicate gains `or resource_id = '*'`.
--
-- Wildcard is enforced solely through my_resource_permission, which is called by the
-- owned-resource RLS policies (mailing_lists, saved_designs, contact_cards,
-- user_assets). The 'template' resource_type has no per-team enforcement table, so a
-- '*' template grant remains inert by design (templates are a global catalog).
create or replace function public.my_resource_permission(p_resource_type text, p_resource_id text, p_team_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select permission_level from public.resource_permissions
  where user_id = auth.uid() and resource_type = p_resource_type
    and (resource_id = p_resource_id or resource_id = '*')
    and team_id is not distinct from p_team_id
    and revoked_at is null and (expires_at is null or expires_at > now())
  order by case permission_level when 'edit' then 0 else 1 end limit 1;
$$;

grant execute on function public.my_resource_permission(text, text, uuid) to authenticated;
