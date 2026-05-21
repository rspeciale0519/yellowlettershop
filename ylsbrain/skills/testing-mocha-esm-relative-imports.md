---
type: skill
area: testing
status: active
confidence: provisional
updated: 2026-05-19
sources: [[journal/2026-05-19]]
---
# Mocha 11 + Node 22: relative test imports + transpileOnly bootstrap

## When to use
Adding/repairing Mocha tests in a TS repo on Mocha ≥11 + Node ≥22 (ESM
loader), ESPECIALLY when the repo's `tsc` baseline is already broken or the
`tests/setup/*` harness referenced by `.mocharc.json` is missing.

## The approach
- **Bootstrap:** one CommonJS shim `tests/setup/register.js` (loads before any
  `.ts`) that programmatically `require('ts-node').register({ project:
  tests/tsconfig.mocha.json, transpileOnly: true, compilerOptions:{module:
  'commonjs'} })` then `require('tsconfig-paths').register({ baseUrl: repoRoot,
  paths:{'@/*':['./*']} })`. `.mocharc.json` → `"require":
  ["./tests/setup/register.js"]` (note the leading `./` — Mocha 11 treats a
  bare `tests/...` require as a *package* and throws `ERR_MODULE_NOT_FOUND
  Cannot find package 'tests'`).
- `tests/tsconfig.mocha.json` extends root but forces `module:commonjs`,
  `jsx:react-jsx`, `esModuleInterop`, `skipLibCheck`. `transpileOnly:true` is
  the load-bearing flag: tests EXECUTE even though the repo's types are red.
- **Test files import targets by RELATIVE path** (`../../components/...`), not
  the `@/` alias. Under Mocha 11/Node 22 the ESM loader resolves spec files and
  cannot honor tsconfig-paths for a bare `@/...` specifier
  (`Cannot find package '@/components'`); relative paths resolve under both
  CJS and ESM. Keep unit-tested modules dependency-light / alias-free so a
  relative import pulls no `@/` chain.
- Co-locate? No — `.mocharc.json` `spec` globs `tests/**`; put tests there
  mirroring the source path (`tests/designer/x.test.ts`). Drop an unused
  `.test.tsx` spec glob to keep output pristine.

## Pitfalls & anti-patterns
- `--require tests/setup/x.ts` (no `./`) → ESM treats `tests` as a package →
  whole runner dies before any test. Always `./`-prefix local requires.
- `@/` alias in a test import → `ERR_MODULE_NOT_FOUND` for `@/components` even
  with tsconfig-paths registered (ESM loader bypasses the CJS hook). Use
  relative.
- Trusting "co-located `.test.ts`" because a CLAUDE.md/global rule says so —
  verify `.mocharc.json` `spec` first; the runner's glob wins.
- Type-checking on in ts-node (no `transpileOnly`) → a pre-existing-red repo
  can't run ANY test. transpileOnly decouples execution from type health
  (type safety is gated separately — see [[skills/build-preexisting-red-delta-gate]]).

## Evidence
- [[journal/2026-05-19]] [03:10]: harness absent → rebuilt
  `tests/setup/register.js` + `tests/tsconfig.mocha.json` + trimmed
  `.mocharc.json`; first `@/`-import test RED with `Cannot find package
  '@/components'` (wrong reason) → switched to relative → RED for the right
  reason (file missing) → GREEN. ~71 new tests executed across 15 phases on a
  repo whose `typecheck:ui` stayed red; `npm test` 0 regressions every phase.

## Revision log
- [2026-05-19] Created from the artwork-designer overhaul consolidation.
  Single (multi-phase, strongly evidenced) task context. `provisional` per the
  Evidence rule; promote when reapplied in a separate independent session.
