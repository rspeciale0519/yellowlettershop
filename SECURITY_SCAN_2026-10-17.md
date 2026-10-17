# Security scan — 17 October 2026

Owner-approved local scan of Yellow Letter Shop (`main` @ scan start). Method: broad sweep, then an independent disproof pass on every candidate (re-trace the path, look for middleware / RLS / RPC / service-role guards, keep only what survived). Attack cases are encoded as Mocha tests. **No production systems, cards, emails, SMS, or hosted databases were touched.**

Live A/B/admin browser attacks were not run: this environment has no local Supabase stack or test accounts. The money-path and IDOR cases below are proven in unit tests that replay the same inputs an attacker would send.

## Live secret check (read this first)

No **live** credential value was found in currently tracked application code.

Locations that look secret-shaped (path and line only — values not copied):

| Location | What it is | Owner action |
|---|---|---|
| `archive/debug-endpoints-2026-08/api-test-db-verification/route.ts:5` | Hard-coded **local Supabase demo** service JWT fallback (well-known public demo key, route is archived) | Leave archived; do not remount |
| `.env.example:13` | Placeholder `whsec_…` / `sk_test_…` tokens, not real | None |
| `ylsbrain/journal/2026-06-14.md:46` | Historical note that a service-role JWT + PAT were once committed at `5cb2199` | Keys were rotated/revoked. Optional: history purge. Do **not** paste old values |

If that historical commit is still reachable on GitHub, treat it as a **rotation-already-done** item. Do not rewrite history unless you choose to.

---

## Ranked findings

### Critical

**C1. Anyone who could talk to checkout could pay $0.01 for a real mailing job.**
A customer (or anyone with a login) could send their own price when creating a payment hold, then send that same fake total when placing the order. The server compared the two client numbers to each other instead of recomputing the real price from the mail options and piece count.

- **Where:** `app/api/payments/intent/route.ts:36` (trusted client `amount`); `lib/orders/order-insert.ts:32` (`extractTotal` reads `pricing.totalPrice`); `app/api/orders/submit/route.ts` (compared Stripe amount to that client total)
- **Proof:** `npx mocha --require ./tests/setup/register.js tests/lib/orders/server-total.test.ts` — “ignores a client-supplied $0.01 total (price tamper)” passes. A 1,000-piece full-service postcard prices far above $0.01; the old `extractTotal` returned `0.01`.
- **Fix in this PR:** Yes. `/api/payments/intent` and `/api/orders/submit` now call `computeServerOrderTotal` (mailing options + deliverable count + `pricing_config` / defaults). Client `amount` / `pricing.totalPrice` is ignored. Legacy `/api/payments/create-payment-intent` rejects client amounts.

**C2. Guessing or copying an image id opened another user’s private file.**
`GET /assets/images/{id}` used the service-role key, skipped login, and for `storage--…` ids decoded the raw storage path. Anyone who knew `{userId}/{filename}` (or a `user_assets` UUID) got a signed download.

- **Where:** `app/assets/images/[assetId]/route.ts:14-37` (pre-fix)
- **Proof:** `tests/lib/assets/image-access.test.ts` — owner `storage--` id resolves; another user’s path and `../` paths return `null`.
- **Fix in this PR:** Yes. Route requires a session. Storage paths must be exactly `{sessionUserId}/{filename}`. Table-backed assets must belong to that user. The PDF renderer loads those images in-process (no cookie-less HTTP loop) and blocks private-network URLs.

---

### High

**H1. Unauthenticated AccuZip / list-builder / validation / spreadsheet routes (cost and CPU abuse).**
`POST /api/accuzip/count`, `create-list`, `list-builder/estimate`, `validation/address`, `validation/email`, `validation/completeness`, and `mailing-lists/parse-spreadsheet` had no login. With a live AccuZip key this burns vendor credits. Spreadsheet parse accepted 10 MB files from anyone.

- **Where:** `app/api/accuzip/count/route.ts:5`; `app/api/accuzip/create-list/route.ts:7`; `app/api/list-builder/estimate/route.ts:5`; `app/api/validation/address/route.ts:4`; `app/api/mailing-lists/parse-spreadsheet/route.ts:13`
- **Proof (local repro):** `curl -X POST http://localhost:3010/api/accuzip/count -H 'content-type: application/json' -d '{"criteria":{}}'` — before: 200/count or mock; after: **401**.
- **Fix in this PR:** Yes. Those routes (plus mailing-list csv-import / version history / restore, campaign execute) are wrapped in `withProtectedRoute` (session + DB rate limit).

**H2. After login, the app would send you wherever the link said — including another website.**
`?redirectedFrom=https://evil.test` was written to `window.location.href` and returned from email login. A phishing page that looked like YLS login would bounce a real session to the attacker.

