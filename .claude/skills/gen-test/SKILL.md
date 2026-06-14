---
name: gen-test
description: Scaffold a focused Mocha spec for a source module, mirroring the project's tests/ layout and pure-logic conventions. Use whenever the user wants tests for a specific file.
disable-model-invocation: true
---

# Generate Test

Scaffold a Mocha test for one source module, following the project's harness and conventions. The user names the file to cover.

## Usage

The user invokes this with: `/gen-test <path-to-source-file>`

Examples:

- `/gen-test lib/webhooks/retry.ts`
- `/gen-test lib/admin/pricing-service.ts`
- `/gen-test utils/format-currency.ts`

## What this harness can and cannot test

Tests run under **Mocha + `ts-node` in `transpileOnly` mode** (`tests/setup/register.js`). So:

- Cover **pure logic only** — exported functions you call with inputs and assert on outputs. No React rendering, no network, no database, no real timers. Component behavior is verified with chrome-devtools, and type safety via `npm run typecheck:ui` — not here.
- Transpile-only means you can import the specific function under test even if the wider repo has type errors. Import the function directly, not a barrel that pulls in Supabase clients.

If the target file is mostly I/O glue with no extractable pure logic, stop and tell the user — recommend exposing the logic via a small refactor, or chrome-devtools verification. Don't scaffold shallow tests that can't fail.

## Steps

### 1. Read the source module

Read the target file and list its exported, side-effect-free functions. Pick the ones whose behavior is worth pinning (calculations, validation, mapping, parsing, branching on enums/status codes).

### 2. Match existing conventions

Read a nearby spec to copy the style exactly:

```bash
cat tests/lib/webhooks/retry.test.ts
cat tests/designer/background-image-source.test.ts
```

Conventions, non-negotiable for consistency:

- `import { describe, it } from 'mocha'`
- `import { strict as assert } from 'assert'` — use Node `assert`, **not** chai
- Mirror the source path under `tests/`: `lib/webhooks/retry.ts` → `tests/lib/webhooks/retry.test.ts`
- Import the module via matching `../` depth or the `@/` alias
- One behavioral claim per `it`, titled in plain language ("caps at the ceiling")

### 3. Write the spec

Create `tests/<mirrored-path>/<name>.test.ts`. Cover the edges, not just the happy path: boundaries, zero/empty/negative inputs, ceilings/floors, every enum branch, error paths. Keep the file ≤350 LOC — split by `describe` into multiple files if needed.

Every assertion must fail if the behavior regresses. If flipping the implementation wouldn't break a test, delete that test.

### 4. Run and verify

```bash
npx mocha tests/<mirrored-path>/<name>.test.ts
```

Then confirm the whole suite still passes:

```bash
npm test
```

Report the actual output. If a test fails because the **code** looks wrong (not the test), surface it instead of editing the test to pass.

## Key Rules

- Pure logic only — no DB, network, React, or real timers
- Node `assert` (`strict`), never chai
- Mirror the source path under `tests/`; do not co-locate
- Type-check is `npm run typecheck:ui`; the test runner is `npm test`
- Tests obey the ≤350 LOC limit
