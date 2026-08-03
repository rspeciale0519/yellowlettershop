# Archived debug endpoints — 2026-08-03

Four development/debug routes that shipped to production in the 2026-08-02
release (`main` @ `1cbc0ee`). Removed from the app and archived here per Rule 1
(moved, never deleted). Nothing in the codebase referenced any of them — the
only match for their names was a file's own header comment.

**All four were verified live against `https://app.yellowlettershop.com`
before removal**, so this was not a theoretical cleanup.

| Path | Prod status when checked | Severity |
|---|---|---|
| `/api/test-db-verification` | **HTTP 200** | **High** — see below |
| `/api/test-db` | **HTTP 200** | Low |
| `/api/test-auth-state` | HTTP 403 | None — correctly gated |
| `/test-types` | **HTTP 200** | Low |

## Why `test-db-verification` mattered

`api-test-db-verification/route.ts` was the real problem, and it is worth being
precise about why:

- It built a Supabase client with **`SUPABASE_SERVICE_ROLE_KEY`**, which
  bypasses RLS entirely.
- It had **no authentication of any kind** — a bare exported `GET` with no
  `withAuth`, no `withAdmin`, and no `NODE_ENV` guard.
- It therefore executed in production for anonymous callers. Confirmed:
  `{"success": false, "successRate": 46, "summary": {"total": 24, "passed": 11,
  "failed": 13}}`, having probed 20 named tables.

What it disclosed was reconnaissance rather than customer data — it reported
pass/fail per table, not row contents — but that still tells an anonymous
caller which tables exist, which are reachable through the service role, the
schema-version history, and custom function counts. It also confirms the
service-role key is live and functional.

It additionally carried a **hard-coded service-role JWT** as a fallback on line
5. That specific token is the well-known Supabase *local demo* key (issuer
`supabase-demo`), publicly documented and shipped in every Supabase local
install — so it is **not** a leak of a real credential. It should still never
have been committed, because it makes the endpoint silently fall back to a
working service-role client instead of failing closed.

`test-auth-state` was the well-behaved one: it checks
`process.env.NODE_ENV !== 'development'` and returns 403, which production
confirmed. It is archived for consistency, not because it was exposed.

## Restoring

These were genuinely useful during the local-Supabase retrofit. If any is
wanted again, restore it **behind `withAdmin`** (`lib/admin/require-admin.ts`),
drop the hard-coded key fallback so a missing env var fails closed, and keep it
out of production entirely — the `NODE_ENV` guard in `test-auth-state` is the
pattern to copy.

## Provenance

Flagged as a hygiene risk in `dev-docs/implementation-status.md` §7 across
multiple audits (2026-06-12, 2026-06-14, 2026-07-31) without being acted on.
The 2026-08-02 release changed the calculus by putting them on a public domain
for the first time.
