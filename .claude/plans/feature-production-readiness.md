# YLS Production Readiness — Master Spec

Source of truth for scope: `docs/temp/yls-feature-audit-report.md` (audit
2026-06-12, §7 recommendations, §8 sprint plan, §9 differentiators D1–D8).
This spec operationalizes ALL of it. Phases must complete IN ORDER; each
phase's EXIT CRITERIA must be evidenced in the transcript (command output),
never asserted.

## GOAL
Take YLS from "checkout broken, last mile missing" to fully production
ready: every Sprint 1–6 item and every approved differentiator D1–D8 built,
e2e tested (Mocha), and browser smoke-tested (chrome-devtools MCP).

## CURRENT STATE (do not rediscover)
- 54 features verified BUILT (`ylsbrain/knowledge/features.md`, current).
- 4 verified P0 checkout breaks: `calculateFinalPricing` undefined
  (`components/orders/steps/PaymentStep.tsx:48`), `/api/orders/proof`
  missing (called at `ReviewApprovalStep.tsx:85`), `/orders/[id]/success`
  404 (`PaymentStep.tsx:190`), submit dead-ends
  (`app/api/orders/submit/route.ts:32-48`).
- Zero outbound email exists. Orders dashboard reads empty static array.
  Order-flow AccuZip is `Math.random()` simulated
  (`app/api/accuzip/upload/route.ts:150`).
- Test harness: Mocha (`npm test`), ~72 tests green at baseline.
  `npm run typecheck:ui` has a pre-existing 12-error baseline
  (`docs/temp/typecheck-baseline.txt`) — gate is ZERO NEW errors
  (delta-gate), clearing the baseline is a bonus, not required.
- Settled product facts: NO subscriptions (transactional only); custom
  designer (no FPD); 2-tier roles; tiered AccuZip job pricing; CallRail
  chosen over Twilio (report §9 D6 decision record).
- Designer PDF renderer at `app/api/design/preview/_render/` is real
  pdf-lib — REUSE it for proof generation.

## PROCESS RULES (every phase)
1. Branch/checkpoints per global Rule 8: `/git-workflow-planning:start
   feature production-readiness` once at Phase 0; after each phase first
   update roadmaps (report §8 table checkmarks + `ylsbrain/knowledge/
   roadmap.md`), then `/git-workflow-planning:checkpoint <N> <desc>`;
   after the final phase `/git-workflow-planning:finish` (ask before merge).
2. If a checkpoint fails (type-check/lint): stop, fix, re-run same
   checkpoint. Never proceed red.
3. Use the frontend-design skill before building any new UI surface.
4. Browser work: chrome-devtools MCP ONLY (never Playwright). Check for an
   already-running dev server before starting one (Rule 3).
5. Never delete files — move to `archive/` (Rule 1). Never hand-edit
   `.claude/hooks/*`.
6. Append a ylsbrain journal entry per completed phase (protocol in
   `ylsbrain/CLAUDE.md`).
7. Write tests for new logic BEFORE or WITH the implementation; a feature
   without a test does not satisfy its exit criteria unless the spec line
   explicitly says "browser-evidence only".
8. Stripe: TEST MODE ONLY. Never a live charge. DB changes only via new
   files in `supabase/migrations/`.

## BLOCKED-BY-OWNER RULES
If an item needs a credential/account only the owner can provide (AccuZip
key, MelissaData key, Stripe test keys, email provider account, CallRail
API credentials, AI Gateway key, mail-tracking vendor): implement the full
integration to its seam (typed client, env-var config, loud explicit
failure when unconfigured — NEVER a silent mock on the customer path),
unit-test the seam with stubs, and record the item + exact env var needed
in `docs/temp/production-blockers.md`. Such items count as DONE for this
goal. Mail tracking (report §7 #21) is owner-blocked by definition (no
vendor integration exists) — seam + blocker entry only.

## PHASES

### Phase 0 — Baseline & setup
Start the branch (Rule 8). Run `npm test` (must be green), `npm run
typecheck:ui` (record current error count vs 12-error baseline),
`npm run lint`, `npm run build`. Audit `.env.local` key presence (names
only, NEVER values) → initialize `docs/temp/production-blockers.md`.
EXIT: all four commands' output in transcript; blockers file exists;
branch `feature/production-readiness` active (`git branch --show-current`).

### Phase 1 — Unbreak checkout (report Sprint 1)
1. Fix `calculateFinalPricing` in PaymentStep (reuse
   `/api/orders/calculate-pricing`).
2. Build `POST /api/orders/proof` — real PDF via the existing
   `_render/` pdf-lib engine + order design + recipient data.
3. Build `app/orders/[orderId]/` success/status page with status timeline
   (submitted → proof ready → approved → captured → production → mailed).
