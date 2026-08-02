# Log
Append-only timeline. Entry format: `## [YYYY-MM-DD] <op> | <title>`.

## [2026-05-17] init | YLS brain scaffolded
- Vault structure, schema, hooks created.

## [2026-05-18] bootstrap | Phases 0–5 complete, acceptance ACCEPTED
- Vault + 5 hooks + settings wired; 3 plan defects fixed (sandboxed verifier,
  date-based covering, .obsidian gitignore). See journal/2026-05-18.
- Open: spec §11 real-session smoke check pending user confirmation.

## [2026-05-18] housekeeping | Removed stale Codex branch/worktree
- Deleted cc/jovial-ellis-f13b4d (+ worktree) after verifying 5cb2199 fully
  merged into develop and main. See journal/2026-05-18.

## [2026-05-18] housekeeping | Dropped stale build-artifact stash
- stash@{0} proven 100% .next/ build output (no source), base b630512 already
  in main/develop. Dropped under user confirmation. Repo fully clean.

## [2026-05-18] milestone | Spec §11 smoke check SATISFIED (blocker discharged)
- Independent live session confirmed SessionStart injection + Stop gating via
  brain.json/ledger/sentinel cross-checked vs hook source. PR #8 merge now
  user's call, §11 no longer blocking. See journal/2026-05-18 [23:45].

## [2026-05-18] housekeeping | ylsbrain session edits committed + pushed
- abec7d5 on feature/yls-brain pushed to origin. Branch merge-ready; §11
  evidence durable in PR #8. See journal/2026-05-18 [23:52].

## [2026-05-18] consolidation | First consolidation — 2 skills distilled
- skills/build-safe-destructive-git + skills/testing-red-green-verifier-gates
  (both provisional); STATE trimmed; index refreshed; gap check = only the
  benign UTC/local date-skew artifact. Recovered from a concurrent-session
  checkout→main mid-pass (no loss). See journal/2026-05-18 [04:10].

## [2026-05-18] promotion | develop → main (brain live in production)
- Recovered concurrent-session tree collision (no loss), then promoted:
  origin/main d00ef4e (Merge branch 'develop') carries full brain +
  consolidation. Brain now on both branches. See journal/2026-05-18 [04:20].

## [2026-05-18] tooling | Organized worktree helper + archive cleanup
- scripts/wt.ps1 (7672662) — sibling container ../yls.worktrees + enforced
  naming; smoke-tested. Recovery draft archived. Both [04:20] threads closed.
  See journal/2026-05-18 [04:34].

## [2026-05-18] docs | Worktree workflow in root CLAUDE.md
- ae59e91 — Branch Strategy now points at scripts/wt.ps1 + no-shared-tree
  rule. Concurrent-session hazard mitigated end-to-end. See [04:37].

## [2026-05-18] fix | Brain hooks cwd-independent ($CLAUDE_PROJECT_DIR)
- f69508e — all 3 hook launch paths anchored to $CLAUDE_PROJECT_DIR;
  persisted shell `cd` no longer breaks Stop-hook resolution. Verified
  from dev-docs/ (the break cwd). See journal/2026-05-18 [02:28].

## [2026-05-18] feature | YLS Brain knowledge layer shipped
- knowledge/{orientation,superseded,features,roadmap}.md + kind:knowledge
  schema + mechanical consolidation clause + verify-knowledge.js gate.
  Code-verified 49 BUILT/12 PARTIAL/3 UNVERIFIED; memory overrides stale
  dev-docs (5 deltas + 5 flagged). Commits 6b5ec5b…c6f38d5. ALL VERIFY
  GREEN. See journal/2026-05-18 [13:55].

## [2026-05-18] consolidation | Post knowledge-layer
- Mechanical reconcile = no app-source drift (clean). Promoted
  testing-red-green-verifier-gates provisional→established (independent
  reapplication). Repaired poisoned .brainstate watermark; brain-lib
  ledger-ts hardening logged as next/open. See journal/2026-05-18 [14:00].

## [2026-05-18] design | Portable Project Brain System spec'd (external)
- Brainstorm→spec for generalizing the brain into vendored per-project
  system at external _brain/ repo (aa02b74). One-tier+Seam stub; YLS→
  instance #1 (future); principle D (structure≠truth) institutionalized.
  No YLS code changed. See journal/2026-05-18 [17:44].

## [2026-05-18] feature | _brain system built; YLS = instance #1
- Built portable engine/CLI/tests in external _brain (instance #0
  dogfooded); YLS adopted via brain sync (ef9b5be) — shared engine,
  vault byte-unchanged, ALL VERIFY GREEN. ~12 defects caught in review.
  Phase 7 (docs+tag, in _brain) remains. See journal/2026-05-18 [20:56].

## [2026-05-18] consolidation | Post _brain build / instance #1
- No app drift (knowledge stays current); no new YLS skill (reasoned);
  3 Seam candidates flagged; ledger-poisoning open thread CLOSED (adopted
  engine carries the fix). See journal/2026-05-18 [21:00].

