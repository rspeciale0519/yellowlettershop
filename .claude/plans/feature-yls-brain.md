# Spec — YLS Brain (Self-Improving Per-Project Engineering Memory)

- **Status:** Approved design, pending user review
- **Date:** 2026-05-17
- **Owner:** rob
- **Type:** feature · **Subject:** yls-brain → branch `feature/yls-brain`
- **Target project:** `C:\Users\rob\Documents\Software\service-businesses\yls\` (yls = Yellow Letter Shop, Next.js 15 SaaS)
- **Vault:** `yls/ylsbrain/` (Obsidian; currently empty except `.obsidian/`)

---

## 1. Purpose

A per-app "second brain" for the **yls** codebase that gives the AI assistant **self-improving engineering competence**: it never loses the thread between sessions, learns from what worked and what failed so it stops repeating mistakes and converges faster, and preserves planning/brainstorming so it compounds. Every session should start smarter than the last.

This is the **per-project / engineering-memory brain** deliberately deferred during the `Developer/` portfolio-brain design. It is a different system with different requirements — designed from intent, not copied.

Adapted from the **Hermes Agent** self-evolution model (NousResearch): three-layer memory (small always-on state · searchable history · evolving procedural skills) + a closed learning loop with periodic consolidation. Implemented in plain Obsidian markdown + Claude Code hooks (no SQLite/DSPy/Honcho — see §9).

## 2. Goals

1. Durable cross-session continuity for yls work (no cold starts).
2. Capture **what worked / what did NOT work / synopsis** for every completed task, anchored to real evidence.
3. Distil recurring patterns into reusable, in-place-evolving **skills** (procedural memory).
4. Enforce capture via Claude Code hooks so it does not depend on assistant discipline.
5. Compound competence over time; surface generalizable lessons to the `Developer/` portfolio brain.

## 3. Locked Decisions (from brainstorming)

| # | Decision |
|---|---|
| Q1 | yls is a mature web app / SaaS (Next.js 15, Supabase, Stripe, AccuZip, Mailgun; Mocha; `npm run lint/test/build`, `typecheck:ui`). |
| Q2 | Cadence: record per **completed task** + **periodic consolidation** (not per prompt). |
| Q3 | Memory model: **dual-layer** — append-only Journal + in-place-evolving Skills. |
| Q4 | Enforcement: **tiered** — SessionStart inject (non-blocking) · Stop conditional hard-gate · consolidation scheduled/prompted. |
| Arch | **Approach A** — vault-native brain + thin Node enforcement hooks + concise protocol pointer in root `CLAUDE.md`. |

## 4. Architecture

Three Hermes layers → Obsidian markdown, enforced by Claude Code hooks.

```
yls/ylsbrain/                  (Obsidian vault, tracked in the yls git repo)
├── CLAUDE.md                  human-authoritative brain schema (full)
├── STATE.md                   tiny always-on layer (≤~25 lines)
├── index.md                   catalog: skills + recent journal + key refs
├── log.md                     append-only greppable timeline
├── journal/YYYY-MM-DD.md      per-day file; per-task `### [HH:MM]` sections
├── skills/<area>-<slug>.md    distilled, in-place-evolving procedural memory
├── archive/                   superseded pages, tombstoned (never delete — Rule 1)
└── .brainstate/               GITIGNORED transient: brain.json (global watermark) + session sentinels + work-ledger
yls/.claude/hooks/             Node hook scripts
yls/.claude/settings.json      COMMITTED hooks key (durable enforcement)
yls/CLAUDE.md                  + one ~15-line "## YLS Brain" pointer section
```

`<area>` taxonomy: `api · supabase · ui · auth · integrations · testing · build`.

## 5. File Schemas

### 5.1 Journal entry (Stop-gated)
```markdown
### [HH:MM] <task title>   (branch: <git branch> · commits: <shas|none>)
**Synopsis:** 1–3 sentences — goal and outcome.
**What worked:** concrete + reusable. Evidence: <npm test/lint/typecheck:ui/build result, or "manual: <how verified>">.
**What did NOT work:** dead-ends, wrong assumptions, failed attempts — explicit. "(none)" only if truly none.
**Artifacts:** files touched (paths), key decisions, [[skill-…]] created/updated, PR/commit.
**Next / open:** follow-ups, unresolved risk.
```
No-op escape: a one-line `no substantive task — nothing to record` is a valid entry. **No secrets / no PII** — pointers, not payloads (AL-5).

### 5.2 Skill page (`skills/<area>-<slug>.md`)
```markdown
---
type: skill
area: api|supabase|ui|auth|integrations|testing|build
status: active | deprecated
confidence: provisional | established
updated: YYYY-MM-DD
sources: [[journal/YYYY-MM-DD]]
---
# <Skill name>
## When to use
## The approach        (durable method/steps)
## Pitfalls & anti-patterns   (harvested from "what didn't work")
## Evidence            (journal + commit refs)
## Revision log        (append-only: [date] what changed & why — the self-evolution trail)
```
`confidence: provisional → established` only on **genuinely independent** signal (different task context, or external proof: CI/tests/production) — never a repeat count. Contradiction → `status: deprecated` + tombstone.

### 5.3 STATE.md (≤~25 lines, SessionStart-injected)
Current focus · Latest-synopsis pointer + 1-line digest · Open threads · Active skills in play.

## 6. Protocol (authoritative in `ylsbrain/CLAUDE.md`; enforced copy hook-injected)

1. **Session-Start Ritual** — SessionStart hook injects the operative protocol text itself + `STATE.md` + latest-journal pointer; assistant states what we last did and where, before new work. (Not dependent on reading a nested file.)
2. **Recall-before-work** — check `skills/<area>` and apply an existing skill before re-deriving.
3. **Per-task Journal protocol** — on completion: journal entry → `STATE.md` → `log.md` → `index.md` if a skill changed.
4. **Evidence rule** — "What worked" cites an objective signal or explicit `manual:`; else logged *unverified*.
5. **Honesty clause** — failures recorded as prominently as wins; Stop hook structurally checks the "did NOT work" + "Evidence" fields are present and non-empty.
6. **Skill distillation** — periodic consolidation or immediately on a clear reusable pattern.
7. **Never-delete** — superseded → `archive/` + tombstone.

**Integration:** append one ~15-line `## YLS Brain` section to root `yls/CLAUDE.md` (rule + pointer; no rewrite of the living doc). Optional one-line `AGENTS.md` pointer. Vault knowledge stays in Obsidian markdown, never `.claude/skills/`.

