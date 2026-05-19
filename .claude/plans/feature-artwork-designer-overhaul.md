# Feature: Artwork Designer Overhaul

> Plan file → Git branch (Rule 6/8): **`feature/artwork-designer-overhaul`**
> Filed in the project `.claude/plans/` per global Rule 6.
> **Rev 3** — Rev 2 fixes + verified baseline reality: `typecheck:ui` and the
> Mocha runner are **pre-existing RED** (unrelated debt). User decision:
> **"Fix runner + delta gate"** — restore a minimal Mocha runner, snapshot the
> 12 pre-existing `typecheck:ui` errors and gate on **zero new** errors; do NOT
> restore the big missing types (cascade risk); recipients via an API route.

## Context

The artwork designer (`/design/customize`) is functional but has gaps from a
prior review. Approved: implement findings **#2–#7 + full drag-and-drop**, skip
**#1** (the light canvas intentionally reflects the user-selected template; the
dark editor shell stays). Enhance the whole tool with shadcn primitives + the
frontend-design aesthetic. **Goal:** one excellent, print-accurate, discoverable
designer; remove the duplicate/legacy editor.

### Locked decisions

| # | Decision |
|---|----------|
| Mail sizes | **Selectable**: 4×6, 6×9, 6×11, 8.5×11 in @ 300 DPI; real bleed 0.125", safe, USPS address+indicia zones |
| Preview data | Preview against a **real recipient picked from a saved mailing list** |
| Background | **Per-page background color + full-bleed image** (gradient deferred; model left extensible) |
| Preview engine | **Real server-side PDF renderer** (replaces the stub) |
| Checkout editor (#4) | **Option A**: replace the embedded mini-editor in `DesignCustomizerStep` with a CTA to the unified designer, then archive the 3 legacy files |

### Verified facts & pre-existing risks

- **Save route is `.passthrough()`** (`app/api/design/save/route.ts:12,14`):
  new fields round-trip with **zero required schema change**; we add *optional*
  hardening only.
- **The 3 "dead" files are LIVE in checkout** —
  `components/orders/steps/DesignCustomizerStep.tsx:25-28` imports
  `tools-sidebar`, `text-tool-panel`, `image-tool-panel`, `canvas-area`. 620-LOC
  legacy mini-editor, divergent save shape, an `any` (line 252), an
  **unauthenticated** `/api/design/preview` call (line 158). Archival = a gated
  checkout refactor in the **same commit** as the file move; `next build` gates.
- **`.mocharc.json` only runs `tests/**/*.test.ts(x)`** — new tests live under
  `tests/` mirroring source (precedent `tests/lib/orders/pricing.test.ts`).
  Overrides the global "co-located tests" line for this repo.
- **`app/design/customize/page.tsx` is 370 LOC — already over 350.** Decomposed
  early (Phase 2), not last.
- **BASELINE IS PRE-EXISTING RED (verified, unrelated debt):**
  - `npm run typecheck:ui` → **12 errors** snapshotted to
    `docs/temp/typecheck-baseline.txt` (missing `@/types/supabase`,
    `@/types/list-builder`, `@/types/mailing-records`;
    `components/shared/column-mapping/*` errors). We do **NOT** restore the
    missing types (importing `types/supabase.ts` cascades across ~60 files).
  - `npm test` Mocha runner was broken (absent `tests/setup/*`); **restored**
    minimally (`tests/setup/register.js` + `tests/tsconfig.mocha.json`,
    ts-node `transpileOnly`). Baseline: existing suite 4 passing.
  - **Success = baseline-delta gate** (see invariant #2). Recipient/mailing
    data is consumed only via the Phase 0 API route, never by importing the
    broken mailing-list lib chain into typechecked code.
- **shadcn** Radix + CSS-vars, Tailwind **3.4.17**, **npm**
  (`npx shadcn@latest`), `cn()` at `lib/utils.ts`. Needed primitives already
  installed; `react-image-crop@^11` installed.
- Brand yellow tokenized (tailwind `yellow` scale, `--sidebar-accent`,
  `outline-yellow-500`). Kill inline-hex hover hacks → tokenized `brand` button.

---

## Architecture

### Coordinate system (single decision — drives everything)

One **design coordinate space = inches × `DESIGN_PPI`, `DESIGN_PPI = 100`**
(≈ today's implicit 862÷8.5 ≈ 101, so existing letter content stays valid).
`PRINT_DPI = 300`; **`PRINT_SCALE = PRINT_DPI / DESIGN_PPI = 3`** (a pure
multiply at render time). There is **no separate display DPI** — on-screen
scaling is the existing `zoom`. `canvasSizePx(fmt,orientation) = inches ×
DESIGN_PPI`; `specRectsPx` (bleed/trim/safe/address/indicia) in the same space.

### Back-compat & template/format migration (mandatory)

- Saved `user_designs` / `pendingOrderDesign` lacking `formatId` →
  loaded as **letter (8.5×11) at the legacy ~101 scale, elements untouched**
  (no reflow, no data loss). New docs get a `formatId`.
- The 3 built-in templates each get an assigned `formatId` and their element
  coordinates **remapped once** into the inches×100 space for that format
  (covered + asserted by a migration test).

### Layering inside the artboard (bottom → top)

paper white → page background (color, then full-bleed image) → design elements
(z-ordered) → live snap guides → **non-printing** print overlay
(bleed/trim/safe/address/indicia) → selection chrome. Overlay + guides are
**derived, never persisted, never sent to the renderer**.

### Hard invariants (enforced every phase)

1. **All new `CanvasArea` props are optional with safe defaults** until Phase 12
   removes the legacy consumer — or `DesignCustomizerStep` breaks
   `typecheck:ui` early.
2. **Baseline-delta gate** every checkpoint: `npm run lint` clean for touched
   files; `npm run typecheck:ui` introduces **zero new** errors vs
   `docs/temp/typecheck-baseline.txt` (the 12 pre-existing may remain);
   `npm test` = all prior tests still pass **and** every new test green;
   `npm run build` succeeds. Source files **≤350 LOC** (`.md` exempt). No
   new `any`.
3. Never delete — move to `archive/<relative path>` (Rule 1).
4. Recipient/mailing data is consumed **only via the Phase 0 API route**, never
   by importing the broken mailing-list lib chain into typechecked code.
5. `preview-modal.tsx` is rewritten **once** (Phase 9 shell); Phase 11 only
   fills it with the server PDF (no double rewrite).

### Reuse (not rebuild)

`react-image-crop` (crop) · `components/ui/dialog.tsx` (accessible dialogs) ·
`/api/assets` + `image-source-url.ts` (background image) · shadcn
Slider/Popover/ToggleGroup/Tooltip · existing `zoom`/pan · existing
`design_tool_save` sessionStorage handoff (checkout↔designer).

---

## Phased build (each phase = a Rule 8 checkpoint; Rule 7 roadmap each phase)

> On approval: `/git-workflow-planning:start feature artwork-designer-overhaul`.
> After each phase: update roadmap (Rule 7) → `/git-workflow-planning:checkpoint
> <n> <desc>`. After the last: `/git-workflow-planning:finish`.

| Ph | Title | Core work | Ship-safe? |
|----|-------|-----------|------------|
| **0** | **Prereq: runner + baseline + recipients API + browser-auth** | ✅ DONE: restored minimal Mocha runner (`tests/setup/register.js`, `tests/tsconfig.mocha.json`, trimmed `.mocharc.json`); snapshotted 12 pre-existing `typecheck:ui` errors → `docs/temp/typecheck-baseline.txt` (delta gate). REMAINING: add thin `app/api/designer/recipients/route.ts` (server-side; App-API excluded from typecheck; solves private-asset auth + the broken-lib-chain isolation) → `GET ?kind=lists`, `GET ?kind=records&listId&search` returning a clean `RecipientDTO[]`; pure mapper `recipient-dto.ts` (snake row → DTO) unit-tested. Document the chrome-devtools **authenticated-session** approach for later UI verification. **No missing-types restore.** | yes (additive) |
| **1 ✅** | **Foundations: mail-spec(100ppi) + model + migration** | `components/designer/mail-spec.ts` (DESIGN_PPI=100, PRINT_DPI=300, PRINT_SCALE=3, `MAIL_FORMATS` 4×6/6×9/6×11/8.5×11, `canvasSizePx`, `specRectsPx`, USPS zones isolated). `types/designer.ts`: `formatId`, `PageBackground(Image)`, optional element fields (`rotation`,`fontStyle`,`textDecoration`,`lineHeight`,`letterSpacing`,`borderRadius`), reconcile `Tool`/`WorkspacePanel`. `designer-templates.ts`: assign each template a `formatId` + **remap coords**; `createDesignerDocument` default; **back-compat loader** (no formatId → letter@legacy, no reflow). Optional Zod hardening (passthrough/optional). Tests: `mail-spec` geometry + **migration/back-compat**. | yes |
| **2 ✅** | **Canvas modularize + page.tsx decomposition (NO visual change)** | Split `canvas-area.tsx` → `components/designer/canvas/*`; keep `canvas-area.tsx` as re-export (Rule 1). Extract `hooks/use-designer-document.ts` + `hooks/use-designer-autosave.ts` (typed `SaveStatus`, kills string-keyed autosave) → `page.tsx` ≤350. **Pure refactor**: prove `page.tsx`, `preview-modal.tsx`, **and checkout** still build/render unchanged. Enforce invariant #1. | yes (no behavior change) |
| **3** | **Canvas features: overlay + bg layer + snap + render + size selector** | `page-background-layer.tsx`, `background-image-source.ts`, `print-overlay.tsx`, `snap-guides.tsx`; `render-element` plumbing (fontStyle/decoration/lineHeight/letterSpacing, graphic borderRadius, image `fit`, rotation); remove baked chrome; transparent overlay; reposition element toolbar (+duplicate/lock); `designer-header` mail-size `Select`; `page.tsx` wires `canvasSizePx`/`specRects`/background. Verify overlay/guides not persisted; checkout still builds (optional props). | yes |
| **4** | **Inspector field toolkit + ColorField** | dep `react-colorful`. `inspector/inspector-styles.ts`, `fields/*`, `use-recent-colors.ts`, `inspector-section.tsx`; font-size caret = lucide `ChevronDown`. Tests: `recent-colors`. No behavior change. | yes |
| **5** | **Inspector decomposition + per-type depth** | Archive original `inspector-panel.tsx`. `sections/{transform,merge-fields}`, `panels/{text,image,graphic,qr,table}`, `image-crop-dialog` (react-image-crop), `table-ops.ts`. Thin router + **single unified TransformSection**. Thread `onReplaceImageRequest` via sidebar+page. Tests: `table-ops`. | yes |
| **6** | **Full drag-and-drop** | `components/designer/dnd.ts` (unified MIME + payload + `dropPointToCanvas`). `modules-panel`: all cards incl. Image draggable; saved-image thumbnails draggable. `canvas` onDrop + `onDropAsset`. `page.tsx`: `placeImageElement` + `dropAsset` (center-on-cursor). Tests: `dnd`. | yes |
| **7** | **Discoverability** | `onDrag` live `SnapGuides` via `computeSnap`; `canvas-empty-state`; `hooks/nudge.ts` + `use-designer-shortcuts` arrow nudge (Shift=10, input-skip preserved); `designer-shortcuts.ts` shared list; `page.tsx` `onNudge`/`onDuplicateElement`. Tests: `nudge`. | yes |
| **8** | **Background tool UX** | Extract `asset-picker.tsx` from `modules-panel` (mode insert/replace/background — reduces modules LOC) + `is-duplicate-asset-name`. `background-panel.tsx`; sidebar `"background"` panel (PaintBucket, aria-current); `page.tsx` `setPageBackground` via `commitDocument`; page-aware color (ColorField) + full-bleed image (AssetPicker + Cover/Contain + opacity). Tests: `is-duplicate-asset-name`, `background-image-source`. | yes |
| **9** | **Tokens + recipient picker + Preview Dialog shell** | `tokens/{token-engine,recipient-map}.ts` (pure; **consume Phase 0 recipients API**, not the lib hook). `preview/recipient-picker.tsx`. `merge-fields.ts` catalog + aliases (keep `MERGE_FIELDS`/`tokenForField`). **Rewrite `preview-modal.tsx` once** → shadcn `Dialog` shell + recipient picker + lightweight client proof placeholder (server PDF fills it Phase 11). Tests: `token-engine`, `recipient-map`. | yes |
| **10** | **Server PDF core** | deps `pdf-lib` + `@pdf-lib/fontkit` + licensed handwriting TTF. Rewrite `app/api/design/preview/route.ts` + `_render/{pdf-renderer,colors}.ts`: page size/bleed/crop marks/TrimBox @ `PRINT_SCALE`, background color, graphic + token-substituted text (standard fonts), 2-up front/back. Zod request/response + **legacy-payload shim**. Reuse `design-previews` bucket; **fetch private assets via Supabase service client** (not public URL). | partial (text/bg proof) |
| **11** | **Server PDF assets/fonts + Dialog integration** | Image embedding (service-client bytes), QR (`qrcode`), tables, embedded custom/handwriting fonts (fontkit). Wire returned PDF (front+back) + download + `widthIn×heightIn @300` into the Phase 9 Dialog shell. RGB-now; CMYK documented follow-up. Verify MediaBox=(in+0.25)×72 pt, 2 pages, crop marks, 300-DPI imagery, personalization. | yes |
| **12** | **Checkout unification + archival (GATED)** | Refactor `DesignCustomizerStep.tsx` (Option A): remove embedded editor + 3 imports + the `any`; **define checkout↔designer round-trip contract** — CTA → `/design/customize?orderId=…`; designer consumes `orderId`, links it on save, returns via existing `design_tool_save` sessionStorage handoff to the order step; saved-design status + authenticated preview. `git mv` 3 files → `archive/components/designer/` **same commit**. CORE GATE: `next build` + checkout step works + grep shows 3 files only under `archive/`. | gated |
| **13** | **Real preflight (#2)** | `preflight/{preflight-rules,preflight-panel,use-image-natural-sizes}`; spec-driven rules (low-DPI = natural px vs printed-in×300, out-of-safe, address/indicia intrusion, placeholder, empty text, tiny font, unknown token). Old `preflight-panel.tsx` → re-export. Tests: `preflight-rules`. | yes |
| **14** | **Help + a11y + aesthetic polish + final regression** | `button` `brand` variant (kill inline-hex) → header Next + help button; `help-dialog.tsx` (quick start, shortcut ref from `designer-shortcuts`, print-zone legend) + reposition icon-only (no toolbar collision); aria-labels + Tooltip on all canvas controls; contrast uplift (slate AA); scoped `designer-type.ts` (designer root only); **rollback note** (legacy reachable until sign-off). Full chrome-devtools regression (authed session per Phase 0) + lint/typecheck/test/build. `/git-workflow-planning:finish`. | yes |

---

## Critical files

| Path | Action |
|------|--------|
| `types/supabase.ts`, `types/mailing-records.ts` | **restore/declare** (Phase 0, repo-bug fix) |
| `app/api/designer/recipients/route.ts` | **add** (Phase 0 — recipient access + auth isolation) |
| `components/designer/mail-spec.ts` | **add** — coord/print SoT (DESIGN_PPI=100) |
| `types/designer.ts` | modify — formatId, PageBackground, element fields, unions |
| `components/designer/designer-templates.ts` | modify — per-template formatId + coord remap + back-compat |
| `components/designer/canvas-area.tsx` | split → `canvas/*`; keep as re-export |
| `app/design/customize/page.tsx` | decompose early (Phase 2) → ≤350 |
| `hooks/use-designer-document.ts`, `hooks/use-designer-autosave.ts` | **add** (Phase 2) |
| `components/designer/inspector-panel.tsx` | archive original; thin router |
| `components/designer/modules-panel.tsx` | drag-drop + AssetPicker extraction |
| `app/api/design/preview/route.ts` + `_render/*` | rewrite (server PDF, service-client assets) |
| `components/designer/preview-modal.tsx` | rewrite once (Phase 9 shell) |
| `components/orders/steps/DesignCustomizerStep.tsx` | refactor (Option A, Phase 12) |
| `archive/components/designer/{tools-sidebar,text-tool-panel,image-tool-panel}.tsx` | move (Rule 1, Phase 12) |

## New dependencies (install only at the gating phase)
`react-colorful` (Phase 4) · `pdf-lib`, `@pdf-lib/fontkit` (Phase 10) · licensed
handwriting TTF asset (Phase 10).

## Verification strategy
- **Static (every checkpoint):** `npm run lint`, `npm run typecheck:ui`,
  `npm test`, `npm run build`. TS strict, no new `any` (Phase 12 removes one).
- **Unit (Mocha + `assert/strict`, under `tests/designer/`,`tests/hooks/`):**
  mail-spec geometry + migration, token-engine, recipient-map, table-ops, dnd,
  snap, nudge, recent-colors, preflight-rules, save-status,
  is-duplicate-asset-name, background-image-source, recipients-route shape.
- **Interactive (chrome-devtools MCP — Rule 4, authed session per Phase 0):**
  per format/orientation overlay + chrome-gone; Inspector per type; ColorField;
  drag every card+thumbnail at zoom/pan; snap guides; nudge vs input-skip;
  Background per page; Preview Dialog focus-trap + real recipient substitution +
  rendered PDF; Help dialog; contrast/aria; **checkout step still works**
  (Phase 12 gate); non-designer page unaffected by scoped font.
- **PDF:** MediaBox=(in+0.25)×72 pt, 2 pages, crop marks, 300-DPI imagery,
  personalized text.

## Risks
1. Checkout archival (HIGH) — gated, refactor+move one commit, `next build` gate.
2. Missing repo types (HIGH, pre-existing) — fixed Phase 0; recipients via API.
3. Coordinate migration — explicit DESIGN_PPI=100 + back-compat loader +
   template remap + migration test (Phase 1).
4. New deps / TTF licensing — install at gating phase only.
5. CMYK out of scope — RGB-now, documented follow-up.
6. USPS zone constants approximate — isolated in `mail-spec.ts`; ops validates
   before production print.
7. Browser verification needs auth — approach defined in Phase 0.
8. Order-wizard preview was unauthenticated — fixed by Phase 12 refactor.
9. Production designer overhaul — keep legacy reachable until Phase 14 sign-off
   (rollback path).
