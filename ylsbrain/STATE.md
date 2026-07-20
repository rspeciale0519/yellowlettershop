# yls brain — STATE
Updated: 2026-07-05

## Current focus
**(2026-07-05): light-dark-theme site-wide redesign — SCRAPPED by owner post-completion.**
6-phase warm-paper/warm-charcoal theme redesign was finished, QA-clean, and
merge-ready, but owner rejected the design direction on review (no specific
reason given). Branch deleted (`git branch -D`, never pushed — zero blast
radius); full history preserved at tag `archive/light-dark-theme-5978f79` if
ever revisited. `develop` unaffected, back to `0a135dd`. Lesson: check in on
direction with a lightweight preview *before* a full multi-phase build-out next
time a full-site visual redesign is attempted. Detail: [[journal/2026-07-05]].

## (prior focus)
**(2026-06-15): Permission Template resource picker — name-based picker +
wildcard grants; built via /goal, e2e-PASSED, ready to merge.** Replaced the raw
`resource_id` UUID text box in the Create/Edit Permission Template form with a
searchable picker (All [type] vs specific multi-select, by name). Branch
`feature/permission-resource-picker`, 4 commits (`7588529` endpoint+wildcard,
`ec21bf3` picker, `6723b1a` form/mapping, `e32fddc` e2e bug fixes). Backend:
`GET /api/access-control/resources` (server-side type→table allowlist + team-admin
guard) + migration `20260616000600` makes `my_resource_permission` honor
`resource_id='*'` (team-bound) so "All [type]" enforces. Storage shape unchanged
(`*` sentinel; multi-select expands to N entries; pure `permission-template-mapping.ts`
+ 8 tests). `template` kept visible but UNENFORCED (no ownership model) with an inline
notice; real template enforcement = backlog. **CDT e2e PASSED** as `owner-e2e@…`:
list-by-name, create→201 (2 entries+team_id in DB), edit re-resolves names, template
notice. Two e2e-only bugs fixed in `e32fddc`: (1) render loop from a Radix Checkbox
(`<button>`) nested in a clickable + cmdk controlled input → swapped to plain
Input+`role=option` rows; (2) `/api/teams/members` never returned `teamId` (page read a
nonexistent `members[0].team_id`) → endpoint now returns it. Gates: eslint 0,
typecheck:ui 0, mocha 179 (8 new). NOW FINISHING → PR to develop. Detail:
[[journal/2026-06-15]] [later]; handoff `docs/temp/permission-resource-picker-handoff.md`.

## (prior focus)
**(2026-06-15): Profile page e2e smoketest — all 3 tabs pass; fixed missing
`assets` storage bucket.** Avatar upload 400'd "Bucket not found" — `assets` bucket
was never in a migration (only `app/api/assets/route.ts` auto-creates it server-side).
Fix: migration `20260616000500_assets_storage_bucket.sql` (PUBLIC `assets` bucket + 4
storage RLS policies); applied + recorded. Migration still UNCOMMITTED (unrelated to
the picker branch). Detail: [[journal/2026-06-15]] [06:10].

## (prior focus)
**Supabase key-leak remediated — rotated to new sb_ keys,
legacy keys DISABLED+REVOKED.** Old `service_role` JWT + a PAT had been
committed to pushed git history (`5cb2199`, `.claude/settings.local.json`).
Fix (browser-driven, owner-authorized): migrated app to new `sb_publishable_`/
`sb_secret_` keys (same env var NAMES, new values) across `.env.local` + Vercel
(Prod + Dev + Preview/develop) → prod redeploy `dpl_GHQPqaHx2…` READY; then
**disabled legacy anon/service_role + REVOKED legacy HS256 signing key
`BCDC2B40`**. Verified: leaked key → `"Legacy API keys are disabled"`, new keys
200, leaked PAT `sbp_v0_8ff3…` → 401 (already dead), live login 0 console errors.
`.claude/settings.local.json` gitignored+untracked (leak vector closed). Details:
[[journal/2026-06-14]] [10:30]; memory:project_supabase_key_rotation. Remaining:
commit hygiene+tooling bundle (chore branch→PR); optional history purge (low
priority, leaked key dead); owner may delete `.env.local.bak`.

