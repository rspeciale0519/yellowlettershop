# PR #25 release preflight — October 17, 2026

**Recommendation: keep production rollout on hold pending hosted evidence and
legacy share-link decisions.** The local release-gate corrections are prepared
for the existing PR. No merge, deployment command, hosted SQL/storage change,
credential rotation, payment or mailing request was performed in this review.

## Current revision and preserved work

GitHub API access is now working. PR #25 is OPEN/DRAFT against main, with no
submitted reviews. Its source advanced from our `6ae97cb` consolidation to
`42343fb8ff193361d56194d5ed7f4585de939f62` through another review session.
The PR subsequently advanced through `b6ad537` (built-in UUID CSPRNG) to
`42c8e79` (PUBLIC/anonymous team-RPC revocation and related auth fixes). This
preflight reuses those fixes and preserves payment-intent reuse
protection, team-write RPCs, hashed share tokens and upload checks.
Main remains `d14e3dc`; designer remains `585c304`; standalone security remains
`9928a56`. No designer feature changes are included.

At `42343fb`, Ubuntu CI passed and Windows CI failed in the test step. The full
audit had **40 high** findings rooted in the identity of the vendored, locally
patched braces dependency. CodeRabbit's success status explicitly means review
was skipped because the PR is a draft; it is not a review approval. GitHub's
existing Vercel integration automatically starts preview builds on branch
updates. The owner explicitly approved the PR push and its automatic preview
only; production releases and hosted changes remain blocked. The previous head
`42c8e79` had green CI/preview, but native DB tests could skip on missing tools.
The reconciled suite requires native PostgreSQL and runs those checks.

## Corrections prepared after that review

- Native PostgreSQL discovery supports an explicit `PG_BIN`, `pg_config`, Linux
  installations and Windows Program Files. The replay test no longer assumes
  `/usr/lib/postgresql/16/bin`; startup uses loopback and portable locale/socket
  options. No test was skipped to make the suite pass.
- The vendored depth-guard implementation stays intact and is explicitly named
  private fork `@yls/braces-depth-guard@3.0.3-yls.1`. It is not represented as
  unmodified upstream `braces@3.0.3`. README documents the upstream advisory and
  that npm audit does not inspect private fork source. Real transitive-parser,
  AST-depth and benign-pattern tests remain necessary alongside registry audit.
- New forward migration `20261017120300_secure_share_tokens.sql` replays the
  **same built-in CSPRNG implementation** already fixed by `17414f3` (two
  `pg_catalog.gen_random_uuid()` values). It adds no alternative generator or
  pgcrypto dependency. The forward replay is necessary if an older, weak
  `120200` was already recorded: changing that version's file does not rerun it.
  No existing migration file is changed by this follow-up.
- The same forward migration revokes browser share-link mutations at both table
  and column levels, retains owner-only reads and service-role writes. This
  closes direct inserts/expiry changes that bypassed the authenticated API.
- Share resolution requires valid creation/expiry dates and an expiry within
  30 days of creation. Missing, future-created, expired and excessive-lifetime
  rows are denied. This prevents long-lived rows becoming usable during their
  final 30 days.

## Evidence

- Clean `npm ci` completed with TLS and checksum verification intact.
- **441 tests passed**, including full replay of all **44 migrations** on a
  disposable native PostgreSQL 17 server, financial RLS, server checkout pricing,
  cross-customer assets, payment reuse and team RPC tests.
- Negative tests reproduced direct-client expiry bypass and the lifetime issue,
  then passed after correction. Existing tests from `17414f3` cover secure token
  generation with either pgcrypto layout; a new test covers upgrading an already
  present weak function through the forward version.
- `npm run typecheck:full` and Next.js **15.5.28** production build passed.
- Full audit: **0 critical, 0 high, 26 moderate, 2 low**.
  `npm audit` reports lower-severity findings; the required high/critical gate is
  `npm audit --audit-level=high`. No audit suppression or registry/TLS bypass is
  used. The private fork still requires the source review described above.
- Independent reviewer confirmed the corrected code and passed **17 focused
  tests**. The review-only SQL preflight was executed successfully against the
  disposable full schema, with a local migration-history fixture.
- All **14 local production HTTP checks passed** using placeholders and
  synthetic non-money events. No hosted credentials were used.

Windows execution cannot be reproduced on this Linux machine. The corrected
revision needs fresh Ubuntu and Windows CI results on GitHub before merge.
The full local PostgreSQL replay is not a copy of the hosted database and does
not establish hosted grants, migration history, row contents or backend E2E.

## Required hosted evidence and legacy URL impact

This environment has no Supabase app, DB or management credentials. Do not add a
production service-role key merely to run the application tests. The prepared
read-only file is:

`docs/superpowers/reports/2026-10-17-security-preflight-readonly.sql`

It uses a read-only transaction and timeout, and returns schema/settings/counts
rather than customer addresses, tokens, key values or signed/public asset URLs.
The owner can run it in the YLS Supabase SQL Editor and return those results.
No approval to mutate the database is needed or implied by that inspection.

Resolve these prerequisites before approving production SQL/app deployment:

