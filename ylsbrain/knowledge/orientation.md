---
kind: knowledge
slug: orientation
status: current
updated: 2026-05-18
layer: orientation
sources:
  - dev-docs/PRD.md
  - dev-docs/technical-architecture.md
  - memory:project_no_subscriptions
---

# Orientation — YLS one-screen brief

**What YLS is:** a cloud SaaS for end-to-end direct-mail automation — list build → design → address validation → fulfillment → analytics. Target users: real-estate investors/agents/wholesalers, insurance/mortgage, SMBs, and direct-mail agencies (`dev-docs/PRD.md §1`).

**Business model — read this first:** revenue is **transactional only**. There are **NO subscriptions** (no Free/Pro/Team/Enterprise tiers); the MLM product is a **separate app**. Customers pay per mail piece (tiered by qty/service) plus add-ons; AccuZip validation is tiered $8–$400/job standalone and free with mail orders (`memory:project_no_subscriptions`; details + the stale subscription docs in [[knowledge/superseded]]).

**Current state:** the codebase is substantially built — 49 BUILT features, 12 PARTIAL, 3 UNVERIFIED, 0 PLANNED-in-code. Auth, list-builder UI, mailing-list import/dedup, custom designer, order wizard, Stripe manual-capture payments, multi-tenant teams, and the full admin suite (including pricing CRUD) are working. Full inventory with code paths: [[knowledge/features]].

**Where it's headed next** (where it goes from here): promote simulated AccuZip validation to live, distribute rate-limiting, back the user orders dashboard and template gallery with real data, then MelissaData purchase + outbound Mailgun. Reconciled list: [[knowledge/roadmap]].

## Product
Scope, audiences, and the (now-stale) tiered narrative are in `dev-docs/PRD.md`. Treat its revenue/role sections as superseded — defer to [[knowledge/superseded]] for what is actually true.

## Architecture
Stack and data flow in `dev-docs/technical-architecture.md`: Next.js App Router, Supabase (Postgres + RLS + Storage), Stripe. Note: its FPD design-engine section is stale — the designer is custom in-house ([[knowledge/superseded]] D2).

## Integrations
Per-service status with code paths is in [[knowledge/features]] (Stripe BUILT; Supabase BUILT; AccuZip/MelissaData/Mailgun PARTIAL; Redstone doc-only). API specifics in `dev-docs/api-*.md` — accurate for protocols, not for build status.

---

**Caveat:** dev-docs are dated April 2025 and are stale on revenue model, design engine, roles, and AccuZip billing. When docs and reality conflict, [[knowledge/superseded]] is authoritative.
