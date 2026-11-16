---
name: verify-yls
description: Use when verifying The Yellow Letter Shop Next.js web app (localhost:3010 — home, auth modal, templates, campaign/order, mailing lists) before claiming work is done, after UI/API/auth/order changes, or when a user-facing flow needs proof.
---

# Verify Yellow Letter Shop

Prove a change on the real user path before saying it works. This app is **The Yellow Letter Shop**: Next.js 15 App Router on port **3010**, Supabase Auth/Postgres, Stripe **test-mode only**. There is no Playwright/Cypress suite. CI runs Mocha unit tests only.

**Do not** name the print vendor. **Do not** touch hosted Supabase, live Stripe, or production data. **Do not** run `npm audit fix --force`.

The maintain-verification-skill process keeps the feature map in `features/` current. After any user-visible change, update the matching feature file (selectors, routes, gotchas, observable end state) in the same PR.

## Static gates

CI is `.github/workflows/test.yml`. It runs on Node **18**, Ubuntu and Windows:

```bash
npm ci
npm test
```

That is the only CI gate. Lint, typecheck, and build are **not** in CI. `AGENTS.md` still requires them for application changes. A green `next build` is **not** type or lint evidence: `next.config.mjs` sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds`.

Run from the repo root. Record full output under `.verify-artifacts/`.

| Gate | Command | Expected pass | CI? |
|---|---|---|---|
| Install | `npm ci` | Exit 0. Lockfile install; no `package.json` drift. | Yes |
| Tests | `npm test` | Exit 0. Mocha spec reporter. `passing` with **0 failing**. Count moves with the suite (290 passing on 2026-11-16). | Yes |
| Typecheck | `npm run typecheck:full` | Exit 0. `tsc --noEmit -p tsconfig.fullcheck.json`, no errors. | No — required by AGENTS.md |
| UI typecheck | `npm run typecheck:ui` | Narrower `tsconfig.typecheck.json`. Do not substitute for full. | No |
| Lint (changed files) | `npx eslint <changed-paths>` | 0 errors on files you touched. | No |
| Lint (repo-wide) | `npm run lint` | `eslint . --ext .js,.jsx,.ts,.tsx`. Currently **fails** with pre-existing issues (38 errors / 955 warnings on 2026-11-16). Do not treat a dirty full lint as a new regression unless your files added it. | No |
| Build | `npm run build` | Exit 0 (`next build`). Confirm typecheck and tests separately. | No |

Mocha config: `.mocharc.json` → `tests/**/*.test.ts` via `tests/setup/register.js` (`ts-node` **transpileOnly**). `npm test` does not prove types. There is a leftover Jest config; it is not wired to a script. There are no Playwright/Cypress specs. SQL assertions (`npx supabase db query --local -f supabase/tests/<file>.sql`) need local Supabase; skip them when Docker is unavailable.

Do not run hosted migrations (`scripts/apply-prod-migrations.mjs`, `--linked`, `db-migrate-prod.yml`).

## Launch

Verification server is **port 3010**. `package.json` `dev` is `next dev -p 3010`. `npm start` has no port flag (defaults to 3000) — do not use it.

`./scripts/launch.sh` runs **`npx next start -p 3010`** after `npm run build`. Chrome 157 on this VM throws `SyntaxError: Invalid or unexpected token` on webpack-eval client chunks from `next dev`, so the auth modal never hydrates. Production bundles do. Set `VERIFY_NEXT_DEV=1` only for SSR-only checks. Rebuild after changing `NEXT_PUBLIC_*` in `.env.local`.

```bash
# Env: copy names from .env.example into gitignored .env.local.
# Ports in .env.example (54321 / localhost:3000) are stale.
# Authoritative local ports: package.json `dev` = 3010;
# supabase/config.toml API = 62440, db = 62441, Studio = 62444.
# Stripe keys must start with sk_test_ / pk_test_ only.

npm run dev
# → next dev -p 3010
```

Required env var **names** (values live in `.env.example`; never commit secrets):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (local only: `postgresql://postgres:postgres@127.0.0.1:62441/postgres`)
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL` (use `http://localhost:3010`, not the `:3000` in `.env.example`)

Helper (records PID, waits until the homepage is actually usable):

```bash
./.cursor/skills/verify-yls/scripts/launch.sh
```

**Ready** means all of:

1. Something is listening on `127.0.0.1:3010`.
2. `GET /` returns HTTP 200.
3. The HTML includes `Streamline Your Direct Mail Campaigns` (the home `<h1>` in `app/page.tsx`). A TCP accept or a compile overlay is not ready.

