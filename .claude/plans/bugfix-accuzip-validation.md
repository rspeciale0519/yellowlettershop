# Bugfix: AccuZip address validation calls an API that does not exist

**Status:** ready to execute · **Branch:** `bugfix/accuzip-validation`
**Severity:** P0 — production cannot take a single order
**Written:** 2026-08-03, from a live production smoke test + a full read of
`dev-docs/api-accuzip.md`

---

## 1. The problem, with evidence

Production is hard-blocked at step 2 of the order wizard. A customer uploads a
list, clicks validate, and gets **0 deliverable / 100% undeliverable** for
addresses that are unambiguously real. "Continue to Design & Content" is
disabled, so **no order can be placed at all**.

Verified 2026-08-03 against `app.yellowlettershop.com` with three known-valid
addresses (White House, Empire State Building, 233 S Wacker):

| Evidence | Value |
|---|---|
| `/api/accuzip/results/<job>` per record | `validation_errors: ["Validation service unavailable"]` |
| Vercel runtime log | `Failed to batch validate records: Error: AccuZIP API error: Not Found` |
| `lib/api/accuzip/validation.ts:4` | `ACCUZIP_API_BASE = process.env.NEXT_PUBLIC_ACCUZIP_API_URL \|\| 'https://api.accuzip.com/v1'` |
| Vercel env | `ACCUZIP_API_KEY` set; **no** `NEXT_PUBLIC_ACCUZIP_API_URL`, so the fallback is live |
| Direct probe | `api.accuzip.com` resolves, `/` → 200, **`/v1` → 404** |

**Root cause:** we implemented a synchronous REST API
(`POST /v1/validate/address`, `/v1/validate/batch`, `Authorization: Bearer`)
that AccuZip does not have and, as far as we can tell, never had. The real API
is documented in our own repo at `dev-docs/api-accuzip.md`: a **cloud, async,
GUID-job** API on a different host with a different auth mechanism.

This has therefore **never worked**. `dev-docs/implementation-status.md` listing
AccuZip as BUILT ("real AccuZip on the order path") is false and must be
corrected as part of this work.

> Note for whoever picks this up: on 2026-08-02 a local smoke hit this exact
> wall and it was worked around by blanking `ACCUZIP_API_KEY`, which routes to a
> dev-only skip. That workaround hid a total integration failure for a day. Do
> not use it again as anything other than a deliberate offline-dev switch.

---

## 2. The real API (from `dev-docs/api-accuzip.md`)

**Base URLs**
- Web services: `https://cloud2.iaccutrace.com/servoy-service/rest_ws/ws_360/v2_0/`
- Web apps (upload/download): `https://cloud2.iaccutrace.com/ws_360_webapps/`

**Auth:** the API key is a GUID passed as a **form/body parameter named
`apiKey`** — *not* an `Authorization: Bearer` header. Our current code is wrong
about this independently of the URL.

**Flow**

1. **Upload** — `POST https://cloud2.iaccutrace.com/ws_360_webapps/v2_0/uploadProcess.jsp?manual_submit=false`
   multipart, and the spec states **parameter order is extremely important**:
   `backOfficeOption`, `json`, `apiKey`, `callbackURL`, `guid`, `file`.
   Add `dataQualityResults_CASS=true` to get DQ counts.
   Optional header remap: `col_address`, `col_address2`, `col_city`, `col_st`,
   `col_zip`.
   → `{"success360Import":true,"quote_started":true,"guid":"<guid>"}`
   Failure → `{"success":false,"message":"ERROR Invalid API Key!"}`

2. **Poll / quote** — `GET .../job/<guid>/QUOTE`
   In progress → `{"message":"QUOTE is still processing.","success":false}`
   Done → `task_state: "FINISHED"` plus DQ fields.

3. **Update quote (required before presort)** — `PUT .../job/<guid>/QUOTE`
   with `{"presort_class":"STANDARD MAIL","mail_piece_size":"LETTER"}`.

4. **Process** — `GET .../job/<guid>/CASS-PRESORT` (async; other variants add
   NCOA and dedupe). → `{"success":true}`, callback on completion.

5. **Download** — `GET https://cloud2.iaccutrace.com/ws_360_webapps/download.jsp?guid=<guid>&ftype=csv`
   `ftype`: `csv` (full print-ready), `prev.csv` (first 25, **free**), `json`,
   `presort.json`.

**Deliverability maths (spec §5 step 2):**
- deliverable = `dq_dpvhsa_y`
- undeliverable = `dq_dpvhsa_d + dq_dpvhsa_s + dq_dpvhsa_n + dq_dpvhsv`

