# Designer Usability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The recommended execution approach is native execution through superpowers:executing-plans, because the document, layout, pricing, and handoff contracts are tightly connected.

**Goal:** Make the existing designer easy to use from product selection through a print-accurate, correctly priced order handoff.

**Architecture:** Keep the current app and introduce one versioned document boundary and one shared text-layout result for the browser and PDF. Build the focused editor around that model, then connect additional printed sides to the existing authoritative pricing and order flow. Preserve existing designs through normalization and tested compatibility.

**Tech Stack:** Next.js 15.5, React 18, TypeScript, Tailwind/Radix, pdf-lib/fontkit, existing Supabase storage, Mocha, and browser interaction tests. Proposed rich-text adapter: Tiptap with a minimal schema and compatible pinned package versions.

**Spec:** `docs/superpowers/specs/2026-10-16-designer-usability-design.md`.

**Status:** Approved for implementation by the owner on 2026-10-17. White and yellow notepad templates must position text baselines on their horizontal rules in both the canvas and PDF.

## Global Constraints

- Support every offered mail piece format; continuous writing and free-positioned objects coexist.
- Keep the current Next.js 15 / React 18 app and existing approval/payment/fulfillment process.
- New application code is TypeScript; each code file is at most 350 lines.
- Preserve legacy front/back and elements-only designs, backgrounds, transforms, and postage keep-clear behavior.
- Use integer cents. Letter sides after the first add exactly 10 cents per piece, including the back of the first sheet. Do not volume-discount this surcharge.
- Add Page and its pricing update happen immediately, without another confirmation dialog.
- Do not automatically add pages or shrink fonts when text overflows.
- An unused reverse is not implicitly billable; additional-side inclusion is explicit and visible.
- Do not add the external CRM API, a second app, a subscription system, or a new CMS in this workstream.
- Test external integrations against local/test services; no live charges or production writes are part of implementation verification.
- Use Mocha tests under `tests/**/*.test.ts` with relative imports. Use delta ESLint for touched files, not the repo-wide lint backlog.

## Review Focus

1. Long unbroken text, pasted formatting, Unicode, and unsupported fonts must preserve content or provide an actionable error — Tasks 4–5.
2. Old designs, inactive page sides, hidden/locked objects, backgrounds, and the 3D view must not disappear during document upgrade — Tasks 3 and 9.
3. Long or missing recipient/sender values must trigger accurate all-page feedback without silently changing page count or cost — Task 6.
4. Slow/failed/out-of-order saves and multiple tabs must not attach an older or different draft to an order — Task 8.
5. Tampered side counts/rates, blank unused backs, quantity changes, and discounts must not change the fixed surcharge or bypass server amount checks — Task 7.

## Sequence and review points

1. Tasks 1–2: repair the visible customer entry and workspace; review on desktop and phone.
2. Tasks 3–6: build the document/text/print foundation and writing experience; review a complete yellow-letter example.
3. Task 7: introduce additional sides and correct live/server pricing together.
4. Tasks 8–9: finish reliable drafts/handoff and verify the customer journey against test services.

Each task ends with a working, separately reviewable result. Do not begin a later dependency until the earlier task's checks pass. Baseline from setup: 290 Mocha tests and `typecheck:full` passed; that was not a live order-flow certification.

## File and responsibility map

| Area | Existing files | New focused modules |
| --- | --- | --- |
| Workspace | `app/design/customize/page.tsx`, designer header/sidebar/canvas | `components/designer/workspace/` |
| Template entry | `data/templates-data.ts`, template grid, designer templates | `lib/designer/template-entry.ts` |
| Versioned documents | `types/designer.ts`, save/preview routes, document hook | `types/designer-document.ts`, `lib/designer/document/` |
| Text and print | canvas render element, PDF renderer | `lib/designer/text/`, `components/designer/writing/` |
| All-page checks | preflight rules/panel, recipient picker | `lib/designer/document-issues.ts` |
| Side count/pricing | page panel, orders pricing/routes/provider | `lib/orders/additional-side-pricing.ts`, `lib/orders/quote-inputs.ts` |
| Draft/handoff | autosave hook, customize page, order initialization/step | `lib/designer/draft-context.ts`, `hooks/use-designer-save.ts` |
| Verification | existing Mocha suite | `tests/browser/designer/`, browser test config/fixtures |

Exact new filenames and the interfaces they own are pinned in the tasks below. Browser test configuration and dependencies belong to Task 1, where the regression tests first need them.

---

