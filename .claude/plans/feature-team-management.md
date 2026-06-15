# Design Spec — Team Management (Full RBAC)

**Status:** Design (approved in brainstorming) — pre-implementation
**Date:** 2026-06-15
**Branch (per Rule 6/8):** `feature/team-management`
**Author:** brainstormed with owner via `superpowers:brainstorming`

> This is the **design** doc. The step-by-step implementation plan is produced
> next by the `writing-plans` skill. No code is written until that plan exists
> and the owner approves this spec.

---

## 1. Purpose & scope

Build Team Management into a working full-RBAC team feature: an account owner
invites staff, who log in, receive a per-team role, request access to specific
resources, and use what an admin grants them.

**Applies ONLY to invited teammates.** A solo one-person customer never needs
this; for them the page is an empty "invite your first teammate" state and **no
team row exists** (see §3, lazy creation).

**v1 includes (all confirmed):** invite + role + zero-trust access flow, email
notifications (Resend), permission templates, real activity log, settings/members
admin surface.

**Out of scope / parked:** usage-based billing for list-building and storage —
its own spec after this ships (memory: `project_usage_billing_backlog`). The
legacy `teams.plan` / `teams.stripe_subscription_id` columns are dead
(no-subscriptions model) and are ignored, not used.

### Confirmed requirements (decision log)

| # | Decision |
|---|----------|
| Purpose | Full RBAC: Owner + staff with scoped access |
| Audience | Invited teammates only; solo customer → inactive/empty page |
| Roles | Per-team **Owner / Admin / Member** (separate from global `user_profiles.role`) |
| Invites | **Both** paths: existing YLS account → added immediately; no account → signup link (Resend) |
| Access model | **Zero-trust**: a member has nothing until granted, per resource |
| Grant authority | **Owner/Admin only** approve requests & grant (creator not consulted unless also admin) |
| Expiry | **Permanent by default**; admin may optionally set an expiry per grant |
| Seat cap | `teams.max_seats`, **default 25**, raisable by a YLS (super_)admin |
| Admin visibility (B) | **Owners/Admins implicitly see ALL team resources**; members stay zero-trust toward each other |
| Team creation (A) | **Lazy** — `teams` + owner `team_members` row created on the owner's first invite |
| Resource types | `mailing_list`, `template`, `design`, `contact_card`, `asset` |

### Role authority matrix

| Action | Owner | Admin | Member | Outsider | super_admin |
|--------|:--:|:--:|:--:|:--:|:--:|
| Invite / remove members | ✅ | ✅ | ❌ | ❌ | ✅ (override) |
| Approve / deny / revoke access | ✅ | ✅ | ❌ | ❌ | ✅ |
| Manage permission templates | ✅ | ✅ | ❌ | ❌ | ✅ |
| See all team resources (B) | ✅ | ✅ | ❌ | ❌ | ✅ |
| Request access to a resource | ✅ | ✅ | ✅ | ❌ | n/a |
| Transfer ownership / delete team | ✅ | ❌ | ❌ | ❌ | ✅ |
| Set/raise `max_seats` | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 2. Data model

### New tables

**`team_members`** — authoritative source of truth for per-team roles.
```
id              uuid pk default gen_random_uuid()
team_id         uuid not null references teams(id) on delete cascade
user_id         uuid not null references auth.users(id) on delete cascade
role            text not null check (role in ('owner','admin','member'))
status          text not null default 'active' check (status in ('active','invited','suspended'))
invited_by      uuid references auth.users(id)
joined_at       timestamptz default now()
created_at / updated_at timestamptz default now()
unique (team_id, user_id)                                  -- one role per team per person
-- "one ACTIVE team per person" is a PARTIAL unique index, NOT unique(user_id),
-- so suspended/historical rows never permanently block re-joining (Fix #3):
create unique index team_members_one_active_team
  on team_members (user_id) where status = 'active';
```

**`team_invitations`** — pending invites for the "no account yet" path.
```
id          uuid pk
team_id     uuid not null references teams(id) on delete cascade
email       citext not null
role        text not null check (role in ('admin','member'))   -- never 'owner'
invited_by  uuid not null references auth.users(id)
token       text not null                                       -- high-entropy, single-use
status      text not null default 'pending' check (status in ('pending','accepted','revoked','expired'))
expires_at  timestamptz not null default now() + interval '7 days'
accepted_at timestamptz
created_at  timestamptz default now()
-- no duplicate LIVE invite for the same email on a team:
create unique index team_invitations_one_live
  on team_invitations (team_id, email) where status = 'pending';
```

### Changes to existing tables
- `teams.max_seats` default `3 → 25` (migration; existing rows untouched).
- `team_id` columns on `access_requests`, `permission_templates`,
  `resource_permissions`, `team_activity_log` are **now populated & enforced**
  (currently nullable/unused).
