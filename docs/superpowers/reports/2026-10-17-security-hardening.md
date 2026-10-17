# Security hardening verification — 2026-10-17

Branch: `feature/designer-flowing-content`. Scope: the owner's seven urgent security requirements.

- Next.js and eslint-config-next require 15.5.28 or later; the installed/locked Next.js is 15.5.28.
- Both payment intent HTTP endpoints are tested against forged amounts, currencies, metadata and nested record counts. They derive amount/count and quote/design revisions from the authenticated user's stored design, completed validation snapshot and server pricing. The legacy endpoint now requires orderState; amount-only requests fail closed.
- Image signing requires authenticated ownership for both metadata-backed IDs and storage-only IDs. Foreign paths, traversal and malformed/non-image paths fail before signing.
- Custom webhooks sign the exact `unix-seconds.raw-body` string using HMAC-SHA256. Senders supply `X-YLS-Timestamp`; receivers require it, reject tampering, malformed/future timestamps and ages over 300 seconds, and bind the event-type header to the signed envelope. Old body-only signatures are rejected. Consumers must update to this signing format. The receiver also awaits the async database client and reads the signed envelope's data.
- The new CSP builder validates protocol, DNS origin, local-development HTTP, credentials, path, query, fragments, whitespace and encoded directive delimiters. Middleware applies its policy to actual responses.
- Added the previously absent `20261017000000_lock_unprotected_tables.sql`. It enables RLS on public application tables; removes unsafe money/admin mutation policies and both table/column grants; preserves owner-only financial reads, public active-price reads, safe self-profile fields and service-role writes. Stored validation counts cannot be forged through direct JWT writes. Storage namespace restrictions prevent uploads/moves into another user's asset namespace.

## Evidence

- `npm test`: **525 passing, zero failing/skipped**, including eight local PostgreSQL/PGlite migration tests. The fixture uses actual profile, credit, pricing and audit DDL plus representative payment/validation/storage tables; it tests authenticated/anonymous/service-role behavior, inherited PUBLIC and legacy column grants, unsafe permissive policies, cross-user access and migration repeatability. This is not a replay of every historical hosted migration.
- `npm run typecheck:full`: exit 0.
- `npm run build`: exit 0 on Next.js 15.5.28. Build-only, nonfunctional Supabase/Stripe configuration was supplied to satisfy module initialization; no real credentials or external transactions were used. The existing Supabase Edge Runtime warning remains.
- Built production server: homepage 200 with expected content/CSP, anonymous asset signing 401 with no redirect, both anonymous intent endpoints 401.
- `npm audit --json`: **0 high, 0 critical**; 26 moderate and 2 low findings remain outside the requested severity gate.
- `git diff --check`: clean.

## Dependency remediation detail

Updated compatible dependencies/lock entries and Playwright MCP; constrained legacy brace-expansion, serialize-javascript and PostCSS to patched versions. No audit findings were suppressed.

The latest upstream `braces` release is still 3.0.3, affected by GHSA-vfj7-8cjw-p6xm. The exact override `npm:@dieub/braces-depth-guard@3.0.3-pn.3` pins a maintained derivative. Its complete runtime diff was reviewed against upstream 3.0.3 and the depth-guard work in micromatch/braces PR 72, commit `d0d575e55e74a4e0218e5248fafb79efc3e54ebb`. It bounds parse and recursive AST depth to 100 and guards malformed limit/parent-cycle cases. Regression tests exercise malicious braces/parentheses, direct AST compile/stringify/expand, normal expansion/ranges and micromatch compatibility. The actual Tailwind production build passes. Registry TLS and lockfile artifact integrity remain enabled; changing the package name alone is not treated as remediation. Replace the override when upstream publishes an equivalent reviewed fix.

## Deployment boundary

No migration was applied to the hosted database. Database restrictions take effect there only after a separate reviewed migration application. No live orders, payments, emails or mailing submissions occurred. Push targets only the existing feature branch; main/develop and production deployment are outside this task.
