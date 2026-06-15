# Team Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Team Management feature into a working full-RBAC team: owners invite staff, staff get per-team roles, request access to resources, and admins grant/revoke scoped (and actually-enforced) access.

**Architecture:** Approach A — a new `team_members` table is the source of truth for per-team Owner/Admin/Member roles. `SECURITY DEFINER` helper functions (`team_role`, `is_team_admin`, `is_team_member`, `team_resource_access`) answer all authority questions without RLS recursion. Existing access-control RPCs/RLS are re-keyed from the global `user_profiles.role` to team membership. Crucially, grants are *enforced* by extending RLS on all five resource tables to consult `resource_permissions`.

**Tech Stack:** Next.js 15 (App Router, port 3010), TypeScript, Supabase (local Docker), PostgREST, Supabase Auth (Google OAuth), Resend (email), Mocha (JS tests), chrome-devtools MCP (UI verification).

**Design spec:** `.claude/plans/feature-team-management.md` (read it first).

**Testing conventions for this plan:**
- **DB-layer tasks** (migrations/RPCs/RLS): the "failing test" is an assertion SQL run against the local stack that errors or returns the wrong row *before* the migration, and passes after. Apply migrations with `npx supabase migration up` (or `npx supabase db reset` to replay clean). Run assertion SQL with:
  `npx supabase db query --file <path>` *(if unavailable, pipe via `docker exec -i supabase_db_<proj> psql -U postgres -d postgres < file.sql`)*.
- **Service/API tasks:** Mocha (`npm test`) where logic is pure; live-stack integration otherwise.
- **UI tasks:** chrome-devtools MCP against `http://localhost:3010` (never Playwright).
- Set the local JWT/role for assertion SQL with `set local role authenticated; set local request.jwt.claims = '{"sub":"<uuid>"}';` to simulate a given user inside a transaction.

**Branch/commit:** Work on `feature/team-management` (created via `/git-workflow-planning:start feature team-management`). Commit after every task. Run a checkpoint (`/git-workflow-planning:checkpoint <phase> <desc>`) at each phase boundary.

---

## File Structure

**Migrations (new, `supabase/migrations/`):**
- `20260616000000_team_members_invitations.sql` — `team_members`, `team_invitations`, `teams.max_seats` default, indexes.
- `20260616000100_team_authority_helpers.sql` — `team_role`, `is_team_admin`, `is_team_member`, `team_resource_access` (all SECURITY DEFINER).
- `20260616000200_rekey_access_control.sql` — re-key `approve_access_request` + `apply_permission_template`; add `deny_access_request`, `revoke_resource_permission`; re-key RLS on the 4 access-control tables.
- `20260616000300_membership_rpcs.sql` — `lookup_user_by_email`, `create_team_and_owner`, `invite_member`, `accept_invite`, `remove_member`, `change_member_role`, `transfer_ownership`, `delete_team`, `set_max_seats`.
- `20260616000400_enforce_grants_resource_rls.sql` — extend RLS on `mailing_lists`, `design_templates`, `saved_designs`, `contact_cards`, `user_assets` to honor grants + admin visibility.

**Service layer (`lib/`):**
- `lib/access-control/time-based-permissions.ts` (modify) — add deny/revoke methods; fix any global-role assumptions.
- `lib/teams/membership-service.ts` (new) — team/member/invite operations wrapping the RPCs.
- `lib/teams/current-team.ts` (new) — resolve the signed-in user's active team + role.
- `lib/email/resend.ts` (new) — Resend send helper + templates.

**API routes (`app/api/teams/`):**
- `invite/route.ts`, `accept-invite/route.ts`, `members/route.ts`, `members/[userId]/route.ts`, `settings/route.ts`, `transfer/route.ts`, `delete/route.ts`.
- Extend `app/api/access-control/*` for deny/revoke if not already present.

**UI (`app/dashboard/team-management/` + `components/team/`):**
- `page.tsx` (modify) — resolve real team, empty state, role-gate.
- `components/team/members-tab.tsx`, `invite-dialog.tsx`, `access-requests-tab.tsx`, `templates-tab.tsx`, `activity-log-tab.tsx`, `settings-tab.tsx`, `request-access-dialog.tsx`.

---

## Phase 1 — Membership foundation

### Task 1: `team_members` + `team_invitations` tables

**Files:**
- Create: `supabase/migrations/20260616000000_team_members_invitations.sql`
- Test: `supabase/tests/team_members_assert.sql` (scratch assertion file)

- [ ] **Step 1: Write the failing assertion**

`supabase/tests/team_members_assert.sql`:
```sql
-- Expect these to exist after the migration:
select 'team_members ok' where to_regclass('public.team_members') is not null;
select 'team_invitations ok' where to_regclass('public.team_invitations') is not null;
-- partial-unique "one active team" must reject a 2nd active row for the same user:
do $$
declare uid uuid := gen_random_uuid(); t1 uuid := gen_random_uuid(); t2 uuid := gen_random_uuid();
begin
  insert into teams(id,name,plan,owner_id) values (t1,'A','none',uid),(t2,'B','none',uid);
  insert into team_members(team_id,user_id,role) values (t1,uid,'owner');
  begin
    insert into team_members(team_id,user_id,role) values (t2,uid,'member');
    raise exception 'FAIL: second active membership was allowed';
  exception when unique_violation then raise notice 'PASS: partial-unique enforced';
  end;
  rollback;
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx supabase db query --file supabase/tests/team_members_assert.sql`
Expected: error `relation "public.team_members" does not exist`.

- [ ] **Step 3: Write the migration**

