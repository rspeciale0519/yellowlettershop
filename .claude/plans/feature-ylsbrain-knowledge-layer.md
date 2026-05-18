# Spec — YLS Brain Knowledge Layer

*Design doc (brainstorming output). Status: awaiting user review. Date: 2026-05-18.*
*Implementation plan will be written separately to `feature-ylsbrain-knowledge-layer-plan.md`.*

## 1. Problem & Goal

The `ylsbrain/` vault has no place to hold **app-domain knowledge** — only
engineering `skills/`, the per-task `journal/`, transient `STATE.md`, `index.md`,
and `log.md`. A fresh Claude Code session therefore cannot quickly know what YLS
*is*, what is actually built, what is planned, or where the product is headed
without re-reading ~33k lines of `dev-docs/` — which are dated **April 2025** and
materially **stale** in several places.

**Goal:** add a small, durable, self-maintaining **knowledge layer** to the brain
so any future session gains accurate whole-app context (purpose, built features,
planned/unbuilt features, direction) in one screen, with trustworthy drill-down —
*without* duplicating or trusting the stale docs.

## 2. Decisions (locked via brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Source of truth | **Memory overrides docs** | `dev-docs/` are the baseline vision; where saved memory / user corrections conflict, the corrected version is current truth. The doc version is recorded as *superseded* with citation + reason. |
| Purpose | **All three layers** (orientation / roadmap-execution / onboarding) — delivered via the *lean* structure below | One instant-context screen, with code-true feature/roadmap drill-down. |
| Build status | **Codebase-verified** | `dev-docs/todo.md` checkboxes are April-2025 and unreliable; only `app/`, `app/api/`, `components/`, `lib/`, `supabase/` substantiate "built". |
| Staleness | **Living, via consolidation** | A clause in `ylsbrain/CLAUDE.md` makes consolidation reconcile the layer against shipped work — no new hook code. |
| Scope | **Lean 4-doc** (not 7) | Fewer dense docs age better; avoids creating a third staleness tier (stale docs → synthesized prose → code). |
| Git flow | **Direct to `develop`** | Single-phase, additive, docs-only brain-vault change. |

### Known stale areas to reconcile (non-exhaustive — research will expand)
- Subscriptions/tiers (Free/Pro/Team/Enterprise) → **transactional revenue only**; MLM is a **separate app** (`memory:project_no_subscriptions`).
- Fancy Product Designer (FPD) → **custom design system only**, VistaPrint-style (`memory:feedback_no_fpd`).
- AccuZip validation → **tiered per-job pricing $8–$400, charged standalone only**, not on mail orders (`memory:project_validation_pricing`).
- Admin pricing UI needed to manage pricing without code deploys (`memory:project_admin_pricing`).
- 8-tier role model in roadmap → reconcile to the **actual** role model in code.

## 3. Artifact schema (new `kind: knowledge`)

New directory `ylsbrain/knowledge/`, parallel to `ylsbrain/skills/`. Every file
carries frontmatter:

```yaml
---
kind: knowledge
slug: <orientation|superseded|features|roadmap>
status: current | partial | needs-reconcile
updated: YYYY-MM-DD
layer: orientation | reference | roadmap
sources:                       # POINTERS, never payloads
  - dev-docs/PRD.md            # doc origin
  - app/api/orders/route.ts    # code-grounded claims cite real paths
  - memory:project_no_subscriptions
---
```

**Hard rules**
- **Pointers, not payloads.** Synthesize + link; never paste doc bodies. The
  whole `knowledge/` layer has a **size budget of ≤ 1,500 lines total**
  (verified at build + flagged in the consolidation clause). Exceeding it is a
  signal to cut prose and replace with pointers.
- Every **BUILT/PARTIAL** claim cites a real code path that exists.
- Every **superseded** claim cites *both* the dev-doc origin *and* the
  memory/correction that overrides it, plus the reason.
- No secrets / PII (brain rule + AL-5 heuristic; pointers to `api-*.md`, never keys).
- Cross-link with `[[knowledge/...]]`, `[[skills/...]]`, `[[journal/...]]`.

## 4. The four documents (content contract)