**Supabase locally:**

```bash
./.cursor/skills/verify-yls/scripts/local-supabase.sh
```

That is `npx supabase start` after fixing nested-Docker ICC (`bridge-nf-call-iptables=0`, `iptables-legacy FORWARD ACCEPT`). Without the ICC fix, GoTrue/storage/realtime TCP to `supabase_db_yls:5432` times out even though the host can reach `:62441`. Never `--linked`. Never a hosted project.

Local API is `http://127.0.0.1:62440`. Seed: `supabase/seed.sql` via `config.toml` `[db.seed]` (currently comments only). Point `.env.local` at `npx supabase status -o env` (`ANON_KEY` / `SERVICE_ROLE_KEY` / `API_URL`). Restart `npm run dev` after changing keys.

SQL assertions:

```bash
./.cursor/skills/verify-yls/scripts/sql-tests.sh
# equivalent: npx supabase db query --local --agent=no -o table -f supabase/tests/<file>.sql
```

**When Docker/Supabase is not available:** do not start a hosted project and do not run migrations. Put placeholder local URL/anon values in `.env.local` so the Next process can boot. Then:

- Public UI still works: `/`, `/templates`, `/?auth=login`, `/?auth=signup`.
- Auth **sign-in itself** cannot succeed (no GoTrue). Record that as unverified; do not fake a session.
- `/dashboard/*` is middleware-protected (`middleware.ts` matcher) and will redirect to `/?auth=login`.
- `/orders/new` is **not** in that matcher; the stepper UI renders without a session. APIs, AccuZip, Stripe, and list pickers will fail. Drive the UI and stop before payment.

**Two instances:** `npm run dev` is hardcoded to 3010. A second process on the same checkout will collide on port and `.next`. Use another port (`npx next dev -p 3011`) in a **separate git worktree**, not a second process in the same tree.

**Teardown:** `./.cursor/skills/verify-yls/scripts/cleanup.sh` (PID only; keeps `.verify-artifacts/`).

## Doctor

Read-only check that this process is ours and is actually serving YLS:

```bash
./.cursor/skills/verify-yls/scripts/doctor.sh
```

Pass: PID file process is alive (if this run started it), port 3010 belongs to that PID, `GET /` is 200, body contains `Streamline Your Direct Mail Campaigns` and `Yellow Letter Shop Logo`. Fail if the port is a different app or the homepage heading is missing.

## Drive

No repo Playwright/Cypress runner. This skill ships a Node harness that uses `fetch` plus headless Chrome (`/opt/google/chrome/chrome` or `google-chrome-stable`, not a wrapper that pins `--remote-debugging-port`) for hydrated DOM and screenshots. One-shot `--screenshot` / `--dump-dom` is used for public pages. Signed-in journeys use Chrome DevTools (CDP) in `chrome-session.mjs` so the harness can type, click, and upload files, then **Browser.close**. Chrome often hangs on dbus if left running; never leave a stray Chrome after a drive. `@playwright/mcp` in `package.json` is an editor MCP, not a test suite. Prefer the real Chrome binary: `/usr/local/bin/google-chrome` on this VM is a wrapper that forces port 9399 and a shared profile.

```bash
# Drive one mapped feature (required on every verification)
node .cursor/skills/verify-yls/scripts/drive.mjs --feature home
node .cursor/skills/verify-yls/scripts/drive.mjs --feature auth
node .cursor/skills/verify-yls/scripts/drive.mjs --feature templates
node .cursor/skills/verify-yls/scripts/drive.mjs --feature campaign-order
node .cursor/skills/verify-yls/scripts/drive.mjs --feature mailing-lists
```

Stable selectors (from current source — no `data-testid` on these public flows except mailing-list manager):

