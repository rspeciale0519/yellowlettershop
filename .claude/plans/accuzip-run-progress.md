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
| Credits remaining | `{"monthly":"","annual":"","total":""}` — **blank** |
| Credits used | numeric `0` everywhere — account has never run a job |
| Account type | `Transaction` (spec's example shows `Subscription`) |

**Why this stops the run:** credits are consumed on production-CSV download
(spec §Credit Management), and a deliverable-only CSV is the whole point of the
integration. Blank-vs-numeric is ambiguous — it may mean we hold no balance, or
that a Transaction account is billed per use rather than from a pool. **Either
reading blocks equally:** we cannot price or guarantee the one operation
checkout depends on. Building phases 2–6 against an unknown billing model for
the only chargeable call is the same mistake the Redstone episode taught us to
gate against.

**Blocker detail + owner script:** `docs/temp/accuzip-blocker.md` (untracked —
it is local-only by design). Owner must contact AccuZip (api@accuzip.com,
805.461.7300; our account number is in the local blocker doc, not in this
repo) about the billing model, level 4 vs 5, and test
credentials.

**Artifact:** `scripts/accuzip-probe.ts` — dev-only, re-runnable, never prints
the key.

**Gate:** typecheck:full 0 · npm test 290 passing 0 failures · eslint 0 errors
on the changed file.

## Vendor update 2026-08-08 — billing resolved, one question still open

AccuZip support (Eric Lambeth) replied twice. Billing model is now known:
transaction-based per-job pricing by record count, billed only on non-preview
download (examples given, not a full rate card); new download-ratio rule
(>50% downloads/uploads per billing period or a penalty invoice applies) that
Phase 2+ design needs to respect. Full detail: `docs/temp/accuzip-blocker.md`.

Also resolved: the "CASS API" is real but is a *separate* AccuZip product
(CASS Point-of-Entry, single-record real-time validation) that our account
isn't provisioned for — confirmed directly by AccuZip. The batch/job API is
what we have and what Phase 2+ must be built against; the plan's "orders under
3 recipients skip validation" default is a hard constraint of that API's
3-row minimum, not a choice.

**Still open, still blocking:** level 4 vs 5 — does the 25-record cap apply to
CASS/DQ validation or only the Mailing Lists product. Test credentials also
still unrequested/unanswered.

## Phases 2–6 — not started

Blocked pending the level 4/5 answer above — it's the one item left that could
still invalidate the AccuZip approach outright.

## Unchanged

Production is still hard-blocked at wizard step 2 — no order can be placed.
The remaining blocker is narrower than 2026-08-03 (billing is now understood)
but is still commercial, not just a code bug.
