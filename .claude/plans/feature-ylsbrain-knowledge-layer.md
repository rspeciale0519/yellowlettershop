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
| Staleness | **Living, via consolidation** | A **mechanical** (git-diff-driven, §6) clause in `ylsbrain/CLAUDE.md` makes consolidation reconcile the layer against shipped work — no new hook code. |
| Scope | **Lean 4-doc** (not 7) | Fewer dense docs age better; avoids creating a third staleness tier (stale docs → synthesized prose → code). |
| Git flow | **Direct to `develop`** | Additive, docs-only brain-vault change; executed in *internal phases with a review gate* (§7) but **no feature branch** — "phased" here means execution checkpoints, not git flow. |

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
slug: orientation | superseded | features | roadmap
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
- **Pointers, not payloads.** Synthesize + link; never paste or paraphrase
  `dev-docs/` bodies. Restating a doc fact is allowed only as a 1–2 sentence
  summary *with* a citation to the source.
- **Principled sizing, not an arbitrary cap.** Each doc earns its length:
  `orientation.md` ≤ **one screen** (~120 lines, hard); the other three are
  *as long as the reconciled facts require and no longer* — density over a
  magic number. Concrete per-doc **soft targets are set at the findings
  checkpoint (§7)** from the actual reconciled feature/roadmap count, not
  guessed up front. The smell test, not a gate: if any doc reads like
  paraphrased `dev-docs/`, cut prose and replace with a pointer.
- Every **BUILT/PARTIAL** claim cites a real code path that exists.
- Every **superseded** claim cites *both* the dev-doc origin *and* the
  memory/correction that overrides it, plus the reason.
- No secrets / PII (brain rule + AL-5 heuristic; pointers to `api-*.md`, never keys).
- Cross-link with `[[knowledge/...]]`, `[[skills/...]]`, `[[journal/...]]`.

## 4. The four documents (content contract)

