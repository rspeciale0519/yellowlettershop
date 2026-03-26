# Order Wizard E2E — Design Spec
**Date:** 2026-03-22
**Status:** Approved
**Branch:** `feature/order-wizard-e2e`

---

## Overview

The YLS order wizard (`/orders/new`) has all 6 step components built but cannot compile or run due to a missing type file, unconnected navigation callbacks, and missing API routes. This spec covers the work to make the wizard fully navigable and interactive — every step renders real UI, the real AccuZip API is called, and the MLM integration is surfaced where relevant.

**Out of scope:** proof review/PDF annotation, real payment capture (authorization only), FPD (not used — custom design system only).

---

## Current State

### What exists and works
- `OrderProvider` — full state management, auto-save logic, step navigation functions
- All 6 step components — built with real UI, import from `@/types/orders`
- Custom design canvas — `CanvasArea`, `ToolsSidebar`, `TextToolPanel`, `ImageToolPanel`
- AccuZip API infrastructure — 7 routes already exist (`/api/accuzip/*`)
- Payment infrastructure — `/api/payments/methods` and related routes exist
- `/api/design/save` and `/api/design/preview` — both exist

### What is broken
- `types/orders.ts` — imported by every step component but file is missing from `types/`; exists intact in `temp/versions/new-001-bkup-01/types/orders.ts`
- Navigation callbacks — `onNext`, `onBack`, `onSaveDraft` passed as `() => {}` stubs in `app/orders/new/page.tsx`
- 4 missing API routes: `/api/orders/drafts` (POST), `/api/orders/drafts/[id]` (GET), `/api/orders/submit` (POST), `/api/orders/pricing` (POST)
- Duplicate/conflicting step key cases in `OrderProvider.validateCurrentStep()` switch

### What is stubbed (needs completing)
- Step 1: MLM list selector = Alert placeholder; manual entry form = Alert placeholder
- Step 2: AccuZip validation uses hardcoded mock data instead of real API

---

## Architecture

No structural changes to the wizard. `OrderProvider` remains the single source of truth via React Context. `app/orders/new/page.tsx` wraps everything and renders the current step. Navigation flows through `useOrderWorkflow()`.

### File structure additions
```
types/
  orders.ts                          ← restored from backup

app/api/orders/
  drafts/
    route.ts                         ← POST save draft, GET list drafts
    [id]/
      route.ts                       ← GET load draft by ID
  submit/
    route.ts                         ← POST submit completed order
  pricing/
    route.ts                         ← POST calculate pricing breakdown

app/api/integrations/
  mlm/
    status/route.ts                  ← GET check MLM connection status
    connect/route.ts                 ← POST initiate connection (happy path + popup fallback)
    callback/route.ts                ← GET receive token from popup redirect
    disconnect/route.ts              ← DELETE revoke connection
    lists/route.ts                   ← GET fetch user's MLM lists
    lists/import/route.ts            ← POST push a new list to MLM

components/orders/steps/
  MlmListPicker.tsx                  ← new: list selector for MLM data source
  ManualEntryForm.tsx                ← new: manual recipient entry form

hooks/
  use-mlm-connection.ts              ← new: { isConnected, isLoading }

lib/integrations/
  mlm-client.ts                      ← new: server-side MLM API utility

supabase/migrations/
  YYYYMMDD_user_integrations.sql     ← new: user_integrations table
```

---

## Section 1: Foundation Fixes

### 1.1 Restore `types/orders.ts`
Copy `temp/versions/new-001-bkup-01/types/orders.ts` → `types/orders.ts`. No modifications. Contains:
- `ORDER_STEPS` (6-step array: data_and_mapping, address_validation, design_and_content, campaign_settings, review, payment)
- `OrderState`, `OrderStepProps`, `OrderWorkflowContextType`, `StepValidation`
- All sub-interfaces: `ListDataSelection`, `ValidationResults`, `ContactCardSelection`, `MailingOptionsConfig`, `CampaignConfig`, `FPDDesignData` (repurposed as `CustomDesignData`), `PricingBreakdown`, `OrderApproval`, `PaymentData`
- `isStepRequired()`, `getStepByKey()`, `getStepById()` utilities