`supabase/migrations/20260616000000_team_members_invitations.sql`:
```sql
create extension if not exists citext;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, user_id)
);
create unique index if not exists team_members_one_active_team
  on public.team_members (user_id) where status = 'active';
create index if not exists team_members_team_idx on public.team_members (team_id) where status = 'active';

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  email citext not null,
  role text not null check (role in ('admin','member')),
  invited_by uuid not null references auth.users(id),
  token text not null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists team_invitations_one_live
  on public.team_invitations (team_id, email) where status = 'pending';
create index if not exists team_invitations_token_idx on public.team_invitations (token) where status = 'pending';

alter table public.teams alter column max_seats set default 25;

alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;
-- RLS policies are added in Task 6 (after the authority helpers exist).
-- Until then, only SECURITY DEFINER RPCs and the service role can touch these.
```

- [ ] **Step 4: Apply and verify it passes**

Run: `npx supabase migration up && npx supabase db query --file supabase/tests/team_members_assert.sql`
Expected: `PASS: partial-unique enforced` notice; both `... ok` rows returned.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260616000000_team_members_invitations.sql supabase/tests/team_members_assert.sql
git commit -m "feat(team): add team_members + team_invitations tables"
```

---

### Task 2: Authority helper functions (SECURITY DEFINER)

**Files:**
- Create: `supabase/migrations/20260616000100_team_authority_helpers.sql`
- Test: `supabase/tests/authority_assert.sql`

- [ ] **Step 1: Write the failing assertion**

`supabase/tests/authority_assert.sql`:
```sql
do $$
declare owner_id uuid := gen_random_uuid(); mem_id uuid := gen_random_uuid(); tid uuid := gen_random_uuid();
begin
  insert into teams(id,name,plan,owner_id) values (tid,'T','none',owner_id);
  insert into team_members(team_id,user_id,role) values (tid,owner_id,'owner'),(tid,mem_id,'member');
  set local request.jwt.claims = json_build_object('sub', owner_id)::text;
  if not public.is_team_admin(tid) then raise exception 'FAIL: owner should be admin'; end if;
  set local request.jwt.claims = json_build_object('sub', mem_id)::text;
  if public.is_team_admin(tid) then raise exception 'FAIL: member must NOT be admin'; end if;
  if not public.is_team_member(tid) then raise exception 'FAIL: member should be member'; end if;
  raise notice 'PASS: authority helpers correct';
  rollback;
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx supabase db query --file supabase/tests/authority_assert.sql`
Expected: error `function public.is_team_admin(uuid) does not exist`.

- [ ] **Step 3: Write the migration**

`supabase/migrations/20260616000100_team_authority_helpers.sql`:
```sql
-- SECURITY DEFINER so these bypass RLS on team_members and cannot recurse
-- when called from team_members' own RLS policies (Fix #2).
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
  select public.team_role(p_team_id) in ('owner','admin') or public.is_super_admin();
$$;

