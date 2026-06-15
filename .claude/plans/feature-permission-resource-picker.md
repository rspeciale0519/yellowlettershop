# Feature: Permission Template Resource Picker

**Branch:** `feature/permission-resource-picker`
**Goal:** Replace the raw "Resource ID" free-text box in the Create/Edit Permission Template
form with a name-based picker, so a team admin never has to grab a UUID from a URL or DB row.
Admins choose **All [type]** (default) or pick **specific** named resources from a searchable
multi-select list.

---

## Background (verified against code)

- **Form today:** `components/access-control/permission-template-form.tsx` renders a per-permission
  card with a free-text `<Input>` for `resource_id` (placeholder "Resource ID or pattern").
- **Storage shape:** `permission_templates.template_permissions` is a JSON array of
  `{ resource_type, resource_id, permission_level, duration_days }` — one `resource_id` per entry
  (`lib/access-control/time-based-permissions.ts`). No schema migration needed for the template table.
- **Enforcement:** `public.my_resource_permission(type, id, team_id)`
  (`supabase/migrations/20260616000100_team_authority_helpers.sql`) does an **exact** match
  `resource_id = p_resource_id`. **No wildcard handling** — so an "All [type]" grant stored as a
  sentinel will NOT enforce until this function is updated. Resource RLS that calls it lives in
  `20260616000400_enforce_grants_resource_rls.sql` (mailing_lists, saved_designs, contact_cards,
  user_assets). `template` (design_templates) is intentionally excluded — global, world-readable
  catalog with no owner/team.
- **apply RPC:** `apply_permission_template` (`20260616000200_rekey_access_control.sql`) iterates the
  JSON array and inserts one `resource_permissions` row per entry. Unchanged by this work.

### Decisions locked with owner
1. **Targeting model:** Both — "All [type]" (default) **and** specific multi-select.
2. **Wildcard storage:** sentinel `resource_id = '*'` (matches the existing "or pattern" intent).
3. **`template` type:** keep it **visible but unenforced**; show an inline notice when selected
   ("Templates are shared with your whole team — this grant is informational") so no admin thinks
   they locked down something that is actually open. Custom user/team-owned templates + real
   template enforcement = **separate backlog feature**, NOT built here.

### Type → table / column map (verified)
| resource_type | table             | label column        | owner column | team col | active/deleted filter      |
|---------------|-------------------|---------------------|--------------|----------|----------------------------|
| mailing_list  | `mailing_lists`   | `name`              | `created_by` | `team_id`| `is_active = true`         |
| design        | `saved_designs`   | `name`              | `user_id`    | `team_id`| (none)                     |
| contact_card  | `contact_cards`   | `name`              | `user_id`    | `team_id`| `is_soft_deleted = false`  |
| asset         | `user_assets`     | `original_filename` | `user_id`    | `team_id`| (none)                     |
| template      | `design_templates`| `name`              | (none)       | (none)   | `is_active = true`         |

> NOTE: `user_assets` has **no** `name` column — label = `original_filename` (fallback `filename`).

### Verified available
- shadcn primitives already present: `components/ui/command.tsx`, `popover.tsx`, `checkbox.tsx`,
  `radio-group.tsx`. No install step.

---

## Phase 1 — Backend: resource-listing endpoint + wildcard enforcement

**1a. New endpoint** `app/api/access-control/resources/route.ts` (GET, `runtime = 'nodejs'`)
- Auth: `supabase.auth.getUser()`; 401 if none.
- Authorization: caller must be a **team admin** of the requested `team_id` (use existing
  `is_team_admin` semantics via RLS / a guard consistent with the templates route).
- Query params:
  - `type` (required) — one of the 5 ResourceTypes; 400 if invalid.
  - `team_id` (required) — scope rows to that team.
  - `q` (optional) — case-insensitive `ilike` on the label column.
  - `ids` (optional, CSV) — batch resolve: return only rows whose `id` is in the set (for edit mode
    label resolution). When `ids` present, `q` is ignored.
  - `limit` (optional, default 50, cap 100).
- Internal map (server-only constant) type → `{ table, labelColumn, ownerColumn, teamColumn, filter }`
  per the table above. **No table name ever comes from the client** — only the validated `type` key.
- Returns `{ resources: { id: string, label: string, meta?: string }[] }`. `meta` examples:
  mailing_list → `${record_count} records`; asset → `file_type`. Keep optional/cheap.
- Zod-validate query params. Order results by label asc.

**1b. New migration** `supabase/migrations/<ts>_resource_permission_wildcard.sql`
- `create or replace function public.my_resource_permission(...)` identical to current body except
  the predicate becomes: `and (resource_id = p_resource_id or resource_id = '*')`.
- Keep `security definer`, `set search_path = public`, and the existing
  `order by case permission_level when 'edit' then 0 else 1 end limit 1`.
- Re-grant execute to `authenticated` if the `create or replace` requires it (it should retain
  grants, but include the grant defensively / idempotently).
- Apply to local DB and record in `supabase_migrations.schema_migrations` per project norm.

**Verify (evidence):** `npm run lint` clean on the new route; manual psql: a `('mailing_list','*',team)`
grant returns a permission level; a specific grant still returns only for its id; expired/revoked
still excluded.

**Checkpoint:** `/git-workflow-planning:checkpoint 1 resources endpoint + wildcard enforcement`

