---
name: db-migration
description: Create and apply Prisma schema changes with proper pooler configuration, client generation, and verification for the WSL2/Supabase environment.
disable-model-invocation: true
---

# Database Migration

Safely modify the Prisma schema and apply changes to the Supabase database. Handles the specific pooler configuration required by this project's WSL2 environment.

## Usage

The user invokes this with: `/db-migration <description>`

Examples:

- `/db-migration add webhook events table`
- `/db-migration add status field to campaigns`
- `/db-migration add index on contacts email`

## Steps

### 1. Read Current Schema

```bash
cat prisma/schema.prisma
```

Understand existing models, relations, and naming conventions before making changes.

### 2. Verify Database Connectivity

Confirm pooler connection is working:

```bash
npx prisma db pull --print 2>&1 | head -5
```

If this fails with ENETUNREACH, the `.env.local` is using direct connection instead of pooler. Check CLAUDE.md Rule 8.

### 3. Make Schema Changes

Edit `prisma/schema.prisma` with the requested changes. Follow existing conventions:

- Model names: PascalCase (e.g., `WebhookEvent`)
- Field names: camelCase (e.g., `createdAt`)
- Always include `id`, `createdAt`, `updatedAt` on new models
- Use `@default(uuid())` for id fields
- Use `@relation` with explicit foreign key fields
- Add `@@index` for fields that will be queried frequently

### 4. Generate Client

```bash
npx prisma generate
```

This updates the Prisma client types. Must succeed before proceeding.

### 5. Apply to Database

For development (creates migration file):

```bash
npx prisma migrate dev --name <descriptive-name>
```

If migrate dev hangs or fails, fall back to:

```bash
npx prisma db push
```

**Important**: `db push` does NOT create migration files. Use `migrate dev` when possible for production-track changes.

### 6. Verify

Run these checks after applying:

```bash
# Type-check passes with new schema
npm run type-check

# Client is correctly generated
npx prisma generate --no-hints
```

### 7. Update Seed Script (if new model)

If a new model was added, update `prisma/seed.ts` or `tests/e2e/fixtures/seed-e2e.ts` to include seed data for the new model. Remember: this project uses JWT-based auth without persistent token storage (no `sessions`, `refresh_tokens`, or `verification_tokens` tables).

## Critical Rules

- **NEVER** use direct database host (`db.xrixrioaarbnpzjqzfsl.supabase.co`) - always use pooler
- **NEVER** remove or rename columns in production without a migration plan
- Always back up data considerations before destructive schema changes
- Connection config lives in `prisma.config.ts`, NOT in `schema.prisma`
- Transaction pooler (port 6543) for app queries, session pooler (port 5432) for migrations