### Task 1: Focused, responsive editor workspace

**Files:**
- Modify `app/design/customize/page.tsx`, `components/layout/header.tsx`, `components/layout/footer.tsx` for route-scoped editor chrome only.
- Modify `components/designer/designer-header.tsx`, `designer-workspace-sidebar.tsx`, `canvas/canvas-area.tsx`.
- Create `components/designer/workspace/editor-shell.tsx`, `editor-drawer.tsx`, and `fit-canvas.ts`.
- Add browser test configuration/fixtures and `tests/browser/designer/workspace.spec.ts`; add `tests/designer/fit-canvas.test.ts`.
- Modify `package.json`/lockfile only for the direct browser-test dependency and a test script. Pin a stable compatible browser-test version; do not depend on the current transitive alpha Playwright as a public test dependency.

**Interfaces:** Produce `fitCanvas(viewport: { width: number; height: number }, artboard: { width: number; height: number }, padding: number): number` returning a zoom percentage. Produce `EditorShell` for header/content/canvas/pages slots, with one active mobile task view.

- [ ] Write failing regressions for 390×844: Continue to Order is in the viewport, the customer can enter content and open a complete preview, and no essential action requires a horizontal scroll. At 1280×800, fitCanvas must fit both artboard dimensions into available space. Keep site chrome unchanged on `/` and `/templates`.
- [ ] Run those tests and verify they fail on the existing layout, not on missing test setup.
- [ ] Implement editor-only chrome, collapsible page navigation, mobile drawer/form-preview switching, contextual controls, and calculated fit on load/resize/panel changes. Label the primary action Continue to Order; retain its existing behavior until Task 8 changes the handoff contract.
- [ ] Run `npm test -- --grep 'fitCanvas'`, `npm run test:designer-browser -- workspace.spec.ts`, `npm run typecheck:full`, and delta ESLint. Verify desktop and phone screenshots.
- [ ] Commit the tested workspace changes with `feat(designer): add focused responsive workspace`.

### Task 2: Connect product/template selection to the intended document

**Files:** Modify `components/templates/template-grid.tsx`, `data/templates-data.ts`, `components/designer/designer-templates.ts`, and `app/design/customize/page.tsx`. Create `lib/designer/template-entry.ts`. Tests: `tests/designer/template-entry.test.ts` and `tests/browser/designer/template-entry.spec.ts`.

**Interfaces:** Produce `resolveTemplateEntry(templateId: string): TemplateEntry | null`, where `TemplateEntry` contains the catalog id, designer template id, intended format/orientation, and readiness state. Add explicit template metadata instead of guessing a mapping between unrelated demo ids.

- [ ] Write failing tests: clicking a ready template opens that exact template/format; changing a URL id does not reuse a different recovered draft; unknown ids have a useful recovery state; preview-only catalog entries do not offer an inert Use Template action.
- [ ] Run the tests and confirm the current inert button/default-flyer behavior fails the customer path.
- [ ] Wire a shared explicit registry and entry URL. Initialize the selected document once and preserve compatible current order context. Use existing valid built-ins for the first preview; production catalog entries require actual artwork/geometry before becoming orderable.
- [ ] Run the targeted unit/browser tests, full typecheck, and delta ESLint. Manually choose a letter and a postcard and confirm template/size/orientation survive reload.
- [ ] Commit with `fix(designer): open the selected catalog template`.

### Task 3: Introduce versioned documents and stable page-side traversal

**Files:** Create `types/designer-document.ts`, `lib/designer/document/normalize.ts`, `pages.ts`, and `schema.ts`. Modify `types/designer.ts`, `hooks/use-designer-document.ts`, `components/designer/pages-panel.tsx`, `app/api/design/save/route.ts`, `app/api/design/preview/route.ts`, `lib/orders/render-proof.ts`, `app/orders/new/page.tsx`, and `components/orders/steps/DesignCustomizerStep.tsx`. Update page traversal in `components/design-preview-3d/{capture-stage,Design3DPreview}.tsx` and the token engine. Tests: `tests/designer/document-compatibility.test.ts` and existing renderer/template/token tests.

**Interfaces:** Produce `DesignerDocumentV2`, `DesignPage`, `ContentRegion`, and `RichTextStory` in the type module, including the semantic paragraph, text-run, style-mark, and field-reference types needed by Task 4. Task 5 adds editor conversion and input validation around these types. `DesignPage` has stable `id`, explicit `printIncluded`, side/sheet identity, elements, regions, and background. Produce `normalizeDesignerDocument(input: unknown): DesignerDocumentV2`, `getDesignPage(doc, pageId): DesignPage | undefined`, and `getPrintedPages(doc): DesignPage[]`. All layout/order consumers use the normalized form.