---

## Phase 2 — `ResourcePicker` component

**New file** `components/access-control/resource-picker.tsx` (target < 350 LOC)

Props:
```ts
interface ResourcePickerProps {
  resourceType: ResourceType
  teamId?: string
  value: string[]            // selected resource_ids, or ['*'] for All
  onChange: (ids: string[]) => void
}
```
Behavior:
- **Scope toggle** (`RadioGroup`): "All [type label]" (default) vs "Specific". Selecting All sets
  `value = ['*']`; selecting Specific clears to `[]` and reveals the combobox.
- **Specific combobox:** `Popover` + `Command` searchable list. Debounced `q` fetch to
  `/api/access-control/resources?type=&team_id=&q=`. Multi-select with `Checkbox` per row; selected
  ids render as removable chips/badges above the trigger. Show `label` + small muted `meta`.
- **Edit/initial labels:** on mount, if `value` holds real ids (not `*`), batch-resolve names via
  `?ids=` so chips show names, not UUIDs.
- **`template` notice:** when `resourceType === 'template'`, render the inline informational note and
  (since templates are unenforced) still allow All/specific selection — purely cosmetic grant.
- **States:** loading spinner in the list; empty state ("No [type] found"); fetch-error inline text.
- Resets selection sensibly when `resourceType` changes (handled by parent — see Phase 3).

**Verify (evidence):** component test (RTL/Mocha) — renders names from a mocked endpoint; toggling
All sets `['*']`; selecting two rows calls `onChange` with both ids; `?ids=` resolves chips.

**Checkpoint:** `/git-workflow-planning:checkpoint 2 resource picker component`

---

## Phase 3 — Wire picker into `PermissionTemplateForm`

**Modify** `components/access-control/permission-template-form.tsx`

- The per-permission card becomes a **rule**: `resource_type` + **targets** (`string[]`) +
  `permission_level` + `duration_days`. Introduce a local view-model so each card holds an array of
  target ids (or `['*']`) instead of a single `resource_id` string.
- Replace the `Resource ID` `<Input>` (lines ~237–245) with `<ResourcePicker>`, passing
  `resourceType`, `teamId` (form's `team_id`), `value`, `onChange`.
- Changing `resource_type` resets that card's targets (avoid cross-type id leakage).
- **Expand on submit:** map each rule → 1..N `TemplatePermission` entries:
  - `['*']` → single entry `{ resource_type, resource_id: '*', permission_level, duration_days }`.
  - `[id1, id2, ...]` → one entry per id, same level/duration.
- **Validation:** replace the "all permissions need resource_id" check with "each rule must have at
  least one target (specific id or All)". Block submit otherwise with the existing `Alert`.
- **Edit mode (initialData):** collapse incoming `template_permissions` back into rules by grouping
  entries sharing `{resource_type, permission_level, duration_days}` into one card with the union of
  their `resource_id`s (a `'*'` entry → All). Picker resolves names via `?ids=`.
- Keep file ≤ 350 LOC; if the collapse/expand helpers push it over, extract them to
  `components/access-control/permission-template-mapping.ts` (pure functions, unit-tested).

**Verify (evidence):** `npm run lint`; component test — multi-select rule expands to N stored
entries; All stores `'*'`; round-trip (expand → collapse) is stable for edit mode.

**Checkpoint:** `/git-workflow-planning:checkpoint 3 wire picker into template form`

---

## Phase 4 — Tests + manual e2e

- **SQL asserts:** extend `supabase/tests/grant_enforcement_assert.sql` (and run with the existing
  test harness): prove a `('mailing_list','*',team)` grant lets a member SELECT *all* team mailing
  lists; a specific grant only the one; expired/revoked excluded; wildcard respects `team_id`
  isolation (no cross-team leakage).
- **Mapping unit tests:** expand/collapse round-trip; `'*'` handling; multi-type cards.
- **Manual CDT e2e** (per project norm, owner-driven in the already-running browser): open
  Team Management → Create Permission Template → add a rule, confirm the picker lists real names,
  pick 2 lists + an "All Designs" rule, save; reopen to confirm names (not UUIDs) re-render; apply
  template to a member and confirm access is enforced for the specific lists and all designs.
- Update `docs/` roadmap entry if one tracks Team Management (Rule 7) before final checkpoint.

**Checkpoint:** `/git-workflow-planning:checkpoint 4 tests + manual e2e`
**Then:** `/git-workflow-planning:finish`

---

## Out of scope (backlog)
- **Custom user/team-owned templates + real template enforcement.** Requires adding ownership
  (`created_by` / `team_id`), a "save as template" flow, RLS, and UI. Separate brainstorm/feature.
  Until then `template` grants remain informational (Phase 2 notice covers the UX risk).

## Risks / notes
- Endpoint must map `type` → table via a server-side allowlist constant ONLY (never interpolate a
  client string into SQL / `.from()`), to avoid type-confusion / injection.
- `user_assets` label is `original_filename`, not `name` — already baked into the map.
- Picker only lists rows the admin can already see (team-admin RLS); the endpoint adds an explicit
  team-admin guard so it cannot be used to enumerate other teams' resources.
- Wildcard `'*'` is honored only by the 4 owned-resource RLS policies via `my_resource_permission`;
  `template` stays unenforced by design.