## [2026-05-19] reconcile | Knowledge F1–F5 CONFIRMED
- Independently re-verified the 5 doc-vs-code flags vs current code, then
  user-confirmed → superseded.md F1–F5 provisional→CONFIRMED; features/
  roadmap wording reconciled; YLS ALL VERIFY GREEN. No app code changed.
  See journal/2026-05-19 [21:26].

## [2026-05-19] docs | Global Rule 11 — _brain self-discovery (option a)
- User-authorized stanza in ~/.claude/CLAUDE.md: every session/any repo
  self-discovers _brain + honors an installed brain; never proactively
  offers bootstrap (passive, user-initiated). Global file not repo-tracked.
  See journal/2026-05-19 [23:41].
- 2026-05-19 [03:10] Artwork Designer Overhaul 15-phase impl — branch feature/artwork-designer-overhaul (618006b..2e45a39), local-only; gated green per phase. See journal [03:10].
- 2026-05-19 [03:40] Consolidation post artwork-designer overhaul — 2 skills added, features.md needs-reconcile, index/STATE refreshed (develop, post 992178b).
- 2026-05-21 [01:30] Release develop -> main — brain sync e83f884 on develop pushed; --no-ff merge 91fcb60 on main pushed (artwork designer overhaul + brain v0.1.0 + knowledge + Rule 11 + MCP fix all on main).
- 2026-06-12 [00:00] Reconcile + consolidation — features.md Design rows re-audited vs code (58 modules, pdf-lib preview non-stub) -> status: current, BUILT 49->54; roadmap dossier-citation nit fixed; index/STATE refreshed; gap check clean.
- 2026-06-12 [01:00] Feature audit + recommendations — 4 Explore agents + P0 spot-checks; report at docs/temp/yls-feature-audit-report.md (DONE 54 / PARTIAL 19 / NOT BUILT 13; P0 checkout breaks verified; 6-sprint plan). 1 false agent claim caught.
- 2026-06-13 [prod-readiness] Phases 0-3 shipped to feature/production-readiness (commits 0940942..d0a151d): unbreak checkout, close-the-loop (proof->approve->capture, email, real AccuZip), hardening (webhook retry/DLQ, payment integrity, mapping gate, rate-limit). 136 tests passing, 0 new typecheck, build green. +2 security fixes (email injection, payment IDOR + fail-closed rate-limit). DB identity resolved: app uses lmtpfgfulkynrktdkgpu (JWT-proven), not jgkkcr. PAUSED on owner blocker: migrations unapplied + browser smoke pending; Phases 4-7 + D1-D8 remain.
- 2026-07-31 [01:18] Full codebase-vs-dev-docs audit + doc reconciliation — 3-agent audit, delta re-verified vs 2026-06-14 report; NEW authoritative dev-docs/implementation-status.md; 13 dev-docs bannered; README v2.0; knowledge features/roadmap -> 2026-07-31, superseded D5 updated; project CLAUDE.md de-staled; 2 typecheck regressions fixed. Gates: 199 tests, typecheck:full 0, build 0. Commit 79572ed (develop). See journal/2026-07-31.
- 2026-07-31 [08:05] Vendor fulfillment loop built (feature/vendor-fulfillment, 16 commits 98216ed..4b81cba): dispatch core+service, order_dispatches, admin dispatch API+panel, inline-payment refactor (payment_transactions eliminated), vendor directory + authenticated /api/vendors. Found orders.updated_at does not exist (6 broken call sites incl. Stripe webhook backstop). Gates: 230 tests, typecheck:full 0, build 0. Storage/CSV leg UNVERIFIED (local storage container health). See journal/2026-07-31.
- 2026-08-01 [12:40] Money-moment confirmations + Redstone Phase 1 (feature/vendor-fulfillment, fb8e19e + a0f7d56): review step's 4 checkboxes -> 2 ENFORCED (UI had demanded 4 while the gate accepted 2); ConfirmActionDialog in front of both money moments (capture had none, reject had a window.confirm - backwards). Redstone: dev-docs/api-redstone.md proven FABRICATED (wrong host/endpoint/key format); real spec is the vendor PDF; key authenticates but createOrder returns opaque HTML 500 for all 4 payload shapes, then the key started being rejected after ~8 posts (rate/abuse guard) - probing STOPPED. Likely un-provisioned endpoint per spec 4.1/4.2. Gates: 258 tests, typecheck:full 0, build 0. See journal/2026-08-01.
- 2026-08-02 [00:20] Redstone outreach email + push — three commits pushed (0958a71..9a9de3d), PR #24 updated. Drafted the Redstone email that probing made the critical path: leads with our own provisioning hypothesis (spec 4.1/4.2), lists all 4 payload shapes already tried, cites test order IDs YLS-APITEST-20260801-A..E, proposes shared-secret/HMAC for webhook auth. Reissued as plain text per owner (no em dashes, no markdown, no hard wrapping; verified by grep). GOTCHA: docs/temp/ is gitignored (.gitignore:74), so the draft is local-only and git add -A skipped it silently. See journal/2026-08-02.
- 2026-08-02 [16:10] Pre-merge browser smoke of PR #24 + 2 fixes (3c71149, bb3ef5a) — archived the fabricated api-redstone.md to archive/api-redstone-fabricated-2026-08/ w/ evidence README, updated all refs. CDP healthy: verified proof-page approve dialog CAPTURED $118 for real (processing/captured/amount_captured=118/captured_at stamped), reject dialog inert on cancel, review step gate holds at 0 and 1 of 2 checkboxes, payment hold dialog submitted order 12e011fd authorized, manual-entry wipe bug still fixed, 2 design variables detected. FOUND+FIXED: pricing line rendered "Base printing (1.180 x 1) $0.45" (used all-in pricePerPiece to label the printing line); stale ExternalLink icon on Add New Payment Method (now an in-page dialog). NOT eye-verified: the icon swap (Fast Refresh resets wizard). GOTCHA: walking the wizard needs ACCUZIP_API_KEY blanked or every address is undeliverable — .env.local backed up and hash-verified restored. Gates: typecheck:full 0, 258 tests, build 0. See journal/2026-08-02.
- 2026-08-02 [17:40] Ultrareview PR #24: 8 findings, all verified real, all fixed (+1 more found) — SECURITY: (a) IDOR/cross-tenant PII — loadRecipients read mailing_list_records by a customer-supplied selectedListId via the service role (RLS bypassed) with NO ownership check; /api/orders/submit takes orderState as z.record(z.unknown()) so the id was attacker-controlled. Ported the accuzip-upload gate into new lib/fulfillment/dispatch-recipients.ts, keyed on order.created_by (not the actor). (b) CWE-1236 CSV formula injection — csvCell escaped only ",\n\r so =WEBSERVICE(...) in a first_name reached the vendor's Excel; added neutralizeSpreadsheetFormula, applied in both CSV builders (must run LAST in sanitizeRedstoneCell or the ["',] strip eats the guard). MONEY: refundPayment overwrote the cumulative amount_refunded, so a 2nd partial refund erased the 1st and admin revenue over-reported; extracted pure resolveRefundState + 6 tests. BONUS (not in review): refundOrder cancelled the order on ANY refund incl. a $1 partial — now gated on isFullRefund. NITS: dispatch race 500->409 regex, CAS guard on updateDispatchStatus (dupe shipped emails), Redstone package jsonb overwrite losing csvPath/proofPath, stale analytics comment, dispatch-service 426->264 LOC via 2 extractions. GOTCHA: PowerShell Measure-Object -Line does NOT count blank lines — it under-reported the file by 49 and nearly had me tell the owner the review was wrong; use [IO.File]::ReadAllLines().Count. Gates: typecheck:full 0, 269 tests (+11), build 0, eslint 0 new errors. Uncommitted. See journal/2026-08-02.
- 2026-08-02 [22:26] PR #24 MERGED to develop (dca90eb, merge commit). GOTCHA worth more than the merge: this repo is wired to THREE Vercel projects, TWO named `yellowlettershop`. Real one = prj_snSyPlSbgjz6sd6hql7JTdfm9mt2 under team_9aYvnhHwLiazNz7OoE8BsRVC (slug robs-projects-c72886ba) — owns app.yellowlettershop.com, matches .vercel/project.json, green. Decoys: `yls` (same team, no domain, fails EVERY commit on missing Supabase env vars at /api/access-control/activity) and a second `yellowlettershop` on a different account (robs-projects-d8ad5232, 403 for this login). GitHub keys commit statuses by CONTEXT STRING, so both `yellowlettershop` projects publish `Vercel – yellowlettershop` and overwrite each other — green on b8836b5, red on cdb2274, same code. I wrongly attributed the red to my own commits and blocked the merge on it; corrected by resolving dpl_9jTg7y2zKtmzh9PC6Y3Htpsu4Hdb -> githubCommitSha cdb2274 + state READY. RULE: before blaming a code change for a red Vercel check, resolve the deployment to its commit SHA and publishing account. See journal/2026-08-02.
- 2026-08-02 [22:50] Vercel decoys DELETED by owner — only `yellowlettershop` (prj_snSyPlSbgjz6sd6hql7JTdfm9mt2, team_9aYvnhHwLiazNz7OoE8BsRVC, owns app.yellowlettershop.com) remains; verified via list_projects (`yls` gone). Use it at all times. NOTE: commit statuses on dca90eb and earlier still carry a frozen `Vercel - yls: failure` — GitHub statuses are immutable history, not live signal; commits from here forward report only `Vercel - yellowlettershop`. Persisted to memory:project-vercel-project so this is not re-derived.