- `user_profiles.team_id` becomes a **denormalized cache** of the user's active
  membership (Fix #3) — `team_members` is authoritative; membership RPCs keep it
  in sync. Existing `team_id`-keyed queries continue to work.

### Resource ownership
A resource is owned by its creator via the existing `created_by` / `user_id`
columns on each resource table. `resource_permissions` grants layer on top. A
creator always reaches their own resources without a grant.

---

## 3. Authority & security (the Approach-A re-key)

### Authority oracle (SECURITY DEFINER — Fix #2)
Two helpers, both `SECURITY DEFINER` so they bypass RLS when resolving membership
and **cannot recurse** into `team_members`' own RLS:
```
team_role(p_team_id) -> caller's role in that team (team_members, status='active') or null
is_team_admin(p_team_id) -> team_role in ('owner','admin')
                            OR caller is global super_admin (platform override)
is_team_member(p_team_id) -> team_role is not null OR super_admin
```

### Re-keyed RPCs
`approve_access_request` and `apply_permission_template` stop checking
`user_profiles.role in ('admin','manager')` and instead require
`is_team_admin(<request/template team_id>)`. Self-approval stays blocked. New:
`deny_access_request`, `revoke_resource_permission`, and the membership RPCs
(§4) — all `SECURITY DEFINER`, all gated by `is_team_admin()`.

### RLS (team-scoped)
- `team_members`: a member reads their own team's roster
  (`is_team_member(team_id)`); mutations via RPC only.
- `team_invitations`: `is_team_admin(team_id)` only.
- `access_requests`: requester/reviewer **OR** `is_team_admin(team_id)` SELECT.
- `permission_templates`: `is_team_admin(team_id)` manages (not just `created_by`).
- `resource_permissions`: grantee/grantor **OR** `is_team_admin(team_id)` SELECT.
- `team_activity_log`: **`is_team_admin(team_id)` only** (admin-only tab).

### Fix #1 — grants must be ENFORCED on every resource table (the real work)
Writing a `resource_permissions` row only *records* a grant; it does nothing
until each resource table's RLS consults it. For **each** of the 5 resource
types we extend read/write RLS to:
```
created_by = auth.uid()                                  -- own it
OR is_team_admin(team_id)                                -- admin visibility (decision B)
OR exists (active resource_permissions for me on this resource)   -- granted
```
- `view_only` grant → SELECT; `edit` grant → SELECT + UPDATE.
- "Active" = `revoked_at is null and (expires_at is null or expires_at > now())`.
- A `team_resource_access(resource_type, resource_id)` SECURITY-DEFINER helper
  centralizes this predicate so the 5 policies stay consistent.

Target tables (confirm exact names during implementation): mailing lists,
templates/`design_templates`, `saved_designs`, contact cards, `user_assets`.

---

## 4. Invite flow ("both" paths)

Owner/Admin enters **email + role** (Admin or Member). One handler:

- **Lazy team creation (A):** if the inviter has no team yet, create the `teams`
  row (+ their `owner` `team_members` row, set their `user_profiles.team_id`)
  *before* processing the invite.
- **Seat check:** count `active members + pending invitations` vs
  `teams.max_seats` (25). At/over → reject: "Seat limit reached (25) — an admin
  can raise it."
- **Branch A — email already has a YLS account** (resolved via a SECURITY-DEFINER
  `lookup_user_by_email` RPC; `auth.users` isn't directly queryable):
  - If they're already an active member of *another* team → reject ("already on a
    team"). Otherwise insert `team_members(status='active')`, set their
    `user_profiles.team_id`, log `member_added`, email "you've been added".
- **Branch B — no account:** insert `team_invitations(status='pending')`, email a
  signup link `/signup?invite=<token>`. On signup, `accept_invite(token)`
  validates (email match, not expired, pending), creates the membership, flips
  invite to `accepted`, sets the cache, logs `member_joined`.
  - **OAuth (C):** the token must survive a Google OAuth round-trip — pass it via
    OAuth `state` (or a short-lived stash), not just the URL. If the email they
    sign in with ≠ the invited email, show a clear mismatch message; the invite
    stays pending.

**Pending-invite management:** Members surface lists pending invites with
**Resend** (re-email, refresh token/expiry) and **Revoke** (`status='revoked'`).
All via `is_team_admin()`-gated RPCs.

---

## 5. Access-request lifecycle (zero-trust)

- **Request (Member):** pick resource + `view_only`/`edit` + optional
  justification → `access_requests` insert (existing RLS: `requester_id =
  auth.uid()`, can't self-request `owner`), status `pending`. Log
  `access_requested`; notify admins.
- **Approve (Owner/Admin):** re-keyed `approve_access_request` —
  `is_team_admin(team_id)`, no self-approval, inserts a `resource_permissions`
  grant (**permanent** unless an optional duration is set). Log `access_approved`;
  notify requester.
- **Deny:** `deny_access_request` (same gate) → `denied` + optional note. Log;
  notify requester.
- **Revoke:** `revoke_resource_permission` → set `revoked_at`/`revoked_by`. Log
  `access_revoked`.
- **Expiry:** existing `revoke_expired_permissions()` flips expired grants; rarely
  fires (permanent default). v1 invokes it lazily on the admin grants-read path
  (no new cron); a scheduled call is a later option.

Because of Fix #1, each transition is *real*: approving makes the resource appear
for the requester; revoking makes it vanish. UI only offers `view_only`/`edit`
(resource-level `admin`/`owner` levels unused in v1).

---

## 6. UI wiring (5 tabs)

Replace mock data and the hardcoded `teamId = 'current-team-id'` with the real
current team resolved from `team_members` for the signed-in user (null for solo
→ empty state).

- **Overview:** real counts (pending requests, active members, active grants,
  active templates); real recent `team_activity_log` (admin) / own grants
  (member). Wire the 3 stub Quick-Action buttons (Request Access, Create
  Template, View Activity Log). Role-gate the numbers (members don't see
  team-wide admin counts).
- **Members** (new, in/near Settings): roster + role badges, pending invites
  (resend/revoke), invite form, remove-member, change-role. Admin-only mutations.
- **Access Requests:** real `pending` list + Approve/Deny; member's own history.
- **Permission Templates:** real CRUD + "apply to member" (backend exists).
  Admin-only.
- **Activity Log:** real `team_activity_log`, **admin-only**.
- **Settings:** team name; **seat usage X / 25**; transfer ownership (owner-only);
  delete team (owner-only).

**Solo/empty state:** signed-in user with no team (or sole owner, no members/
invites) → calm "Invite your first teammate" state, not dense controls.

**Role-gating** is enforced in UI (hide) *and* at the DB (RLS/RPC). The DB is the
real boundary; UI hiding is convenience.

### Transfer / delete semantics (D)
- **Transfer ownership:** exactly one owner invariant — promote target (an existing
  admin) to `owner`, demote old owner to `admin`. Owner-only, via RPC.
- **Delete team:** clear members' `user_profiles.team_id`, remove `team_members`,
  revoke outstanding grants, expire pending invites. **Resources stay with their
  creators** (`created_by` unchanged). Owner-only, confirm dialog.

---

## 7. Notifications, errors, testing

**Notifications (Resend):** invite (added / signup link), access-requested (→
admins), approved / denied (→ requester). Sent from server routes/RPC callers;
minimal templates; **no secrets/PII in logs**.

**Error handling — specific friendly messages, typed RPC exceptions → HTTP codes:**
seat-limit reached, duplicate live invite, expired/invalid token, email mismatch
on accept, self-approval, non-admin attempting a gated action, inviting someone
already on a team.

**Testing:**
- RPC/RLS unit tests — authority matrix (owner/admin/member/outsider/super_admin ×
  each action).
- Invite-flow integration — both branches + accept (incl. OAuth token survival,
  email-mismatch).
- Access-request happy path **+ the Fix-#1 enforcement test**: a granted member
  can actually read the resource; after revoke, cannot; an admin sees member
  content (B); a member cannot see another member's content.
- Seat-cap, transfer, delete-team behavior.
- chrome-devtools pass over the live tabs (never Playwright).

---

## 8. Implementation surface (orientation for the plan)

- **Migrations:** `team_members`, `team_invitations`, `teams.max_seats` default,
  `team_role`/`is_team_admin`/`is_team_member`/`team_resource_access` helpers,
  re-keyed + new RPCs, re-keyed RLS on the 4 access-control tables **and** the 5
  resource tables.
- **Service layer:** extend `lib/access-control/time-based-permissions.ts`
  (deny/revoke/membership/invite methods); new membership/invite module.
- **API routes:** invite, accept-invite, members CRUD, request/approve/deny/revoke,
  template apply, team settings/transfer/delete.
- **UI:** `app/dashboard/team-management/page.tsx` + tab components; new Members
  surface; wire Quick Actions; remove mock data + hardcoded teamId.
- **Email:** Resend templates + a small send helper.

### Known risks
- **Scope honesty:** Fix #1 (5 resource tables' RLS) is the bulk of the work and
  the part the existing skeleton entirely lacks — do not under-scope it.
- RLS recursion if any helper isn't SECURITY DEFINER (Fix #2).
- Exact resource table/column names must be verified against the live schema
  before writing the enforcement policies.
- OAuth-invite token plumbing touches the signup flow (Google OAuth, local
  Supabase env-var creds — memory: `project_google_oauth`).
