# 3D Mail-Piece Preview in the Custom Designer (feature/designer-3d-preview off develop)

## Context

The production designer (`app/design/customize` — byte-identical on `main`,
`develop`, `new-ui-001`) lets users drag-and-drop text/images/QR/tables/
graphics/postage onto front/back pages of 4 mail formats
(postcard_4x6/6x9/6x11, letter_8_5x11), previewing via a server-rendered flat
PDF (pdf-lib) in `PreviewModal`. Branch `new-ui-001` has a polished 3D paper
viewer (`components/ui2/letter-inspector/`) whose art layer is hard-coded.

Goal: 2D designing untouched; the Preview modal gains a **3D view** showing
the user's actual front/back design on the physically-real paper. Accuracy by
construction: capture bitmaps from the designer's own DOM rendering
(html-to-image), feed them as albedo onto the 3D sheet — the 3D layer never
re-interprets elements.

Verified facts: elements are DOM-rendered (react-rnd + RenderElement); tokens
substitute server-side today but `token-engine.ts` is pure/client-safe; fonts
are system CSS stacks (no webfonts); Supabase images are 1h signed URLs with
working CORS (precedent: image-crop-dialog crossOrigin usage); main/develop
lack three/fiber/drei and any DOM-rasterizer dep; `components/ui2` absent on
develop. fiber@9/drei@10 peer-require React 19 while repo is React 18.3.1 —
new-ui-001 runs them fine in practice; needs `.npmrc legacy-peer-deps=true`.

## Phase 0 — Branch + deps
- Commit stray `ylsbrain/journal/*` on new-ui-001 first (clean tree).
- Branch `feature/designer-3d-preview` off `develop`.
- Add `.npmrc` (`legacy-peer-deps=true`) + deps at new-ui-001's versions:
  `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`,
  `html-to-image`. Smoke: dev server boots, designer loads.

## Phase 1 — Port 3D core + art-texture path
- Copy byte-identical from new-ui-001 → `components/design-preview-3d/core/`:
  LetterScene.tsx, LetterSheet.tsx, LocalEnvironment.tsx, **use-page-turn.ts**
  (was missing from the draft port list — LetterSheet imports it), page-curl.ts,
  rest-state.ts, letter-textures.ts, texture-surface-maps.ts,
  texture-face-art.ts, substrate-painters.ts, face-layouts.ts, ink-engine.ts,
  paper-stocks.ts. (ui2 shells NOT ported; `handFamily()` safely falls back to
  'cursive' without --yls-hand.)
- NEW `core/art-textures.ts` (sibling, not a modification — keeps port
  diffable, skips font gate in art mode, splits memoization):
  - `DesignArt = { front: HTMLCanvasElement; back: HTMLCanvasElement }`
  - `createArtTextures(stock, art)`: art canvases → sRGB albedo textures;
    substrate normal/roughness from `buildHeightMap`/`heightToNormal`/
    `buildRoughnessMap` with an all-black ink mask; map dims from oriented
    inches (~86 px/in — NOT layoutFor(), which only knows 2 aspects); flat
    specular-floor alpha canvas; `buildEdgeTiles` edges. Back art needs NO
    mirroring (BoxGeometry back-face UVs already read correctly — keep the
    letter-textures.ts:120 comment).
  - `usePieceTextures(stock, art?)`: branches inside useMemo (hook-rules
    legal); substrate memo on stock alone, art albedo re-memos per capture;
    dispose on change; font gate only in procedural mode.
- Small diffs to ported LetterSheet/LetterScene: optional `art` prop threaded
  down; LetterSheet swaps `useLetterTextures(stock)` → `usePieceTextures(stock, art)`.

## Phase 2 — Capture pipeline (new, under components/design-preview-3d/)
- `element-frame.ts`: shared absolute-frame style helper (left/top/w/h/zIndex/
  opacity). **NO rotation**: canvas-area's rotate() is clobbered by
  react-draggable's transform and the PDF renderer ignores rotation too — the
  3D view must match print output today (file the rotation/opacity gap as a
  separate pre-existing bug; do not fix here).