- [ ] Write failing round-trip fixtures for old front/back designs, legacy elements-only designs, empty backs, locked/hidden objects, backgrounds, rotations, unknown versions, and malformed JSON. Assert content/order/identities are preserved, and errors do not reset documents silently.
- [ ] Run these tests and verify failures identify absent normalization/traversal, not import configuration problems.
- [ ] Implement normalization, explicit version validation, and recovery snapshots. Replace fixed front/back loops in all consumers found by `rg 'DesignerDocument|DesignerPage|\.pages' app components hooks lib`. Adapt the optional 3D view to the selected sheet/spread; retain all included sides in the PDF. Keep page-add controls hidden until Task 7 supplies policy/pricing.
- [ ] Run `npm test -- --grep 'document compatibility|renderDesignToPdf|token|templates'`, full typecheck, and delta ESLint. Reload an old saved-design fixture and compare its artwork, page sides, and PDF dimensions.
- [ ] Commit with `feat(designer): normalize versioned multi-side documents`.

### Task 4: Share text measurement and positioned layout with PDF output

**Files:** Create `lib/designer/text/{types,font-metrics,layout,resolve-values}.ts`. Modify `components/designer/canvas/render-element.tsx`, `components/designer/designer-fonts.ts`, `app/api/design/preview/_render/pdf-renderer.ts`, and `lib/orders/render-proof.ts`. Tests: `tests/designer/text-layout.test.ts`, `text-print-consistency.test.ts`, and existing PDF renderer tests.

**Interfaces:** Produce `FontMetrics` and `DocumentLayout` types; `layoutDesignerDocument(doc: DesignerDocumentV2, values: ResolvedValues, metrics: FontMetrics): DocumentLayout`; `ResolvedValues` is a string-valued field map. Layout includes page/region ids, positioned styled runs and baselines, and overflow/font issues. Keep font loading/embedding separate from the pure layout function.

- [ ] Write failing fixtures for paragraph/line-break preservation, left/center/right alignment, bold/italic/underline, letter spacing, ruled baselines, long unbroken words, unsupported glyphs, and narrow postcard regions. Assert identical positioned text input reaches the browser renderer and PDF renderer.
- [ ] Run targeted tests and verify the current separate wrapping/formatting behavior fails the expected assertions.
- [ ] Load/measure the same printable font files in both environments. Compute positions in the existing 100-units-per-inch space. Have both renderers draw the shared result. Report overflow or unsupported fonts/glyphs rather than shrinking, clipping, or substituting silently. Preserve non-text rendering, rotation, opacity, and QR/image behavior.
- [ ] Run the new text tests and existing PDF tests, full typecheck, and delta ESLint. Compare browser/PDF output for a ruled letter and postcard at matching scale, including non-default formatting. A merely valid PDF is not sufficient evidence of visual consistency.
- [ ] Commit with `feat(designer): share text layout with print rendering`.

### Task 5: Add continuous writing alongside movable text boxes

**Files:** Create `components/designer/writing/{message-editor,formatting-toolbar,writing-panel}.tsx` and `rich-text-adapter.ts`; create `lib/designer/text/rich-text-schema.ts`. Modify the designer document hook/sidebar, text inspector, and template definitions. Tests: `tests/designer/rich-text-schema.test.ts` and `tests/browser/designer/writing.spec.ts`. Add only the compatible pinned Tiptap packages needed by the minimal schema in this task.

**Interfaces:** Produce `MessageEditor({ value: RichTextStory, onChange, onInsertField })` and adapter functions `fromEditorDocument(input: unknown): RichTextStory` / `toEditorDocument(story: RichTextStory): unknown`. Renderer/layout code must not import browser editor modules. The story schema validates supported paragraphs, hard breaks, style marks, and atomic field references.

- [ ] Write failing browser stories: paste a multi-paragraph letter; apply bold to selected words; insert a field at the caret; type with composition/IME; undo a typing group; edit a floating text box in the same design. Test paste sanitization and invalid markup as pure schema tests.
- [ ] Run these tests to establish the absent continuous-writing behavior as the failure.
- [ ] Validate Tiptap's peer support for the current React 18 before pinning dependencies. Implement the minimal adapter and content panel. Calibrate template writing rectangles/ruled baselines against actual paper artwork, with fixture profiles for tests. Link story regions explicitly and reserve address/postage areas. Use Task 4 layout for live preview and overflow; no auto-added pages.
- [ ] Run schema tests and `writing.spec.ts`, full typecheck, and delta ESLint. Review one finished yellow-letter example with typing/formatting before extending/calibrating every offered template. All formats remain required for completion.
- [ ] Commit with `feat(designer): add continuous formatted writing`.

