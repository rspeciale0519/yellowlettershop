---
name: db-migration
description: Create and verify Yellow Letter Shop Supabase SQL migrations, RLS policies, assertions, and generated types.
disable-model-invocation: true
---

# Database Migration

Use this skill for requested schema, policy, grant, index, or database function changes.
Follow the repository's [instructions](../../../AGENTS.md) for database safety and approval boundaries.
A migration request does not authorize production access.

## Evidence and design

Read the relevant migrations, SQL assertions, and application consumers.
Use `types/supabase.ts` as generated reference material.
Verify its claims against migrations and the local schema when needed.

State the data risks and recovery path before making changes.
Preserve tenant isolation and compatibility with the deployed application.
Use staged additions and removals when a single deployment cannot remain compatible.
Do not edit an applied migration to change its historical meaning.

## Migration file

Check command support with the installed Supabase CLI's `--help`.
Create the file with `npx supabase migration new <name>`.
Confirm its timestamp sorts after the migrations it requires.

Write SQL in the generated file under `supabase/migrations/`.
Include the required indexes, grants, and RLS policies.
Enable RLS for tables in exposed schemas.
Match policies to actual ownership, team membership, and roles.
Check both existing rows and proposed row values for updates.
Review execution grants and authorization for privileged database functions.

Add relevant SQL assertions under `supabase/tests/`.
Test permitted access and denied access across users and teams.
Use disposable fixtures with cleanup or rollback.

## Local application and checks

Confirm the target is the local project defined in `supabase/config.toml`.
Inspect pending migrations before applying them.
Apply only authorized changes with `npx supabase migration up --local`.
This command applies all pending migrations, so review unrelated pending files first.
Do not reset a database or remove data without explicit approval.

Run each relevant assertion with:
`npx supabase db query --local -f supabase/tests/<file>.sql`

For schema changes, generate types with:
`npx supabase gen types --local --lang typescript --schema public`

Capture generated output before replacing `types/supabase.ts`.
Confirm command success and valid TypeScript output first.
Preserve any additional schemas required by existing consumers.
Never hand-edit the generated file.
Run the relevant application checks from `AGENTS.md`.

If local services are unavailable, retain the migration and report the unverified checks.
Do not switch to a hosted database as a fallback.

## Production and recovery

Hosted commands, `--linked`, and production migration actions require explicit approval.
Do not use `supabase db push` against production.
Production migrations use `scripts/apply-prod-migrations.mjs` through `.github/workflows/db-migrate-prod.yml`.
Merging migration files into `main` can trigger that workflow.

Describe recovery for the actual change.
Prefer a corrective migration when rollback would lose data.
Identify backup or restore requirements before any irreversible operation.
