# PR #25 security consolidation — October 17, 2026

The approved code reconciliation extends existing PR #25. It does not authorize
merge, deployment, hosted SQL/storage changes, credential rotation or vendor
orders. Designer feature work remains separate.

## Relationship to existing fixes

| Reference before consolidation | Commit |
| --- | --- |
| main | `d14e3dcbc24d2c44439111e8d09751eaa3aba281` |
| PR #25 / `cursor/security-scan-2026-10-17-1cd0` | `ce4d55ed1a8190900bdb8f53ca16205ee7fe846f` |
| `fix/security-release` | `9928a563ffa3d29cfab410facd849e574fae2bed` |
| `feature/designer-flowing-content` | `585c304abe24a8d0d30a469ad94eb8a20ba68f3f` |

Neither security branch contained the other; both started from the listed main.
Both already resolved Next.js to 15.5.28 and used timestamp-bound custom HMAC.
PR #25 already had authenticated vendor APIs, rate limiting, pinned outbound
SSRF protection, safe redirects, Mailgun freshness checks and owner-aware PDF
image loading. Those implementations are retained.

The consolidation uses PR #25 as its parent and ports the additional protections
from 9928a56 into its existing checkout, asset, CSP and webhook modules. It does
not add a second quote/CSP/webhook architecture or designer feature commits.
The old standalone branches are retained for history, not a second merge.

## Resulting behavior

- Checkout derives actual deliverable recipients and counts from the owner's
  completed validation job, rejects malformed/inconsistent records and ambiguous
  job IDs, and uses current server prices. Browser amount/count fields do not
  control payment creation. The legacy intent endpoint remains disabled.
- Authorization and submission verify the Stripe intent's owner, exact cents,
  USD currency, manual capture and a hash of the canonical quote, recipients and
  artwork. Checks happen before card attachment/confirmation. Submission saves
  the trusted snapshot rather than browser recipient arrays. Pricing display
  still works before artwork selection and below Stripe's 50-cent minimum;
  payment creation enforces artwork and Stripe's minimum.
- Image signing requires login, metadata ownership and a valid owner namespace.
  Alternate signing/list/download/rename/delete paths also reject forged foreign
  paths, even when the metadata row belongs to the caller. Both historical
  `{owner}/...` and `assets/{owner}/...` paths work. Public metadata does not grant
  another customer access through the authenticated image route.
- PDFs reuse PR #25's in-process owner-aware image fetch. Private design previews
  return expiring signed URLs. Explicit share tokens still validate creator,
  asset ownership, path and expiry. HTML, SVG and other active share formats
  download as octet-stream attachments; only a small MIME allowlist is inline.
  Untrusted filenames cannot inject response headers.
- CSP rejects malformed Supabase origins instead of silently dropping them.
  Exact Stripe/Supabase origins, fonts, workers and private preview frames remain
  supported. Custom signatures cover the exact `timestamp.rawBody`, reject
  missing/future/malformed/stale timestamps and bind the event header to the
  signed envelope. Sender and receiver use the same crypto module.
- Next.js remains 15.5.28. Patched lockfile/overrides remove high/critical audit
  findings; patched Playwright MCP stays dev-only. Runtime/CI target Node 24.

## Validation

- `npm ci --no-audit --no-fund`: passed with lockfile integrity and TLS checks.
- `npm test`: **436 passing**, including checkout and cross-customer negative
  tests, real PDF image embedding, alternate asset endpoints, shares and CSP/HMAC.
- Twelve local PostgreSQL/PGlite tests cover financial/admin RLS, old column
  grants, fake validation/payment rows, self-elevation, safe profile/team edits,
  service-role writes, asset namespaces, repeatability and PR #25 → forward SQL.
- `npm run typecheck:full`: passed. Next's build skips its internal type/lint
  checks, so this separate full typecheck is the authoritative type gate.
- `npm run build`: passed on Next.js 15.5.28 with nonfunctional placeholder keys.
- Fourteen local production HTTP checks passed: homepage/CSP, anonymous image,
  payment, asset and preview/proof access denied, a fresh signed sample webhook
  accepted, and stale/timestamp-tampered/body-only/event-header attacks rejected.
