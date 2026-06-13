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
