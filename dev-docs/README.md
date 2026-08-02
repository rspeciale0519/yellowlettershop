# Yellow Letter Shop (YLS) — Developer Docs

**Version:** v2.0 (reconciled 2026-07-31) · **Maintainer:** support@yellowlettershop.com

Yellow Letter Shop (YLS) is a full-stack SaaS platform for real estate
investors, marketers, and agencies to launch personalized direct-mail
campaigns at scale — list upload/validation, a custom WYSIWYG designer,
Stripe manual-capture checkout, PDF proofing, and fulfillment.

> [!IMPORTANT]
> **Start with [`implementation-status.md`](./implementation-status.md)** —
> the code-verified record of what is built, partial, not built, or dropped.
> Every other doc here is an April/August-2025 planning baseline with a
> staleness banner. Live reconciled knowledge is maintained under
> `ylsbrain/knowledge/`.

## What the product actually does today (2026-07-31)

* **End-to-end customer money path (working):** sign up → upload/build a
  mailing list → CASS validation (AccuZip, real on the order path) → design a
  print-accurate mail piece → Stripe authorization (manual capture) → real PDF
  proof (private bucket, signed URLs) → approve → capture → confirmation
  email → live order-status timeline
* **Custom in-house designer** (no FPD): 69 modules — canvas, inspector,
  merge-token engine, preflight rules, USPS postage areas, server-side pdf-lib
  rendering, and a three.js 3D mail-piece preview
* **Mailing list management:** CSV/XLSX/ODS import with column mapping,
  dedup, version history + restore, tagging, bulk operations
* **List builder UI** (geo/property/mortgage/foreclosure/demographics/
  predictive) — estimates degrade to mock without a Melissa key; purchase
  flow not built yet
* **Teams & access control:** invitations (email), Owner/Admin/Member roles,
  permission templates with a name-based resource picker + wildcard grants,
  time-based permissions, activity log — all RLS-enforced with SQL assertion
  tests
* **Auth/security:** email + Google OAuth, real TOTP 2FA, login history,
  session revocation, PII-hardened RLS
* **Admin:** users/credits/notes, DB-driven pricing management (no deploys
  needed), orders UI, analytics dashboard (revenue metrics pending a
  `payment_transactions` migration), health checks
* **Platform:** transactional email (Resend/Mailgun adapter), durable job
  queue, outbound webhooks with retry + dead-letter, short-link engagement
  tracking, vendors CRUD

**Business model:** transactional only — **no subscriptions** (MLM is a
separate app). Roles are `admin | super_admin` platform-wide plus per-team
roles. AccuZip standalone validation is tiered per-job ($8–$400), free with
mail orders.

## Core technologies (verified against package.json)

| Area | Technology |
|------|------------|
| Frontend | Next.js **15** (App Router), React 18, TypeScript 5, Tailwind CSS 3, ShadCN/Radix, react-rnd (designer), three.js + R3F (3D preview) |
| Backend | Supabase (PostgreSQL + RLS, Auth, Storage), Next.js API routes — **no Prisma, no NextAuth** |
| Payments | Stripe (manual capture; idempotent webhooks) |
| PDF | pdf-lib + fontkit (server-side proof/preview rendering) |
| Email | Resend (preferred) / Mailgun fallback via `lib/email/` |
| Validation & data | AccuZip (CASS), Melissa Data (list building, partial) |
| Testing | **Mocha + React Testing Library** (`npm test`) + SQL assertion tests in `supabase/tests/` |
| Dev environment | Local Docker Supabase stack; dev server on port **3010**; `develop` branch workflow |

## Documentation index (actual files)

| Document | What it is | Trust level |
|----------|------------|-------------|
| [`implementation-status.md`](./implementation-status.md) | Code-verified build status, gaps, risks | **Authoritative** |
| [`PRD.md`](./PRD.md) | Product goals, personas, feature intent | Historical plan |
| [`roadmap.md`](./roadmap.md) / [`todo.md`](./todo.md) | Original phased plan + checklists | Historical plan (checkboxes unreliable) |
| [`features-and-dashboards.md`](./features-and-dashboards.md) | Deep feature/dashboard specs | Historical plan |
| [`technical-architecture.md`](./technical-architecture.md) | Architecture baseline | Stale on stack details |
| [`development-guide.md`](./development-guide.md) / [`developer-quick-start-guide.md`](./developer-quick-start-guide.md) | Dev workflow | Stale on scripts/stack — trust root `CLAUDE.md` + `package.json` |
| [`api-accuzip.md`](./api-accuzip.md) / [`api-melissa.md`](./api-melissa.md) / [`api-integrations.md`](./api-integrations.md) / [`external-api-mapping.md`](./external-api-mapping.md) | Vendor API references, field mappings | Useful reference; status columns stale |
| ~~`api-redstone.md`~~ | **FABRICATED — archived 2026-08-02** to `archive/api-redstone-fabricated-2026-08/`. Real spec: `docs/temp/vendors/redstone/rsm_api_specs_pre-r631-1.pdf` | Removed |
| [`cross-reference-mapping-with-code.md`](./cross-reference-mapping-with-code.md) | AI-generated implementation cookbook | Aspirational; truncated |

## Getting started

Node.js 18+, npm 8+. `npm install`, copy `.env.local` (see root `CLAUDE.md`),
`npm run dev` (port 3010). Scripts: `build`, `lint`, `test` (Mocha),
`typecheck:ui`, `typecheck:full`. Local Supabase runs via Docker
(`supabase start`).

## Developer contact

**Email:** support@yellowlettershop.com
