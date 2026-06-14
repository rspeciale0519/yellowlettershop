-- Access-control / Team-Management backend. These tables + RPCs are referenced by
-- lib/access-control/time-based-permissions.ts and the Team Management page, but
-- were never captured in migrations (the "missing migrations" backlog) — so the
-- page 404'd on access_requests and 500'd on /api/access-control/templates.
-- Schemas mirror the TypeScript interfaces in that service exactly.

-- ── access_requests ─────────────────────────────────────────────────────────
create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resource_type text not null check (resource_type in ('mailing_list','template','design','contact_card','asset')),
  resource_id text not null,
  requested_permission text not null check (requested_permission in ('view_only','edit','admin','owner')),
  justification text,
  requested_duration_days integer,
  status text not null default 'pending' check (status in ('pending','approved','denied','expired','withdrawn')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  expires_at timestamptz,
  team_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists access_requests_requester_idx on public.access_requests (requester_id, created_at desc);
alter table public.access_requests enable row level security;
drop policy if exists access_requests_select on public.access_requests;
create policy access_requests_select on public.access_requests for select to authenticated
  using (requester_id = auth.uid() or reviewed_by = auth.uid());
drop policy if exists access_requests_insert on public.access_requests;
-- requester is always the caller; 'owner' cannot be self-requested (owner is
-- assigned, not requested).
create policy access_requests_insert on public.access_requests for insert to authenticated
  with check (requester_id = auth.uid() and requested_permission <> 'owner');
drop policy if exists access_requests_update on public.access_requests;
create policy access_requests_update on public.access_requests for update to authenticated
  using (requester_id = auth.uid()) with check (requester_id = auth.uid());

-- ── permission_templates ────────────────────────────────────────────────────
create table if not exists public.permission_templates (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  team_id uuid,
  name text not null,
  description text,
  template_permissions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  usage_count integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.permission_templates enable row level security;
drop policy if exists permission_templates_all on public.permission_templates;
create policy permission_templates_all on public.permission_templates for all to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

-- ── resource_permissions ────────────────────────────────────────────────────
create table if not exists public.resource_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id),
  resource_type text not null check (resource_type in ('mailing_list','template','design','contact_card','asset')),
  resource_id text not null,
  permission_level text not null check (permission_level in ('view_only','edit','admin','owner')),
  team_id uuid,
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists resource_permissions_user_idx on public.resource_permissions (user_id) where revoked_at is null;
alter table public.resource_permissions enable row level security;
drop policy if exists resource_permissions_select on public.resource_permissions;
create policy resource_permissions_select on public.resource_permissions for select to authenticated
  using (user_id = auth.uid() or granted_by = auth.uid());

-- ── team_activity_log ───────────────────────────────────────────────────────
create table if not exists public.team_activity_log (
  id uuid primary key default gen_random_uuid(),
  team_id uuid,
  actor_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  action_type text not null,
  target_user_id uuid references auth.users(id),
  resource_type text,
  resource_id text,
  permission_level text,
  duration_days integer,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists team_activity_log_created_idx on public.team_activity_log (created_at desc);
alter table public.team_activity_log enable row level security;
drop policy if exists team_activity_log_select on public.team_activity_log;
create policy team_activity_log_select on public.team_activity_log for select to authenticated
  using (actor_id = auth.uid() or target_user_id = auth.uid());

-- ── RPCs ────────────────────────────────────────────────────────────────────
-- SECURITY: identity is taken from the JWT (auth.uid()), NEVER from the
-- caller-supplied reviewer_user_id argument (kept only for call-signature
-- compatibility). Only admins/managers may approve, and never their own request.
create or replace function public.approve_access_request(request_id uuid, reviewer_user_id uuid default null, review_notes_text text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r public.access_requests; caller uuid := auth.uid(); caller_role text;
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  select role into caller_role from public.user_profiles where user_id = caller;
  if coalesce(caller_role, 'user') not in ('admin', 'manager') then
    raise exception 'not authorized to approve access requests';
  end if;
  update public.access_requests
     set status='approved', reviewed_by=caller, reviewed_at=now(),
         review_notes=review_notes_text, updated_at=now()
   where id=request_id and status='pending' and requester_id <> caller
   returning * into r;
  if r.id is not null then
    insert into public.resource_permissions (user_id, granted_by, resource_type, resource_id, permission_level, expires_at)
    values (r.requester_id, caller, r.resource_type, r.resource_id, r.requested_permission,
            case when r.requested_duration_days is not null
                 then now() + make_interval(days => r.requested_duration_days) end);
  end if;
end; $$;

-- SECURITY: granted_by is taken from the JWT (auth.uid()), NEVER from the
-- caller-supplied applied_by_user_id argument. Only the template owner or an
-- admin/manager may apply a template.
create or replace function public.apply_permission_template(template_id uuid, target_user_id uuid, applied_by_user_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare tp jsonb; t public.permission_templates; caller uuid := auth.uid(); caller_role text;
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  select role into caller_role from public.user_profiles where user_id = caller;
  select * into t from public.permission_templates where id=template_id;
  if t.id is null then raise exception 'permission template not found'; end if;
  if t.created_by <> caller and coalesce(caller_role, 'user') not in ('admin', 'manager') then
    raise exception 'not authorized to apply this template';
  end if;
  for tp in select jsonb_array_elements(coalesce(t.template_permissions,'[]'::jsonb)) loop
    insert into public.resource_permissions (user_id, granted_by, resource_type, resource_id, permission_level, expires_at)
    values (target_user_id, caller, tp->>'resource_type', tp->>'resource_id', tp->>'permission_level',
            case when tp->>'duration_days' is not null
                 then now() + make_interval(days => (tp->>'duration_days')::int) end);
  end loop;
  update public.permission_templates set usage_count=usage_count+1, last_used_at=now(), updated_at=now() where id=template_id;
end; $$;

create or replace function public.revoke_expired_permissions()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.resource_permissions set revoked_at=now(), updated_at=now()
   where revoked_at is null and expires_at is not null and expires_at < now();
end; $$;

grant execute on function public.approve_access_request(uuid, uuid, text) to authenticated;
grant execute on function public.apply_permission_template(uuid, uuid, uuid) to authenticated;
grant execute on function public.revoke_expired_permissions() to authenticated;