create or replace function public.is_team_member(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.team_role(p_team_id) is not null or public.is_super_admin();
$$;

-- Returns the active resource_permissions level for the caller on a resource,
-- or null. Used by resource-table RLS in Task 12.
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
```

- [ ] **Step 4: Apply and verify it passes**

Run: `npx supabase migration up && npx supabase db query --file supabase/tests/authority_assert.sql`
Expected: `PASS: authority helpers correct`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260616000100_team_authority_helpers.sql supabase/tests/authority_assert.sql
git commit -m "feat(team): add SECURITY DEFINER authority helpers"
```

---

## Phase 2 — Re-key access control to team authority

### Task 3: Re-key `approve_access_request` + add `deny`/`revoke`

**Files:**
- Create: `supabase/migrations/20260616000200_rekey_access_control.sql`
- Test: `supabase/tests/approve_assert.sql`

- [ ] **Step 1: Write the failing assertion**

`supabase/tests/approve_assert.sql`:
```sql
do $$
declare adm uuid := gen_random_uuid(); reqer uuid := gen_random_uuid(); tid uuid := gen_random_uuid(); rid uuid;
begin
  insert into teams(id,name,plan,owner_id) values (tid,'T','none',adm);
  insert into team_members(team_id,user_id,role) values (tid,adm,'admin'),(tid,reqer,'member');
  insert into access_requests(id,requester_id,resource_type,resource_id,requested_permission,status,team_id)
    values (gen_random_uuid(), reqer, 'mailing_list', 'list-1', 'view_only', 'pending', tid) returning id into rid;
  -- A non-member must NOT be able to approve:
  set local request.jwt.claims = json_build_object('sub', gen_random_uuid())::text;
  begin perform public.approve_access_request(rid); raise exception 'FAIL: outsider approved';
  exception when others then raise notice 'PASS: outsider blocked'; end;
  -- The team admin MUST be able to approve, creating a grant:
  set local request.jwt.claims = json_build_object('sub', adm)::text;
  perform public.approve_access_request(rid);
  if not exists (select 1 from resource_permissions where user_id = reqer and resource_id = 'list-1' and revoked_at is null)
    then raise exception 'FAIL: grant not created'; end if;
  raise notice 'PASS: admin approved + grant created';
  rollback;
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx supabase db query --file supabase/tests/approve_assert.sql`
Expected: `FAIL: outsider approved` (current RPC checks global role, which the random outsider lacks — but the team-scoped gate doesn't exist yet; the assertion documents the target behavior). Confirm the assertion errors/raises before the new migration.

- [ ] **Step 3: Write the migration**

`supabase/migrations/20260616000200_rekey_access_control.sql`:
```sql
-- Re-key approval authority from global user_profiles.role to team membership.
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

-- Re-key template application authority to team membership (keep template-owner allowance).
create or replace function public.apply_permission_template(template_id uuid, target_user_id uuid, applied_by_user_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare tp jsonb; t public.permission_templates; caller uuid := auth.uid();
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  select * into t from public.permission_templates where id=template_id;
  if t.id is null then raise exception 'permission template not found'; end if;
  if t.created_by <> caller and not public.is_team_admin(t.team_id) then raise exception 'not authorized to apply this template'; end if;
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
```

- [ ] **Step 4: Apply and verify it passes**

Run: `npx supabase migration up && npx supabase db query --file supabase/tests/approve_assert.sql`
Expected: `PASS: outsider blocked` then `PASS: admin approved + grant created`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260616000200_rekey_access_control.sql supabase/tests/approve_assert.sql
git commit -m "feat(team): re-key approve/deny/revoke + template apply to team authority"
```

---

### Task 4: Re-key RLS on the 4 access-control tables

**Files:**
- Modify (append to): `supabase/migrations/20260616000200_rekey_access_control.sql`
- Test: `supabase/tests/ac_rls_assert.sql`

- [ ] **Step 1: Write the failing assertion**

`supabase/tests/ac_rls_assert.sql`:
```sql
do $$
declare adm uuid := gen_random_uuid(); mem uuid := gen_random_uuid(); tid uuid := gen_random_uuid();
begin
  insert into teams(id,name,plan,owner_id) values (tid,'T','none',adm);
  insert into team_members(team_id,user_id,role) values (tid,adm,'admin'),(tid,mem,'member');
  insert into access_requests(requester_id,resource_type,resource_id,requested_permission,status,team_id)
    values (mem,'mailing_list','l1','view_only','pending',tid);
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', adm)::text;
  if (select count(*) from access_requests where team_id = tid) < 1
    then raise exception 'FAIL: admin cannot see team requests'; end if;
  raise notice 'PASS: admin sees team requests';
  rollback;
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx supabase db query --file supabase/tests/ac_rls_assert.sql`
Expected: `FAIL: admin cannot see team requests` (current policy only exposes requester/reviewer rows).

- [ ] **Step 3: Append the RLS re-key to the migration**

Append to `supabase/migrations/20260616000200_rekey_access_control.sql`:
```sql
drop policy if exists access_requests_select on public.access_requests;
create policy access_requests_select on public.access_requests for select to authenticated
  using (requester_id = auth.uid() or reviewed_by = auth.uid() or public.is_team_admin(team_id));

drop policy if exists permission_templates_all on public.permission_templates;
create policy permission_templates_all on public.permission_templates for all to authenticated
  using (created_by = auth.uid() or public.is_team_admin(team_id))
  with check (created_by = auth.uid() or public.is_team_admin(team_id));

drop policy if exists resource_permissions_select on public.resource_permissions;
create policy resource_permissions_select on public.resource_permissions for select to authenticated
  using (user_id = auth.uid() or granted_by = auth.uid() or public.is_team_admin(team_id));

drop policy if exists team_activity_log_select on public.team_activity_log;
create policy team_activity_log_select on public.team_activity_log for select to authenticated
  using (public.is_team_admin(team_id));
```

- [ ] **Step 4: Apply and verify it passes**

Run: `npx supabase db reset && npx supabase db query --file supabase/tests/ac_rls_assert.sql`
Expected: `PASS: admin sees team requests`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260616000200_rekey_access_control.sql supabase/tests/ac_rls_assert.sql
git commit -m "feat(team): re-key access-control RLS to team authority"
```

---

## Phase 3 — Membership RPCs + grant enforcement

### Task 5: Membership & invite RPCs

**Files:**
- Create: `supabase/migrations/20260616000300_membership_rpcs.sql`
- Test: `supabase/tests/membership_assert.sql`

- [ ] **Step 1: Write the failing assertion**

`supabase/tests/membership_assert.sql`:
```sql
do $$
declare owner_id uuid := gen_random_uuid(); tid uuid; seat int;
begin
  set local request.jwt.claims = json_build_object('sub', owner_id)::text;
  tid := public.create_team_and_owner('My Team');           -- lazy creation
  if (select role from team_members where team_id=tid and user_id=owner_id) <> 'owner'
    then raise exception 'FAIL: owner membership not created'; end if;
  if (select team_id from user_profiles where user_id=owner_id) is distinct from tid
    then raise notice 'note: user_profiles cache row may not exist for synthetic user'; end if;
  raise notice 'PASS: create_team_and_owner works';
  rollback;
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx supabase db query --file supabase/tests/membership_assert.sql`
Expected: error `function public.create_team_and_owner(text) does not exist`.

- [ ] **Step 3: Write the migration**

`supabase/migrations/20260616000300_membership_rpcs.sql`:
```sql
-- Resolve a user id by email without exposing auth.users to clients.
create or replace function public.lookup_user_by_email(p_email text)
returns uuid language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

-- Lazy team creation: creates the team + owner membership + syncs cache.
create or replace function public.create_team_and_owner(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare caller uuid := auth.uid(); tid uuid;
begin
  if caller is null then raise exception 'unauthenticated'; end if;
  if exists (select 1 from public.team_members where user_id = caller and status='active')
    then raise exception 'already on a team'; end if;
  insert into public.teams(name, plan, max_seats, owner_id) values (coalesce(p_name,'My Team'), 'none', 25, caller)
    returning id into tid;
  insert into public.team_members(team_id, user_id, role, invited_by) values (tid, caller, 'owner', caller);
  update public.user_profiles set team_id = tid where user_id = caller;
  insert into public.team_activity_log(team_id, actor_id, action_type) values (tid, caller, 'team_created');
  return tid;
end; $$;

-- Invite: enforces seat cap, branches existing-user vs pending-invite.
-- Returns jsonb {mode:'added'|'invited', token?:text}.
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

-- super_admin-only seat-cap control.
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
```

- [ ] **Step 4: Apply and verify it passes**

Run: `npx supabase migration up && npx supabase db query --file supabase/tests/membership_assert.sql`
Expected: `PASS: create_team_and_owner works`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260616000300_membership_rpcs.sql supabase/tests/membership_assert.sql
git commit -m "feat(team): membership + invite + transfer/delete RPCs"
```

---

### Task 6: RLS on `team_members` + `team_invitations`

**Files:**
- Create: `supabase/migrations/20260616000350_team_tables_rls.sql`
- Test: `supabase/tests/team_rls_assert.sql`

- [ ] **Step 1: Write the failing assertion**

`supabase/tests/team_rls_assert.sql`:
```sql
do $$
declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); t1 uuid := gen_random_uuid(); t2 uuid := gen_random_uuid();
begin
  insert into teams(id,name,plan,owner_id) values (t1,'A','none',a),(t2,'B','none',b);
  insert into team_members(team_id,user_id,role) values (t1,a,'owner'),(t2,b,'owner');
  set local role authenticated;
  set local request.jwt.claims = json_build_object('sub', a)::text;
  if exists (select 1 from team_members where team_id = t2)
    then raise exception 'FAIL: leaked another team roster'; end if;
  if not exists (select 1 from team_members where team_id = t1)
    then raise exception 'FAIL: cannot see own roster'; end if;
  raise notice 'PASS: roster isolation correct';
  rollback;
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx supabase db query --file supabase/tests/team_rls_assert.sql`
Expected: `FAIL: leaked another team roster` (no SELECT policy yet → with RLS enabled and no policy, actually returns 0 rows; if so, invert: confirm own-roster line fails instead). Either way the assertion raises before the policy exists.

- [ ] **Step 3: Write the migration**

`supabase/migrations/20260616000350_team_tables_rls.sql`:
```sql
drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members for select to authenticated
  using (public.is_team_member(team_id));

drop policy if exists team_invitations_select on public.team_invitations;
create policy team_invitations_select on public.team_invitations for select to authenticated
  using (public.is_team_admin(team_id));
-- All mutations go through SECURITY DEFINER RPCs; no direct insert/update/delete policies.
```

- [ ] **Step 4: Apply and verify it passes**

Run: `npx supabase db reset && npx supabase db query --file supabase/tests/team_rls_assert.sql`
Expected: `PASS: roster isolation correct`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260616000350_team_tables_rls.sql supabase/tests/team_rls_assert.sql
git commit -m "feat(team): RLS for team_members + team_invitations"
```

---

### Task 7: Enforce grants on the 5 resource tables (Fix #1 — the core)

**Files:**
- Create: `supabase/migrations/20260616000400_enforce_grants_resource_rls.sql`
- Test: `supabase/tests/grant_enforcement_assert.sql`

> **Before writing:** verify each table's owner column and existing policies:
> `grep -rA60 "create table if not exists public.<t>" supabase/migrations | grep -iE "created_by|user_id|team_id"`
> and `grep -rin "policy.*on public.<t>" supabase/migrations`.
> Confirmed owner columns: `mailing_lists.created_by`, `saved_designs.user_id`,
> `contact_cards.user_id`, `user_assets.user_id`, `design_templates`=**verify**
> (`grep -rA40 "create table if not exists public.design_templates" supabase/migrations`).
> Resource-type → table map: mailing_list→mailing_lists, design→saved_designs,
> contact_card→contact_cards, asset→user_assets, template→design_templates.

- [ ] **Step 1: Write the failing assertion**

`supabase/tests/grant_enforcement_assert.sql`:
```sql
do $$
declare creator uuid := gen_random_uuid(); grantee uuid := gen_random_uuid(); other uuid := gen_random_uuid();
        adm uuid := gen_random_uuid(); tid uuid := gen_random_uuid(); lid uuid := gen_random_uuid();
begin
  insert into teams(id,name,plan,owner_id) values (tid,'T','none',adm);
  insert into team_members(team_id,user_id,role) values
    (tid,adm,'admin'),(tid,creator,'member'),(tid,grantee,'member'),(tid,other,'member');
  insert into mailing_lists(id,name,created_by,team_id) values (lid,'L',creator,tid);
  -- grantee can't see it yet:
  set local role authenticated; set local request.jwt.claims = json_build_object('sub', grantee)::text;
  if exists (select 1 from mailing_lists where id=lid) then raise exception 'FAIL: grantee saw list pre-grant'; end if;
  -- admin (decision B) CAN see it:
  set local request.jwt.claims = json_build_object('sub', adm)::text;
  if not exists (select 1 from mailing_lists where id=lid) then raise exception 'FAIL: admin cannot see team list'; end if;
  -- grant view to grantee, then grantee CAN see, other still cannot:
  insert into resource_permissions(user_id,granted_by,resource_type,resource_id,permission_level,team_id)
    values (grantee, adm, 'mailing_list', lid::text, 'view_only', tid);
  set local request.jwt.claims = json_build_object('sub', grantee)::text;
  if not exists (select 1 from mailing_lists where id=lid) then raise exception 'FAIL: grant not honored'; end if;
  set local request.jwt.claims = json_build_object('sub', other)::text;
  if exists (select 1 from mailing_lists where id=lid) then raise exception 'FAIL: ungranted member saw list'; end if;
  raise notice 'PASS: grant enforcement + admin visibility correct';
  rollback;
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx supabase db query --file supabase/tests/grant_enforcement_assert.sql`
Expected: `FAIL: admin cannot see team list` (existing RLS keys only on `created_by`, so the admin sees nothing). Confirms enforcement is missing.

- [ ] **Step 3: Write the migration** (repeat the pattern per table; owner column noted inline)

`supabase/migrations/20260616000400_enforce_grants_resource_rls.sql`:
```sql
-- Pattern per resource table: own it OR team-admin (decision B) OR an active grant.
-- view_only grant → SELECT; edit grant → SELECT + UPDATE.

-- mailing_lists (owner col: created_by; resource_type 'mailing_list')
drop policy if exists mailing_lists_team_select on public.mailing_lists;
create policy mailing_lists_team_select on public.mailing_lists for select to authenticated
  using (created_by = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('mailing_list', id::text) is not null);
drop policy if exists mailing_lists_team_update on public.mailing_lists;
create policy mailing_lists_team_update on public.mailing_lists for update to authenticated
  using (created_by = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('mailing_list', id::text) = 'edit');

-- saved_designs (owner col: user_id; resource_type 'design')
drop policy if exists saved_designs_team_select on public.saved_designs;
create policy saved_designs_team_select on public.saved_designs for select to authenticated
  using (user_id = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('design', id::text) is not null);
drop policy if exists saved_designs_team_update on public.saved_designs;
create policy saved_designs_team_update on public.saved_designs for update to authenticated
  using (user_id = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('design', id::text) = 'edit');

-- contact_cards (owner col: user_id; resource_type 'contact_card')
drop policy if exists contact_cards_team_select on public.contact_cards;
create policy contact_cards_team_select on public.contact_cards for select to authenticated
  using (user_id = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('contact_card', id::text) is not null);
drop policy if exists contact_cards_team_update on public.contact_cards;
create policy contact_cards_team_update on public.contact_cards for update to authenticated
  using (user_id = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('contact_card', id::text) = 'edit');

-- user_assets (owner col: user_id; resource_type 'asset')
drop policy if exists user_assets_team_select on public.user_assets;
create policy user_assets_team_select on public.user_assets for select to authenticated
  using (user_id = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('asset', id::text) is not null);
drop policy if exists user_assets_team_update on public.user_assets;
create policy user_assets_team_update on public.user_assets for update to authenticated
  using (user_id = auth.uid() or public.is_team_admin(team_id)
         or public.my_resource_permission('asset', id::text) = 'edit');

-- design_templates (owner col: VERIFY before writing; resource_type 'template')
-- After confirming the owner column (assume created_by), add the same two policies.
```

> **Note on existing policies:** these tables already have owner-scoped SELECT/UPDATE
> policies from earlier migrations. Postgres RLS combines multiple permissive
> policies with OR, so adding these widens access as intended. If an existing
> policy is named identically it is replaced by the `drop policy if exists` above —
> grep first and reconcile names so you don't silently drop an unrelated policy.

- [ ] **Step 4: Apply and verify it passes**

Run: `npx supabase db reset && npx supabase db query --file supabase/tests/grant_enforcement_assert.sql`
Expected: `PASS: grant enforcement + admin visibility correct`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260616000400_enforce_grants_resource_rls.sql supabase/tests/grant_enforcement_assert.sql
git commit -m "feat(team): enforce resource grants + admin visibility via RLS (Fix #1)"
```

---

## Phase 4 — Service layer + API routes

### Task 8: `current-team` resolver + membership service

**Files:**
- Create: `lib/teams/current-team.ts`, `lib/teams/membership-service.ts`
- Test: `tests/teams/membership-service.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/teams/membership-service.test.ts`:
```ts
import { expect } from 'chai'
import { buildInviteToken } from '@/lib/teams/membership-service'

describe('buildInviteToken', () => {
  it('produces a 43+ char url-safe token', () => {
    const t = buildInviteToken()
    expect(t).to.match(/^[A-Za-z0-9_-]{43,}$/)
  })
  it('is unique across calls', () => {
    expect(buildInviteToken()).to.not.equal(buildInviteToken())
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx mocha tests/teams/membership-service.test.ts`
Expected: FAIL — cannot find module `@/lib/teams/membership-service`.

- [ ] **Step 3: Write the implementation**

`lib/teams/current-team.ts`:
```ts
import { createClient } from '@/utils/supabase/server'

export interface CurrentTeam { teamId: string; role: 'owner' | 'admin' | 'member' }

/** Resolve the signed-in user's active team + role, or null for a solo user. */
export async function getCurrentTeam(): Promise<CurrentTeam | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  return data ? { teamId: data.team_id, role: data.role as CurrentTeam['role'] } : null
}
```

`lib/teams/membership-service.ts`:
```ts
import { randomBytes } from 'crypto'
import { createClient } from '@/utils/supabase/server'

export function buildInviteToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function inviteMember(teamId: string, email: string, role: 'admin' | 'member') {
  const supabase = await createClient()
  const token = buildInviteToken()
  const { data, error } = await supabase.rpc('invite_member', {
    p_team_id: teamId, p_email: email, p_role: role, p_token: token,
  })
  if (error) throw error
  return data as { mode: 'added' | 'invited'; token?: string }
}

export async function ensureTeam(name: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_team_and_owner', { p_name: name })
  if (error) throw error
  return data as string
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx mocha tests/teams/membership-service.test.ts`
Expected: PASS (2 passing).

- [ ] **Step 5: Commit**

```bash
git add lib/teams/current-team.ts lib/teams/membership-service.ts tests/teams/membership-service.test.ts
git commit -m "feat(team): current-team resolver + membership service"
```

---

### Task 9: Invite + accept-invite API routes

**Files:**
- Create: `app/api/teams/invite/route.ts`, `app/api/teams/accept-invite/route.ts`
- Test: manual (live stack) — documented assertion below.

- [ ] **Step 1: Write the route — invite**

`app/api/teams/invite/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentTeam } from '@/lib/teams/current-team'
import { ensureTeam, inviteMember } from '@/lib/teams/membership-service'
import { sendInviteEmail } from '@/lib/email/resend'

const Body = z.object({ email: z.string().email(), role: z.enum(['admin', 'member']), teamName: z.string().optional() })

export async function POST(req: NextRequest) {
  try {
    const { email, role, teamName } = Body.parse(await req.json())
    let team = await getCurrentTeam()
    if (!team) { const id = await ensureTeam(teamName ?? 'My Team'); team = { teamId: id, role: 'owner' } }
    if (team.role === 'member') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    const result = await inviteMember(team.teamId, email, role)
    await sendInviteEmail({ email, mode: result.mode, token: result.token })
    return NextResponse.json(result, { status: 201 })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 })
    const msg = String(e?.message ?? e)
    const code = /seat limit/.test(msg) ? 409 : /already belongs|already on a team/.test(msg) ? 409
      : /not authorized/.test(msg) ? 403 : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}
```

- [ ] **Step 2: Write the route — accept-invite**

`app/api/teams/accept-invite/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'

const Body = z.object({ token: z.string().min(10) })

export async function POST(req: NextRequest) {
  try {
    const { token } = Body.parse(await req.json())
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data, error } = await supabase.rpc('accept_invite', { p_token: token, p_email: user.email })
    if (error) {
      const msg = error.message
      const code = /expired|invalid|mismatch/.test(msg) ? 400 : /already on a team/.test(msg) ? 409 : 500
      return NextResponse.json({ error: msg }, { status: code })
    }
    return NextResponse.json({ teamId: data }, { status: 200 })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Manual verification (live stack)**

Run dev (`npm run dev`, port 3010). As an owner account, `POST /api/teams/invite` with a brand-new email → expect `201 {mode:'invited'}` and a row in `team_invitations`; with an existing user's email → `201 {mode:'added'}` + a `team_members` row. Invite past 25 seats → `409 seat limit`.
Expected: as described; check rows in Studio (`http://127.0.0.1:54323`).

- [ ] **Step 4: Commit**

```bash
git add app/api/teams/invite/route.ts app/api/teams/accept-invite/route.ts
git commit -m "feat(team): invite + accept-invite API routes"
```

---

### Task 10: Members, settings, transfer, delete API routes

**Files:**
- Create: `app/api/teams/members/route.ts`, `app/api/teams/members/[userId]/route.ts`, `app/api/teams/settings/route.ts`, `app/api/teams/transfer/route.ts`, `app/api/teams/delete/route.ts`

- [ ] **Step 1: Write members list + mutation routes**

`app/api/teams/members/route.ts` (GET roster + pending invites):
```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentTeam } from '@/lib/teams/current-team'

export async function GET() {
  const team = await getCurrentTeam()
  if (!team) return NextResponse.json({ members: [], invitations: [] })
  const supabase = await createClient()
  const [members, invitations] = await Promise.all([
    supabase.from('team_members').select('user_id, role, status, joined_at').eq('team_id', team.teamId),
    team.role !== 'member'
      ? supabase.from('team_invitations').select('id, email, role, status, expires_at').eq('team_id', team.teamId).eq('status', 'pending')
      : Promise.resolve({ data: [] as any[] }),
  ])
  return NextResponse.json({ members: members.data ?? [], invitations: (invitations as any).data ?? [], role: team.role })
}
```

`app/api/teams/members/[userId]/route.ts` (PATCH role / DELETE remove):
```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { getCurrentTeam } from '@/lib/teams/current-team'

const Patch = z.object({ role: z.enum(['admin', 'member']) })

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const team = await getCurrentTeam()
  if (!team || team.role === 'member') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  const { role } = Patch.parse(await req.json())
  const supabase = await createClient()
  const { error } = await supabase.rpc('change_member_role', { p_team_id: team.teamId, p_user_id: params.userId, p_role: role })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { userId: string } }) {
  const team = await getCurrentTeam()
  if (!team || team.role === 'member') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  const supabase = await createClient()
  const { error } = await supabase.rpc('remove_member', { p_team_id: team.teamId, p_user_id: params.userId })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Write settings/transfer/delete routes**

`app/api/teams/settings/route.ts` (PATCH team name):
```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { getCurrentTeam } from '@/lib/teams/current-team'

const Body = z.object({ name: z.string().min(1).max(120) })

export async function PATCH(req: NextRequest) {
  const team = await getCurrentTeam()
  if (!team || team.role === 'member') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  const { name } = Body.parse(await req.json())
  const supabase = await createClient()
  const { error } = await supabase.from('teams').update({ name }).eq('id', team.teamId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
```

`app/api/teams/transfer/route.ts` and `app/api/teams/delete/route.ts` follow the same shape, calling `transfer_ownership` ({ p_team_id, p_new_owner }) and `delete_team` ({ p_team_id }) respectively, each gated by `team.role === 'owner'` (return 403 otherwise) — the RPC re-checks owner authority as the real boundary:
```ts
// app/api/teams/delete/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentTeam } from '@/lib/teams/current-team'

export async function POST() {
  const team = await getCurrentTeam()
  if (!team || team.role !== 'owner') return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  const supabase = await createClient()
  const { error } = await supabase.rpc('delete_team', { p_team_id: team.teamId })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
```
(transfer route: `POST` with body `{ newOwnerId }`, calls `transfer_ownership`.)

- [ ] **Step 3: Manual verification**

As owner: PATCH name → 200 + Studio shows change; PATCH a member to admin → 200; DELETE a member → 200 + their grants revoked. As a member account: every mutation → 403.

- [ ] **Step 4: Commit**

```bash
git add app/api/teams/members app/api/teams/settings app/api/teams/transfer app/api/teams/delete
git commit -m "feat(team): members/settings/transfer/delete API routes"
```

---

## Phase 5 — Email notifications (Resend)

### Task 11: Resend helper + notification sends

**Files:**
- Create: `lib/email/resend.ts`
- Modify: `app/api/teams/invite/route.ts` (already calls `sendInviteEmail`), access-control approve/deny route(s) to call notify helpers.
- Test: `tests/email/resend.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/email/resend.test.ts`:
```ts
import { expect } from 'chai'
import { inviteEmailHtml } from '@/lib/email/resend'

describe('inviteEmailHtml', () => {
  it('includes the signup link with the token for the invited path', () => {
    const html = inviteEmailHtml({ mode: 'invited', token: 'abc123', appUrl: 'http://localhost:3010' })
    expect(html).to.contain('http://localhost:3010/signup?invite=abc123')
  })
  it('omits the signup link for an added existing user', () => {
    const html = inviteEmailHtml({ mode: 'added', appUrl: 'http://localhost:3010' })
    expect(html).to.not.contain('/signup?invite=')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx mocha tests/email/resend.test.ts`
Expected: FAIL — cannot find module `@/lib/email/resend`.

- [ ] **Step 3: Write the implementation**

`lib/email/resend.ts`:
```ts
import { Resend } from 'resend'

const FROM = 'YLS <team@yellowlettershop.com>'
function appUrl() { return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3010' }
function client() { const k = process.env.RESEND_API_KEY; return k ? new Resend(k) : null }

export function inviteEmailHtml(o: { mode: 'invited' | 'added'; token?: string; appUrl: string }): string {
  if (o.mode === 'invited') {
    const link = `${o.appUrl}/signup?invite=${o.token}`
    return `<p>You've been invited to a Yellow Letter Shop team.</p><p><a href="${link}">Accept your invitation</a></p>`
  }
  return `<p>You've been added to a Yellow Letter Shop team. <a href="${o.appUrl}/dashboard/team-management">Open your team</a>.</p>`
}

export async function sendInviteEmail(o: { email: string; mode: 'invited' | 'added'; token?: string }) {
  const c = client(); if (!c) { console.warn('[email] RESEND_API_KEY unset; skipping invite email'); return }
  await c.emails.send({ from: FROM, to: o.email, subject: "You're invited to a YLS team",
    html: inviteEmailHtml({ ...o, appUrl: appUrl() }) })
}

export async function sendAccessDecisionEmail(o: { email: string; approved: boolean; resource: string }) {
  const c = client(); if (!c) { console.warn('[email] RESEND_API_KEY unset; skipping decision email'); return }
  await c.emails.send({ from: FROM, to: o.email, subject: `Access ${o.approved ? 'approved' : 'denied'}`,
    html: `<p>Your request for ${o.resource} was ${o.approved ? 'approved' : 'denied'}.</p>` })
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx mocha tests/email/resend.test.ts` → PASS (2). Then `npm install resend` if not present (`grep '"resend"' package.json`).

- [ ] **Step 5: Commit**

```bash
git add lib/email/resend.ts tests/email/resend.test.ts package.json package-lock.json
git commit -m "feat(team): Resend email helper for invites + access decisions"
```

---

## Phase 6 — UI wiring

### Task 12: Resolve real team + empty state on the page

**Files:**
- Modify: `app/dashboard/team-management/page.tsx`
- Create: `components/team/empty-state.tsx`

- [ ] **Step 1: Replace the hardcoded teamId**

In `app/dashboard/team-management/page.tsx`, remove `const teamId = 'current-team-id'` (≈ lines 221, 477) and the mock arrays. Resolve the real team via a client fetch to `GET /api/teams/members` (returns `{ members, invitations, role }`) or, if the page is a server component, call `getCurrentTeam()`. If no team and the user has no members/invites → render `<TeamEmptyState />`.

`components/team/empty-state.tsx`:
```tsx
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TeamEmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <Users className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">No team yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">Invite a teammate to start collaborating. Your team is created automatically.</p>
      <Button className="mt-4" onClick={onInvite}>Invite your first teammate</Button>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

chrome-devtools: navigate `http://localhost:3010/dashboard/team-management` as a solo account → see the empty state, no console errors (`list_console_messages`).

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/team-management/page.tsx components/team/empty-state.tsx
git commit -m "feat(team): resolve real current team + solo empty state"
```

---

### Task 13: Members tab + invite dialog

**Files:**
- Create: `components/team/members-tab.tsx`, `components/team/invite-dialog.tsx`

- [ ] **Step 1: Build the invite dialog**

`components/team/invite-dialog.tsx` — a Dialog with an email `Input`, a role `Select` (Admin/Member), and a submit that `POST`s `/api/teams/invite` then refreshes. On a non-2xx, show the returned `error` string in a destructive alert (covers seat-limit 409, already-on-a-team 409, 403).

- [ ] **Step 2: Build the members tab**

`components/team/members-tab.tsx` — fetches `GET /api/teams/members`; renders the roster with role badges; for admins/owners shows pending invites (with Resend → re-POST invite; Revoke → `DELETE` an invite route — add `app/api/teams/invitations/[id]/route.ts` calling an `revoke_invitation` update gated by `is_team_admin`), a change-role `Select` (PATCH), and a remove button (DELETE). Members see a read-only roster.

- [ ] **Step 3: Verify in browser**

As owner: open dialog, invite a new email → row appears under pending; invite an existing user → appears as active member; promote/demote/remove work; as member → controls hidden. No console errors.

- [ ] **Step 4: Commit**

```bash
git add components/team/members-tab.tsx components/team/invite-dialog.tsx app/api/teams/invitations
git commit -m "feat(team): members tab + invite dialog"
```

---

### Task 14: Access Requests, Templates, Activity Log, Settings tabs + Quick Actions

**Files:**
- Create: `components/team/access-requests-tab.tsx`, `components/team/request-access-dialog.tsx`, `components/team/templates-tab.tsx`, `components/team/activity-log-tab.tsx`, `components/team/settings-tab.tsx`
- Modify: `app/dashboard/team-management/page.tsx` (wire the 3 Quick-Action buttons + render real tabs)

- [ ] **Step 1: Access Requests tab + request dialog**

`access-requests-tab.tsx` — admins: list `pending` from the service (`getTeamAccessRequests`) with Approve (`approve_access_request` via existing `/api/access-control/*` or a new route) / Deny (`deny_access_request`); members: their own request history. `request-access-dialog.tsx` — resource-type Select + resource picker + view/edit + justification → inserts an `access_requests` row (RLS-checked).

- [ ] **Step 2: Templates + Activity Log + Settings tabs**

- `templates-tab.tsx`: real CRUD via the existing template service + "Apply to member" (calls `apply_permission_template`). Admin-only.
- `activity-log-tab.tsx`: `getTeamActivityLog(teamId)`; admin-only (RLS already enforces). Replace mock jane/john/bob.
- `settings-tab.tsx`: team name (PATCH settings), seat usage `X / max_seats` (from `GET /api/teams/members` count + a `teams` read), transfer ownership (owner-only, pick an admin), delete team (owner-only, confirm dialog → `POST /api/teams/delete`).

- [ ] **Step 3: Wire Quick Actions**

In `page.tsx`, wire the three Overview buttons: Request Access → opens `request-access-dialog`; Create Template → opens the template editor in `templates-tab`; View Activity Log → switches to the Activity Log tab. Remove the mock Overview cards; show real counts.

- [ ] **Step 4: Verify in browser**

Full pass as owner, admin, and member accounts: each tab shows real data, role-gating hides admin controls from members, Quick Actions work, approving a request makes the resource actually visible to the requester (cross-check by logging in as them). No console/network errors (`list_console_messages`, `list_network_requests`).

- [ ] **Step 5: Commit**

```bash
git add components/team app/dashboard/team-management/page.tsx
git commit -m "feat(team): wire requests/templates/activity/settings tabs + quick actions"
```

---

## Phase 7 — End-to-end verification

### Task 15: Authority-matrix integration + full E2E

**Files:**
- Create: `supabase/tests/e2e_matrix_assert.sql`

- [ ] **Step 1: Write the authority-matrix assertion**

One SQL transaction that sets up a team with owner/admin/member/outsider and asserts each cell of the §1 matrix (approve/deny/revoke/template/visibility/transfer/delete) raises or succeeds as specified. Model it on the per-task assertions; cover the negative cases (member cannot approve, outsider sees nothing, member cannot delete team, non-super-admin cannot `set_max_seats`).

- [ ] **Step 2: Run the full DB suite**

Run: `npx supabase db reset` then run every file in `supabase/tests/*.sql`. Expected: all `PASS` notices, no exceptions.

- [ ] **Step 3: Run JS tests + lint + build**

Run: `npm test && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 4: Browser E2E (chrome-devtools)**

Two real accounts (owner = `theyellowlettershop@`, invitee = a second local user). Invite (both branches) → accept via signup (verify Google-OAuth token survival) → request access → approve → confirm the invitee now sees the granted resource → revoke → confirm it disappears. Capture console/network clean. Leave the browser open.

- [ ] **Step 5: Commit + checkpoint**

```bash
git add supabase/tests/e2e_matrix_assert.sql
git commit -m "test(team): authority-matrix + E2E verification"
```
Then `/git-workflow-planning:finish` to open the PR.

---

## Self-Review (completed during authoring)

- **Spec coverage:** every §2–§7 spec item maps to a task — tables (T1), helpers/Fix#2 (T2), re-key RPCs (T3) + RLS (T4), membership/invite/transfer/delete RPCs incl. lazy creation A, seat cap, "already on a team", OAuth email-match (T5), team-table RLS (T6), Fix#1 grant enforcement + admin-visibility B (T7), service (T8), invite/accept APIs (T9), members/settings/transfer/delete APIs incl. D (T10), Resend (T11), empty state A (T12), members UI (T13), remaining tabs + quick actions (T14), matrix + E2E (T15).
- **Placeholder scan:** no "TBD"/"add error handling" — error mapping is shown explicitly in routes; the one deliberate verify-step is `design_templates`' owner column (flagged with the exact grep), which must be confirmed before T7-step-3.
- **Type consistency:** RPC names/params are identical across the migration that defines them and the routes that call them (`invite_member(p_team_id,p_email,p_role,p_token)`, `accept_invite(p_token,p_email)`, `change_member_role(p_team_id,p_user_id,p_role)`, etc.); `getCurrentTeam()` shape (`{teamId, role}`) is used consistently.

## Open risks carried from the spec
- `design_templates` owner column unverified — confirm before Task 7 step 3.
- The Supabase CLI query command (`npx supabase db query`) may differ by version; fallback is the `docker exec -i ... psql` pipe noted in the testing conventions.
- OAuth invite-token survival touches the signup flow (Google OAuth, env-var creds — memory `project_google_oauth`); budget extra verification time in Task 15 step 4.