### 1.2 Wire navigation in `app/orders/new/page.tsx`
In `OrderContent` (the child component rendered inside `<OrderProvider>`), destructure `nextStep`, `previousStep`, `saveDraft` from `useOrderWorkflow()` and pass them as `onNext`, `onBack`, `onSaveDraft` in `commonProps`. Currently all three are `() => {}`. `OrderContent` is already in the correct location inside the provider boundary — no restructuring of the provider/consumer pattern is needed.

**`OrderNavigation` note:** The `<OrderNavigation>` component rendered at the bottom of `OrderContent` already calls `nextStep()` and `previousStep()` directly from `useOrderWorkflow()` — it does not use `commonProps` and requires no stub fixes. The last-step "Complete Order" button handler currently calls `console.log` — **do not wire it to `submitOrder()`**. `PaymentStep` already calls `submitOrder()` internally via its own payment confirmation flow. Wiring the nav button separately would create a duplicate submit path. The nav button on the last step is already disabled via `canProceed` (from `validateCurrentStep()`) until payment is authorized, which is sufficient — no changes to `OrderNavigation` are needed beyond removing the `console.log`.

### 1.3 Fix `OrderProvider.validateCurrentStep()`
The switch statement has duplicate handling under legacy key names that overlap with or partially match canonical keys. Remove **all** of the following legacy case branches — they are unused and cause unreachable or incorrect validation paths:
- `list_data`
- `column_mapping`
- `accuzip_validation`
- `review_and_approval`
- `contact_cards`
- `design`
- `mailing_options`
- `campaign_setup`

Keep only the 6 canonical case branches that match `ORDER_STEPS` exactly:
- `data_and_mapping`
- `address_validation`
- `design_and_content`
- `campaign_settings`
- `review`
- `payment`

The `OrderState` type retains both consolidated and legacy fields for backward compatibility — only the validation logic switch needs cleaning.

**Important:** Do NOT modify the body of any kept case — only remove legacy case branches. In particular, the `address_validation` case body currently checks `orderState.accuzipValidation` (legacy field). Leave this intact; it will be updated as part of Section 3's dual-write work.

### 1.4 Missing API routes

**`POST /api/orders/drafts`**
- Auth: required
- Body: `{ orderId?: string, orderState: OrderState }`
- Creates or updates a row in `order_drafts` table (Supabase), scoped to `auth.uid()`
- Sets `expires_at = now() + 30 days`
- Returns `{ orderId: string }`
- Validate body with Zod

**`GET /api/orders/drafts/[id]`**
- Auth: required
- Returns draft by ID, enforces RLS (user can only load their own drafts)
- Returns `{ orderState: OrderState }`
- Returns 404 if expired or not found

**`POST /api/orders/submit`**
- Auth: required
- Body: `{ orderState: OrderState }`
- Validates payment status is `'authorized'`
- Creates a row in `orders` table with status `'submitted'`
- Marks the associated draft as `submitted`
- Returns `{ orderId: string, status: 'submitted' }`

**`POST /api/orders/pricing`**
- Auth: required
- Body: `{ orderState: OrderState }`
- Extracts `mailingOptions` from `orderState.mailingOptions` and `recordCount` from `orderState.listData.totalRecords` (or `listData.manualRecords.length` for manual entry)
- Calls the same pricing calculation logic as `/api/orders/calculate-pricing` by importing and reusing the shared calculation function (do not make an HTTP call to the other route — extract the calculation logic into a shared utility and import it in both routes)
- Returns `PricingBreakdown`

---

## Section 2: Step 1 — Data & Mapping

### 2.1 MLM List Selector (`MlmListPicker.tsx`)
Rendered inside the `currentSource === 'existing'` branch of `DataSourceDetailsSection` (i.e., inside the "Select Existing List" section), when `isConnected === true`.