## 7. Enforcement Hooks (Node scripts, `yls/.claude/hooks/`, wired via a `hooks` key in committed `.claude/settings.json`)

> **Assumption to verify first (Phase 0 of the plan):** confirm whether yls has a committed `.claude/settings.json` and how a new `hooks` key interacts with the existing `.claude/settings.local.json` permission allowlist. If only `.local` exists, create a committed `settings.json` for hooks (durability) without disturbing the local allowlist. Verify; do not assume.

### 7.1 Ledger & watermark lifecycle (the core of the gate — fully specified)

State in gitignored `ylsbrain/.brainstate/`:
- `brain.json` — **global, cross-session**: `{ lastCoveredTs, lastConsolidationTs, taskCountSinceConsolidation }`.
- `<session-id>.ledger` — append-only `<iso-ts>\t<tool>\t<path|summary>` written by H2.
- `<session-id>.sentinel` — `{ sessionId, startTs, branch, blockCount }`.

- **Unconsumed work** = ledger lines across **all** session ledgers with `ts > brain.json.lastCoveredTs`. Baseline is **journal-global**, so a task spanning sessions stays covered (resolves the cross-session gap).
- **Covering entry** = a journal `### [HH:MM]` block whose timestamp ≥ the *oldest* unconsumed ledger ts.
- **On a passing Stop** (covering entry present & structurally compliant): set `lastCoveredTs` = newest ledger ts now; `taskCountSinceConsolidation += 1`. Deterministic clear — no perpetual block.

### 7.2 Hooks

- **H1 SessionStart (inject, non-blocking):** write `<session-id>.sentinel`; prune sentinels/ledgers >14 days; inject compact protocol + `STATE.md` + latest-journal pointer (≤~40 lines, cache-disciplined). If `taskCountSinceConsolidation ≥ N` (default 5, tunable) or an overdue flag is set, prepend a **one-line** notice: "ℹ Consolidation overdue — after the user's task, offer/run a time-boxed consolidation." Pure file reads.
- **H2 PostToolUse (work-ledger, non-blocking, near-instant):** on Edit/Write/git-commit, append one ledger line. No model call.
- **H3 Stop (conditional hard-gate):** block **only if** *unconsumed work exists* AND *no covering entry* AND *sentinel.blockCount < 2*. On block: `blockCount += 1`; message states exactly what to append. Pass paths: covering entry present (advance watermark per §7.1); OR no unconsumed work; OR a one-line no-op entry; OR `blockCount ≥ 2` → **loop-breaker fails open** with a loud warning; OR any internal error → **fails open** with a warning. H3 also runs a **cheap secret/PII heuristic** (regex: `sk_live`, `AKIA[0-9A-Z]{16}`, `BEGIN * PRIVATE KEY`, long hex/base64 blobs, raw email/phone) over the new entry and emits a **non-blocking warning** if matched (partial AL-5 mitigation; heuristic, not a guarantee).
- **H4 Consolidation (mid-session when `taskCountSinceConsolidation ≥ N`; or next-SessionStart overdue notice — NOT SessionEnd):** the assistant, **only after completing the user's actual request**, offers or runs a **time-boxed** pass bounded to entries since `lastConsolidationTs`: cluster recurring worked→skill, didn't→pitfalls; contradiction→revise/deprecate+tombstone; journal-vs-git **gap check**; trim STATE; refresh index; set `lastConsolidationTs`, reset `taskCountSinceConsolidation`. **Consolidation never preempts or substitutes for the user's stated task.** SessionEnd only sets the overdue flag.

