# YLS Brain — Schema

You maintain a self-improving engineering memory for the yls app. The enforced
behavior is hook-injected each session; this file is the human-authoritative copy.

## Session-Start Ritual
Before new work: read STATE.md, the tail of the latest journal/YYYY-MM-DD.md,
index.md, and any [[skill-...]] marked in play. State what we last did and where
it lives before starting.

## Recall-before-work
Check skills/<area> for an existing relevant skill and apply it before re-deriving.

## Per-task Journal protocol
On task completion append to journal/<today>.md:
### [HH:MM] <task title>   (branch: <branch> · commits: <shas|none>)
**Synopsis:** 1-3 sentences - goal and outcome.
**What worked:** concrete + reusable. Evidence: <npm test/lint/typecheck:ui/build, or "manual: <how>">.
**What did NOT work:** dead-ends, wrong assumptions - explicit. "(none)" only if truly none.
**Artifacts:** files, decisions, [[skill-...]], PR/commit.
**Next / open:** follow-ups, risk.
Then update STATE.md, log.md, and index.md if a skill changed.
no-op escape: a one-line `no substantive task - nothing to record` is valid.
NO secrets / NO PII - pointers, not payloads.

## Evidence rule
"What worked" must cite an objective signal or explicit `manual:`; else it is
recorded as *unverified*, not "worked".

## Skill protocol
skills/<area>-<slug>.md (area = api|supabase|ui|auth|integrations|testing|build),
frontmatter: type/status/confidence/updated/sources. Sections: When to use /
The approach / Pitfalls & anti-patterns / Evidence / Revision log (append-only).
confidence provisional->established only on genuinely independent signal
(different task context or external proof). Contradiction -> status: deprecated +
tombstone. Never delete -> archive/ + tombstone.

## Consolidation
Periodic (every ~5 tasks or when the SessionStart notice says overdue), AFTER
the user's current request, time-boxed: distil recurring worked->skill,
didn't->pitfalls; revise/deprecate contradicted skills; run journal-vs-git gap
check; trim STATE; refresh index. Never preempt the user's task.

## Seam
When a skill is established AND generalizable beyond yls, propose an app-agnostic
version for the Developer portfolio brain's wiki/shared/ (kind: playbook).
Proposal-only, user-approved; cross-project write needs explicit authorization.

## Accepted Limitations
- AL-1: hooks cannot verify truthfulness/completeness of self-reports (structural floor only).
- AL-2: enforcement only in Claude Code; other tools won't self-maintain the brain.
- AL-3: task-boundary detection is heuristic; gate may over/under-fire.
- AL-4: distillation quality is agent-dependent; the post-task notice is a floor.
- AL-5: brain-in-repo is a confidentiality/entanglement tradeoff; heuristic PII scan is partial.