- `static-page-render.tsx`: clean page render — root `position:relative`,
  white bg, `canvasSizePx(formatId, orientation)` size; filter
  `!element.hidden`, sort by zIndex; `PageBackgroundLayer` +
  `RenderElement editing={false}` with no-op handlers; fonts passed through.
- `capture-page.ts`: readiness waits (document.fonts.ready; every <img>
  complete INCLUDING QR subtrees via bounded rAF retry — QrRenderer renders
  blank until toDataURL resolves); img preflight — on fetch failure rewrite
  src to same-origin `/assets/images/{assetId}` (derive id per
  image-source-url.ts, but relative path); `toCanvas` wrapper with
  `pixelRatio = min(2, 2048 / max(wPx, hPx))`, `skipFonts: true`,
  imagePlaceholder, one retry (Safari foreignObject first-blank quirk).
- `use-design-art.ts`: hook — `substituteDocument(doc,
  buildTokenContext(recipient, {}))` when a recipient is chosen (matches the
  server route's sender default); portal-mount BOTH pages' StaticPageRender in
  a hidden `position:fixed; left:-99999px` container (never display:none);
  capture → `{ front, back, status, error, retry }`; re-capture on
  doc/recipient change. If html.dark is set, guard capture against dark:
  variants baking into the paper (designer is light-only today; verify).

## Phase 3 — Formats + viewer component
- `format-stocks.ts`: ONE base matte-PBR stock literal + per-format overrides
  (widthIn/heightIn from `orientedInches`, unitsPerInch ~0.14 letter / 0.19→
  0.13 postcards so 6×11 fits, thickness/edgeStyle/warpMode letter-vs-board);
  all art stocks `ruled:false, showThroughAlpha:0, hasAddressSide:false`.
- `Design3DPreview.tsx`: r3f Canvas + LetterScene(stock, art) + flip button
  (shadcn Button) + loading skeleton + error/Retry. `dynamic(ssr:false)`
  boundary HERE, imported lazily by the modal so the ~600KB three chunk loads
  only when the 3D tab opens.

## Phase 4 — Modal integration
- `preview-modal.tsx`: segmented toggle **[Print PDF | 3D preview]**; PDF
  iframe stays default; 3D tab conditionally mounts Design3DPreview (unmount
  on toggle-away — don't keep a hidden live GL context); recipient changes
  flow into both paths.

## Verification
- Gates per phase: `npx tsc --noEmit` (or repo typecheck script if present on
  develop), `npm test` designer suite, final `npx next build`.
- Browser (chrome-devtools MCP, existing window tabs, :3010, /design/customize):
  build a test design exercising every element type (text w/ {{first_name}},
  image, QR, graphic, table, postage) on BOTH pages; open Preview → 3D tab;
  verify pixel-parity with the 2D canvas (asymmetric corner text proves
  back-face orientation), flip works, recipient substitution updates texture,
  all 4 formats size correctly, console clean. React-18-runtime smoke test for
  fiber9/drei10 (peer-dep override) — scene mounts, orbits, no errors.
- LOC ≤350 every new/modified file (`texture-face-art.ts` ports at 344 — add
  nothing to it).

## Commits
Per phase on `feature/designer-3d-preview`; plain `git commit` (the
git-workflow checkpoint's lint gate is blocked by ~743 pre-existing repo lint
errors — documented deviation, consistent with session precedent). Push/PR to
`develop` only on owner sign-off.

## Do NOT
- Touch the 2D editor's interaction behavior (Rnd, tools, autosave).
- Apply element rotation in the 3D path (phantom in editor + PDF today).
- Import three statically anywhere reachable from the designer page load.
- Modify `use-page-turn.ts` (byte-identical port).
- Add clearcoat/gloss (matte mandate stands).
