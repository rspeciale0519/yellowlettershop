# Template gallery

Public browse of in-memory templates (`app/templates/page.tsx`, `data/templates-data`). No Supabase.

## Sub-features

- Page heading **Template Gallery**
- Search (`aria-label="Search templates"`)
- Type filters and sort (`TemplateFilters`)
- Category accordion (default expanded `real-estate`)
- Grid of templates; choosing one continues into order with `?templateId=`

## How to get to it (user POV)

1. Header **Templates**, or home card **Get Some Inspiration** / **Browse Templates**.
2. URL: http://localhost:3010/templates
3. Wait through **Loading templates...** (~1 second, simulated).

## Driving it with the verify-yls harness

```bash
node .cursor/skills/verify-yls/scripts/drive.mjs --feature templates
```

Assertions:

- `GET /templates` HTTP 200
- After hydration, heading **Template Gallery**
- Search input `aria-label="Search templates"`
- Loader text **Loading templates...** is gone
- Screenshot: `templates.png`

## Gotchas

- Entire gallery is client-rendered. Curl of SSR HTML will not contain **Template Gallery**.
- The 1s timeout is real (`setTimeout(..., 1000)`). `--virtual-time-budget=12000` covers it.
- No seed data. Templates are bundled.
- Starting an order from a template still hits the campaign/order journey (auth + `/orders/new?templateId=`). Do not call that a gallery pass by itself.

## Observable end state

`/templates` shows **Template Gallery**, a working search field, and template cards (not the spinner). Evidence: `templates.png` + DOM dump with those strings.