**Webhook:** `callbackURL` receives `GET ?guid=<guid>` on completion.

---

## 3. Constraints that change our design (read before coding)

These are the things that make this a rewrite rather than a URL swap.

1. **Minimum 3 rows — header + 2 detail records.** A 1- or 2-recipient order
   **cannot be validated at all**. Our public pricing sells "1 - 249", so
   single-piece orders are a real product. **This needs an owner decision**
   (see §7). Do not silently pad the file with a fake record; that would mail
   to a fabricated address or corrupt counts.
2. **QUOTE returns aggregate counts only, not per-record flags.** Our
   `accuzip_validation_jobs.validated_records` and the whole UI assume a
   per-record `is_deliverable`. Per-record data requires either
   `GET .../job/<guid>/CleanAddresses/<filterSubType>` or downloading
   `ftype=json`/`csv`. This is the single biggest structural change.
3. **Credits are consumed on download**, not on upload or processing.
   `prev.csv` (25 records) is free. So the deliverable-only CSV we hand to the
   vendor costs credits per order — real money, and worth logging.
4. **Rate limit: 12 uploads/minute per API key** → HTTP 409 with `Retry-After`.
   Needs backoff, and matters if several customers validate at once.
5. **File must be `.csv`, CRLF or LF, max 2,000,001 rows.**
6. **AccuZip's expected headers differ from ours.** It wants `First`,
   `Address`, `City` (required) plus optional `Last`, `Address2`, `St`, `Zip`,
   `Company`. The `col_*` remap params cover only address/address2/city/st/zip —
   **not first/last** — so emit AccuZip-native headers rather than relying on
   remapping.

---

## 4. Phases

Follow Rule 8: `/git-workflow-planning:start bugfix accuzip-validation`, then a
checkpoint per phase.

### Phase 1 — Verify the spec before building on it (do not skip)

The Redstone spec in this same repo documented a **deprecated** process and cost
us days. Assume nothing here is current until a real call proves it.

- Add `scripts/accuzip-probe.ts` (dev-only, never imported by the app) that
  calls `POST .../v2_0/INFO` with the real key.
- Expected: `{success:true, level, active, credits_remaining, services}`.
- Record account **level** and **credits_remaining** in the journal — level
  gates features, and credits are consumed by downloads.
- Then upload the 3-record fixture and confirm a `guid` comes back.

**Gate:** if `INFO` fails, stop and contact api@accuzip.com (support
805.461.7300) before writing any client code. Note the spec offers test
credentials and 2–3 free test jobs — ask for them rather than burning
production credits.

**Deliverable:** journal entry with the verbatim `INFO` response and a decision:
proceed, or blocked-on-vendor.

### Phase 2 — Pure core, fully tested

`lib/api/accuzip/accuzip-core.ts`, matching the repo's `*-core.ts` convention
(`dispatch-core`, `redstone-core`, `refund-core`) — no IO, so it is unit
testable:

- `buildAccuzipCsv(records)` → AccuZip-native headers (`First,Last,Address,Address2,City,St,Zip,Company`), CRLF, `.csv`
- `assertUploadable(recordCount)` → enforces the 3-row minimum and 2,000,001 max with an actionable message
- `parseQuote(json)` → `{ state: 'processing' | 'finished' | 'error', deliverable, undeliverable, totalRecords, raw }`
- `deliverabilityFromDq(dq)` → implements `y` vs `d+s+n+v` exactly as §5 step 2
- `classifyAccuzipResponse(status, body)` → `ok | processing | rate_limited(retryAfter) | invalid_key | file_rejected | permanent | retryable`

Reuse the formula-injection guard from `dispatch-core.neutralizeSpreadsheetFormula`
— this CSV is customer-supplied data leaving our system.

**Tests:** the DQ arithmetic, the 3-row boundary (2 rows rejected, 3 accepted),
CRLF termination, header naming, and every response class above.

### Phase 3 — IO client + job lifecycle

- `lib/api/accuzip/accuzip-client.ts`: `uploadList`, `getQuote`, `updateQuote`,
  `processJob`, `downloadCsv`. **Preserve multipart parameter order.** Retry
  only `rate_limited` (honour `Retry-After`) and `retryable`; never retry
  `invalid_key` or `file_rejected`.
- **Persist the raw response on every failure.** We could not answer Redstone's
  question about their own error ids because we discarded bodies; do not repeat
  that with AccuZip.
- Migration: add `accuzip_guid text`, `raw_quote jsonb`, `last_error jsonb` to
  `accuzip_validation_jobs`; index on `accuzip_guid`.
