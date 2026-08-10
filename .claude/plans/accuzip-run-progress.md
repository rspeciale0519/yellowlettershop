# AccuZip validation run — progress

Branch `bugfix/accuzip-validation` · plan `.claude/plans/bugfix-accuzip-validation.md`

**Status as of 2026-08-10: UNBLOCKED.** The account-level cap that stopped
this run is resolved (see the 2026-08-10 update below) — Phases 2–6 can start.
One narrow row-count clarification is still open and should be settled before
finalizing the small-order design, but does not block starting other work.

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

**Still open after 2 replies:** level 4 vs 5 — does the 25-record cap apply to
CASS/DQ validation or only the Mailing Lists product. Test credentials also
still unrequested/unanswered.

## Vendor update 2026-08-08 (2nd reply) — webhook, egress, and file limits resolved

AccuZip support (Vincent Murdoch) answered the rest of the follow-up: webhook
support confirmed (pass `callback_url` on the upload call, no separate
registration), egress is a US IP block (Vercel functions pinned to a US
region should be fine), and the practical row ceiling is **1,000,000**
records (spec's 2,000,001 max is technically true but AccuZip recommends
against relying on it). Also clarified the download-ratio rule: abandoned
jobs count against it, failed jobs usually don't, it's tracked monthly with
advance notice, and re-downloading via the same job GUID doesn't count again.
Full detail: `docs/temp/accuzip-blocker.md`.

**Only remaining blocker:** level 4 vs 5 record cap. Test credentials also
still open. Everything else needed to design Phase 2+ is now known.

## Vendor update 2026-08-10 (3rd reply) — level 4/5 RESOLVED, not a blocker

AccuZip support (Eric Lambeth) confirmed the account is at its effective
highest access level: *"The 25-record business just means you're eligible for
the 25-record preview-only free download, which every access level gets."*
No validation cap, no separate production tier to migrate to. **This was the
one item that could have killed the AccuZip approach outright — it's closed.**

**New open item, narrower in scope:** Eric's reply also contradicts the
documented row minimum — policy text says 3 rows, Eric says "the minimum
should be 100." Max is now confirmed at 1,000,000 (the 2,000,001 figure in
AccuZip's own policy doc is stale). The minimum discrepancy affects only plan
§7 decision #1 (orders under 3 recipients skip validation). **Owner sent a
narrow follow-up asking which number AccuZip's system actually enforces,
2026-08-10 — awaiting reply.** Full detail: `docs/temp/accuzip-blocker.md`.

## Phases 2–6 — ready to start

The account-level blocker is resolved. Recommend settling or conservatively
defaulting the row-minimum question above before finalizing §7 decision #1
specifically; nothing else needs to wait on it.

## Unchanged

Production is still blocked at wizard step 2, but now only because Phases
2–6 are unbuilt, not because of an open vendor question. No order can be
placed until that implementation work happens.
