# Security release against main — 2026-10-17

Branch: `fix/security-release`, based on main `d14e3dcbc24d2c44439111e8d09751eaa3aba281`.
The designer work on `feature/designer-flowing-content` is separate. Existing
main artwork handling and price configuration are retained.

## Changes

- Next.js and eslint-config-next resolve to 15.5.28. Compatible dependency
  updates and overrides remove the high/critical audit findings. Node 24 is the
  declared runtime and CI target.
- Both payment-intent endpoints calculate their amount from server price
  configuration and the authenticated owner's completed validation records.
  Browser amounts, counts, currency and payment metadata cannot set the charge.
  Authorization and submission also verify the amount and a fingerprint of the
  artwork, recipients and options. Submission persists that recipient snapshot.
  Legacy artwork uses the renderer's existing letter fallback, preventing a
  cheaper postcard quote for a rendered letter.
- Image signing requires authentication, owned metadata and an owned storage
  path. The share service also rejects foreign paths and mismatched share
  creators before service-role signing.
- Custom webhooks sign the exact UTF-8 string `timestamp.rawBody` with
  HMAC-SHA256. `X-YLS-Timestamp` is Unix seconds; `X-YLS-Signature` is
  `sha256=<hex>`. Messages older than 300 seconds, future timestamps, legacy
  body-only signatures and event-type substitutions are rejected. The receiver
  creates its trusted database client only after signature verification.
- CSP construction rejects malformed Supabase origins, including delimiter
  injection, credentials and non-origin URLs. Stripe script/frame/API and the
  configured Supabase HTTPS/WebSocket origins remain allowed.
- `20261017000000_lock_unprotected_tables.sql` enables RLS on public application
  tables, removes legacy table/column mutation grants and permissive write
  policies from money/admin tables, and limits financial reads to the owner.
  Protected profile/team billing and role fields remain server-only; self
  profile preferences/business details and owner team-name changes still work.
  Asset metadata cannot reassign ownership or reference a foreign namespace.

## Validation

Run locally on this branch after the final application changes:

| Check | Result |
| --- | --- |
| `npm test` | 337 passing; includes 47 security tests |
| Local PostgreSQL RLS integration tests (PGlite) | 11 passing; migration applied twice to test repeatability |
| `npm run typecheck:full` | Passed |
| `npm run build` | Passed with Next.js 15.5.28 |
| `npm audit --json` | 0 critical, 0 high, 26 moderate, 2 low |
| Production-server HTTP smoke | 10 checks passed: home/CSP, authentication gates, fresh/stale/tampered webhook signatures and event binding |
| Independent code review | No remaining release-blocking findings; reviewer separately passed the 47 security tests |

`npm audit` still exits nonzero because of the moderate/low findings. The build
retains the existing Supabase Edge-runtime compatibility warning. Build and HTTP
checks used nonfunctional Supabase/Stripe placeholders and a local sample
webhook secret. Stripe calls in checkout tests were mocked. No live payment,
mailing order, hosted migration or production deployment was performed.

The exact `braces` override is
`npm:@dieub/braces-depth-guard@3.0.3-pn.3`, because upstream 3.0.3 has no patched
release for the reported depth-exhaustion advisory. Its runtime diff against
upstream and the depth-guard follow-ups were reviewed; it has no install
lifecycle scripts and the lockfile retains integrity verification. Regression
tests exercise the actual transitive dependency's parser, direct AST compile
path, depth bounds and ordinary pattern compatibility. This is a third-party
fork and should be replaced with an official fixed release when available.

## Rollout requirements and limits

1. Review this security branch independently of the designer branch. Confirm the
   deployment runtime is Node 24. No hosting settings were changed here.
2. Rehearse the migration on a disposable Supabase staging clone of the current
   production schema. The local tests use real PostgreSQL with representative
   tables, historical baseline DDL and deliberately unsafe legacy grants; they
   do not certify the complete hosted migration history or all existing data.
3. Coordinate custom webhook consumers to verify the timestamp-prefixed
   signature and send the same envelope/header format. The legacy format is
   intentionally rejected, so an uncoordinated cutover will reject deliveries.
4. Obtain separate authorization for any hosted migration or production
   release. Coordinate application and RLS rollout: validated recipient records
   are authoritative only when the database also prevents client forgery.
5. Smoke-test authenticated checkout with Stripe test mode, profile/team edits,
   assets/shares and webhooks in staging before a live release. No real Stripe
   or authenticated browser end-to-end checkout was run in this environment.

The historic `assets` bucket is public and avatars depend on its public URLs.
This release secures signed-URL issuance and foreign-path metadata attacks; it
does not make existing public storage bytes private. Making that bucket private
requires a separate compatibility change for avatars and other direct URLs.

The hosted database is untouched. Lower-severity dependency findings, the
public-bucket design and the coordinated webhook cutover remain explicit
follow-up items.
