---
name: create-api-route
description: Create Yellow Letter Shop API routes with existing auth wrappers, Zod validation, and Supabase data access.
disable-model-invocation: true
---

# Create API Route

Use this skill when the user requests a route under `app/api/`.
Implement the requested methods and behavior.
Follow the repository's [instructions](../../../AGENTS.md) for approvals and required checks.

## Route and authentication

Inspect the nearest relevant route and its callers.
Use `app/api/<path>/route.ts`, with services under `lib/<feature>/` when needed.

- User routes use `withAuth` from `@/lib/auth/middleware`.
- Its handler receives the request, `{ user, userId }`, and the route context.
- Platform admin routes use `withAdmin` from `@/lib/admin/require-admin`.
- Use `withSuperAdmin` when the operation requires that role.
- Dynamic admin routes can call `requireAdmin(request)` directly.
- Return its result immediately when it is an instance of `NextResponse`.
- Await dynamic `params` as required by the installed Next.js version.
- Public routes and webhooks need their own access or signature checks.

Authentication does not establish resource ownership or team authority.
Check the caller's access to the requested resource before data access.
Do not infer authorization from the route path alone.

## Request and data handling

Validate changed request contracts with Zod, including relevant path and query values.
Return 400 for malformed JSON and invalid input.
Preserve existing response contracts unless the requested change requires otherwise.

Use existing Supabase services where they fit the request.
For cookie sessions, `await createClient()` from `@/utils/supabase/server` carries the session for RLS.
Do not assume that a cookie client carries a bearer token.
Check the authentication modes supported by the route.

The client from `@/utils/supabase/service` bypasses RLS.
Use it only for justified server operations with explicit authorization and resource scope.
Never accept an unchecked user or team identifier as authority.
Check returned Supabase errors before returning success.
Return stable errors without provider details, credentials, or personal data.

## Verification

Use Mocha tests under the matching `tests/<area>/` directory for meaningful route or service behavior.
Cover denied access, invalid input, missing resources, and provider failures when relevant.
Follow the application checks in `AGENTS.md`, including `npm run typecheck:full`.
Do not return a placeholder success response for unfinished behavior.