- **Where:** `components/auth/auth-flow-modal/index.tsx:204`; `components/auth/auth-flow-modal/auth-service.ts:26`; `app/auth/callback/route.ts:8,23-27` (also trusted `X-Forwarded-Host`)
- **Proof:** `tests/lib/security/safe-redirect.test.ts` — external, `//host`, and scheme-smuggling values fall back to `/dashboard`.
- **Fix in this PR:** Yes. `getSafeInternalPath` on login, Google OAuth, and `/auth/callback`. Callback uses `NEXT_PUBLIC_APP_URL` / request origin, never `X-Forwarded-Host`.

**H3. The PDF renderer and user webhooks would fetch whatever URL they were given (SSRF).**
A signed-in user could put `http://169.254.169.254/` (or `http://127.0.0.1`) on a design image, or register that URL as an outbound webhook. The server fetched it.

- **Where:** `app/api/design/preview/_render/pdf-renderer.ts:43` (pre-fix `fetch(src)`); `lib/supabase/webhooks.ts:237`
- **Proof:** `tests/lib/security/safe-fetch-url.test.ts` — metadata, loopback, RFC1918, credentials, `file:` blocked; public https allowed.
- **Fix in this PR:** Yes. Outbound fetch and webhook create/update/send require `isSafeOutboundUrl`.

**H4. Mailgun skip-trace webhook accepted a captured signature forever (replay).**
HMAC was correct, but the `timestamp` age was never checked. A recorded `timestamp+token+signature` stayed valid.

- **Where:** `app/api/skip-trace/webhook/results/route.ts:28-35`
- **Proof:** `tests/lib/security/webhook-crypto.test.ts` — timestamp 301 seconds old is rejected; 30 seconds is accepted.
- **Fix in this PR:** Yes. 5-minute window. Failed verifies no longer log the Mailgun token.

**H5. Several money/admin tables had RLS off.**
`proof_annotations`, `admin_audit_log`, `pricing_config`, `pricing_change_log`, `user_notes`, `user_credits` were created without `ENABLE ROW LEVEL SECURITY`. With the anon key, PostgREST would treat them as open. App code already uses the service role for these tables.

- **Where:** `supabase/migrations/20260328000001_admin_audit_log.sql`; `20260328000002_pricing_tables.sql`; `20260328000004_user_management_tables.sql`; `20260613000000_consolidate_db1_model.sql` (`proof_annotations`)
- **Proof:** No later migration enabled RLS on those names (`rg "enable row level security" supabase/migrations` — they do not appear).
- **Fix in this PR:** Migration **file only** (`supabase/migrations/20261017000000_lock_unprotected_tables.sql`). Not applied to any live database.

**H6. Rate limiter existed and was never called. Login/OTP still cannot be limited in this app.**
`checkRateLimit` (Postgres RPC) had **zero callers**. The in-memory `Map` in `lib/auth/middleware.ts` is also unused and useless on Vercel. Login/OTP go straight to Supabase Auth in the browser, so our API cannot rate-limit them.

- **Where:** `lib/rate-limit/index.ts` (no importers before this PR); login in `components/auth/auth-flow-modal/auth-service.ts:15`
- **Proof:** pre-change `rg "from '@/lib/rate-limit'" app lib` → empty. Mocha: `evaluateRateLimit` fail-closed tests still pass.
- **Fix in this PR:** Partial. Wired into AccuZip, validation, list-builder, parse, payment-intent. **Owner action:** turn on Supabase Auth rate limits / CAPTCHA in the hosted project. Do not expect this PR to stop password stuffing by itself.

---

### Medium

**M1. AccuZip count invented a random number when the key was missing or the vendor failed.**
Orders and estimates could show 1,000–11,000 fake records in production.

- **Where:** `lib/api/accuzip/count.ts:16-18,43-44` (pre-fix)
- **Proof:** `tests/lib/api/accuzip/count-fail-closed.test.ts`
- **Fix in this PR:** Yes. Throws “AccuZIP is not configured” / “unavailable”. `ACCUZIP_SKIP_VALIDATION` no longer skips in production.

**M2. Analytics and list-builder usage accepted another user’s id.**
`?userId=` overrode the session. Data leak was **blocked in practice** (`short_link_tracking` RLS-on/no-policies; `mailing_list_usage` is `user_id = auth.uid()`, and these services used the cookie-less browser client so `auth.uid()` is null). Still a loaded gun.

- **Where:** `app/api/analytics/performance/route.ts:7`; `app/api/list-builder/usage/route.ts:8-10`
- **Proof:** Code path only; RLS would return empty rows. Still fixed.
- **Fix in this PR:** Yes. Session user only; performance route now requires auth.

**M3. Internal `/api/webhooks` HMAC compare could throw on a short signature (500 / retry storm).**
`timingSafeEqual` requires equal buffer lengths.

- **Where:** `app/api/webhooks/route.ts:32-35` (pre-fix)
- **Proof:** `timingSafeEqualHex` test rejects a truncated digest without throwing.
- **Fix in this PR:** Yes. Length-safe compare. `x-yls-timestamp` is required, 300s window, bound into the HMAC (`${timestamp}.${body}`).

