---
name: create-api-route
description: Scaffold a new Next.js API route with auth middleware, Zod validation, and Prisma queries following existing project patterns.
disable-model-invocation: true
---

# Create API Route

Scaffold a new API route following the project's established patterns. The user provides the route path and HTTP methods needed.

## Usage

The user invokes this with: `/create-api-route <path> [methods]`

Examples:

- `/create-api-route webhooks` - Creates GET and POST handlers
- `/create-api-route webhooks/[id] GET PATCH DELETE` - Creates specific methods
- `/create-api-route admin/reports` - Creates an admin route with `requireAdmin()`

## Steps

### 1. Determine Route Type

Check if the path starts with `admin/`:

- **Admin route**: Use `requireAdmin()` from `@/lib/admin/middleware`
- **User route**: Use `getAuthContext()` from `@/lib/auth/middleware`

### 2. Examine Existing Patterns

Before writing any code, read 2-3 existing routes near the target path to match patterns:

```bash
# For user routes
cat src/app/api/contacts/route.ts
cat src/app/api/lists/route.ts

# For admin routes
cat src/app/api/admin/users/route.ts
cat src/app/api/admin/plans/route.ts
```

### 3. Create the Route File

Create `src/app/api/<path>/route.ts` following this structure:

**User route pattern:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!auth.organizationId) {
      return NextResponse.json(
        { error: "No organization associated with user" },
        { status: 403 }
      );
    }

    // TODO: Implement
    return NextResponse.json({ data: [] });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch resource" },
      { status: 500 }
    );
  }
}
```

**Admin route pattern:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/middleware";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    // TODO: Implement
    return NextResponse.json({ data: [] });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 4. Create Validation Schema (if POST/PATCH)

If the route accepts request bodies, create a Zod schema in the appropriate service's `validation.ts` file or a co-located file:

```typescript
import { z } from "zod";

export const createResourceSchema = z.object({
  name: z.string().min(1).max(255),
  // ... fields
});
```

### 5. Create Service Layer (if complex logic)

For routes with non-trivial business logic, create or extend a service file under `src/lib/<resource>/service.ts` or `src/services/`.

### 6. Verify

After creation, run:

```bash
npm run type-check
npm run lint
```

## Key Rules

- Never use `any` types - use `unknown` with type narrowing
- Always validate request bodies with Zod at API boundaries
- Use `prisma` from `@/lib/prisma` for database operations
- Keep route files under 450 lines - extract to service layer if needed
- Use `Promise.all()` for parallel independent queries (see admin/users pattern)
- Parse search params with explicit defaults, not implicit coercion
