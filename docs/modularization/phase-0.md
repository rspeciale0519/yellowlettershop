# Modularization — Phase 0 (Foundations)

Status: INITIATED
Branch: `feat/mod-phase-0-foundations`

## Baseline audit
- Tests: PASS (Mocha harness) — see `tests/` (28 passing)
- Lint: TBD
- Typecheck: FAIL (existing project errors; ~96 across 19 files). No changes in Phase 0 will modify TS.
- Gemini LOC audit (>300 LOC): Completed; see CLI output captured during baseline.

## Scope
- Add README-only scaffolding:
  - `components/list-builder/common/` — shared filter primitives
  - `hooks/filters/` — shared hooks
  - `components/table/` — table building blocks
  - `lib/mappers/` — pure data mappers
  - `lib/errors/` — error normalization

No behavior changes; no TypeScript code introduced in Phase 0.

## Acceptance criteria
- Directories created with clear conventions and APIs documented.
- No runtime changes; test suite remains green.
- Pre/Post Gemini audit available for later phases.

## Next steps
- Phase 1A: begin extracting List Builder domains into subcomponents that consume these primitives and hooks.
- Optional: add CI jobs for lint and typecheck (non-blocking until type errors are addressed).