4. Wire `app/dashboard/orders/` and home dashboard stats to real Supabase
   queries; remove the `lib/data-structures.ts` mock path (archive it).
EXIT: new Mocha tests for proof route + pricing fix pass in `npm test`
output; `npm run build` exit 0; chrome-devtools smoke: drive the wizard
from a seeded test login through payment (test mode) and land on the
status page — screenshot evidence in transcript.

### Phase 2 — Close the loop (report Sprint 2)
1. Proof approval workflow v1: approve/reject on the proof; approval calls
   existing `capture-payment`; rejection returns to design/review.
2. Real AccuZip on the order path: replace the `Math.random()` block in
   `app/api/accuzip/upload/route.ts` with the real client from
   `lib/api/accuzip/`; loud failure when key missing (blockers rules).
3. Outbound email: `lib/email/` provider adapter (Resend or Mailgun —
   pick one, document why) + templates: order confirmation, proof ready,
   payment captured, team invite. Wire team-service stub
   (`lib/team/team-service.ts:489`) to it.
EXIT: Mocha tests for approval→capture state machine, AccuZip seam, and
email adapter (stubbed transport) green; browser smoke: approve a proof in
test mode and see captured status on the status page; blockers file
updated for any missing keys.

### Phase 3 — Production-safe (report Sprint 3)
1. Persistent job queue: replace in-memory Map+setTimeout
   (`lib/jobs/job-queue.ts`) with a Supabase-table-backed queue surviving
   restarts.
2. Distributed rate limiting + batch limits: shared store (Supabase or
   Upstash) replacing both in-memory Maps (`lib/auth/middleware.ts`,
   `lib/system/batch-limits.ts`).
3. Payment integrity: payment-intent route fails the request when DB
   insert fails (`app/api/payments/intent/route.ts:108-127`);
   compensating Stripe cancel when authorize→order-insert fails
   (`app/api/payments/authorize/route.ts:82-100`).
4. Outbound-webhook retry with backoff + dead-letter log
   (`lib/supabase/webhooks.ts`).
5. Column-mapping hard validation: required address fields must be mapped
   before advancing (`DataAndMappingStep.tsx`).
EXIT: Mocha tests covering each of the five (queue survival simulated,
limiter store, both payment failure paths, retry/DLQ, mapping validation)
green in `npm test` output; build exit 0.

### Phase 4 — Honest UI + trust (report Sprint 4)
1. React error boundaries around the order wizard + dashboard shells.
2. Real loading/empty states; remove fake timers and the 6 hardcoded
   template mocks; wire `mail_templates` DB table to the gallery
   (seed from `data/templates-data.ts` via migration; archive static path).
3. RBAC decision: ship `projects`/`project_members` migrations +
   `types/supabase.ts` OR archive `lib/rbac` + ProjectManager (pick per
   transactional model; document decision in report).
4. Real 2FA: Supabase `auth.mfa` enroll/verify/unenroll replacing mock
   codes (`app/dashboard/security/page.tsx`).
5. Notification settings + API keys: real backends (tables + routes + Zod)
   — or archive the pages if descoped (state which in report).
6. Doc hygiene: fix project `CLAUDE.md` stale claims (FPD, subscriptions,
   Prisma, dead `docs/modularization/` ref, stale branch); archive dead
   subscription code (`app/api/subscriptions/`,
   `lib/payments/subscription-service.ts`).
EXIT: Mocha green incl. new backend tests; chrome-devtools smoke of
templates-from-DB, 2FA enroll (test user), notification save persisting
across reload — screenshots; build exit 0.

### Phase 5 — Delight & revenue (report Sprint 5 + D1, D2, D5, D7)
1. D1 per-recipient QR/PURL: unique short-link per recipient rendered via
   designer QR; scan events attributed to order+recipient in analytics.
2. Wire handwriting background into landing/login (it exists, unwired).
3. Onboarding checklist (first list → first design → first order) +
   teaching empty states.
4. Discount codes: `lib/orders/pricing.ts` coupon logic + admin CRUD UI.
5. Campaign ROI view: order cost vs D1/short-link engagement.
6. D2 AI copy assistant in designer (AI Gateway; seam + blocker if no key).
7. D5 win-back emails (uses Phase-2 email service; scheduled via job queue).
8. D7 drip sequences: per-touch orders, authorize days before send,
   capture at proof approval/mailing, cancel-anytime (per §9 billing
   model).
EXIT: Mocha tests for QR attribution, coupon math, drip per-touch billing
state machine green; browser smoke: landing page shows handwriting bg,
onboarding visible for fresh user, discount applies in checkout —
screenshots; build exit 0.