**M4. Public team tags were editable by any logged-in user (app logic).**
`canEdit` treated `visibility === 'public'` as enough. RLS would likely block the write; the API still returned success-shaped permission.

- **Where:** `app/api/tags/[id]/route.ts:45`
- **Fix in this PR:** Yes. Owner only.

**M5. Shared SVG files were served `inline` (stored XSS if a victim opened the share link).**
- **Where:** `app/api/assets/route.ts:186` (allows `image/svg+xml`); `app/api/share/[token]/route.ts:53`
- **Fix in this PR:** Yes. SVG share responses use `Content-Disposition: attachment`.

**M6. No app-wide security headers.**
- **Where:** `next.config.mjs` (no `headers()` before)
- **Fix in this PR:** Yes. `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, baseline CSP.

**M7. Campaign execute had no route-level auth.**
Service already throws if `getUser()` is null (browser client on the server), so this was 500-not-200. Still a missing 401.

- **Where:** `app/api/campaigns/[campaignId]/execute/route.ts:4`
- **Fix in this PR:** Yes. `withProtectedRoute`.

---

### Low / info (not changed, or defense-in-depth only)

| ID | Summary | Why it did not become a High fix |
|---|---|---|
| L1 | Middleware matcher is only `/dashboard/:path*` | APIs must keep using `withAuth`. Expanding the matcher would 401 Stripe/the print vendor/share. Left as owner product choice. |
| L2 | Access-request approve looked like BOLA | **Disproved.** RPC `approve_access_request` uses `auth.uid()`, `is_team_admin`, and blocks self-approve (`supabase/migrations/20260616000200_rekey_access_control.sql:7-12`). Deny path now calls `deny_access_request`. |
| L3 | Template apply looked like privilege escalation | **Disproved.** RPC requires `is_team_admin(template.team_id)`. |
| L4 | Campaign execute as anonymous send | **Disproved as a working exploit.** Service fail-closed. Route still wrapped (M7). |
| L5 | `mailing_list_versions` / `short_link_tracking` RLS on, no policies | Default-deny. Feature may be broken; not a leak. Owner: add owner-scoped policies if you want the feature. |
| L6 | Policies use `TO public` with `auth.uid() = created_by` | `NULL = NULL` is not true; anon sees nothing. Weak defense-in-depth only. |
| L7 | `Math.random` short-link codes | Guessable if codes leak; RLS/public `/s/` still redirects. Owner: switch to `crypto.randomBytes`. |
| L8 | `secure_password_change = false` in `supabase/config.toml` | Local stack only. Owner: enable on hosted Auth. |
| L9 | Stripe webhook IP allowlist skipped outside production | Signature still required. Staging must not be public with `NODE_ENV=development`. |
| L10 | CI workflows | No `pull_request_target`. Prod migrate uses `environment: production` + secrets. Dry-run interpolation is a boolean, not free text. |
| L11 | `dangerouslySetInnerHTML` | Theme script + chart CSS + static media fallbacks. No user HTML observed. |
| L12 | Debug endpoints | Already archived 2026-08-03. Confirmed not under `app/`. |
| L13 | Login rate limit | See H6. Owner: Supabase dashboard. |
| L14 | npm audit | See below. Owner: upgrade Next.js. |

---

## Dependency risk (`npm audit --omit=dev`)

17 production issues (1 critical, 11 high, 5 moderate) as of this scan. Do **not** run `npm audit fix --force` in this PR (exceljs downgrade / lockfile churn).

Owner should upgrade **Next.js** off 15.5.14. Advisories include unauthenticated RCE on Windows-hosted image optimization (AVIF) and other cache/SSRF/DoS items (`GHSA-2xp9-vwfh-vxw4`, `GHSA-p293-qw3h-jr36`, plus several high). Also: `sharp`/`libvips`, `ws`, `postcss` (via Next), `tmp`.

---

## What this PR does **not** do (owner)

1. Rotate or change any live credentials (none found live in tracked app code).
2. Apply the RLS migration to hosted Supabase. Review, then apply through your normal migrate path.
3. Enable Supabase Auth rate limits / CAPTCHA / `secure_password_change`.
4. Upgrade Next.js / run `npm audit fix`.
5. Purge git history of the June 2026 leaked keys (already revoked).
6. Expand edge middleware to all `/api/*` (would break signed webhooks unless you exclude them).
7. Add policies to `mailing_list_versions` / `short_link_tracking` (that is a feature repair).
8. Before prod: any external caller of `/api/webhooks` must send `X-YLS-Timestamp` and sign `${timestamp}.${body}`.

---

## Test evidence

```
npm test
307 passing (126ms)
```

Includes new specs: price tamper, open redirect, SSRF URL block, webhook replay/HMAC, asset IDOR, AccuZip fail-closed, rate-limit policy (existing).
