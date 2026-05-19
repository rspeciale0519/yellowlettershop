# Feature: Artwork Designer Overhaul

> Plan file → Git branch (Rule 6/8): **`feature/artwork-designer-overhaul`**
> Filed in the project `.claude/plans/` per global Rule 6 (the harness default
> `~/.claude/plans/i-want-all-of-eager-blossom.md` violated Rule 6 on location +
> naming and was not used).

## Context

The artwork designer (`/design/customize`) is functional but has gaps found in
a prior review. The user approved implementing findings **#2–#7 + full
drag-and-drop**, skipping **#1** (the light canvas is intentional — it reflects
the user-selected template; the dark editor shell stays). The whole tool is to
be enhanced with shadcn primitives and the frontend-design aesthetic.

**Goal:** one excellent, print-accurate, discoverable artwork designer; remove
the duplicate/legacy editor so the app has a single design surface.

### Locked decisions

| # | Decision |
|---|----------|
| Mail sizes | **Selectable** in the designer: 4×6, 6×9, 6×11, 8.5×11 in @ 300 DPI; real bleed (0.125"), safe, USPS address+indicia zones |
| Preview data | Preview against a **real recipient picked from a saved mailing list** |
| Background tool | **Per-page background color + full-bleed image** (gradient deferred, model left extensible) |
| Preview engine | **Real server-side PDF renderer now** (replaces the stub) |
| Checkout editor (#4) | **Option A**: replace the embedded mini-editor in `DesignCustomizerStep` with a CTA to the unified designer, then archive the 3 legacy files |

### Verified pre-existing facts & risks (must respect)

- **Save route is `.passthrough()`** (`app/api/design/save/route.ts:12,14`): new
  fields round-trip with **zero required schema change**; we add *optional*
  hardening only. `extractVariablesFromDesign` JSON-stringifies state → merge
  tokens still detected; background URLs/colors inert.
- **The 3 "dead" files are LIVE in checkout** —
  `components/orders/steps/DesignCustomizerStep.tsx:25-28` imports
  `tools-sidebar`, `text-tool-panel`, `image-tool-panel`, `canvas-area`. It is a
  620-LOC legacy mini-editor with a divergent save shape
  (`{elements,zoom,canvas:{612,792}}`), an `any` (line 252), and an
  **unauthenticated** `/api/design/preview` call (line 158). Archival = a gated
  checkout refactor in the **same commit** as the file move; **`next build`
  is the gate**.
- **`.mocharc.json` only runs `tests/**/*.test.ts(x)`** — co-located tests will
  NOT run. All new Mocha tests go under `tests/` mirroring source path
  (precedent: `tests/lib/orders/pricing.test.ts`). This overrides the global
  CLAUDE.md "co-located tests" line for this repo (harness reality).
- **`app/design/customize/page.tsx` is 370 LOC — already over the 350 limit.**
  Extraction (autosave + document hooks) is required to land it compliant.
- **Missing types (HIGH):** `@/types/mailing-records` & `@/types/supabase` do
  not exist in the live tree (only in `temp/versions/**`); `lib/`+`app/api` are
  excluded from typecheck so the build survives. New recipient code must define
  a **self-contained `RecipientTokens`** type and consume raw snake rows — never
  import the missing types. (Restoring those types = separate ticket, out of
  scope.)
- **New dependencies required** (install at the gated phase, not before):
  `pdf-lib`, `@pdf-lib/fontkit` (server PDF — entailed by the approved
  decision), `react-colorful` (≈2.8 kB, the ColorField picker).
- **CMYK** is out of scope: deliver RGB 300-DPI print-PDF with full bleed +
  crop marks; CMYK / PDF-X is a documented follow-up.
- shadcn is Radix + CSS-vars, Tailwind **3.4.17**, **npm** (`npx shadcn@latest`),
  `cn()` at `lib/utils.ts`. All needed primitives already installed
  (Dialog, Popover, Slider, Tabs, ToggleGroup, Tooltip, ScrollArea, Switch,
  Separator, Sonner…). `react-image-crop@^11` already installed.
- Brand yellow already tokenized: tailwind `yellow` scale +
  `--sidebar-accent` + theme-aware `.bg-yellow-500` + `outline-yellow-500`
  focus. Kill inline-hex hover hacks; use a tokenized `brand` button variant.

---

## Architecture

**Single source of truth for print geometry:** new pure module
`components/designer/mail-spec.ts` (no React) used by the canvas, preflight, and
the server PDF renderer — eliminates the `32`/`inset-8` magic-number drift.

**Canvas is decomposed** into `components/designer/canvas/*`; the existing
`components/designer/canvas-area.tsx` becomes a thin re-export so both import
sites (`page.tsx`, `preview-modal.tsx`) and the checkout (until Phase 9) keep
working — and no file is deleted (Rule 1).

**Inspector is decomposed** into `components/designer/inspector/*` (field
toolkit + per-type panels + one unified Transform section); the existing
`inspector-panel.tsx` becomes a thin router.

**Layering inside the artboard (bottom → top):** paper white → page background
(color, then full-bleed image) → design elements (z-ordered) → live snap guides
→ non-printing print overlay (bleed/trim/safe/address/indicia) → selection
chrome. The print overlay and snap guides are **derived, never persisted** and
never sent to the renderer.

**Reused, not rebuilt:** `useMailingListFunctions()` →
`getMailingLists`/`getMailingListRecords` (recipient picker);
`hooks/use-designer-images.ts` + `/api/assets` + `image-source-url.ts`
(background image upload/resolve); `react-image-crop` (image crop);
`components/ui/dialog.tsx` (accessible Preview/Help dialogs); shadcn
Slider/Popover/ToggleGroup/Tooltip throughout.

---

## Phased build (each phase = a Rule 8 checkpoint; update roadmap per Rule 7)

> Rule 8: on approval run `/git-workflow-planning:start feature
> artwork-designer-overhaul`; after each phase update the roadmap (Rule 7) then
> `/git-workflow-planning:checkpoint <n> <desc>`; after the last,
> `/git-workflow-planning:finish`. Every checkpoint must pass
> `npm run lint`, `npm run typecheck:ui`, `npm test`, `npm run build`.
> Source files **≤350 LOC** (docs/.md exempt). Never delete — move to
> `archive/<relative path>` (Rule 1).

### Phase 0 — Foundations: model + spec + save schema (no UI change)
- **Add** `components/designer/mail-spec.ts` (~190 LOC, pure): `MailFormatId`,
  `MAIL_FORMATS`, `PRINT_DPI=300`, `DISPLAY_DPI`, `physicalForOrientation`,
  `canvasSizePx` (replaces `CANVAS_SIZES`), `printSizePx`, `specRectsPx`
  (bleed/trim/safe/address/indicia), `lowDpiThresholdPx`. USPS constants
  documented + isolated (ops must validate before production print).
- **Modify** `types/designer.ts`: add `DesignerDocument.formatId: MailFormatId`;
  add `PageBackgroundImage`/`PageBackground` + `backgrounds?:
  Partial<Record<DesignerPage, PageBackground>>`; add optional element fields
  `rotation` (base), `fontStyle`/`textDecoration`/`lineHeight`/`letterSpacing`
  (text), `borderRadius` (graphic); `Tool` → drop dead `"colors"|"background"`;
  `WorkspacePanel` → add `"background"`.
- **Modify** `components/designer/designer-templates.ts`: `createDesignerDocument`
  defaults `formatId`; keep `CANVAS_SIZES` as a temporary shim.
- **Modify** `app/api/design/save/route.ts`: *optional* Zod hardening —
  `PageBackground(Image)Schema`, `backgrounds` (`.optional()`), `formatId`
  (`.optional()`), element fields; keep outer/inner `.passthrough()`. PUT
  inherits via `.extend()`. No DB migration (JSONB).
- **Tests** `tests/designer/mail-spec.test.ts`: geometry per format×orientation.
- **Verify:** typecheck/build green; save POST/PUT round-trips with & without
  new fields; old `pendingOrderDesign` payload still parses.

### Phase 1 — Canvas core (structural; 3 axes converge here, do once)
- **Add** `components/designer/canvas/`: `canvas-area.tsx` (~170, orchestrator),
  `print-overlay.tsx` (~90), `snap-guides.tsx` (~70), `render-element.tsx`
  (~130), `canvas-element-toolbar.tsx` (~80), `canvas-empty-state.tsx` (~50),
  `use-canvas-viewport.ts` (~80, pan/zoom/wheel), `snap.ts` (~90, pure
  `computeSnap`→`{x,y,guides:SnapGuide[]}`).
- **Add** `components/designer/page-background-layer.tsx` (~60) +
  `components/designer/background-image-source.ts` (~30, pure resolver mirroring
  `image-source-url.ts`).
- **Modify** `components/designer/canvas-area.tsx` → thin
  `export { CanvasArea } from "./canvas/canvas-area"` (file kept, Rule 1).
- **Render plumbing** in `render-element.tsx`: text
  `fontStyle/textDecoration/lineHeight/letterSpacing`; graphic `borderRadius`
  precedence; image `fit` cover/contain (currently hardcoded contain);
  `rotation` transform on the Rnd wrapper.
- **Remove baked chrome** (yellow spine, fake gray box, "Direct mail preview"
  caption, hardcoded `inset-8`); overlay container made transparent; page div
  keeps `bg-white` as paper. Mount `PageBackgroundLayer` first child;
  `PrintOverlay` (from `specRectsPx`) above elements, non-printing,
  `pointer-events-none`, `aria-hidden`; `SnapGuides` above elements.
- **Reposition** element toolbar (flip below when `y` near top); add Duplicate +
  Lock actions.
- **Modify** `app/design/customize/page.tsx`: `canvasSize` via `canvasSizePx`;
  compute `specRects`; pass `background = documentState.backgrounds?.[activePage]`
  and `specRects` to `CanvasArea`; add format `<Select>` wiring.
- **Modify** `components/designer/designer-header.tsx`: add mail-size `<Select>`
  (`formatId`, `onFormatChange`); status bar shows format label.
- **Verify:** each new file ≤350; overlay/guides absent from saved JSON &
  `localStorage`; `preview-modal.tsx` + checkout `CanvasArea` still render;
  chrome-devtools snapshot per format/orientation; decorative chrome gone.

### Phase 2 — Inspector field toolkit + ColorField
- Add dep **`react-colorful`**.
- **Add** `components/designer/inspector/inspector-styles.ts`,
  `inspector/fields/{number,slider,color,toggle-group,select,font-size,index}`,
  `inspector/use-recent-colors.ts` (localStorage MRU, cap 8),
  `inspector/inspector-section.tsx`. `font-size` field replaces the literal
  **"v"** caret with lucide `ChevronDown`. `ColorField` =
  Popover + `react-colorful` + hex input + brand swatches + recent colors;
  exported interface `ColorFieldProps { value?, onChange(hex|undefined), label?,
  id? }` (consumed by Inspector **and** Background panel).
- **Tests** `tests/designer/recent-colors.test.ts`.
- **Verify:** toolkit compiles; no behavior change yet (ship-safe).

### Phase 3 — Inspector decomposition + per-type depth
- **Archive** current `inspector-panel.tsx` →
  `archive/components/designer/inspector-panel.pre-overhaul.tsx` (Rule 1).
- **Add** `inspector/sections/{transform-section,merge-fields-section}.tsx`,
  `inspector/panels/{text,image,graphic,qr,table}-inspector.tsx`,
  `inspector/panels/image-crop-dialog.tsx` (`react-image-crop`),
  `inspector/table-ops.ts` (pure add/remove row·col, toggle header).
- **Rewrite** `inspector-panel.tsx` → thin router (~110): empty state, header,
  name, `switch(type)` + always-rendered single **TransformSection**
  (X/Y/W/H + rotation + opacity + lock + center) — removes the duplicated
  alignment blocks.
- Coverage: Text (font, size, weight ToggleGroup, italic/underline, color
  ColorField, align, line-height, letter-spacing, merge insert); Image (fit
  toggle, **visible Replace button**, Crop dialog, opacity); Graphic
  (shape, fill, stroke, strokeWidth, borderRadius); QR (value, fg/bg
  ColorField); Table (row/col steppers, header Switch).
- **Modify** `designer-workspace-sidebar.tsx` + `page.tsx`: thread
  `onReplaceImageRequest` into the sidebar/Inspector.
- **Tests** `tests/designer/table-ops.test.ts`.
- **Verify:** every type shows full controls; "v" gone; one Transform block.

### Phase 4 — Full drag-and-drop
- **Add** `components/designer/dnd.ts` (unified `DND_MIME` + payload codec +
  `dropPointToCanvas` zoom/pan-correct math, extracted verbatim).
- **Modify** `modules-panel.tsx`: every module card draggable **including
  Image**; every saved-image thumbnail draggable (drop = insert that asset at
  cursor); keep click-to-add.
- **Modify** `canvas/canvas-area.tsx` `onDrop` + add `onDropAsset` prop.
- **Modify** `page.tsx`: extract `placeImageElement`, add `dropAsset`
  (center-on-cursor), pass `onDropAsset`.
- **Tests** `tests/designer/dnd.test.ts` (round-trip; drop math at zoom
  50/100/220 + pan).
- **Verify:** drag every card + thumbnail onto canvas at multiple zoom/pan.

### Phase 5 — Discoverability
- **Modify** `canvas/canvas-area.tsx`: `onDrag` → live `SnapGuides` via
  `computeSnap`; render `canvas-empty-state` when no visible elements.
- **Add** `hooks/nudge.ts` (pure `nudgeDelta`); **modify**
  `hooks/use-designer-shortcuts.ts`: arrow-key nudge (Shift = 10px),
  preserving the input/contentEditable skip guard.
- **Add** `components/designer/designer-shortcuts.ts` (single shortcut
  descriptor list; consumed by the hook + Help dialog).
- **Modify** `page.tsx`: pass `onNudge`, `onDuplicateElement`.
- **Tests** `tests/designer/nudge.test.ts`.
- **Verify:** snap lines draw on drag; arrows nudge 1/10px; typing in inputs
  does not nudge; toolbar never clips; empty state shows.

### Phase 6 — Background tool UX
- **Add** `components/designer/asset-picker.tsx` (extracted from
  `modules-panel.tsx` — `mode: "insert"|"replace"|"background"`; **reduces**
  modules-panel LOC), `components/designer/background-panel.tsx`,
  pure `is-duplicate-asset-name` helper.
- **Modify** `modules-panel.tsx` to consume `AssetPicker`;
  `designer-workspace-sidebar.tsx` add the `"background"` panel (rail entry,
  `PaintBucket` icon, `aria-current`); `page.tsx` add `setPageBackground`
  (routes through `commitDocument` → undo/autosave).
- Background panel = page-aware (front/back via existing Pages rail): color via
  shared `ColorField`; full-bleed image via `AssetPicker` + Cover/Contain
  ToggleGroup + opacity Slider + remove. Empty → `backgrounds[page]=undefined`.
- **Tests** `tests/designer/{is-duplicate-asset-name,background-image-source}.test.ts`.
- **Verify:** color + full-bleed image per page; undo/redo; save→reload (local
  + server) persists; Preview shows it; panel WCAG-AA contrast.

### Phase 7 — Token engine + recipient picker + accessible Preview Dialog
- **Add** `components/designer/tokens/{token-engine,recipient-map}.ts` (pure;
  self-contained `RecipientTokens` — do **not** import missing `@/types/*`),
  `components/designer/preview/recipient-picker.tsx`
  (`useMailingListFunctions`, list `Select` + searchable record list, default
  first record).
- **Modify** `components/designer/merge-fields.ts`: extend catalog + alias table
  (`mailing_address`↔`address_line_1`, etc.); **keep** `MERGE_FIELDS` /
  `tokenForField` exports (used by Inspector). Reconciles the
  template-vs-catalog token mismatch without rewriting templates.
- **Rewrite** `preview-modal.tsx` → shadcn `Dialog` (focus trap, Esc,
  `aria-modal`) with recipient picker + clean proof (no editor chrome,
  orientation-correct, front+back); split into
  `preview/{preview-dialog,preview-document}.tsx` if >350. Update `page.tsx`
  props.
- **Tests** `tests/designer/{token-engine,recipient-map}.test.ts`.
- **Verify:** pick real list+record → tokens resolve live; Dialog a11y.

### Phase 8 — Real server-side PDF renderer
- Add deps **`pdf-lib`, `@pdf-lib/fontkit`**; bundle a licensed handwriting TTF.
- **Rewrite** `app/api/design/preview/route.ts` (~90) + **add**
  `app/api/design/preview/_render/{pdf-renderer,colors,fonts}.ts`. `pdf-lib`
  vector render (rationale: structured elements, no HTML/CSS layout,
  Vercel-friendly, deterministic, true 300-DPI vector vs heavy headless
  Chromium). Page = `printSizePx` in points incl. 0.125" bleed; 2 pages;
  background → z-ordered elements; text via `token-engine.substitute` + embedded
  fonts; images via `image-source-url`; QR via `qrcode`; crop/trim marks;
  TrimBox set. Zod request/response; **legacy-payload shim** for the checkout
  call shape (removed Phase 9). Reuse Supabase `design-previews` bucket +
  service client.
- **Modify** Preview Dialog to render the returned PDF (front+back) + download +
  show `widthIn×heightIn @300 DPI`; caption "Proof — not final print". CMYK =
  documented RGB-now follow-up.
- **Verify:** PDF MediaBox = (in+0.25)×72 pt, 2 pages, crop marks present,
  personalized content; embedded image px ≥ printed-in×300.

### Phase 9 — Checkout unification (Option A, GATED) + archival + polish
- **Modify** `components/orders/steps/DesignCustomizerStep.tsx`: remove the
  embedded mini-editor, the 3 imports, and the `any`; replace with a focused
  saved-design status + **"Open Designer" CTA** → `/design/customize`
  (passing `orderId`; the `design_tool_save` sessionStorage handoff already
  exists); keep variables/preview/actions cards, wired to the real
  authenticated `/api/design/preview`. Drops to <350 LOC.
- **`git mv`** `tools-sidebar.tsx`, `text-tool-panel.tsx`,
  `image-tool-panel.tsx` → `archive/components/designer/` **in the same
  commit** as the refactor. Grep proves zero non-archive refs.
- **Modularize preflight:** add
  `components/designer/preflight/{preflight-rules,preflight-panel,use-image-natural-sizes}`
  (spec-driven: low-DPI image, out-of-safe, address-zone intrusion, placeholder,
  empty text, tiny font, unknown token); old `preflight-panel.tsx` →
  re-export. **Tests** `tests/designer/preflight-rules.test.ts`.
- **Polish (frontend-design + a11y):** add `brand` variant to
  `components/ui/button.tsx`; `designer-header.tsx` Next + `help-button.tsx`
  use it (delete inline-hex hover hacks). Wire `help-button.tsx` →
  accessible Help `Dialog` (`help-dialog.tsx`: quick start, shortcut reference
  from `designer-shortcuts.ts`, print-zone legend); reposition icon-only so it
  never collides with the canvas zoom toolbar. Add aria-labels + Tooltip to all
  icon-only canvas controls. Contrast uplift where slate text fails AA.
  Replace overloaded `statusMessage` with typed `SaveStatus` +
  `save-status-indicator.tsx` (icon+label, `aria-live`, `"saving"` state).
  Scoped designer typography via `designer-type.ts` applied **only** on the
  designer root.
- **Extract from `page.tsx`** (it starts at 370 > 350):
  `hooks/use-designer-autosave.ts` + `hooks/use-designer-document.ts` → land
  `page.tsx` ≤350.
- **Tests** `tests/designer/{save-status,designer-shortcuts}.test.ts`.
- **Verify (core gate):** `next build` succeeds; checkout `design_and_content`
  step renders + save/preview/launch work; grep finds 3 files only under
  `archive/`; Help dialog focus/Esc/labelled; Next has real focus ring (no
  inline style in DOM); save-status announces; contrast ≥4.5:1; designer font
  does not leak to other pages.

---

## Critical files

| Path | Action |
|------|--------|
| `components/designer/mail-spec.ts` | **add** — print geometry SoT |
| `types/designer.ts` | modify — formatId, PageBackground, element fields, unions |
| `components/designer/canvas-area.tsx` | split → `canvas/*`; keep as re-export |
| `app/design/customize/page.tsx` | modify + extract hooks (≤350) |
| `components/designer/inspector-panel.tsx` | archive original; rewrite as router |
| `components/designer/modules-panel.tsx` | modify — drag-drop + AssetPicker |
| `app/api/design/preview/route.ts` | rewrite + `_render/*` (server PDF) |
| `app/api/design/save/route.ts` | modify — optional Zod hardening |
| `components/designer/merge-fields.ts` | modify — catalog + aliases (keep exports) |
| `components/orders/steps/DesignCustomizerStep.tsx` | refactor (Option A, Phase 9) |
| `archive/components/designer/{tools-sidebar,text-tool-panel,image-tool-panel}.tsx` | move (Rule 1, Phase 9) |

## New dependencies (install at the gating phase only)
`react-colorful` (Phase 2) · `pdf-lib`, `@pdf-lib/fontkit` (Phase 8). Plus a
licensed handwriting TTF asset (Phase 8).

## Verification strategy
- **Static (every checkpoint):** `npm run lint`, `npm run typecheck:ui`,
  `npm test`, `npm run build`. TS strict, no new `any` (Phase 9 removes one).
- **Unit (Mocha + `assert/strict`, under `tests/designer/` & `tests/hooks/`):**
  mail-spec geometry, token-engine, recipient-map, table-ops, dnd, snap, nudge,
  recent-colors, preflight-rules, save-status, is-duplicate-asset-name,
  background-image-source.
- **Interactive (chrome-devtools MCP, never Playwright — Rule 4):**
  `/design/customize` per format/orientation (overlay correct, chrome gone);
  Inspector per type; ColorField; drag every card+thumbnail at zoom/pan; snap
  guides; arrow nudge vs input-skip; Background per page; Preview Dialog focus
  trap + real recipient substitution + rendered PDF; Help dialog; contrast/aria;
  **checkout `design_and_content` step still works** (Phase 9 gate).
- **PDF:** assert MediaBox = (in+0.25)×72 pt, 2 pages, crop marks, 300-DPI
  imagery, personalized text.

## Risks
1. Checkout archival (HIGH if mishandled) — gated, refactor+move one commit,
   `next build` is the gate.
2. Missing `@/types/*` (HIGH, pre-existing) — mitigated via self-contained
   recipient types; flagged as separate ticket.
3. New deps need approval/licensing (pdf-lib, fontkit, react-colorful, TTF).
4. CMYK out of scope (documented RGB-now).
5. USPS zone constants are approximations — ops must validate before production
   print; isolated in `mail-spec.ts` for a one-line correction.
6. `.mocharc.json` test placement (tests under `tests/`, not co-located).
7. LOC ceiling — `page.tsx` starts non-compliant; canvas/inspector splits
   mandatory.
8. Order-wizard preview was unauthenticated — fixed by the Phase 9 refactor.
