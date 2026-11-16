# Yellow Letter Shop feature map

Index of user-facing journeys the verify-yls skill can drive. Keep this current via the maintain-verification-skill process whenever routes, copy, or selectors change.

App: **The Yellow Letter Shop** (direct-mail campaigns: design, lists, order, pay in Stripe test mode). Surface: Next.js App Router on **http://localhost:3010**.

| Feature | Route(s) | Auth | File |
|---|---|---|---|
| Home | `/` | Public (logged-in users redirect to `/dashboard`) | [home.md](home.md) |
| Auth | `/?auth=login`, `/?auth=signup`, `/login` → modal | Public | [auth.md](auth.md) |
| Template gallery | `/templates` | Public | [templates.md](templates.md) |
| Campaign / order | `/new-campaign`, `/orders/new` | Campaign page requires session; order UI is not middleware-gated | [campaign-order.md](campaign-order.md) |
| Mailing lists | `/mailing-services/mailing-list-manager`, `/mailing-services/build-lists` | `FeatureAuthGuard` + `redirectToAuth` | [mailing-lists.md](mailing-lists.md) |

Drive one file at a time:

```bash
node .cursor/skills/verify-yls/scripts/drive.mjs --feature home
node .cursor/skills/verify-yls/scripts/drive.mjs --feature auth
node .cursor/skills/verify-yls/scripts/drive.mjs --feature templates
node .cursor/skills/verify-yls/scripts/drive.mjs --feature campaign-order
node .cursor/skills/verify-yls/scripts/drive.mjs --feature mailing-lists
```

Related but not seeded here: designer `/design/customize` (auth redirect), dashboard `/dashboard` (middleware), admin `/dashboard/admin/*`. Add files when those journeys need dedicated proof.