| File | `layer:` | Holds |
|---|---|---|
| `knowledge/00-orientation.md` | `orientation` | One screen. **What YLS is**, target users, the **transactional (no-subscription) business model**, current build state in ~3 lines, **where it's headed next**. Contains short *pointer sections* (2–3 sentences + links) for Product, Architecture, Integrations — no standalone synthesized docs for these. The single file a fresh session reads to "get it". Links to the other three. |
| `knowledge/superseded.md` | `reference` | The doc-vs-truth **ledger**. Each delta: *doc said X (cite dev-doc) → truth is Y (cite memory/correction) → why*. Covers the §2 stale areas + anything research surfaces. Highest-value doc — prevents the brain confidently asserting stale facts. |
| `knowledge/features.md` | `reference` | The inventory, **code-verified** (primary reference doc; also feeds the orientation + roadmap layers): **BUILT** (each → route/handler/component/schema path), **PARTIAL** (scaffolded/incomplete, with what's missing), **PLANNED** (→ `roadmap.md`), **SUPERSEDED** (→ `superseded.md`). The spine of "all features + plans for unbuilt." |
| `knowledge/roadmap.md` | `roadmap` | Unbuilt features, phased, **reconciled** to current direction. Superseded phases explicitly marked, not silently dropped. Pointer to `dev-docs/roadmap.md` for original detail. |

Product / Architecture / Integrations are deliberately **not** standalone docs —
they live as curated pointer sections in `00-orientation.md` to avoid redundant,
rot-prone restatement of `dev-docs/`.

## 5. Reconciliation & build-status method (production order)

1. **Mine dev-docs** (`PRD.md`, `roadmap.md`, `todo.md`, `features-and-dashboards.md`,
   `technical-architecture.md`, `integrations-and-data.md`, `api-*.md`) for the
   intended product model and full feature universe.
2. **Verify build status against real code** — for each feature inspect `app/`
   routes, `app/api/` handlers, `components/`, `lib/`, `supabase/` schema/migrations.
   `BUILT` only if code substantiates it; `PARTIAL` if scaffolded/incomplete;
   `PLANNED` otherwise. `todo.md` checkboxes are *claims to verify*, not truth.
3. **Apply memory-overrides-docs** — conflicts → `superseded.md` with both
   citations + reason. Conflicts surfaced in research that are **not yet in
   memory** are flagged to the user, not silently resolved.
4. **Secret/PII discipline** — pointers only; run the AL-5 scan over all new files.

## 6. Protocol / schema extension (living via consolidation)

Minimal, surgical edits — **no hook code changes** (consolidation is
protocol-driven; `consolidate.js` is a helper/notice, not the enforcer):

- **`ylsbrain/CLAUDE.md`** — add a short **"Knowledge layer"** schema block
  (artifact `kind: knowledge`, frontmatter contract, pointer-not-payload rule,
  ≤1,500-line budget); add one **Consolidation** clause: *"reconcile `knowledge/`
  against shipped work — journal/git deltas since last pass update
  `features.md`/`roadmap.md`/`00-orientation.md`; contradicted claims flip
  `status: needs-reconcile`; flag budget overflow."*
- **`ylsbrain/index.md`** — new `## Knowledge` section, one-line hook per doc
  (SessionStart already reads `index.md`).
- **`ylsbrain/STATE.md`** — `Latest synopsis` / Notes point at
  `[[knowledge/00-orientation]]` so orientation surfaces at session start.
- **`ylsbrain/log.md`** — one timeline line for the layer's creation.
- SessionStart injection unchanged (it already surfaces STATE + index, which now
  point into `knowledge/`).

## 7. Build sequence

1. **Schema/protocol first** — extend `ylsbrain/CLAUDE.md` + `index.md` so the
   contract exists before content.
2. **Parallel research** — dispatch independent agents (no shared state):
   (a) dev-docs product/roadmap mining, (b) codebase build-status verification,
   (c) integrations, (d) doc-vs-memory conflict detection.
3. **Synthesize** the four docs from findings, enforcing pointer discipline +
   citations + size budget.
4. **Verify before "done"** (see §8).
5. **Journal + consolidation** — append the task journal entry, update
   STATE/log/index, then the protocol's post-task consolidation step.

## 8. Verification ("done" criteria)

- All four files exist with valid `kind: knowledge` frontmatter.
- Every BUILT/PARTIAL claim's cited code path **exists** (spot-checked, ≥1 per
  feature group).
- `superseded.md`: every delta cites *both* dev-doc origin and overriding
  memory/correction + reason; all §2 known areas present.
- `knowledge/` total ≤ 1,500 lines.
- AL-5 secret/PII scan clean on all new files (git-SHA false positives noted, OK).
- All `[[...]]` cross-links resolve.
- `index.md` Knowledge section + `CLAUDE.md` clauses present; `node
  .claude/hooks/consolidate.js` exits 0.
- Evidence recorded per the brain evidence rule in the journal entry.

## 9. Non-goals / YAGNI

- No standalone product/architecture/integrations docs (pointer sections only).
- No copying or full paraphrase of `dev-docs/` (pointers).
- No hook code changes; no SessionStart format change.
- No edits to `dev-docs/` themselves (they remain the historical baseline).
- Not fixing the AL-5 git-SHA false positive (deferred, low value).
- MLM app is explicitly **out of scope** (separate product).

## 10. Risks & accepted limitations

- **R1 — synthesized layer itself drifts.** Mitigation: size budget + the
  consolidation reconciliation clause + `status: needs-reconcile`. Residual risk
  is real and bounded by AL-4 (distillation is agent-dependent) — accepted.
- **R2 — "living" is soft** (AL-4): consolidation quality isn't guaranteed. The
  clause is a floor, not a proof. Accepted; documented.
- **R3 — build-status verification is sampling-bounded** on a large codebase;
  `PARTIAL` is used honestly when unsure rather than over-claiming `BUILT`.
- **R4 — undiscovered stale areas** beyond §2. Mitigation: research step (d) +
  flag-to-user rather than silent resolution.
