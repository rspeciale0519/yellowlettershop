-- Authority oracle for Team Management. SECURITY DEFINER so these bypass RLS on
-- team_members and CANNOT recurse when called from team_members' own RLS policies.
create or replace function public.team_role(p_team_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from public.team_members
  where team_id = p_team_id and user_id = auth.uid() and status = 'active' limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.user_profiles where user_id = auth.uid()), 'user') = 'super_admin';
$$;

create or replace function public.is_team_admin(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  -- coalesce so a non-member yields false, not NULL (NULL would defeat `if not ...`).
  select coalesce(public.team_role(p_team_id) in ('owner','admin'), false) or public.is_super_admin();
$$;

create or replace function public.is_team_member(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.team_role(p_team_id) is not null, false) or public.is_super_admin();
$$;

-- Returns the active resource_permissions level for the caller on a resource, or
-- null. Used by resource-table RLS to enforce grants ('edit' ranks above view_only).
create or replace function public.my_resource_permission(p_resource_type text, p_resource_id text)
returns text language sql stable security definer set search_path = public as $$
  select permission_level from public.resource_permissions
  where user_id = auth.uid() and resource_type = p_resource_type and resource_id = p_resource_id
    and revoked_at is null and (expires_at is null or expires_at > now())
  order by case permission_level when 'edit' then 0 else 1 end limit 1;
$$;

grant execute on function public.team_role(uuid), public.is_super_admin(),
  public.is_team_admin(uuid), public.is_team_member(uuid),
  public.my_resource_permission(text, text) to authenticated;
