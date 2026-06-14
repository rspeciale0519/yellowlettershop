---
name: db-migration
description: Author a Supabase SQL migration in supabase/migrations, with scoped RLS policies, then regenerate types and verify. For this project's Supabase/Postgres schema changes (there is no Prisma).
disable-model-invocation: true
---

# Database Migration

Create a SQL migration for the Supabase Postgres database. This project applies schema changes as **hand-written SQL files in `supabase/migrations/`** — there is no Prisma, no `schema.prisma`, and no `prisma migrate`.

## Usage

The user invokes this with: `/db-migration <description>`

Examples:

- `/db-migration add webhook_events table`
- `/db-migration add status column to campaigns`
- `/db-migration scope RLS on contacts to owner+team`

## Steps

### 1. Understand the current schema

The generated types are the fastest source of truth for existing tables/columns:

```bash
sed -n '1,80p' types/supabase.ts
```

Read 1-2 recent migrations to match style and RLS conventions:

```bash
ls supabase/migrations/ | tail -5
cat supabase/migrations/20260613010000_fix_rls_pii.sql
```

### 2. Create the migration file

Name it `supabase/migrations/<YYYYMMDDHHMMSS>_<snake_case_description>.sql` — a 14-digit UTC timestamp prefix that sorts after the latest existing file. Wrap the whole thing in a transaction and comment **why**, not just what (the existing migrations are heavily commented — match that):

```sql
-- Why this change is needed (one or two lines of intent).
begin;

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- ...
);

commit;
```

Conventions from existing migrations:

- Table/column names: `snake_case`; tables under `public.`
- Always include `id` (`uuid default gen_random_uuid()`) and `created_at timestamptz default now()` on new tables
- Add indexes for columns that will be filtered/joined frequently
- Use `if exists` / `if not exists` so re-runs are safe

### 3. RLS is mandatory for any table holding user or PII data

This is the project's sharpest hazard — a prior migration (`fix_rls_pii.sql`) existed specifically to remove over-broad `using(true)` policies that leaked homeowner PII to anonymous callers. So:

- `alter table public.<t> enable row level security;`
- Add **owner-scoped** and, where relevant, **team-scoped** policies. Never ship a `using (true)` SELECT on a table with user data.
- Scope by the authenticated user (`auth.uid()`) and/or team membership, mirroring existing policy names on sibling tables.

### 4. Apply the migration

Application targets the live Supabase project and in this repo is **owner/environment-gated** (the app's real DB ref is `lmtpfgfulkynrktdkgpu`; the locally-named dashboard project differs — confirm before applying). Options:

- **Supabase MCP**: `apply_migration` (and `list_migrations` to confirm what's already applied) — preferred for the remote project
- **Supabase CLI**: `supabase db push` against the linked project

If you cannot confirm the target/credentials, **stop and hand off** — leave the SQL file authored and unapplied rather than guessing the environment.

### 5. Regenerate types (if tables/columns changed)

Keep `types/supabase.ts` in sync so the app compiles against the new schema:

- Supabase MCP: `generate_typescript_types`, write the result to `types/supabase.ts`
- or CLI: `supabase gen types typescript --linked > types/supabase.ts`

### 6. Verify

```bash
npm run typecheck:ui
npm test
```

## Critical Rules

- Migrations are SQL files in `supabase/migrations/` — **not** Prisma; do not create `schema.prisma` or run `prisma migrate`
- Every table with user/PII data needs RLS enabled with owner/team-scoped policies — never `using (true)`
- **NEVER** drop or rename a column in production without a data-migration plan
- Wrap each migration in `begin; … commit;` and keep changes idempotent (`if [not] exists`)
- Confirm the apply target/credentials before applying; otherwise author-and-hand-off
- Regenerate `types/supabase.ts` after any schema shape change