**Behaviour:**
- Fetches `GET /api/integrations/mlm/lists` on mount (paginated, `?page=1&perPage=20&search=`)
- Renders a searchable list: list name, record count, last modified
- Single selection — clicking a row sets it as active with a checkmark
- On select: calls `onDataComplete({ dataSource: 'mlm_select', selectedListId: id, selectedListName: name, recordCount: n })`
- Search is debounced 300ms, re-fetches with `?search=term`
- Loading skeleton while fetching
- Empty state: "No lists found. [Create one in MLM →]" (links to MLM app)

**Visibility:** only shown if `useMlmConnection().isConnected === true`. If false, the "Existing List" button is removed from `DataSourceSelectionButtons` entirely. To implement this, add `isConnected: boolean` to `DataSourceSelectionButtonsProps` and conditionally render the button based on that prop. The parent (`DataAndMappingStep`) passes `useMlmConnection().isConnected`.

**Data source field alignment:** `DataSourceDetailsSection` reads `orderState.dataAndMapping?.listData?.source` (not `dataSource`) and branches on `currentSource === 'existing'` to render the "Select Existing List" section. When the "Existing List" button is clicked, `DataSourceSelectionButtons` must set **both** `source: 'existing'` and `dataSource: 'mlm_select'` in the listData object so `DataSourceDetailsSection` correctly shows the section. `MlmListPicker` is rendered **inside** the `currentSource === 'existing'` branch of `DataSourceDetailsSection`.

### 2.2 Manual Entry Form (`ManualEntryForm.tsx`)
Rendered inside the `currentSource === 'manual'` branch of `DataSourceDetailsSection`. This is the `source` field (set by `DataSourceSelectionButtons` to `'manual'` when Manual Entry is clicked), not the `dataSource` field (`'manual_entry'`).

**Fields (all required except Address Line 2):**
- First Name, Last Name
- Address Line 1, Address Line 2 (optional)
- City, State (dropdown), ZIP Code

**Behaviour:**
- "Add Recipient" button validates fields with Zod, appends to `listData.manualRecords[]`
- Submitted entries shown in a table below (Name, Address, remove button)
- Soft warning at 20+ records: "For large lists, uploading a CSV is faster."
- State stored in `orderState.listData.manualRecords`

### 2.3 "Save to MLM" checkbox
Rendered below the file dropzone after a successful file upload, only if `isConnected === true`.

**Label:** "Save this list to my MLM account for future use"
**Behaviour:**
- Does not block proceeding — order flow continues regardless
- If checked: after column mapping completes and user advances past Step 1, build a `ManualRecord[]` by re-parsing the `File` object stored in `orderState.dataAndMapping.listData.uploadedFile` (already in client memory) using Papa Parse or the same CSV parser used during column mapping, then applying the completed `columnMapping` to transform each raw row into `{ firstName, lastName, addressLine1, addressLine2, city, state, zipCode }`. Fire a background `POST /api/integrations/mlm/lists/import` with `{ name: <uploaded file name without extension>, records }`. If the file object is no longer available (e.g. after a page reload), skip the background import silently.
- On success: toast "List saved to your MLM account"
- On failure: toast "Couldn't save to MLM — you can export from Mailing List Manager later." No retry, no blocking.

---

## Section 3: Step 2 — Address Validation

Replace mock `handleStartValidation` with real AccuZip polling flow.

### Flow
1. User clicks "Start Address Validation"
2. Build the upload request body from `orderState`. The route expects `{ columnMapping, listData }` where `source` is `z.enum(['upload', 'list_builder', 'saved_list'])`:
   ```
   // file upload:
   {
     columnMapping: orderState.dataAndMapping.columnMapping,
     listData: { source: 'upload', uploadedFileId: listData.uploadedFileId }
   }

   // mlm_select (inline records from the MLM list loaded by MlmListPicker, stored in listData.mlmRecords):
   {
     columnMapping: orderState.dataAndMapping.columnMapping,
     listData: { source: 'list_builder', records: listData.mlmRecords }
   }

   // manual_entry:
   {
     columnMapping: orderState.dataAndMapping.columnMapping,
     listData: {
       source: 'list_builder',
       records: listData.manualRecords.map(r => ({
         address_line_1: r.addressLine1, city: r.city, state: r.state,
         zip: r.zipCode, first_name: r.firstName, last_name: r.lastName
       }))
     }
   }
   ```