### Task 6: Reuse sender details and surface accurate all-page print checks

**Files:** Create `lib/designer/document-issues.ts`, `lib/designer/preflight-recipients.ts`, and `components/designer/writing/personalization-controls.tsx`. Modify `components/designer/preflight/preflight-rules.ts`, its panel, the preview recipient picker, and `lib/orders/proof-inputs.ts` as needed for shared context and server-side production-recipient checks. Tests: `tests/designer/document-issues.test.ts`, `preflight-recipients.test.ts`, and `tests/browser/designer/personalization.spec.ts`.

**Interfaces:** Produce `collectDocumentIssues(doc, layout, assets, context): DocumentIssue[]`; each issue includes severity, pageId, optional region/element id, message, and action. Produce `DesignerPersonalizationContext` with explicit sample/actual mode, sender fields, and current recipient. Consume layout output from Task 4 and story tokens from Task 5.

- [ ] Write failing tests for overflow on an inactive included side, a long recipient name, a known token with no actual value, an unknown token, missing sender phone, a placeholder image, and a low-resolution upload. Include a later recipient that overflows when the first recipient fits. Test that sample data is visibly labeled and never presented as actual recipient data.
- [ ] Run them and verify the current active-page/known-token checks fail the required cases.
- [ ] Reuse the existing order contact card/list where available. Insert fields at the caret. Aggregate issues across all included sides; clicking an issue activates/focuses its target. Validate the production recipient set in server-side batches before the existing final approval gate, with affected-record feedback; a selected preview/sample alone cannot certify that set. Provide concrete fixes while preserving font size/page count. Keep the existing approval flow and show the exact production PDF as the main review view.
- [ ] Run unit/browser tests, full typecheck, and delta ESLint. Reproduce the review's long-copy case and verify it can no longer report No issues found.
- [ ] Commit with `feat(designer): add personalization and all-page print checks`.

### Task 7: Ship additional printed sides and pricing as one complete change

**Files:** Create `lib/orders/additional-side-pricing.ts`, `lib/orders/quote-inputs.ts`, and `components/designer/workspace/order-summary.tsx`. Modify page controls, document actions, `lib/orders/pricing{,-breakdown}.ts`, `types/orders.ts`, `components/orders/OrderProvider.tsx`, quote/review/payment UI, both order-pricing routes, the server total used by authorize/submit, and design proof traversal. Preserve `lib/orders/verify-payment.ts`'s server-amount invariant. Tests: `tests/lib/orders/additional-side-pricing.test.ts`, `quote-inputs.test.ts`, existing pricing/verification tests, and `tests/browser/designer/pages-pricing.spec.ts`.

**Interfaces:** Produce `ProductPrintPolicy` with server-owned `includedPrintedSides`, `allowAdditionalPages`, and `additionalPrintedSideCents: 10`. Produce `getAdditionalSideChargeCents(sideCount: number, includedSides: number, quantity: number): number`. Produce `resolveOrderQuoteInputs(state, normalizedDesign, productPolicy)` deriving included-side count and validated quantity; client totals/rates/counts are not authoritative. Extend the existing pricing breakdown with a clearly labeled additional-side line item and quote design revision.

- [ ] Add the following exact surcharge assertions, plus remove/quantity-change/blank-unused-back cases:

  ```ts
  assert.equal(getAdditionalSideChargeCents(1, 1, 1000), 0)
  assert.equal(getAdditionalSideChargeCents(2, 1, 1000), 10000)
  assert.equal(getAdditionalSideChargeCents(3, 1, 1000), 20000)
  assert.equal(getAdditionalSideChargeCents(2, 1, 250), 2500)
  assert.equal(getAdditionalSideChargeCents(2, 2, 1000), 0) // base two-sided postcard
  ```