1. Actual migration versions/statements, RLS, table/column grants and privileged
   function definitions/EXECUTE privileges. Rehearse the exact hosted schema and
   customer/other-customer/team/service roles in an approved staging copy.
   Versions `120100` and `120200` had different SQL during review: if an older
   body is already recorded, prepare a unique forward correction rather than
   overwriting history. In particular, older team RPCs need the latest PUBLIC/
   anonymous revocations and removal of the email-lookup function.
2. Duplicate nonempty order PaymentIntent IDs: the uniqueness migration refuses
   duplicates rather than deleting orders. Review legitimate orders/payments
   and approve a correction before attempting the index.
3. Actual share-token function and any old version already recorded. The final
   generator uses core PostgreSQL randomness and requires no pgcrypto extension.
4. **Existing share-token provenance.** Earlier rows stored raw bearer tokens;
   the newer app always looks up their SHA-256 digest. Those old `/share/{token}`
   and `/api/share/{token}` URLs stop resolving without a conversion. Raw tokens
   and hashes can both be 64-hex strings, so length/shape cannot distinguish them.
   Confirm actual deployed revisions and creation history, and compare known
   links privately if necessary. Return counts only. A proven all-raw population
   can be hashed once transactionally; mixed/unknown rows need an explicit format
   marker/operator mapping. Do not blindly double-hash or enable a raw-token
   fallback that would let a stored digest act as a bearer token.
5. **Existing share expiry policy.** Missing/invalid dates or lifetimes over
   30 days are now rejected. Count them and obtain an explicit decision about
   conversion/expiry/reissue. Do not silently renew old links or reset their
   creation date. No legacy-token or expiry backfill is included/applied here.
6. Public assets remain public. The prior consolidation report inventories
   avatars, `user_assets.file_url`, saved designs and orders storing
   `/storage/v1/object/public/assets/...` references. A private-bucket change
   breaks those references unless consumers/data are migrated first. Exact hosted
   URL counts remain unverified. Signed private previews/proofs stay separate.
7. Active custom-webhook registrations and recent callers. AccuZip/MelissaData
   use ordinary outbound APIs in this repository; Stripe/Mailgun/Redstone have
   separate protocols. No external custom caller is certified compatible until
   its owner verifies the timestamp/raw-body signature and fresh/stale samples.
   Persistent custom-event deduplication and unchecked DB results in some
   handlers still need review before active money-related custom integrations.

## SQL order, change window and rollback

Apply only through a separately approved, rehearsed change window. Keep checkout,
team writes, share creation and affected custom deliveries paused while the
database/app boundaries are changing. Preserve actual migration history.

| Ordered security version | SHA-256 of reviewed file |
| --- | --- |
| `20261017000000` original PR #25 lock | `8470d9a1103d20cbebf3f6f6c3564a12cb6053453ca6d80fb3275a99d4b52414` |
| `20261017010000` financial/asset guards | `9ecb19109ef489ebbf5bbfdebc202ebd99641cbcffec7cb81d61e1afebc05eb0` |
| `20261017120000` payment-intent uniqueness | `984ed3c02d5eee1cadb8a0fa7306a8a2b7bd1810a9a898b6d31402709dff8da1` |
| `20261017120100` team-write RPCs | `b28dca9b34034d83888ce1010d23d38afe302fdb09d5fca709e39ad982df2be1` |
| `20261017120200` share identity/pricing guards | `7e63b3bcedca4c93b833be8a4eb4c97c045b2dee7ea264cf63f11f960e3bb50f` |
| `20261017120300` secure share generator/writes | `4bef26b64b664863bb738bff127925d8096aec205682f23de47bf84d68b082c3` |

After schema/ACL migrations, run the separately designed/approved legacy share
conversion, then deploy the compatible exact application revision, smoke using
test/sample data and resume only after success. Public-bucket conversion remains
a separate release. Do not run the older app between these migration steps.

No reviewed down migration exists. A pre-COMMIT SQL failure rolls back its
transaction; after COMMIT, use a reviewed forward correction or separately
approved restoration of captured grants/policies/functions and backups. Keep
financial/validation immutability. A database restore does not undo Stripe
charges or vendor dispatches. Application rollback needs an identified compatible
Next.js 15.5.28+ build and matching share-token data format; blindly restoring old
main or unhashing tokens is not a safe rollback. Keep affected flows paused when
a compatible rollback does not exist.

## Approved scope and remaining approval gates

- Approved: updating PR #25 and the existing Vercel hook's automatic preview.
  This does not authorize a production release or hosted data/security changes.
- Merge: final PR #25 SHA, security scope, required reviews and green CI.
- Hosted SQL/data: exact target project/environment, ordered versions/checksums,
  inspected history, duplicate-order resolution and explicit legacy token/expiry
  conversion, staging evidence, backup, window, executor and corrective rollback.
- Production app: exact reviewed SHA, Node 24/runtime changes, paused-flow window,
  sample smoke/resume criteria and compatible rollback build/data format.
- Storage privacy: exact bucket/policies, intended public objects, legacy URL and
  consumer migration, share/avatar behavior, caches and rollback access limits.
- Any external custom-webhook cutover: named app/owner, compatible revisions and
  queue handling. Credential rotation, if later required, needs its own exact
  systems and secure update/revocation sequence; none is requested here.

Reusable cloud `install_script` and `start_skill` were saved as a draft, including
native PostgreSQL setup and the current access limitations. They were not
published or tested in a fresh environment. Current-instance installation,
migration tests and application validation are distinct from publication.
