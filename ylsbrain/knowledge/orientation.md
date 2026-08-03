---
kind: knowledge
slug: orientation
status: current
updated: 2026-08-02
layer: orientation
sources:
  - dev-docs/PRD.md
  - dev-docs/technical-architecture.md
  - dev-docs/implementation-status.md
  - memory:project_no_subscriptions
  - memory:project-vercel-project
---

# Orientation — YLS one-screen brief

**What YLS is:** a cloud SaaS for end-to-end direct-mail automation — list build → design → address validation → fulfillment → analytics. Target users: real-estate investors/agents/wholesalers, insurance/mortgage, SMBs, and direct-mail agencies (`dev-docs/PRD.md §1`).

**Business model — read this first:** revenue is **transactional only**. There are **NO subscriptions** (no Free/Pro/Team/Enterprise tiers); the MLM product is a **separate app**. Customers pay per mail piece (tiered by qty/service) plus add-ons; AccuZip validation is tiered $8–$400/job standalone and free with mail orders (`memory:project_no_subscriptions`; details + the stale subscription docs in [[knowledge/superseded]]).

**Current state (2026-08-02):** substantially built and **in production**. The full commercial loop runs end to end: signup → list → real AccuZip validation → custom designer → Stripe authorize (manual capture) → PDF proof → approve → capture → **auto-dispatch to a print vendor** → admin advances to delivered → order completes. Also working: multi-tenant teams + access control (RLS, SQL-asserted), real TOTP 2FA, admin suite with DB-driven pricing. Gates: 269 tests, typecheck:full 0, build 0. Full inventory with code paths: [[knowledge/features]]; evidence matrix: `dev-docs/implementation-status.md`.

**Deploy:** one Vercel project (`yellowlettershop`) owns `app.yellowlettershop.com`; `main` is production and lags `develop` by design (`memory:project-vercel-project`). Dev runs on the local Docker Supabase stack, port 3010.

**Where it's headed next:** delete the shipped test/debug endpoints (now live), wire the built-but-uncalled DB rate limiter, back both template galleries with real data, Melissa list purchase, proof annotation UI. Redstone outbound is built but blocked on them provisioning our endpoint. Reconciled list: [[knowledge/roadmap]].

## Product
Scope, audiences, and the (now-stale) tiered narrative are in `dev-docs/PRD.md`. Treat its revenue/role sections as superseded — defer to [[knowledge/superseded]] for what is actually true.

## Architecture
Stack and data flow in `dev-docs/technical-architecture.md`: Next.js App Router, Supabase (Postgres + RLS + Storage), Stripe. Note: its FPD design-engine section is stale — the designer is custom in-house ([[knowledge/superseded]] D2).

## Integrations
Per-service status with code paths is in [[knowledge/features]] (Stripe BUILT; Supabase BUILT; AccuZip BUILT on the order path, mock for count/search without a key; Resend/Mailgun BUILT; Melissa PARTIAL — client only, no purchase flow; **Redstone outbound BUILT and opt-in**, blocked on their provisioning). API specifics in `dev-docs/api-*.md` — accurate for protocols, not for build status. **`api-redstone.md` was fabricated and is archived** (`archive/api-redstone-fabricated-2026-08/`); the real spec is the vendor PDF under `docs/temp/vendors/redstone/`.

---

**Caveat:** dev-docs are dated April 2025 and are stale on revenue model, design engine, roles, and AccuZip billing. When docs and reality conflict, [[knowledge/superseded]] is authoritative.