- `npm audit --omit=dev`: **0 critical, 0 high, 3 moderate**. Lower severity
  findings remain. The braces override now uses an in-repo copy of official
  braces 3.0.3 with a local depth bound (`vendor/braces`).
- Independent review found and resolved the share MIME issue and a pricing
  display minimum regression; final re-review passed 28 focused tests and
  direct route probes with no remaining blockers in that review.

Checkout/Stripe/storage boundaries use mocks; PostgreSQL fixtures are
representative, not a replay of the complete hosted schema or membership RPCs.
No authenticated hosted/browser/Stripe end-to-end payment was performed. No
real mailing, payment, email, external callback or credential test was sent.
GitHub's API is unavailable here, so current remote reviews/CI and deployment
status are not certified by this report.

## RLS proposal and version order

The original PR #25 migration is byte-unchanged:

`20261017000000_lock_unprotected_tables.sql`

SHA-256: `8470d9a1103d20cbebf3f6f6c3564a12cb6053453ca6d80fb3275a99d4b52414`

The broader SQL previously proposed at that same version in 9928a56 now has a
unique forward version:

`20261017010000_harden_financial_and_asset_access.sql`

SHA-256: `9ecb19109ef489ebbf5bbfdebc202ebd99641cbcffec7cb81d61e1afebc05eb0`

The forward SQL enables RLS on public application tables, revokes browser table
AND column writes on money/admin/validation tables, removes permissive mutation
policies, scopes financial reads and keeps service-role writes. Profile role,
credits, billing and team membership stay protected; safe self-profile and team
name edits remain possible. Asset identity/path and storage namespace guards
are included. **It does not make the assets bucket private. Neither migration
was applied to a hosted database.**

If the original version is absent, apply the original then the forward version
through the normal approved migration process. If it is recorded, inspect its
actual statements/checksum first; do not overwrite history and assume a rerun.
The forward SQL is locally repeatable, including after PR #25's original SQL.

The review-only read queries in `2026-10-17-security-preflight-readonly.sql`
collect prerequisite metadata/counts without secret values or customer URLs.
Review actual table/column grants, RLS policies, function owners/EXECUTE grants,
SECURITY DEFINER entry points and full migration history before approving SQL.
Default-deny tables and removed legacy direct-client team writes can affect
existing screens. Rehearse normal customer, other customer, team owner/admin and
service roles on a full schema copy, including membership RPCs, profile edits,
catalog reads, proof annotations and explicit shares.

## Still-public assets and URLs affected by a future privacy change

The checked-in bucket configuration remains `public=true` with public SELECT.
Anyone who knows an existing public object URL may still fetch its bytes. Route
isolation is verified; complete customer-file confidentiality is not established
while public storage remains. Existing downloads/caches cannot be made unseen.

| Existing producer / stored URL shape | What a private-bucket change would break |
| --- | --- |
| `components/profile/personal-info-tab.tsx`: public `assets/{userId}/avatar_*.png` URLs stored in `avatar_url` | Existing profile/header avatars |
| `lib/assets/asset-service.ts`: `user_assets.file_url` under `/storage/v1/object/public/assets/assets/{userId}/...` | Media thumbnails, detail modals and saved design sources |
| Historical `file_url` values under `/storage/v1/object/public/assets/{userId}/...` | Older assets and every persisted consumer of those URLs |
| `saved_designs.design_data`, `orders.metadata.order_state`, Auth user metadata | Any embedded old public URLs; new uploads alone do not repair them |
| `/assets/images/{id or storage--encodedPath}` | Anonymous/other-customer use is now denied intentionally; owner-aware rendering is required |
| Proper `/storage/v1/object/sign/assets/{path}?token=...` URLs | Work only until expiry; do not persist them as permanent replacements |
| `/api/share/{token}` | Intentional token shares remain available through validated service-side streaming |

This identifies exact code paths and URL patterns. Hosted rows were not
enumerated, so no complete list of affected customer URLs is claimed. Before a
separate privacy change, inventory counts and references internally; decide
which avatars/content are intentionally public, migrate consumers and stored
references, test old designs/orders/shares, then approve the exact bucket and
policy change. Keep proof/design-preview buckets separate.

## External webhook compatibility

The owner knows of AccuZip and MelissaData, with no other connected apps known.
Their repository integrations are outbound request/response APIs, not custom
`/api/webhooks` senders/receivers. No vendor account setting was inspected.

