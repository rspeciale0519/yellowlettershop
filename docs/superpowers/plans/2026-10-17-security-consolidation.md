# Security consolidation implementation plan

> **For agentic workers:** Use superpowers:executing-plans task by task. The user approved the reconciliation recommendation on October 17. Keep work local to the existing isolated checkout and update PR #25 after verification.

**Goal:** Consolidate PR #25 and 9928a56 without losing either set of security protections or introducing designer features.

**Architecture:** Keep PR #25's existing checkout, image resolution, PDF fetching, CSP and webhook modules. Extend these modules with 9928a56's validated recipient snapshot, quote binding, ownership checks and financial RLS. Use one implementation of each boundary.

**Tech stack:** Next.js 15.5.28+, TypeScript, Stripe, Supabase, Mocha, PGlite, Node 24.

**Spec:** Approved reconciliation review and recommendation in this conversation: actual server recipients/prices; strict owner image signing; owner-aware PDF downloads; timestamp-bound custom webhooks; strict CSP origin validation; review-only RLS; no hosted changes, merges, deployment, live mailing/payment requests or credential rotation.

## Global constraints

- Preserve PR #25's auth, rate-limit, SSRF, redirect, Mailgun replay and SVG fixes.
- Preserve all designer feature branches and keep designer feature commits out.
- Keep the legacy payment endpoint disabled; it must never accept browser amounts.
- Audit must report 0 high/critical findings. Full tests, typecheck and build must pass.
- The public assets bucket remains public pending separate owner approval and legacy URL migration.
- Do not apply either migration to hosted databases. Keep the original migration version and add a uniquely versioned forward hardening migration so either existing history can advance safely.
- New/modified security modules and tests stay modular; newly created source files are TypeScript and at most 350 lines.

## Review focus

- Changed recipients/artwork with the same total must invalidate authorization.
- Forged owned metadata must never allow signing, downloading, renaming or deleting a foreign object.
- Both historical owner storage namespaces must work without server-side cookie forwarding.
- Existing explicit share tokens must work while public image metadata cannot bypass strict image ownership.
- A recorded older migration must not cause hardening to be silently skipped.

## Tasks

### 1. Checkout reconciliation

Files: `lib/orders/{validation-job,trusted-checkout,mailing-options}.ts`, `lib/payments/intent-metadata.ts`, payment intent/authorize and order submit routes; existing and new checkout tests.

- [x] Port negative route tests and observe the missing fingerprint/card/snapshot protections fail.
- [x] Extend `ValidationJobRow` with `validated_records`; return actual validated recipients from the owned completed job and reject inconsistent stored counts or ambiguous references.
- [x] Extend existing `evaluateTrustedCheckout`/`loadTrustedCheckout` with `amountCents`, `snapshot`, `pricing` and `quoteRevision`; check artwork/mailing format consistency and use the existing renderer's letter fallback.
- [x] Add `quote_revision` to server Stripe metadata and compare exact owner/currency/manual capture/amount/revision before card actions and submit.
- [x] Store only the canonical recipient/price snapshot and retain PR #25's rate limit and metadata updates.
- [x] Run checkout tests; commit the coherent change after verification.

### 2. Asset and renderer reconciliation

Files: existing image access/resolver and PDF fetch modules, all asset signing/mutation entry points, share service; asset/renderer regression tests.

- [x] Add foreign-path signing and real PDF embedding negative/positive controls; observe the access gaps fail.
- [x] Centralize namespace validation in `lib/assets/ownership.ts`; support `{owner}/...` and `assets/{owner}/...`, reject traversal/encoding/control characters.
- [x] Keep `/assets/images` strictly authenticated and owner-bound. Use PR #25's in-process PDF download with authenticated owner context and validate metadata before privileged storage access.
- [x] Guard alternate signers/list/download/rename/delete paths and share creator/path; retain SVG attachment behavior.
- [x] Run asset and PDF tests including valid ownership, foreign metadata, traversal, namespaces and valid shares.

### 3. CSP, webhook and dependency reconciliation

Files: existing CSP and webhook-crypto modules, webhook sender/receiver, manifests/lockfile/CI; security tests.

- [x] Add negative malformed-origin, future/stale/tampered timestamp and signed-event-header tests.
- [x] Keep one strict CSP builder with Stripe/font/worker compatibility and one timestamp-bound HMAC implementation; preserve safe outbound fetch and Mailgun protocol.
- [x] Bind the receiver's event type/envelope and create the trusted client only after verification; report remaining idempotency/integration limits explicitly.
- [x] Preserve patched lockfile/overrides from 9928a56, keep patched MCP in development dependencies, pin Node 24 and install with integrity/TLS verification intact.
- [x] Run targeted security tests and the audit gate.

### 4. Forward RLS hardening

Files: new uniquely versioned hardening migration and local PostgreSQL fixtures/tests.

- [x] Keep PR #25's original six-table migration unchanged; add 9928a56's reviewed hardening as a new forward migration version.
- [x] Verify fresh and prior-migration histories, repeatability, financial/validation forgery denial, safe profile/team edits, service-role writes and asset namespaces locally.
- [x] Prepare read-only hosted preflight and rollout/rollback notes; do not run hosted SQL or change bucket security.

### 5. Final verification and existing PR update

- [x] Run full suite, typecheck, production build, audit and meaningful local HTTP checks with sample data/nonfunctional placeholders.
- [x] Obtain independent security review, resolve findings and rerun affected checks.
- [x] Update release documentation with actual test counts, known public URL dependencies, unavailable hosted/external verification and exact future approvals.
- [x] Prepare the verified fast-forward update to PR #25's unchanged source branch. Record the push and best-effort attachment result in the final handoff. Do not merge or deploy.