3. `POST /api/accuzip/upload` with the above body — returns `{ jobId, totalRecords, status }`
4. Button state changes to "Validating..." with spinner
5. Poll `GET /api/accuzip/status/[jobId]` every 3 seconds
6. Show an **indeterminate** progress bar (animated pulse/stripe, not a percentage) while `status === 'processing'`. The `processed` field from the status route is derived from counts that are only written on completion, so it is always 0 during mid-run — do not attempt to compute a percentage from it
7. On completion: `GET /api/accuzip/results/[jobId]` — returns `{ totalRecords, deliverableRecords, undeliverableRecords, validatedAt, cassCertified, records, summary }`
8. Map results to **both** `orderState.addressValidation` (new canonical field) **and** `orderState.accuzipValidation` (legacy field). The dual-write is load-bearing: the `address_validation` case in `validateCurrentStep()` currently checks `accuzipValidation` — omitting the legacy write will cause the step gate to remain locked even after successful validation. Write both:
   - `totalRecords` → `addressValidation.totalRecords` and `accuzipValidation.totalRecords`
   - `deliverableRecords` → `addressValidation.deliverableCount` and `accuzipValidation.deliverableCount`
   - `undeliverableRecords` → `addressValidation.undeliverableCount` and `accuzipValidation.undeliverableCount`
   - `summary.deliveryRate` → `addressValidation.deliveryRate` and `accuzipValidation.deliveryRate`
   - `records` → `addressValidation.validatedRecords` (used by undeliverable panel)
   - `validatedAt` → `addressValidation.validatedAt`
   - `cassCertified` → `addressValidation.cassCertified`
9. Existing results cards (Total, Deliverable, Undeliverable, Delivery Rate) populate from real data

### Addition: Undeliverable Records Panel
Collapsible section below results (only shown if `undeliverableRecords > 0`):
- "View X undeliverable addresses ▼"
- Expands to a table: original address, reason code, suggested correction (if any)
- No action required — informational only. User can note and fix before next time.

### Error handling
- If AccuZip upload fails: show error alert with "Try Again" button, do not advance
- If polling times out after 5 minutes: show timeout message with "Retry" option
- Preserve any previously validated results in state — re-running validation overwrites only after new results arrive

---

## Section 4: MLM Integration Infrastructure

### 4.1 Supabase table: `user_integrations`
```sql
create table user_integrations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  app_id       text not null,           -- 'mlm'
  access_token text not null,           -- stored server-side only, never returned to client
  connected_at timestamptz not null default now(),
  revoked_at   timestamptz,
  unique(user_id, app_id)
);

alter table user_integrations enable row level security;
create policy "users manage own integrations"
  on user_integrations for all
  using (auth.uid() = user_id);
```

### 4.2 `lib/integrations/mlm-client.ts`
Server-side utility. All MLM API calls go through here, never inline in route handlers.

Functions:
- `getMlmConnectionStatus(userId)` — reads `user_integrations` for the user
- `getMlmToken(userId)` — returns stored access token or throws if not connected
- `fetchMlmLists(token, { page, perPage, search })` — calls `GET {MLM_APP_URL}/api/integrations/data/lists`
- `importListToMlm(token, { name, records })` — calls `POST {MLM_APP_URL}/api/integrations/data/lists`
- `connectViaServiceKey(userEmail)` — calls `POST {MLM_APP_URL}/api/integrations/connect` with service key
- `revokeToken(token)` — calls `DELETE {MLM_APP_URL}/api/integrations/revoke`

### 4.3 New API routes in YLS

**`GET /api/integrations/mlm/status`**
- Auth: required
- Checks `user_integrations` for current user + `app_id = 'mlm'`
- Returns `{ connected: boolean }`
- Lightweight — used by `useMlmConnection` hook on every wizard load

