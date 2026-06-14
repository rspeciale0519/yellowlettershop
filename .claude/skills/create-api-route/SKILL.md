---
name: create-api-route
description: Scaffold a new Next.js API route under app/api with the project's auth wrappers, Zod (or unknown-narrowing) validation, and Supabase data access following existing patterns.
disable-model-invocation: true
---

# Create API Route

Scaffold a new API route following the project's established patterns. The user provides the route path and HTTP methods needed.

## Usage

The user invokes this with: `/create-api-route <path> [methods]`

Examples:

- `/create-api-route campaigns` — Creates GET and POST handlers
- `/create-api-route campaigns/[id] GET PATCH DELETE` — Creates specific methods
- `/create-api-route admin/reports` — Creates an admin route gated by `withAdmin`

## Steps

### 1. Determine Route Type

Check if the path starts with `admin/`:

- **Admin route**: wrap with `withAdmin` from `@/lib/admin/require-admin`
- **User route**: wrap with `withAuth` from `@/lib/auth/middleware`

### 2. Examine Existing Patterns

Before writing any code, read 2-3 existing routes near the target path to match conventions:

```bash
# User routes
cat app/api/accuzip/search/route.ts
cat app/api/mailing-lists/route.ts

# Admin routes
cat app/api/admin/users/route.ts
```

### 3. Create the Route File

Create `app/api/<path>/route.ts`. Routes live in `app/api`, not `src/app/api`.

**User route pattern** (`withAuth` injects an auth context — destructure `userId`; the full shape is `{ user, userId }`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    // ... query scoped to userId
    return NextResponse.json({ data: [] });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
```

To restrict a user route by role, pass options: `withAuth(handler, { allowedRoles: ['admin'] })`.

**Admin route pattern** (`withAdmin` injects the resolved `AdminUser`; it returns 401/403 itself):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/admin/require-admin';
import type { AdminUser } from '@/lib/admin/types';

export const GET = withAdmin(async (req: NextRequest, admin: AdminUser) => {
  // admin.userId, admin.role, admin.email available
  return NextResponse.json({ data: [] });
});
```

### 4. Validate request bodies (POST/PATCH)

Parse the body as `unknown` inside a try/catch and reject malformed JSON with 400 before touching it. Then validate with either a Zod schema (preferred — ~45 routes already do) or explicit `unknown`-narrowing (see `app/api/accuzip/search/route.ts`):

```typescript
import { z } from 'zod';

const createResourceSchema = z.object({
  name: z.string().min(1).max(255),
  // ... fields
});

let body: unknown;
try {
  body = await req.json();
} catch {
  return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
}

const parsed = createResourceSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
}
```

### 5. Data access (Supabase, not Prisma)

This project has **no Prisma**. Use the Supabase clients:

- Server helpers under `@/lib/supabase/server-*` (e.g. `server-mailing-lists`)
- Service-role client `createServiceClient` from `@/utils/supabase/service` for trusted server work

For non-trivial logic, extract to a service under `lib/<resource>/` rather than fattening the route. Always scope queries to the caller (`userId` / their organization) so a request can't read another tenant's rows.

### 6. Verify

```bash
npm run typecheck:ui
npm run lint
```

## Key Rules

- Never use `any` — use `unknown` with type narrowing
- Always parse/validate request bodies at the boundary; reject bad JSON with 400
- Data access is Supabase (`@/lib/supabase/*`, `@/utils/supabase/*`) — there is no `@/lib/prisma`
- Keep route files **≤350 LOC** — extract to a `lib/<resource>/` service if needed
- Scope every query to the authenticated user/org to prevent cross-tenant (IDOR) reads
- Parse search params with explicit defaults, not implicit coercion (see `app/api/admin/users/route.ts`)