- [ ] Write a failing browser scenario in which Add Page immediately adds/inserts a side and updates the surcharge/total with no confirmation dialog. A back-of-first-sheet side must count for a letter. Test tampered client rate/count/total, a changed design after quote, and volume discounts; the additional-side line stays exactly 10 cents × extra sides × validated pieces.
- [ ] Run the unit/browser tests and confirm the missing page/fee integration is the failure.
- [ ] Implement explicit included sides, add/remove controls, real thumbnails, and the server-owned policy. An added side counts immediately; an unused legacy reverse is not included merely because it exists in editing state. Keep fixed postcard pricing/capacity. Recompute/invalidate quotes on side/quantity/design change, and use the same server result in authorization/submission amount checks. Preserve the existing approval/capture sequence and return paths.
- [ ] Run pricing, quote, payment-verification, renderer, and browser tests; run full typecheck/delta ESLint. Against local/test services verify the customer summary, server quote, persisted design, proof page count, and authorized amount agree. Use test payment mode only.
- [ ] Commit with `feat(orders): price additional printed sides consistently`.

### Task 8: Make saving, recovery, and order handoff dependable

**Files:** Create `hooks/use-designer-save.ts` and `lib/designer/draft-context.ts`. Modify the autosave/document hooks, customize page, design-save route, order initialization, and `DesignCustomizerStep.tsx`. Tests: `tests/designer/draft-context.test.ts`, `save-result.test.ts`, and `tests/browser/designer/draft-handoff.spec.ts`.

**Interfaces:** Produce `SaveDesignResult = { ok: true; designId: string; revision: string } | { ok: false; recoverySaved: boolean; message: string }`. Produce a pending-design key/reference scoped to userId, designId, and optional orderId. Continue consumes only a successful save/reference for the current revision and current order.

- [ ] Write failing scenarios: server save fails and Retry succeeds; a slow older response arrives after a newer edit; two tabs edit different orders; an old global pending key is present; reload recovers a local draft; changing templates preserves a recovery copy; continuing from an existing order retains completed steps and the intended order id.
- [ ] Run tests and verify failures correspond to the current swallowed save error/global-key/new-order handoff behavior.
- [ ] Implement explicit save results, visible saved/local/retry states, stale-response protection, scoped draft context, and recovery before replacement. Carry the actual saved design id/revision into the existing order; do not claim an order has a remote design solely because localStorage contains one. Preserve existing ownership checks and correct the touched linkage to the actual `created_by`/design schema rather than copying legacy `user_id`/`updated_at` assumptions from the existing save route.
- [ ] Run targeted tests, full typecheck, and delta ESLint. Against a local/test backend verify save/load ownership, recovery, and a designer → existing order → designer round trip.
- [ ] Commit with `fix(designer): preserve drafts and reliable order handoff`.

### Task 9: Verify the complete customer journey and review the result

**Files:** Complete `tests/browser/designer/customer-journey.spec.ts`, add focused layout/PDF fixtures under `tests/designer/fixtures/`, and update the feature's user-facing help only where labels/behavior changed.

**Interfaces:** Consume the existing template entry, normalized document, layout, issue, quote, and save contracts. This task introduces no second implementation of those contracts.

- [ ] Add an integrated journey: choose a ready template; reuse sender details; enter and format a letter; preview a long recipient; resolve overflow; add a printed side; verify $100 additional charge for 1,000 pieces; save; resume the intended order; view the same production content in the final proof.
- [ ] Add equivalent fixed-capacity postcard and legacy-document journeys. Check every offered format at 390×844, 768×1024, 1280×800, and 1440×1000, including keyboard access and visible focus. Verify actual thumbnails, drawer controls, 3D selected-spread compatibility, and no hidden primary action.
- [ ] Run `npm test`, `npm run typecheck:full`, `npm run build`, the designer browser suite, delta ESLint, and `git diff --check`. Baseline test count may increase; require zero failures rather than a fixed count of 290.
- [ ] Perform a local/test-service integration pass for saves, recipient data, quotes, proof persistence, and payment amount consistency. Report separately which browser checks used mocks and which used actual test services. The separately recorded AccuZip launch blocker must not be hidden by mocked data or disabled validation.
- [ ] Review the actual screens and generated print proofs with the owner. Commit final regression fixtures/help with `test(designer): verify customer ordering journey`.

## Completion criteria

All nine tasks have objective evidence and no product-path regression; the chosen template opens correctly; continuous and floating text coexist; all included sides are represented and checked; PDF formatting matches the editing layout; the confirmed side fee is enforced by the server; drafts and order context survive the supported round trips; and the primary customer actions work on phone and laptop.

This plan covers designer usability repairs. It does not declare the entire app launch-ready, implement the external ordering API, or authorize a production deployment.
