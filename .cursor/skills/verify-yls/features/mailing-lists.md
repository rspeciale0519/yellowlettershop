# Mailing lists

Manage saved lists and build new ones. Routes: `/mailing-services/mailing-list-manager`, `/mailing-services/build-lists`.

## Sub-features

- Manager (`MailingListManagerContent`): heading **Mailing List Manager**; `data-testid="add-button"` (**Add List** / **Add Record**); `data-testid="upload-button"` (**Upload List**); `data-testid="view-mode-toggle"`; `data-testid="list-name-input"` in the add-list modal
- Create order from a list: `/orders/new?listId=<id>&source=mailing_list_manager`
- List builder: **Build Your Mailing List**, filters, **Purchase List** → `/orders/new?source=list_builder`
- Unauthenticated: both pages set `FeatureAuthGuard` `redirectToAuth={true}` → `/?auth=login&redirectedFrom=...`

## How to get to it (user POV)

1. Header **Mailing List Manager** or **Build a List** (both `requiresAuth: true` — signed-out users get the login modal).
2. Direct URLs: http://localhost:3010/mailing-services/mailing-list-manager and http://localhost:3010/mailing-services/build-lists
3. After sign-in, add/upload a list, then **Create Order**.

## Driving it with the verify-yls harness

```bash
node .cursor/skills/verify-yls/scripts/drive.mjs --feature mailing-lists
```

Without a session the harness expects the **auth modal** (Welcome back / `#login-email`), not the manager chrome. That is the real unauthenticated path.

With a local session, additionally:

- `h1` **Mailing List Manager**
- `data-testid="add-button"`, `data-testid="upload-button"`, `data-testid="view-mode-toggle"`
- Add a list via `data-testid="list-name-input"` and confirm it appears
- Screenshot: `mailing-list-manager.png`

## Gotchas

- `MailingListManagerLanding` / `BuildListLanding` are passed as `landingPage` but **never shown** while `redirectToAuth={true}`. Do not wait for **Manage Your Mailing Lists Like a Pro** or **Start Free Trial** on these routes.
- Creating/listing records needs local Supabase + a signed-in user. `supabase/seed.sql` is loaded only on `npx supabase start` / db reset. If seed has no lists, **Existing List** in the order flow cannot be proven — record that; do not skip the path.
- No Docker: stop after observing the login redirect. Do not call a hosted project.
- Manager `data-testid`s are the only testids on this journey; public pages rely on labels/roles.

## Observable end state

**Signed out:** visiting `/mailing-services/mailing-list-manager` opens `/?auth=login` with **Welcome back**.

**Signed in (local DB):** **Mailing List Manager** heading, Add/Upload controls, and a list you created visible in the table. Proof of a write is a new local `mailing_lists` row, not only a toast.
