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
- **Do not** treat Add List (`data-testid="list-name-input"`) as a save — `AddListModal` builds a mock object and never INSERTs.
- Real save: authenticated `POST /api/orders/upload-list` (JSON `{ name, mappedFields, rows }`). That is the same route the order wizard calls after CSV mapping. **Add List** is a mock and is not a save.
- On this VM, Next.js client routing from `/dashboard` swallows `Page.navigate` / `<Link>` / form GET / `Target.createTarget` to other app routes. A new document at `/mailing-services/mailing-list-manager` bounces to `/dashboard` (`FeatureAuthGuard` `getUser` race, then home `redirect('/dashboard')`). The harness therefore persists from the signed-in dashboard (same-origin cookies) and screenshots a save panel plus the local `mailing_lists` row.
- Proof: `mailing-list-persist.json` (`ok: true`, `mailingListId`), `mailing-list-save.png` (dashboard + save panel), `mailing-list-db.txt` + `mailing-list-db.png` (local `mailing_lists` row named `verify-yls-list`).

## Gotchas

- `MailingListManagerLanding` / `BuildListLanding` are passed as `landingPage` but **never shown** while `redirectToAuth={true}`. Do not wait for **Manage Your Mailing Lists Like a Pro** or **Start Free Trial** on these routes.
- Creating/listing records needs local Supabase + a signed-in user. `supabase/seed.sql` is comments only. If seed has no lists, **Existing List** in the order flow cannot be proven until a CSV persist created a row — record that; do not skip the path.
- Manager **Upload List** opens CSV import **into an existing list** (`listId` required), it does not create one.
- No Docker: stop after observing the login redirect. Do not call a hosted project.
- Manager `data-testid`s are the only testids on this journey; public pages rely on labels/roles.

## Observable end state

**Signed out:** visiting `/mailing-services/mailing-list-manager` opens `/?auth=login` with **Welcome back**.

**Signed in (local DB):** **Mailing List Manager** heading, Add/Upload controls, and a list you created visible in the table. Proof of a write is a new local `mailing_lists` row, not only a toast.