| Surface | Route | Drive with |
|---|---|---|
| Home | `GET /` | Role/heading `Streamline Your Direct Mail Campaigns`; links **Start a New Design** → `/design/customize`, **Get Some Inspiration** → `/templates`; **New Campaign**; `#pricing` **Transparent Pricing**. Header **Sign In** only after `getSession()` (needs local Supabase). |
| Auth | `/?auth=login` or `/?auth=signup` | Dialog title `Welcome back` / `Create your account`; `#login-email` labelled **Email Address**; `#login-password` labelled **Password**; submit **Sign In**; Google `aria-label="Sign in with Google"`; signup `#signup-email`, `#signup-password`, `#agree`, submit **Create Account**. With local GoTrue, `drive.mjs --feature auth` also signs up and screenshots `/dashboard` (`Total Orders` / `Recent Orders` → `dashboard.png`). |
| Templates | `/templates` | After ~1s spinner `Loading templates...`, heading **Template Gallery**; search `aria-label="Search templates"` |
| Campaign / order | Header **New Campaign** → `/new-campaign` (auth) or `/orders/new?source=dashboard_create_new` | **Create New Campaign** / **Create New Order**; step 1 heading **Data & Mapping**; buttons **Upload File**, **Existing List**, **Manual Entry**; tabs `1. Select Data Source`, `2. Map Columns`; continue **Continue to Address Validation** |
| Mailing lists | `/mailing-services/mailing-list-manager` | Authenticated: `h1` **Mailing List Manager**, `data-testid="add-button"`, `data-testid="upload-button"`, `data-testid="view-mode-toggle"`. Unauthenticated: `FeatureAuthGuard` with `redirectToAuth` sends `/?auth=login&redirectedFrom=/mailing-services/mailing-list-manager`. **Add List is a mock** (no INSERT). Real save: signed-in `POST /api/orders/upload-list` (same JSON the order wizard sends). Dashboard `<Link>` / `Page.navigate` to `/orders/new` is unreliable here — the harness persists from `/dashboard` then opens the manager in a new Chrome target. Proof: `mailing-list-manager.png` + local `mailing_lists` row (`mailing-list-db.txt` / `.png`). |

Cover, as far as test mode allows: homepage loads → open sign-in/sign-up → campaign/order through Data & Mapping. **Do not** submit Stripe payment. **Do not** dispatch to a print vendor.

Feature recipes: `features/`. Never weaken a journey to make it pass — log blockers under Gotchas.

## Evidence

Write everything to **`.verify-artifacts/`** (gitignored).

Capture:

- Terminal: `install.log`, `test.log`, `typecheck.log`, `lint.log`, `build.log`, `dev.log`, `doctor.log`, `drive-<feature>.log`
- HTTP: status + response snippet (`home.html`, `drive-<feature>.json`)
- Screenshots: `home.png`, `auth-login.png`, … (Chrome headless)
- DOM dumps: `home.dom.html` for selector proof after hydration
- Side effects when the journey reaches them: new `mailing_lists` rows on **local** Postgres only (`127.0.0.1:62441`, `docker exec supabase_db_yls psql`). Never query hosted Supabase.
- SQL assertions: `sql-tests.log` plus `sql-tests.png` (screenshot of that log).

Proof rules:

1. Real user path (`/`, `/?auth=login`, `/templates`, `/new-campaign`, `/orders/new`). Not a test-only endpoint.
2. Check side effects, not only HTTP 200.
3. For dry-run / missing Supabase / Stripe test mode, **observe what was skipped** and write it in `drive-<feature>.json` → `skipped`. Examples: GoTrue sign-in skipped without local API; PaymentIntent skipped without `sk_test_`; print dispatch skipped with no active vendor row.

## Cleanup

```bash
./.cursor/skills/verify-yls/scripts/cleanup.sh
```

Kills **only** the PID/PGID in `.verify-artifacts/dev.pid` (and its children). Never `pkill node` / `pkill next`. Leaves screenshots, logs, and JSON in place. Confirm after cleanup:

```bash
test -d .verify-artifacts && ls -la .verify-artifacts
kill -0 "$(cat .verify-artifacts/dev.pid)" 2>/dev/null && echo STILL_RUNNING || echo STOPPED
```

## Helpers

All scripts are executable. Run from repo root.

```bash
./.cursor/skills/verify-yls/scripts/local-supabase.sh
./.cursor/skills/verify-yls/scripts/launch.sh
./.cursor/skills/verify-yls/scripts/doctor.sh
./.cursor/skills/verify-yls/scripts/sql-tests.sh
node .cursor/skills/verify-yls/scripts/drive.mjs --feature home
node .cursor/skills/verify-yls/scripts/drive.mjs --feature auth
node .cursor/skills/verify-yls/scripts/drive.mjs --feature mailing-lists
./.cursor/skills/verify-yls/scripts/cleanup.sh
```

`drive.mjs` flags: `--feature <home|auth|templates|campaign-order|mailing-lists>`, `--base-url http://127.0.0.1:3010`, `--out .verify-artifacts`.