| File | `layer:` | Holds |
|---|---|---|
| `knowledge/orientation.md` | `orientation` | One screen (≤ ~120 lines, hard). **What YLS is**, target users, the **transactional (no-subscription) business model**, current build state in ~3 lines, **where it's headed next**. Contains short *pointer sections* (2–3 sentences + links) for Product, Architecture, Integrations — no standalone synthesized docs for these. The single file a fresh session reads to "get it". Links to the other three. |
| `knowledge/superseded.md` | `reference` | The doc-vs-truth **ledger**. Each delta: *doc said X (cite dev-doc) → truth is Y (cite memory/correction) → why*. Covers the §2 stale areas + anything research surfaces. Highest-value doc — prevents the brain confidently asserting stale facts. |
| `knowledge/features.md` | `reference` | The inventory, **code-verified to the §5 evidence bar** (primary reference doc; also feeds the orientation + roadmap layers): **BUILT** / **PARTIAL** (with what's missing) / **PLANNED** (→ `roadmap.md`) / **UNVERIFIED** / **SUPERSEDED** (→ `superseded.md`), each with its citation. The spine of "all features + plans for unbuilt." |
| `knowledge/roadmap.md` | `roadmap` | Unbuilt features, phased, **reconciled** to current direction. Superseded phases explicitly marked, not silently dropped. Pointer to `dev-docs/roadmap.md` for original detail. |

Product / Architecture / Integrations are deliberately **not** standalone docs —
they live as curated pointer sections in `orientation.md` to avoid redundant,
rot-prone restatement of `dev-docs/`.

## 5. Reconciliation & build-status method (production order)

1. **Mine dev-docs** (`PRD.md`, `roadmap.md`, `todo.md`, `features-and-dashboards.md`,
   `technical-architecture.md`, `integrations-and-data.md`, `api-*.md`) for the
   intended product model and full feature universe.
2. **Verify build status against real code — with a rigorous bar.** For each
   feature inspect `app/` routes, `app/api/` handlers, `components/`, `lib/`,
   `supabase/` schema/migrations. Classification is **evidence-gated**, not
   "a file exists":
   - **BUILT** = all three hold: (i) the entrypoint exists (route/handler/
     component/table), **and** (ii) it contains real non-stub logic (not a
     `TODO`/`throw new Error('not implemented')`/empty handler/placeholder
     return), **and** (iii) it is *wired* end-to-end (UI → API/data, or the
     handler reads/writes real persistence) — each substantiated by a cited
     path (and symbol/line where it sharpens the claim).
   - **PARTIAL** = entrypoint exists but (ii) or (iii) fails, or only one side
     of a flow is present. Record *what is missing*, with the path.
   - **PLANNED** = no substantiating code.
   - **UNVERIFIED** = could not be conclusively checked within the pass — used
     honestly instead of guessing `BUILT`. Never assert `BUILT` on a doc
     checkbox alone; `todo.md`/`roadmap.md` ticks are *claims to verify*.
3. **Apply memory-overrides-docs** — conflicts → `superseded.md` with both
   citations + reason. Conflicts surfaced in research that are **not yet in
   memory** are flagged to the user, not silently resolved.
4. **Secret/PII discipline** — pointers only; run the AL-5 scan over all new files.

## 6. Protocol / schema extension (living via consolidation)

Minimal, surgical edits — **no hook code changes** (consolidation is
protocol-driven; `consolidate.js` is a helper/notice, not the enforcer):

- **`ylsbrain/CLAUDE.md`** — add a short **"Knowledge layer"** schema block
  (artifact `kind: knowledge`, frontmatter contract, pointer-not-payload rule,
  principled-sizing rule per §3); add one **mechanical Consolidation** clause:
  *"Reconcile `knowledge/` against shipped work. Concretely: `git log
  --name-only <lastConsolidationTs>..HEAD` (and the journal entries since the
  watermark) → for every changed path under `app/`, `app/api/`, `components/`,
  `lib/`, `supabase/`, check whether `features.md`/`roadmap.md`/`orientation.md`
  still hold; any claim the diff contradicts flips to `status:
  needs-reconcile` and is corrected or flagged. A doc that reads like
  paraphrased `dev-docs/` is trimmed to pointers."* (Diff-driven, not
  vibes-driven — addresses the AL-4 softness as far as protocol can.)
- **`ylsbrain/index.md`** — new `## Knowledge` section, one-line hook per doc
  (SessionStart already reads `index.md`).
- **`ylsbrain/STATE.md`** — `Latest synopsis` / Notes point at
  `[[knowledge/orientation]]` so orientation surfaces at session start.
- **`ylsbrain/log.md`** — one timeline line for the layer's creation.
- SessionStart injection unchanged (it already surfaces STATE + index, which now
  point into `knowledge/`).

## 7. Build sequence — phased, with a findings checkpoint

It is one additive change, but it is the heaviest task the brain has attempted
(parallel research over ~33k doc-lines + the whole codebase, then 4 synthesized
docs). It is therefore **phased with a hard human checkpoint** between research
and synthesis so a shallow or wrong reconciliation cannot silently become
"done". (Git flow is still direct-to-`develop`; the checkpoint is a review
gate, not a branch.)

- **Phase 1 — Schema/protocol.** Extend `ylsbrain/CLAUDE.md` + `index.md` so
  the `kind: knowledge` contract + mechanical consolidation clause exist before
  any content. Commit.
- **Phase 2 — Parallel research → findings dossier.** Dispatch independent
  agents (no shared state): (a) dev-docs product/roadmap mining, (b) codebase
  build-status verification to the §5 evidence bar, (c) integrations, (d)
  doc-vs-memory conflict detection. Output is a single **findings dossier**
  (raw, cited, not yet synthesized) written to `docs/temp/`.
- **── CHECKPOINT (gate) ──** Present the dossier: the reconciled
  built/partial/planned/unverified counts, the full superseded-delta list
  (incl. any conflicts **not** previously in memory, flagged not resolved),
  and the **per-doc soft size targets** derived from the actual counts. User
  reviews/corrects before any synthesis. Synthesis does **not** start until
  this is approved.
- **Phase 3 — Synthesize** the four docs from the *approved* dossier, enforcing
  pointer discipline + citations + the agreed per-doc sizes.
- **Phase 4 — Verify** against §8.
- **Phase 5 — Journal + consolidation** — append the task journal entry,
  update STATE/log/index, then the protocol's post-task consolidation step.

## 8. Verification ("done" criteria)

- All four files exist with valid `kind: knowledge` frontmatter.
- **Build-status integrity (the load-bearing check):** every `BUILT` claim is
  re-checked against the §5 evidence bar — cited path exists *and* shows
  non-stub logic *and* the wired-up evidence is real; **independently
  re-verify a sample of ≥3 per feature group, and re-verify 100% of any
  feature `orientation.md` calls "built"/"shipped".** Any item failing the bar
  is downgraded to `PARTIAL`/`UNVERIFIED` before "done". A `BUILT` that turns
  out stub/unwired is a release-blocking defect, not a nit.
- `superseded.md`: every delta cites *both* dev-doc origin and overriding
  memory/correction + reason; all §2 known areas present; conflicts found in
  research but not previously in memory are listed as **flagged-to-user**, not
  silently resolved.
- **Sizing principle (not a number):** `orientation.md` ≤ ~120 lines; no doc
  reads as paraphrased `dev-docs/` (reviewer judgement); each doc within the
  per-doc soft target agreed at the §7 checkpoint, or the overage is justified
  in the journal.
- AL-5 secret/PII scan clean on all new files (git-SHA false positives noted, OK).
- All `[[...]]` cross-links resolve.
- `index.md` Knowledge section + `CLAUDE.md` clauses present; `node
  .claude/hooks/consolidate.js` exits 0 (run from project root).
- Evidence recorded per the brain evidence rule in the journal entry.

## 9. Non-goals / YAGNI

- No standalone product/architecture/integrations docs (pointer sections only).
- No copying or full paraphrase of `dev-docs/` (pointers).
- No hook code changes; no SessionStart format change.
- No edits to `dev-docs/` themselves (they remain the historical baseline).
- Not fixing the AL-5 git-SHA false positive (deferred, low value).
- MLM app is explicitly **out of scope** (separate product).

## 10. Risks & accepted limitations

- **R1 — synthesized layer itself drifts.** Mitigation: principled sizing
  (pointers over paraphrase) + the **mechanical** (git-diff-driven)
  consolidation clause + `status: needs-reconcile`. Residual risk is real and
  bounded by AL-4 (distillation is agent-dependent) — accepted.
- **R2 — "living" is soft** (AL-4): consolidation quality isn't guaranteed.
  Making the clause a concrete `git log --name-only` diff against the
  watermark raises the floor from "remember to reconcile" to "run this diff
  and check each touched path" — still a floor, not a proof. Accepted.
- **R3 — build-status verification is sampling-bounded** on a large codebase.
  Mitigation: the §5 evidence bar + §8 independent re-verification (≥3/group,
  100% of orientation "built" claims) + honest `UNVERIFIED` instead of
  over-claiming `BUILT`. This is the project's primary value, so it gets the
  strictest gate.
- **R4 — undiscovered stale areas** beyond §2. Mitigation: research step (d) +
  flag-to-user rather than silent resolution.