Stripe uses its SDK signature protocol, Mailgun uses its timestamp/token
protocol, and the print vendor uses its separate callback token. None requires YLS
custom headers. Their deployed settings were not inspected.

The YLS custom sender and receiver pass local raw-body/signature compatibility
tests. Custom callers must send `X-YLS-Timestamp` in integer Unix seconds,
`X-YLS-Signature: sha256=<HMAC-SHA256(secret, timestamp + '.' + rawBody)>`, and
`X-YLS-Event-Type` matching the signed JSON envelope's `type`; payload is in
`data`. Timestamps must be current, no more than 300 seconds old and not future.

**Every external caller is not verified.** Hosted `public.webhooks` registrations,
deployed app settings and recent ingress logs are unavailable here. Inspect IDs,
owners, event types, active flags and secret-presence only; never export secrets,
callback URLs with tokens, raw payloads or signed headers. For any actual custom
integration, its owner must prove sender and receiver revisions support this
format using fresh/stale/tampered sample deliveries. If inventory shows none,
record the format as unused externally rather than externally certified.

There is no persistent custom event-ID deduplication inside the five-minute
window. Some custom business handlers also acknowledge unchecked database error
fields. Any active money-affecting custom integration needs a separate
idempotency/error-handling review before it is enabled or released.

## Migration and release sequence — not executed

1. Finish security-only PR #25 review/CI. Confirm the actually deployed revision
   and Node runtime; branch pointers and old STATE notes are not deployment proof.
2. Obtain hosted read-only preflight, URL counts and webhook inventory. Capture
   a backup and exact prior ACL/policy/trigger/function definitions.
3. Rehearse the exact SQL/app on a disposable full schema copy or an explicitly
   approved staging environment. Run cross-customer negative tests and normal
   checkout/proof/profile/team/share flows, plus Stripe test mode without a live
   charge or mailing. Resolve compatibility issues before production approval.
4. In the separately approved window, hold checkout and affected custom
   deliveries, apply approved RLS first, then deploy the compatible app. Keep
   validated jobs immutable; the server quote depends on that database boundary.
5. Coordinate any actual custom sender/receiver cutover and queued events while
   paused. Verify the fresh/stale/tampered format before resuming deliveries.
6. Handle public assets only as a separate approved consumer/data/storage
   migration. This PR does not implicitly authorize privacy or bucket changes.

## Rollback and exact approvals still required

No down migration is reviewed/tested. A failure before SQL COMMIT rolls back the
transaction; after COMMIT, ROLLBACK cannot restore dropped policies/grants.
Prefer a reviewed forward correction retaining RLS and financial/validation
immutability. Restoring captured ACLs or a backup needs separate approval and
must reconcile subsequent orders/payments; a DB restore does not undo Stripe
charges or vendor dispatches.

Application rollback must use an identified compatible build retaining Next
15.5.28+ and protected boundaries. Reverting blindly to old main can reopen the
issues. Keep checkout/deliveries held if no safe rollback build exists. Webhook
rollback requires both sides/queues coordinated without accepting stale or
body-only signatures. Storage rollback must not silently republish files.

| Action needing approval | Exact owner approval must identify |
| --- | --- |
| PR merge | PR #25 final commit SHA, security scope, required reviewers and passing remote CI |
| Hosted SQL | Target project/environment, forward version/checksum above and actual prior history, staging/preflight evidence, backup, window, named executor and corrective rollback scope |
| Application deployment | Exact reviewed app SHA, Node 24/runtime changes, checkout/webhook hold window, sample smoke plan, compatible rollback build and resume criteria |
| Storage/privacy | Exact bucket/policies, intended public/private objects, avatar/share behavior, stored URL migration, caches and access-restoration limits |
| External custom cutover, if any | Named app and responsible owner, tested sender/receiver revisions, pause/resume and queued-event handling |
| Credential rotation, only if later needed | Exact credential names/systems, dependent apps and secure update/revocation sequence; none is required or authorized by this work |

Read-only inspection/local testing are already authorized. Missing hosted access
and external evidence are verification gaps, not a reason to request the same
permission again. No merge, deploy, hosted mutation or key rotation occurred.
