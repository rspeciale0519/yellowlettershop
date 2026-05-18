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
└── .brainstate/               GITIGNORED transient: session sentinels + work-ledger
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

## 7. Enforcement Hooks (Node scripts, `yls/.claude/hooks/`, wired in committed `.claude/settings.json`)

- **H1 SessionStart (inject, non-blocking):** write session sentinel to `.brainstate/`; prune old sentinels; inject compact protocol + `STATE.md` + latest pointer (≤~40 lines, cache-disciplined); if consolidation overdue, **escalate** the payload ("CONSOLIDATION OVERDUE — do before new work"). Pure file reads.
- **H2 PostToolUse (work-ledger, non-blocking, near-instant):** on Edit/Write/git-commit, append a marker to `.brainstate/<session>.ledger`; also serves as the N-task consolidation counter.
- **H3 Stop (conditional hard-gate):** block **only if** (ledger shows substantive work since last journal entry) AND (no covering entry) AND (per-session block-count < 2). Else pass silently. Block message states exactly what to append. Escapes: no-op entry satisfies; **loop-breaker** fails open after 2 blocks with a loud warning; any internal script error **fails open** with a warning.
- **H4 Consolidation (mid-session N-task threshold via ledger, default N=5 tunable; and next-SessionStart overdue check — NOT SessionEnd):** prompt journal→skills distillation; cluster recurring worked→skill, didn't→pitfalls; contradiction→revise/deprecate+tombstone; journal-vs-git **gap check**; trim STATE; refresh index. Non-blocking; SessionEnd only writes the overdue flag.

**Invariants:** hooks are deterministic file ops only (no model calls → no token cost, fast); absolute quoted paths; fail-open over session-trap; brain commits are separate `brain:`-prefixed commits; per-day journal files + last-writer-append to limit worktree/develop-main merge conflicts.

## 8. Self-Evolution Loop & Seam

SessionStart (inject/recall) → work (ledger) → task done → Journal (gated) → STATE/log/index → Consolidation (distil→skills, gap-check) → next SessionStart surfaces sharpened state. Each cycle sharpens procedural memory = compounding competence.

**Seam to Developer brain:** when a skill is `established` *and* generalizable beyond yls, consolidation **proposes** an app-agnostic version for promotion to the `Developer/` brain's `wiki/shared/` as `kind: playbook` (the reserved seam). Proposal-only, user-approved; **execution is a cross-project write requiring explicit authorization at that time** (Rule 9); two-way backlink; promoted playbooks may drift → manual re-sync.

## 9. Accepted Limitations (carried forward, not solved)

- **AL-1:** No hook can verify the *truthfulness/completeness* of self-reported failures; structural non-empty checks raise the floor only.
- **AL-2:** Enforcement fires **only in Claude Code**; Cursor/Codex/other-tool sessions won't self-maintain the brain. Mitigation: `AGENTS.md` pointer + consolidation journal-vs-git gap check.
- **AL-3:** Task-boundary detection is heuristic (file/commit signals); the gate can occasionally over/under-fire. Mitigation: no-op escape, loop-breaker, gap check.
- **AL-4:** Distillation *quality* is agent-dependent; escalating SessionStart pressure raises the floor but does not guarantee genuine learning.
- **AL-5:** Brain history in the code repo is a confidentiality/entanglement tradeoff; mitigated by separate `brain:` commits + a no-secrets/no-PII journal rule, not eliminated.

## 10. Not Replicated from Hermes (honest scope)

No SQLite/FTS5 DB, no DSPy/GEPA genetic optimizer, no Honcho user-modeling. "Self-evolution" = Claude-curated procedural distillation + schema co-evolution in markdown — real curated learning, not automated weight/prompt search.

## 11. Verification Approach

Node "verify" checks become the implementation plan's red→green gates:
- Vault structure present (all §4 paths; `.brainstate/` gitignored).
- Simulated session: sentinel → ledger marker → journal entry → Stop **passes**.
- Stop **blocks** when substantive work exists with no covering entry; **loop-breaker** fails open after 2 blocks.
- Consolidation run produces/updates a skill and flags a journal-vs-git gap.
- **Fidelity caveat:** mocked hook-input approximates the harness; a **real-session smoke check** in yls is required before declaring done.

## 12. Acceptance Criteria

- All §4 vault files/dirs exist; `.brainstate/` + `.obsidian/` gitignored; `ylsbrain/` otherwise tracked.
- `ylsbrain/CLAUDE.md` encodes §6 protocol + §5 schemas; root `yls/CLAUDE.md` has the ~15-line pointer section; `.claude/settings.json` has the 4 hooks.
- A simulated task: SessionStart injects state; work logged; Stop gates until a compliant journal entry exists; entry written → passes.
- A consolidation pass turns ≥2 related journal entries into a skill with a Revision-log line.
- All §11 verify checks green; real-session smoke check performed.
- All five accepted limitations documented in `ylsbrain/CLAUDE.md`.

## 13. Future Work (own specs later)

- Developer-brain promotion automation (currently manual-gated).
- Multi-tool enforcement (Cursor/Codex) — AL-2.
- Optional local semantic search if the journal outgrows index+grep.