- Rewire `app/api/accuzip/{upload,status,results}` to the new client. The
  existing route surface (create job → poll status → fetch results) already
  suits an async API, so it should largely survive.

### Phase 4 — Completion signal

Prefer the webhook (spec §12 best practice #1) over polling.

- `app/api/webhooks/accuzip/[token]/route.ts`, reusing the pattern established
  by `app/api/webhooks/redstone/[token]/route.ts`: high-entropy path token,
  `timingSafeEqual`, fail closed when the env var is unset, record every call.
- Pass that URL as `callbackURL` on upload.
- **Keep polling as the fallback**, since `status/[jobId]` already exists and a
  webhook that never fires must not hang a customer forever. Time-box the poll
  and surface a clear timeout state.

### Phase 5 — Honesty fixes on the failure path

These are separate defects found in the same smoke and must not be lost:

1. `app/api/accuzip/results/[jobId]/route.ts:61` hardcodes
   `cassCertified: true`. It is currently true even when no validation ran —
   a false attestation written into order data. Derive it, never assert it.
2. The UI shows "Address validation completed successfully. Your mailing list
   is ready for processing." while simultaneously showing 0% and blocking
   Continue. Contradictory.
3. A service outage is reported to the customer as "3 undeliverable addresses",
   blaming their list for our broken integration. **Distinguish
   `service_unavailable` from `all_undeliverable`.** They need different copy,
   and the outage case should offer a retry, not tell the customer their data
   is bad.
4. `components/orders/OrderProvider.tsx:173` gates on
   `deliverableRecords === 0`. That gate is right for a genuinely bad list;
   keep it, but it must not be the thing that reports an outage.

### Phase 6 — Docs + verification

- `npm run typecheck:full`, `npm test`, `npm run build`.
- Re-run the **production customer smoke** end to end (upload → validate →
  design → review → stop at payment). Production Stripe is in **test mode**
  (`pk_test_51TEd05E`, confirmed in Vercel and in the app chunk), so reaching
  payment costs nothing.
- Correct the AccuZip status in `dev-docs/implementation-status.md` (§3 lists it
  BUILT) and `ylsbrain/knowledge/features.md`.

---

## 5. Files in scope

| Path | Action |
|---|---|
| `lib/api/accuzip/validation.ts` | replace (invented API) |
| `lib/api/accuzip/{fetch,params,record,count}.ts` | audit — likely same invented base URL |
| `lib/api/accuzip/accuzip-core.ts` | new, pure |
| `lib/api/accuzip/accuzip-client.ts` | new, IO |
| `app/api/accuzip/{upload,status,results}/route.ts` | rewire |
| `app/api/webhooks/accuzip/[token]/route.ts` | new |
| `components/orders/steps/AddressValidationStep.tsx` | outage vs bad-list copy |
| `components/orders/OrderProvider.tsx:170-178` | keep gate, separate outage state |
| `supabase/migrations/` | guid + raw response columns |
| `dev-docs/implementation-status.md`, `ylsbrain/knowledge/features.md` | correct the BUILT claim |

## 6. Environment

- `ACCUZIP_API_KEY` — already set in Vercel (Preview + Production).
- `NEXT_PUBLIC_ACCUZIP_API_URL` — **rename to `ACCUZIP_API_BASE_URL`.** This is
  a server-only secret-adjacent config; `NEXT_PUBLIC_` ships it to the browser
  for no reason.
- `ACCUZIP_WEBHOOK_TOKEN` — new, for phase 4.

## 7. Decisions needed from the owner

1. **Orders under 3 recipients.** AccuZip cannot validate them. Block checkout,
   or allow the order with validation skipped and disclosed? Pricing sells from
   1 piece, so this is a live case, not hypothetical.
2. **Which processing pipeline.** `CASS-PRESORT` is the minimum. NCOALink
   requires a signed PAF per list owner (spec §6) — do we have one? Dedupe adds
   `DUPS_01/02/03`. This affects both cost and what the vendor receives.
3. **Credits.** Downloads consume them. Confirm the account has enough for
   expected volume, and decide whether to use the free `prev.csv` for the
   customer-facing preview and only pay for the full CSV at dispatch.

## 8. Risks

- **The doc may be stale.** It carries a 2025 staleness banner. Phase 1 exists
  precisely to find that out on day one rather than after four phases.
- **Per-record deliverability may force a UI change** if we can only obtain
  aggregate counts cheaply. Decide in phase 2 whether the wizard needs
  per-record display at all, or whether counts plus a downloadable
  deliverable-only CSV is sufficient.
- **Credit burn during development.** Use test credentials (api@accuzip.com)
  and keep a log of test GUIDs, as the spec advises, to avoid billing
  confusion.