**`POST /api/integrations/mlm/connect`**
- Auth: required
- Tries happy path: calls `mlmClient.connectViaServiceKey(user.email)`
- If MLM returns token: store in `user_integrations`, return `{ connected: true }`
- If MLM returns `{ found: false }`: return `{ requiresPopup: true, authorizeUrl: string }`
- Frontend opens popup to `authorizeUrl` if `requiresPopup: true`

**`GET /api/integrations/mlm/callback`**
- Public (no auth middleware — token arrives in query string from MLM redirect)
- Query params: `?token=...&state=...`
- The `state` param is a signed JWT containing `{ userId, nonce }`, signed with `MLM_SERVICE_KEY` (HMAC-SHA256). No separate nonce storage is needed — signature verification proves authenticity and `userId` is extracted from the payload.
- Validates state signature; rejects with 400 if invalid or expired (JWT `exp` = 10 minutes from `connect` call)
- Stores `token` in `user_integrations` for the `userId` extracted from the state JWT
- Returns a minimal HTML page that posts `{ type: 'mlm-connected' }` to `window.opener` and closes the popup

**`DELETE /api/integrations/mlm/disconnect`**
- Auth: required
- Calls `mlmClient.revokeToken(token)` on MLM
- Deletes row from `user_integrations` (or sets `revoked_at`)
- Returns `{ disconnected: true }`

**`GET /api/integrations/mlm/lists`**
- Auth: required
- Calls `mlmClient.fetchMlmLists(token, query)`
- Returns paginated list response to client
- If token is invalid (MLM returns 401): return `{ error: 'mlm_token_invalid' }` — frontend handles by showing "Reconnect MLM" prompt

**`POST /api/integrations/mlm/lists/import`**
- Auth: required
- Body: `{ name: string, records: ManualRecord[] }`
- Calls `mlmClient.importListToMlm(token, body)`
- Returns `{ success: boolean }`
- Errors are non-blocking from the order wizard perspective

### 4.4 `hooks/use-mlm-connection.ts`
```ts
export function useMlmConnection() {
  // SWR fetch to GET /api/integrations/mlm/status
  // Returns { isConnected: boolean, isLoading: boolean, mutate }
  // Revalidates on focus, cached for session
}
```

### 4.5 YLS Settings — Integrations tab
Added to the profile/settings page alongside existing tabs.

**Disconnected state:** Card with MLM name, description, "Connect" button. Clicking calls `POST /api/integrations/mlm/connect`. If `requiresPopup: true`, opens popup window. On popup close, re-checks status and updates UI.

**Connected state:** Green "Connected" badge, connected date, "Disconnect" button with confirmation dialog.

### 4.6 Environment variables
```env
MLM_APP_URL=        # Base URL of MLM app (e.g. https://mlm.yourdomain.com)
MLM_SERVICE_KEY=    # Shared secret — must match YLS_SERVICE_KEY in MLM env vars
```

---

## Security Notes

- MLM access tokens are stored server-side only — never returned to the browser
- `MLM_SERVICE_KEY` lives only in server environment variables
- Popup callback validates a `state` param — a signed JWT (`userId` + `nonce`, signed with `MLM_SERVICE_KEY`, 10-minute expiry) — to prevent CSRF without requiring server-side session storage
- `user_integrations` is RLS-protected — users can only access their own rows
- If MLM token is revoked externally, YLS detects 401 on next API call and surfaces "Reconnect MLM" rather than silently failing

---

## What Is Explicitly Out of Scope

- FPD — not used, not referenced. Custom design system only.
- Proof review / PDF annotation — separate feature
- Real payment capture — Step 6 authorizes only; capture triggers on proof approval (future)
- Orders database schema — `order_drafts` and `orders` tables are created as part of this work with minimal schema; full order lifecycle schema is a separate spec
- MLM-side implementation — covered in `/c/Users/rob/documents/software/data-management/mlm2/.claude/plans/feature-yls-integration.md`