## (prior focus)
**(PR #11, merge `a9981fe`): Stripe webhook finished "properly" + FIRST
PRODUCTION DEPLOY.** Per owner "set it up properly"→"Do it all properly":
(1) Vercel `STRIPE_WEBHOOK_SECRET` untangled — deleted 3 overlapping placeholder
entries (All-Env + Development + Preview/develop), left ONE All-Environments
entry set to the real endpoint signing secret (whsec_…, NOT recorded here);
"Needs Attention" cleared. Also deleted leftover `TEST_VAR_DELETE_ME`. Endpoint:
Stripe → https://app.yellowlettershop.com/api/payments/webhooks/stripe (events
payment_intent.succeeded/payment_failed/canceled). (2) Handler rewrite
`app/api/payments/webhooks/stripe/route.ts` for the consolidated inline-payment
model: kept IP allowlist + rate limit + signature verify; added DB-backed
idempotency via new `webhook_events`; only reconciles orders by
stripe_payment_intent_id (payment_status + amount_captured), never regresses
fulfillment; dropped dead subscription/invoice/customer handlers (−475 LOC).
(3) Migration `20260613100000_webhook_events.sql` (service-role-only, unique
stripe_event_id) APPLIED to DB2 + verified (RLS on, unique constraint, 3 idx).
Gates: typecheck:full 0, 167 tests. Commit `c743bcb` → PR #11 → main `a9981fe`
→ Vercel production deploy (dpl_nLgykfJoJv9b…, target production). Detail in
[[journal/2026-06-13]].

## (prior focus)
**Production-readiness: DB consolidation DONE+verified; orders/payment refactored
to the consolidated model; core flow browser-smoke VERIFIED.** Branch
`feature/production-readiness`, commits `0940942`→`7517c40`. Big arc this session:
(1) DB consolidation — DB1 normalized domain model built into the YLS-OWNED
project DB2 (`lmtpfgfulkynrktdkgpu`), 33 tables, data preserved, team-scoped RLS
(`0a1f088`); (2) 5 security fixes incl. PII-exposure RLS inherited from DB1
(`50d383e`) + submit payment re-verify (`a8842c0`); (3) orders+payment code
refactored to normalized/inline-payment model (`cb6f94b`,`52c7353`) — no more
order_state blob / payment_intents tables; (4) `withAuth` cookie-session fix;
(5) **chrome-devtools browser smoke on real DB2** — login→dashboard→orders→
status page verified (`docs/temp/smoke/*.png`). **NEW (fd726fe,011afe9):**
typecheck:ui backlog CLEARED 14→0; **B8 type-debt reconciled 664→0**; **full
wizard browser-smoke DONE** — journey verified login→…→Step 6 payment, 9 real
bugs fixed live (auto-map, AccuZip upload contract, design-save table, designer
cross-tab round-trip, campaign defaults, proof buckets ×2) + migrations
20260613030000+040000 APPLIED to DB2 + design-previews bucket auto-created.
Gates: typecheck:ui 0, typecheck:full 0, 143 tests, build 0. **CHECKOUT NOW
CLOSED END-TO-END (commit `4048a7e`):** drove a $1.48 / 10-piece order through
the wizard → authorize (manual-capture PI) → submit → proof PDF → approve →
**CAPTURE** ($1.48, order 1065B687 → processing/captured on DB2). Fixed 2 real
bugs: stale-state submit (submitOrder/validateCurrentStep closed over pre-update
orderState → "Payment must be authorized" on every checkout; now take a state
override) + approve 500 (wrote nonexistent `orders.updated_at`; removed + made
capture idempotent so a post-capture DB hiccup self-heals). Detail in
[[journal/2026-06-13]] [13:58]. **HARDENING PASS DONE + RE-SMOKED 100%
(`28e50d6`,`15b7840`,`821eebc`,`80d65f7`; [[journal/2026-06-13]] [15:24]):**
proof PII → private bucket + signed URLs (mig 060000), fail-closed PI ownership,
pricing reads admin pricing_config, real Supabase TOTP 2FA, DB-backed job queue,
CSV→mailing_list_records persistence (mig 070000 fixed a consolidation gap: the
audit trigger's table was never created → every insert 42P01'd), error
boundaries, archived dead RBAC + mock api-keys/notifications pages. Fresh order
CAF16D73 driven to CAPTURE; proof signed→200/public→400. Gates: typecheck:full 0,
167 tests, `next build` clean, full browser smoke. Migrations 060000+070000
APPLIED to DB2. REMAINING: D1-D10 differentiators (net-new, need owner external
accounts); deploy; set email provider keys (prod); deferred minors (CLAUDE.md
stale refs, subscriptions archive, template-gallery DB = D4, XLSX parse,
job-queue orphan-reaper); wire typecheck:full+build into CI. Full summary:
`docs/temp/production-readiness-status.md`. Test user yls-e2e@yellowlettershop.test.
Read [[knowledge/orientation]].

