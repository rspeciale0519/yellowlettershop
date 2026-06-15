-- Re-key access-control authority from the global user_profiles.role to per-team
-- membership (is_team_admin). Adds deny + revoke RPCs and logs to team_activity_log.

create or replace function public.approve_access_request(request_id uuid, reviewer_user_id uuid default null, review_notes_text text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r public.access_requests; caller uuid := auth.uid();
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  select * into r from public.access_requests where id = request_id;
  if r.id is null then raise exception 'request not found'; end if;
  if not public.is_team_admin(r.team_id) then raise exception 'not authorized to approve access requests'; end if;
  if r.requester_id = caller then raise exception 'cannot approve your own request'; end if;
  update public.access_requests
     set status='approved', reviewed_by=caller, reviewed_at=now(), review_notes=review_notes_text, updated_at=now()
   where id=request_id and status='pending' returning * into r;
  if r.id is not null then
    insert into public.resource_permissions (user_id, granted_by, resource_type, resource_id, permission_level, team_id, expires_at)
    values (r.requester_id, caller, r.resource_type, r.resource_id, r.requested_permission, r.team_id,
            case when r.requested_duration_days is not null then now() + make_interval(days => r.requested_duration_days) end);
    insert into public.team_activity_log(team_id, actor_id, action_type, target_user_id, resource_type, resource_id, permission_level)
    values (r.team_id, caller, 'access_approved', r.requester_id, r.resource_type, r.resource_id, r.requested_permission);
  end if;
end; $$;

create or replace function public.deny_access_request(request_id uuid, review_notes_text text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r public.access_requests; caller uuid := auth.uid();
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  select * into r from public.access_requests where id = request_id;
  if r.id is null then raise exception 'request not found'; end if;
  if not public.is_team_admin(r.team_id) then raise exception 'not authorized'; end if;
  update public.access_requests set status='denied', reviewed_by=caller, reviewed_at=now(),
    review_notes=review_notes_text, updated_at=now() where id=request_id and status='pending';
  insert into public.team_activity_log(team_id, actor_id, action_type, target_user_id, resource_type, resource_id)
  values (r.team_id, caller, 'access_denied', r.requester_id, r.resource_type, r.resource_id);
end; $$;

create or replace function public.revoke_resource_permission(permission_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare p public.resource_permissions; caller uuid := auth.uid();
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  select * into p from public.resource_permissions where id = permission_id;
  if p.id is null then raise exception 'permission not found'; end if;
  if not public.is_team_admin(p.team_id) then raise exception 'not authorized'; end if;
  update public.resource_permissions set revoked_at=now(), revoked_by=caller, updated_at=now()
   where id=permission_id and revoked_at is null;
  insert into public.team_activity_log(team_id, actor_id, action_type, target_user_id, resource_type, resource_id, permission_level)
  values (p.team_id, caller, 'access_revoked', p.user_id, p.resource_type, p.resource_id, p.permission_level);
end; $$;

create or replace function public.apply_permission_template(template_id uuid, target_user_id uuid, applied_by_user_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare tp jsonb; t public.permission_templates; caller uuid := auth.uid();
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  select * into t from public.permission_templates where id=template_id;
  if t.id is null then raise exception 'permission template not found'; end if;
  -- Admin-only: NO template-owner shortcut. A non-admin who owns a template must
  -- not be able to self-grant arbitrary resource_permissions by applying it.
  if not public.is_team_admin(t.team_id) then raise exception 'not authorized to apply this template'; end if;
  for tp in select jsonb_array_elements(coalesce(t.template_permissions,'[]'::jsonb)) loop
    insert into public.resource_permissions (user_id, granted_by, resource_type, resource_id, permission_level, team_id, expires_at)
    values (target_user_id, caller, tp->>'resource_type', tp->>'resource_id', tp->>'permission_level', t.team_id,
            case when tp->>'duration_days' is not null then now() + make_interval(days => (tp->>'duration_days')::int) end);
  end loop;
  update public.permission_templates set usage_count=usage_count+1, last_used_at=now(), updated_at=now() where id=template_id;
  insert into public.team_activity_log(team_id, actor_id, action_type, target_user_id)
  values (t.team_id, caller, 'template_applied', target_user_id);
end; $$;

grant execute on function public.deny_access_request(uuid, text),
  public.revoke_resource_permission(uuid) to authenticated;

-- ── RLS re-key (Task 4): team admins can see/manage their team's rows ──────────
drop policy if exists access_requests_select on public.access_requests;
create policy access_requests_select on public.access_requests for select to authenticated
  using (requester_id = auth.uid() or reviewed_by = auth.uid() or public.is_team_admin(team_id));

-- Templates are admin-only (create/read/update/delete). Dropping the prior
-- created_by-based access so a non-admin cannot mint a template to self-grant via
-- apply_permission_template. team_id must be set and the caller must administer it.
drop policy if exists permission_templates_all on public.permission_templates;
create policy permission_templates_all on public.permission_templates for all to authenticated
  using (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

drop policy if exists resource_permissions_select on public.resource_permissions;
create policy resource_permissions_select on public.resource_permissions for select to authenticated
  using (user_id = auth.uid() or granted_by = auth.uid() or public.is_team_admin(team_id));

drop policy if exists team_activity_log_select on public.team_activity_log;
create policy team_activity_log_select on public.team_activity_log for select to authenticated
  using (public.is_team_admin(team_id));
