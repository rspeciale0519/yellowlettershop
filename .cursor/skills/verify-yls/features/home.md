# Home

Public marketing homepage. Server Component in `app/page.tsx`. Logged-in visitors are sent to `/dashboard`.

## Sub-features

- Hero heading and supporting copy
- Two campaign cards: start a design, browse templates
- Header: logo, nav (New Design, Templates, Build a List, Mailing List Manager, Pricing), **New Campaign**, **Sign In**, **Get Started**
- Pricing block `#pricing` (**Transparent Pricing**, letter and postcard tables)

## How to get to it (user POV)

1. Open http://localhost:3010/
2. If you are signed in you will not stay here — you land on `/dashboard`. Sign out (header **Log out**) to see the marketing page.
3. Use **Start a New Design** / **Get Some Inspiration**, or header **Sign In** / **Get Started** / **New Campaign**.

## Driving it with the verify-yls harness

```bash
./.cursor/skills/verify-yls/scripts/doctor.sh
node .cursor/skills/verify-yls/scripts/drive.mjs --feature home
```

Assertions:

- `GET /` HTTP 200
- HTML contains `Streamline Your Direct Mail Campaigns` and `Yellow Letter Shop Logo`
- Hydrated DOM contains **Start a New Design**, **Get Some Inspiration**, **New Campaign**, **Transparent Pricing**
- **Sign In** is required when local Supabase answers `getSession()`; without it the harness records a skip (header stays on placeholders)
- Links: `/design/customize`, `/templates`
- Screenshot: `.verify-artifacts/home.png`

## Gotchas

- Header auth chrome is client-hydrated (`components/layout/header.tsx`). Until `getSession()` returns, **Sign In** / **Get Started** are `animate-pulse` placeholders. Without local GoTrue (`127.0.0.1:62440`) that call can hang — **Sign In** never appears. Record that skip; do not treat card copy **Get Started** as the header signup button.
- Headless Chrome on this environment writes `--screenshot` / `--dump-dom` then hangs on dbus. The harness SIGTERMs **its own Chrome PID/group** once the artifact exists. Never `pkill chrome`.
- `.env.example` `NEXT_PUBLIC_APP_URL` says port 3000; the real dev port is **3010**.
- Missing/invalid Supabase env: `createServerClient()` throws, catch still renders the page.
- Authenticated `getUser()` success **redirects away** — a dashboard screenshot is not proof of home.
- No seed data required.

## Observable end state

An anonymous visitor sees the hero heading, both campaign cards, **New Campaign**, and **Transparent Pricing**. Evidence: HTTP 200 + `home.png` + `home.dom.html` with those strings. Header **Sign In** is part of the same page but only after `getSession()`; without local Supabase record it skipped. The page is usable, not just listening on 3010.