## Latest synopsis
Shipped production-readiness Phases 0-3 (code) + 2 security fixes; resolved a
Supabase project-identity mixup. The app's ONLY real DB is `lmtpfgfulkynrktdkgpu`,
managed under the **corp@yellowlettershop.com** Supabase account (proven by
anon+service JWT `ref` claims in `.env.local`). An unrelated, differently-owned
dashboard project that once shared a confusing display name has been fully
purged from this repo (2026-07-19, owner request) and must never be
referenced again — if you see any other Supabase project ref anywhere in this
codebase, it is wrong. Lesson: identify "which X does this app use" from the
app's own config/JWT, never an external listing's display name.
See [[journal/2026-06-13]], memory:project_supabase_key_rotation.

## Open threads
- **B8 — hidden type-debt → RESOLVED to ZERO** (`docs/temp/typecheck-debt-finding.md`):
  full-include `tsc` (`tsconfig.fullcheck.json`) 664→**0**. Root cause was a
  type-architecture swap (970-line hand-authored `types/supabase.ts` replaced by the
  generated schema at consolidation). Fixed via Phase A (canonical layer:
  `types/supabase-domain.ts` + `domain-extra.ts`), Phase B (8 parallel subagents,
  by module), Phase C (central fixes + archived never-functional scaffolding + added
  `npm run typecheck:full` gate). Gates: typecheck:full 0, typecheck:ui 0, tests 143,
  `next build` exit 0. **Wire `typecheck:full` into CI** (`ignoreBuildErrors` stays
  true — Next's build type-checker has lucide-react false-positives; tsc is authoritative).
  INCOMPLETE features archived (build later): saved-payment-methods, campaign-payment,
  asset-usage table.
- **Migration 20260613030000 committed but UNAPPLIED to live DB2** — applies at
  deploy (ad-hoc Mgmt-API prod write was correctly guardrail-denied). Until applied,
  assets-library + undo/redo throw at runtime (assets API has storage-only fallback).
- **Designer deferred follow-ups** (documented, tracked): true CMYK/PDF-X
  export, embedded handwriting TTF (families map to pdf-lib StandardFonts),
  order↔designer `orderId`-on-save linkage, broader WCAG contrast sweep,
  Tooltips on canvas zoom toolbar, **chrome-devtools visual regression NOT
  yet run** (auth-gated; approach in
  `docs/temp/designer-verification-auth.md`) — designer UI is *unverified*
  visually, only logic+build are evidenced.
- **Feature audit DONE** → `docs/temp/yls-feature-audit-report.md`
  (2026-06-12): 54 BUILT confirmed; 4 verified P0 checkout breaks (no
  `/api/orders/proof`, `calculateFinalPricing` undefined in PaymentStep,
  success page 404, submit dead-ends); 13 doc-intended NOT BUILT; 6-sprint
  build order proposed (Sprint 1 = unbreak checkout). Awaiting user
  direction on which sprint/items to start.
- Standing op-note: **YLS engine is sync-managed** — never hand-edit
  `yls/.claude/hooks/*` (a `brain sync` flags it local-mod); upgrades flow
  from `_brain`. Onboarding other projects = `brain init <repo>` (follow-up,
  out of v1 scope).

## Active skills in play
- [[skills/build-safe-destructive-git]] — before any git delete/drop/reset
- [[skills/testing-red-green-verifier-gates]] — gating non-Mocha deliverables

## Notes
- Brain hook **launch** paths must be `$CLAUDE_PROJECT_DIR`-anchored
  (fixed `f69508e`); a persisted shell `cd` otherwise breaks Stop-hook
  resolution. Vault-root resolution itself is already cwd-robust
  (`brain-lib.js` `ylsRoot` → `input.cwd`/`__dirname`).
- `dev-docs/` are an April-2025 baseline and materially STALE (revenue
  model, design engine, roles, AccuZip billing). On any app-knowledge
  question defer to [[knowledge/superseded]]; it is authoritative over
  the docs. Knowledge-layer freshness is reconciled mechanically at
  consolidation (`git log --name-only` since watermark — see CLAUDE.md).
- Known benign: AL-5 PII heuristic false-positives on 40-char git SHAs
  quoted in the journal (`[0-9a-fA-F]{40,}`); non-blocking, regex not
  tightened (deferred).
- Known benign: consolidate.js gap check perpetually flags `9e05ba0`
  (local date 2026-05-17) since journals are UTC-dated (`2026-05-18.md`) —
  artifact of the date-based-covering decision, not a real coverage gap.
- Seam: skills `provisional`; no Developer-brain promotion yet
  (promotion needs `established` + cross-project authorization — §8).
- Hazard (recorded as feedback memory): concurrent CC sessions doing git
  branch ops in one working tree caused a mid-consolidation checkout→main;
  recovered, no loss. MITIGATED: use `scripts/wt.ps1 new <branch>` for a
  per-session worktree (sibling `../yls.worktrees/`); never hand-run
  `git worktree add`. See [[concurrent-sessions-worktrees]].
