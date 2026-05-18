---
type: skill
area: testing
status: active
confidence: provisional
updated: 2026-05-18
sources: [[journal/2026-05-18]]
---
# Red→green standalone verifier scripts as phase gates

## When to use
Delivering work the project's own test framework does NOT cover — e.g.
`.claude/` tooling, hooks, scaffolding, config, repo-structure invariants
(yls Mocha does not see `.claude/` scripts). Also when executing a multi-phase
plan via subagent-driven-development and each phase needs an objective
pass/fail gate.

## The approach
- For each phase, write a tiny standalone Node verifier (`'use strict';`,
  CommonJS, Node-core only) that asserts the phase's structural/behavioral
  invariants and `process.exit(0|1)` with a one-line `X OK` / `X FAIL: …`.
- Run it RED *before* implementing (proves the gate discriminates), implement,
  run GREEN after. Keep prior phases' verifiers and re-run them every phase as
  a regression suite (`structure && schema && hooks && settings`).
- A behavior verifier that simulates the real system must run in an isolated
  sandbox (`fs.mkdtempSync(os.tmpdir(),…)`) with `try/finally` teardown — it
  must never read/write/delete the real workspace it is testing.
- Compare on a stable basis: never compare a UTC-coerced wall-clock string to
  a real UTC timestamp; reduce to date-strings or a single time frame.
- When fixing a defect found in review, route the fix back through the
  implementer subagent (don't hand-patch from the controller) so the
  spec→quality review loop stays intact and context isn't polluted.

## Pitfalls & anti-patterns
- Plan-verbatim test/harness code can carry latent defects (a harness that
  mutates real state; a brittle timestamp compare). Trace the harness logic
  before trusting "it's from the approved plan."
- A verifier that leaves fixtures behind in the real tree (non-idempotent,
  may leak a planted-secret fixture into git). Make teardown unconditional.
- Hand-patching controller-side to "save a round trip" — loses the review gate
  and is how defects ship.
- Case-sensitive token gates vs prose (`no-op` vs `No-op`): make the content
  satisfy the gate, or the gate never goes green.

## Evidence
- [[journal/2026-05-18]] [03:20]: 4 red→green verifiers gated Phases 1–5;
  `verify-structure && verify-schema && verify-hooks && verify-settings` →
  `ALL VERIFY GREEN` (each exit 0); 3 real plan defects caught at their gate
  (sandbox data-loss, UTC covering, post-tool-use `cwd` omission caught by an
  implementer BLOCK); final acceptance ACCEPTED on all spec §12 criteria.

## Revision log
- [2026-05-18] Created from first consolidation. Single (but multi-phase,
  strongly evidenced) task context — the brain bootstrap. `provisional` per
  the Evidence rule; promote to `established` when the pattern is reapplied in
  a separate, independent task/session.
