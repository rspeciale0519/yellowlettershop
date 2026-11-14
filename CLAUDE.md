# Yellow Letter Shop Repository Instructions

Global instructions apply. This file adds repository facts and repository-specific rules.

## Scope and Evidence

- This repository contains one application.
- Use current code, tests, manifests, and workflows before planning documents.
- Read `dev-docs/implementation-status.md` when product orientation is needed.
- Verify status-document claims against current code before relying on them.
- Treat other `dev-docs/` planning files as historical unless current code confirms them.

## Skill Selection

- Prefer project skills when global skills conflict with this repository's implementation.
- Use `design-guide` for UI changes within the existing application style.
- Use `frontend-design` when a new page or requested redesign needs a distinct visual direction.
- Use `shadcn` for component APIs or registry work, not every task in a project with `components.json`.
- Load additional skills only when their specific guidance is needed.
- Do not use the global `fullpush` workflow here; it assumes `develop` promotion and staging all changes.
- Skills do not expand Git, dependency, or production authorization.
- Keep shared project skill instructions aligned between `.agents/skills/` and `.claude/skills/`.

## Repository Facts

- Use npm with `package-lock.json`.
- The application uses Next.js 15 App Router, React 18, TypeScript 5, and Tailwind CSS 3.
- The backend uses Next.js API routes and Supabase PostgreSQL.
- Use Supabase JS, Auth, Storage, and RLS.
- Do not introduce Prisma, NextAuth, or Fancy Product Designer assumptions.
- The designer is a custom React implementation.
- Payments use Stripe manual capture.
- The revenue model is transactional.
- Do not build new subscription behavior from legacy subscription code.
- Platform roles are `admin` and `super_admin`.
- Team roles are `owner`, `admin`, and `member`.

## Important Paths

- `app/` contains pages, layouts, and API routes.
- `components/` contains feature components and shared UI.
- `lib/` contains domain services, integrations, and server logic.
- `hooks/`, `types/`, and `utils/` contain shared application code.
- `tests/` contains Mocha tests grouped by feature.
- `supabase/migrations/` contains ordered SQL migrations.
- `supabase/tests/` contains SQL assertion tests.
- `dev-docs/` contains product and architecture documentation.
- `archive/` contains inactive material and is not active source.

## Commands

- Run `npm ci` for a lockfile-based installation.
- Run `npm run dev` for local development at `http://localhost:3010`.
- Run `npm run typecheck:full` for the authoritative TypeScript check.
- Run `npm run typecheck:ui` only for its narrow UI scope.
- Run `npm test` for the Mocha suite.
- Run `npm run test:watch` for local test iteration.
- Run `npm run test:single -- "<pattern>"` for a matching Mocha test.
- Run `npm run build` for the production Next.js build.
- Run `npm run lint` only for repository-wide lint work.
- Use `npx eslint <changed-paths>` for normal changed-file linting.
- Run `npx supabase start` for the local Supabase stack.

Local Supabase uses these configured ports:

- API: `62440`
- Database: `62441`
- Studio: `62444`
- Inbucket: `62445`

## Tests and Completion Checks

- Mocha loads `tests/**/*.test.ts` through `ts-node`.
- The Mocha bootstrap uses `transpileOnly`.
- Therefore, `npm test` does not replace TypeScript checks.
- The Jest configuration is not connected to a package script.
- Do not assume that Jest or an E2E runner is active.
- CI runs only `npm test` on Windows and Ubuntu with Node 18.
- CI does not run type-checking, linting, building, or SQL assertions.

For application changes:

1. Run the smallest relevant tests.
2. Lint every changed JavaScript or TypeScript file.
3. Run `npm run typecheck:full`.
4. Run `npm test`.
5. Run `npm run build` when bundling or runtime behavior can change.

The Next.js build ignores TypeScript and ESLint failures.
Never use a successful build as evidence that those checks passed.

For a relevant SQL assertion, run:

`npx supabase db query --local -f supabase/tests/<file>.sql`

For UI changes, verify the rendered result at port 3010.
Check interactions, responsive behavior, console errors, and network errors.

## Database, Authentication, and Payment Safety

- Make schema changes through timestamped files in `supabase/migrations/`.
- Include required RLS policies, grants, indexes, and SQL assertions.
- Preserve tenant isolation for every changed table, RPC, storage policy, and route.
- Use backward-compatible migrations and document recovery steps.
- Do not run `supabase db push` against production.
- The production migration chain uses `scripts/apply-prod-migrations.mjs`.
- GitHub runs that script for migrations reaching `main`.
- Treat `--linked`, production migration, and hosted database commands as production actions.
- Get explicit approval before any production database action.
- Treat Stripe captures, refunds, cancellations, and webhook changes as high-risk.
- Do not perform a live payment operation without explicit approval.
- Treat `types/supabase.ts` as generated schema output.
- Do not hand-edit that file.
- Regenerate it through a verified Supabase workflow after approved schema changes.

## API and Source Conventions

- Use TypeScript or TSX for application code.
- Use the `@/` path alias for repository modules.
- Follow the nearest feature’s naming and file-layout pattern.
- Use Tailwind utilities for application styling.
- Validate new or changed request contracts with Zod.
- Apply the correct authentication or administrator wrapper before data access.
- Return stable JSON errors with appropriate HTTP status codes.
- Do not expose provider, database, or secret details in responses.
- Search all consumers before changing routes, schemas, events, or shared types.
- Place Mocha tests under the matching `tests/<area>/` path.
- Keep pure core logic separate when it makes route or integration testing safer.
- Prefer new or substantially rewritten source files near 350 lines.
- Split files by responsibility when practical.
- Do not refactor unrelated legacy files only to meet a line target.

## Generated and Protected Files

Do not hand-edit:

- `.next/`
- `node_modules/`
- `*.tsbuildinfo`
- `next-env.d.ts`
- `types/supabase.ts`
- `.brain.lock`
- sync-managed `.claude/hooks/`

Do not use archived files as current implementation evidence.

## Git, CI, and Deployment

- `origin/HEAD` points to `main`.
- Base approved new work on `main` unless the user names another base.
- Do not infer a `develop` workflow from the current checked-out branch.
- Get separate approval for every branch, commit, push, pull request, merge, or release action.
- For approved parallel work, use `scripts/wt.ps1`.
- Pass `main` explicitly when creating a worktree from the default branch.
- Application production is documented as Vercel.
- No repository GitHub workflow deploys the application.
- Treat `netlify.toml` as unverified legacy configuration.
- Production database migrations run through `.github/workflows/db-migrate-prod.yml`.

## Environment Variables

- Keep local secrets in ignored environment files.
- Never commit or print secret values.
- Read only the values required for the active task.
- Update `.env.example` with placeholders when the environment interface changes.
- Verify local URLs against `package.json` and `supabase/config.toml`.
- Do not assume current `.env.example` ports are correct.

## Project Memory

- `.brain.json` identifies `ylsbrain/` as project memory.
- Follow a runtime-injected brain protocol when it is available.
- Do not infer permission to modify memory files from an unrelated task.
- A user no-write instruction overrides routine journal maintenance.
- `ylsbrain/CLAUDE.md` defines the memory schema for that subtree.
- Do not run brain maintenance commands without an explicit request.
