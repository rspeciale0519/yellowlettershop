---
type: skill
area: build
status: active
confidence: provisional
updated: 2026-05-19
sources: [[journal/2026-05-19]]
---
# Pre-existing-RED baseline → delta-gate, not green-gate

## When to use
Starting multi-phase work in a repo whose `typecheck`/`lint`/`test`/`build`
is ALREADY failing from unrelated pre-existing debt. A "must be fully green"
checkpoint rule is then impossible to satisfy and tempts a huge, risky,
out-of-scope cleanup.

## The approach
- **First action: measure the baseline before touching anything.** Run the
  gate commands; if red, snapshot the exact failing set (e.g. sorted unique
  `error TS…` lines → `docs/temp/typecheck-baseline.txt`).
- **Surface it to the user and get the success definition.** Don't silently
  redefine "done" or silently expand into a repo-wide fix. Offer: (a) delta
  gate, (b) full-green cleanup (state the cascade risk), (c) scoped
  verification. Let them choose.
- **Delta gate** (the usual answer): each checkpoint must add **zero new**
  errors vs the snapshot (`Compare-Object baseline current | where '=>'`),
  **all NEW tests green**, **all prior tests still green**, **build OK**, lint
  clean on *touched* files. The pre-existing N may remain.
- Fix only genuinely in-scope blockers (e.g. a broken test runner the work
  needs) minimally; route around the rest (a thin API/excluded path) rather
  than restoring a large type surface that cascades across dozens of importers.
- Encode the definition in the plan; re-assert it at every checkpoint commit.

## Pitfalls & anti-patterns
- "Restore the missing big type file" → cascades type errors across every
  importer; massive unplanned scope. Prefer an isolated boundary
  (a typecheck-excluded API route returning a clean DTO the client owns).
- Letting a generic `/checkpoint`-style command hard-fail on the pre-existing
  red and block all commits — its all-green assumption doesn't hold; do the
  Rule-8 commit manually with the same message convention, document why.
- Claiming "tests pass" when the runner never ran, or "typecheck clean" when
  it's red — report against the baseline honestly (`0 new vs baseline 12`).
- Treating the pre-existing red as yours to fully fix without authorization.

## Evidence
- [[journal/2026-05-19]] [03:10]: `typecheck:ui` pre-existing RED (12 errors:
  missing `@/types/supabase|list-builder|mailing-records` + column-mapping)
  and Mocha runner absent. Surfaced → user chose "fix runner + delta gate".
  15 phases each: `Compare-Object` baseline→current = **0 new** TS errors,
  full Mocha suite green (0 regressions, ~71 new), `next build` exit 0; one
  build-green commit per phase (`618006b`→`2e45a39`, merged PR #9 `992178b`).

## Revision log
- [2026-05-19] Created from the artwork-designer overhaul consolidation.
  Single (multi-phase, strongly evidenced) task context. `provisional`;
  promote on independent reapplication. Complements
  [[skills/testing-red-green-verifier-gates]] (delta is the gate basis when
  green is unattainable).