### Phase 6 — Differentiators & polish (report Sprint 6 + D3, D4, D6, D8)
1. D3 A/B split-send UI on enhanced campaigns; winner via D1 data.
2. D4 template performance stats (response rates from D1 on the DB-backed
   gallery).
3. D6 CallRail integration behind `CallTrackingProvider` interface
   (webhook receiver + per-campaign number mapping + calls in attribution;
   seam + blocker if no credentials).
4. D8 deliverability score: USPS mailpiece-compliance rules in
   `components/designer/preflight/` (clear zones, indicia, aspect ratio,
   OCR readability) + combined list+design score at checkout.
5. Designer follow-ups: embedded handwriting TTFs in PDF render, WCAG
   contrast sweep, zoom-toolbar tooltips. (CMYK/PDF-X: attempt; if
   pdf-lib can't, document as limitation in blockers — honest negative OK.)
EXIT: Mocha tests for split assignment, score computation, CallRail seam
green; browser smoke: preflight shows compliance findings; checkout shows
combined score — screenshots; build exit 0.

### Phase 6.5 — Vendor-gated capture + AI proof comparison (report §9 D9, D10)
Added 2026-06-13 (owner-approved). Depends on the DB1-model `orders`
(`amount_authorized/captured`, `proof_approved_by/at`, `vendor_assignments`,
`proof_urls`, `proof_annotations`) from the consolidation.
1. **D9 vendor-gated capture:** move the capture trigger from "customer
   approves" to "vendor confirms the ready-to-print proof matches the
   approved design" → `paymentIntents.capture()`. Vendor denial →
   `paymentIntents.cancel()` (releases hold, NO refund processed). Handle the
   ~7-day Stripe authorization-expiry window (re-authorize before capture if
   the vendor cycle exceeds it; document the fallback). This SUPERSEDES the
   Phase-2 capture-on-customer-approval logic.
2. **D10 AI proof comparison (automates D9's gate):** hybrid check —
   (a) per-recipient merge-field text verification (name/property
   address/phone — the "data merged correctly" the vendor proof demonstrates);
   (b) vision fidelity diff (layout/handwriting/placement) via a top vision
   model (GPT-5.5 / Gemini image) through AI Gateway. Ignore vendor
   mail-automation marks (data-matrix barcode, sequence number, blank back).
   Confidence-scored: high-confidence → auto-confirm (→ capture); low →
   escalate to human (never blind-move money). Seam + blocker if no model key.
   Validate against `temp/vendor-proof-examples/` (LTR + ENV).
EXIT: Mocha tests for the capture-gate state machine (authorize → vendor
confirm → capture; vendor deny → cancel/release) and the proof-comparison
verdict logic (text-match + confidence threshold + human-escalation) green;
browser smoke: a test order moves authorize → vendor-confirm → capture, and a
denied proof releases the hold with no refund — screenshots; build exit 0.
AI model access is owner-level (document in production-blockers.md if absent).

### Phase 7 — Full E2E + final verification
1. E2E Mocha suite: API-level journey test (create list → design → order →
   proof → approve → capture, Stripe test mode/stubs).
2. chrome-devtools full smoke, seeded test user: signup/login → upload+
   scrub list → design (visual designer verification — finally) → wizard →
   test payment → proof approve → status page → dashboards real data →
   admin pricing → team invite. Screenshot each station.
3. Lighthouse audit (chrome-devtools) on landing, dashboard, designer —
   record scores (no hard threshold; report honestly).
4. Full gates: `npm test` green, `npm run lint` clean, typecheck:ui ≤
   baseline (0 new), `npm run build` exit 0.
5. Update report §§4-9 statuses + `ylsbrain/knowledge/features.md` +
   roadmap; final journal entry; `/git-workflow-planning:finish` (opens
   PR; ASK before merging).
EXIT: all four gate commands' output in transcript; smoke screenshots
enumerated; PR URL in transcript; blockers file contains ONLY
owner-level items.

## HARD CONSTRAINTS
- Source files ≤350 LOC (docs exempt). TypeScript strict, no `any`. Zod on
  every new/changed API boundary.
- NO subscription features. NO FPD. Transactional billing only.
- No silent mocks/fakes on the paying-customer path — real, or loud
  failure + blockers entry.
- Don't weaken/delete existing tests to pass gates; 0 regressions in the
  Mocha suite.
- Stripe test mode only; no live external side effects.
- NO secrets/PII in any file, log, journal, or transcript echo.

## DEFINITION OF DONE
Phases 0–7 exit criteria all evidenced; full Mocha suite green; 0 new
typecheck:ui errors vs baseline; lint clean; build exit 0; full-journey
browser smoke evidenced; report+brain knowledge updated; PR open;
`docs/temp/production-blockers.md` lists only owner-level items.
