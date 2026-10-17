# Security Hardening Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the seven security requirements in the owner's urgent request, then push the existing feature/PR branch.

**Architecture:** Reuse the authoritative saved-design/validated-recipient quote for both intent endpoints. Authenticate asset signing, share timestamp-bound webhook signing/verification, validate CSP origins, and deny client writes to server-authoritative money/admin data with PostgreSQL RLS and grants.

**Tech Stack:** Next.js 15, Node 24, TypeScript, Mocha, Supabase/PostgreSQL, Stripe.

**Spec:** Owner's seven numbered security requirements in this conversation.

## Global Constraints

- Next.js must be 15.5.28 or later; npm audit must report zero high/critical findings.
- Never trust browser amount, pricing, or recipient count when creating an intent.
- Asset URL signing requires an authenticated owner, including encoded storage IDs.
- Sign timestamps; reject missing/malformed/future timestamps and messages older than 300 seconds.
- Reject malformed Supabase origins before building CSP.
- Never apply any migration to the hosted database, submit live orders, or expose keys.
- Run the full suite, typecheck and production build before pushing the current branch.

## Review Focus

- Forged nested count/amount/metadata and alternate intent endpoint cannot bypass the stored quote.
- Encoded paths, traversal, public assets and missing auth cannot bypass ownership.
- Changing only the timestamp invalidates a signature; malformed values fail closed.
- CSP URL credentials, delimiter injection, non-HTTP schemes and paths cannot add sources.
- Self-profile role changes, permissive old policies and column grants cannot enable financial/admin writes.

### Task 1: Dependency security floor

- [ ] Add a regression asserting the manifest/lock and installed Next.js meet 15.5.28.
- [ ] Upgrade Next.js/config dependencies and fix audited high/critical transitive dependencies using supported versions/overrides.
- [ ] Run npm audit with all dependency classes, preserving the JSON result and exit status.

### Task 2: Authoritative payment intent and asset ownership

Files: `app/api/payments/{intent,create-payment-intent}/route.ts`, `lib/orders/server-quote.ts`, `app/assets/images/[assetId]/route.ts`, route test helpers and `tests/security/*`.

- [ ] Write and run endpoint regressions for forged amount/count/metadata, incomplete/unowned validation and designs, anonymous/non-owner asset requests and encoded path traversal.
- [ ] Route legacy intent requests through `loadOrderQuote`, preserving USD/manual capture and server-owned metadata.
- [ ] Authenticate image requests before storage/metadata reads and enforce ownership before signing.
- [ ] Rerun the affected tests.

### Task 3: Webhook and CSP hardening

Files: `lib/webhooks/security.ts`, `lib/supabase/webhooks.ts`, `app/api/webhooks/route.ts`, new `lib/security/csp.ts`, middleware/config and `tests/security/*`.

- [ ] Write and run timestamp tampering, stale/future/malformed time, bad signatures and malformed CSP-origin regressions.
- [ ] Share HMAC over `timestamp.payload` across sender and receiver, enforce the 300-second window, and reject legacy body-only signatures.
- [ ] Validate/normalize the Supabase origin and use the builder in actual response headers.
- [ ] Rerun affected tests and verify actual response headers.

### Task 4: Database privilege restrictions

Files: new `supabase/migrations/20261017000000_lock_unprotected_tables.sql`, embedded local PostgreSQL test fixtures and `tests/security/database-rls.test.ts`.

- [ ] Test real PostgreSQL role behavior before the migration: financial/admin mutations, cross-user access and self-elevation must be denied after migration.
- [ ] Enable RLS on public tables, replace unsafe financial/admin write policies/grants, retain safe owner/public reads and profile edits, preserve service-role operations.
- [ ] Verify existing table/column grants and policies cannot bypass restrictions; execute the migration twice locally for repeatability.

### Task 5: Completion

- [ ] Run full Mocha suite, TypeScript, npm audit and production build; resolve failures and record evidence.
- [ ] Review the complete diff for authorization and migration regression risks.
- [ ] Commit and push `feature/designer-flowing-content`; attach the existing PR if its URL can be retrieved.
- [ ] Report concrete changes, test count, and remaining limitations.
