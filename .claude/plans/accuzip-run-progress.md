# AccuZip validation run — progress

Branch `bugfix/accuzip-validation` · plan `.claude/plans/bugfix-accuzip-validation.md`

## Phase 1 — Verify the spec before building on it — **STOPPED, blocked on vendor**

**Status:** complete. Gate fired. Phases 2–6 not started, by design.

**Proved (live `POST .../v2_0/INFO`):**

| Question | Answer |
|---|---|
| Is the cloud API real? | Yes — `cloud2.iaccutrace.com` answers, spec §2 base URL correct |
| Is our key valid? | Yes — `success:true`, `active:true` |
| Auth encoding? | **form-encoded `apiKey=<guid>`**; raw body fails, `Bearer` was never right |
| Account level | `4` — "…Limited 25-record Mailing Lists Test Environment" |
| Credits remaining | `{"monthly":"","annual":"","total":""}` — **none** |
| Credits used | `0` everywhere — account has never run a job |

**Why this stops the run:** credits are consumed on production-CSV download
(spec §Credit Management). A deliverable-only CSV is the whole point of the
integration. With zero credits it dead-ends at the final step, so building
phases 2–6 now would be building on sand — the exact failure the Redstone
episode taught us to gate against.

**Blocker detail + owner script:** `docs/temp/accuzip-blocker.md` (untracked —
it is local-only by design). Owner must contact AccuZip (api@accuzip.com,
805.461.7300, account `7744004001`) about credits, level 4 vs 5, and test
credentials.

**Artifact:** `scripts/accuzip-probe.ts` — dev-only, re-runnable, never prints
the key.

**Gate:** typecheck:full 0 · npm test 290 passing 0 failures · eslint 0 errors
on the changed file.

## Phases 2–6 — not started

Blocked pending the vendor answers. Two of them change the design, so starting
early would mean rework:
- if CASS validation is capped at 25 records, AccuZip may be the wrong vendor
- if the production CSV is costly per download, plan §7.3 becomes load-bearing

## Unchanged

Production is still hard-blocked at wizard step 2 — no order can be placed. The
cause is now fully understood and is commercial as well as technical.