**Invariants:** hooks are deterministic file ops only (no model calls → no token cost, fast); absolute quoted paths; **fail-open over session-trap**; brain commits are separate `brain:`-prefixed commits; per-day journal files + last-writer-append to limit worktree/develop-main merge conflicts.

## 8. Self-Evolution Loop & Seam

SessionStart (inject/recall) → work (ledger) → task done → Journal (gated) → STATE/log/index → Consolidation (distil→skills, gap-check) → next SessionStart surfaces sharpened state. Each cycle sharpens procedural memory = compounding competence.

**Seam to Developer brain:** when a skill is `established` *and* generalizable beyond yls, consolidation **proposes** an app-agnostic version for promotion to the `Developer/` brain's `wiki/shared/` as `kind: playbook` (the reserved seam). Proposal-only, user-approved; **execution is a cross-project write requiring explicit authorization at that time** (Rule 9); two-way backlink; promoted playbooks may drift → manual re-sync.

## 9. Accepted Limitations (carried forward, not solved)

- **AL-1:** No hook can verify the *truthfulness/completeness* of self-reported failures; structural non-empty checks raise the floor only.
- **AL-2:** Enforcement fires **only in Claude Code**; Cursor/Codex/other-tool sessions won't self-maintain the brain. Mitigation: `AGENTS.md` pointer + consolidation journal-vs-git gap check.
- **AL-3:** Task-boundary detection is heuristic (file/commit signals); the gate can occasionally over/under-fire. Mitigation: no-op escape, loop-breaker, gap check.
- **AL-4:** Distillation *quality* is agent-dependent; a persistent post-task SessionStart consolidation notice (non-preempting) raises the floor but does not guarantee genuine learning.
- **AL-5:** Brain history in the code repo is a confidentiality/entanglement tradeoff; partially mitigated by separate `brain:` commits, a no-secrets/no-PII journal rule, **and a heuristic secret/PII scan in H3 (non-blocking warning)** — heuristic only, not eliminated.

## 10. Not Replicated from Hermes (honest scope)

No SQLite/FTS5 DB, no DSPy/GEPA genetic optimizer, no Honcho user-modeling. "Self-evolution" = Claude-curated procedural distillation + schema co-evolution in markdown — real curated learning, not automated weight/prompt search.

## 11. Verification Approach

Node "verify" checks become the implementation plan's red→green gates:
- Vault structure present (all §4 paths; `.brainstate/` gitignored).
- Simulated session: sentinel → ledger marker → journal entry → Stop **passes**.
- Stop **blocks** when unconsumed work exists with no covering entry; a covering entry advances `lastCoveredTs` and the gate clears (no perpetual block); **loop-breaker** fails open after 2 blocks; cross-session work stays covered.
- Consolidation **plumbing only**: given a fixture of ≥2 related entries, the overdue notice fires, the gap check flags an uncovered commit, and a skill file produced from the fixture validates against the §5.2 schema. Distillation *quality/correctness* is **not** asserted by verify (AL-4).
- Secret/PII heuristic emits a warning on a planted-secret fixture entry (and none on a clean one).
- **Fidelity caveat:** mocked hook-input approximates the harness; a **real-session smoke check** in yls is required before declaring done.

## 12. Acceptance Criteria

- All §4 vault files/dirs exist; `.brainstate/` + `.obsidian/` gitignored; `ylsbrain/` otherwise tracked.
- `ylsbrain/CLAUDE.md` encodes §6 protocol + §5 schemas; root `yls/CLAUDE.md` has the ~15-line pointer section; `.claude/settings.json` has the 4 hooks.
- Phase 0 verified the `.claude/settings.json` vs `.local` interaction before any hook wiring.
- A simulated task: SessionStart injects state; work logged to the ledger; Stop gates until a compliant journal entry exists; entry written → watermark advances → passes (deterministic clear; cross-session work covered).
- Consolidation **plumbing** passes (§11): overdue notice fires, gap check flags an uncovered commit, a fixture skill validates against the §5.2 schema. (Distillation quality is AL-4, not gated.)
- Secret/PII heuristic warns on a planted-secret fixture, silent on a clean one.
- All §11 verify checks green; real-session smoke check performed.
- All five accepted limitations documented in `ylsbrain/CLAUDE.md`.

## 13. Future Work (own specs later)

- Developer-brain promotion automation (currently manual-gated).
- Multi-tool enforcement (Cursor/Codex) — AL-2.
- Optional local semantic search if the journal outgrows index+grep.
