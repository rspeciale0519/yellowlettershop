# Designer usability and flowing content — proposed design

Status: approved for implementation by the owner on 2026-10-17. White and yellow notepad paper must share explicit ruled-line geometry with text layout in both the canvas and PDF.

Sources: the owner's discussion, `2026-10-16-designer-flowing-content-brief.md`, and the read-only customer review at `/workspace/scratch/designer-ux-review/recommendations.md`.

## Goal

A customer chooses an actual product/template, edits their message and details, sees an accurate mail piece, resolves print problems, and continues into the existing order process with their work intact. One text-box system supports both behaviors: every text box has a Guided writing toggle. Enabled boxes follow template writing bounds and paper baselines; disabled boxes stay freely positioned. This owner refinement on 2026-10-17 supersedes a separate document-story editing mode.

## Scope and constraints

- Support every offered mail piece format. Build the text system for all formats and use a yellow-letter example for the first visual checkpoint.
- Preserve free-positioned text, images, shapes, QR codes, tables, backgrounds, undo, and existing postage keep-clear rules.
- Preserve existing saved designs and production proof/approval/payment behavior. Changes to quote inputs and the design handoff must integrate with that behavior.
- Keep the current Next.js 15 / React 18 application and its Supabase persistence. Do not create a second app, a subscription system, a new CMS, or the external CRM API in this workstream.
- All new application code is TypeScript and each code file is at most 350 lines. Split only where this feature needs a clear responsibility boundary.
- Prices use integer cents internally. The additional printed-side rate is exactly 10 cents per mail piece, with no volume discount applied to that surcharge.
- Add Page acts immediately and updates pricing immediately; there is no separate price-confirmation dialog.
- No automatic page addition or silent font shrinking on overflow. The customer controls page additions and font size.
- Use local/test services for integration verification. Existing unit/typecheck success does not establish live checkout or AccuZip readiness.

## Customer experience

Desktop: a compact editor header, a selected-box content panel, a large canvas, and collapsible real page thumbnails. Existing text boxes expose a formatted multiline editor and Guided writing toggle. Selecting another canvas object exposes its relevant controls.

Phone: a content form and an easily accessible full-screen preview, with tools in a drawer and Continue to Order always reachable. No basic task requires dragging, hovering, or double-clicking. Fit to screen computes available width and height after panels and header are accounted for.

Product selection opens the selected template with its intended format and orientation. Public entries without a usable designer template must not display a working-looking order action. Keep template identifiers consistent between the catalog, editor, saved design, and order. Actual production artwork and ruled-paper measurements are part of template readiness, not values to guess from a screenshot.

## Document model and compatibility

Introduce a versioned canonical document with stable page identifiers, ordered page sides, template-defined writing regions, and structured rich text stored on the existing text elements. Each page side records whether it is included for printing. A guided text box can continue through explicitly linked text boxes on added sides; a postcard's message must not flow into its address/postage area.

Use `normalizeDesignerDocument(input: unknown): DesignerDocumentV2` at load/save/preview/order boundaries. Support existing front/back documents and the legacy elements shape currently accepted by order proof rendering. Preserve page content, backgrounds, transforms, locked/hidden objects, and personalization values. Preserve an original recovery snapshot before saving an upgraded document. Unsupported or malformed versions produce a recoverable error instead of a reset to a blank template.

Canonical types, including the small semantic text schema, live in `types/designer-document.ts`. `types/designer.ts` retains/re-exports element types needed by existing consumers. Page traversal goes through shared helpers rather than hard-coded front/back loops. Update save validation, PDF rendering, order handoff, preview capture, and 3D consumers as part of compatibility work. The primary PDF includes every included page side; optional 3D preview represents the selected sheet/spread and must not imply that it displays every page at once.

## Text composition and print layout

Use a proven rich-text editor behind a small adapter; the proposed engine is Tiptap with only the required paragraph, hard-break, text-style, bold, italic, underline, alignment, and personalization-field features. Verify React 18 compatibility and pin one matching version across its packages when implementing. Store a small validated project schema rather than arbitrary HTML or browser DOM.

Define `layoutDesignerDocument(document, values, metrics): DocumentLayout` as a shared pure layout function. It returns positioned lines/runs, baselines, page/region references, and overflow issues. `values` contains the resolved sender/recipient strings; `metrics` measures the exact printable fonts. The canvas and PDF draw those positions rather than wrapping text independently. Use the existing 100-design-units-per-inch geometry and convert to PDF points in the renderer.

Each template defines its writing rectangles, safe margins, first baseline, and optional ruled-line spacing. Calibrate those against actual artwork. Layout preserves paragraphs and intentional line breaks. Pasted content is sanitized to supported text and marks; unsupported glyphs or unavailable fonts produce clear feedback. Guided text-box content flows only through its linked continuation boxes and reports overflow when capacity is exhausted. Existing floating text boxes also use shared measurement for overflow and print consistency.

## Pages and billing

Confirmed owner rule on 2026-10-16: for letters, each additional printed side after the first printed side costs $0.10 per mail piece. Printing the back of the first sheet therefore counts as an additional printed side. This is a side count, not a physical-sheet count.

Use server-owned `ProductPrintPolicy` with `includedPrintedSides`, `allowAdditionalPages`, and `additionalPrintedSideCents`. Letter policies include one printed side and use a rate of 10. Fixed two-sided postcards retain their configured two-sided base product price and do not acquire additional-page controls. Additional flyer/page capabilities must be explicit in their product policy.

Billable count comes from sides included in the production document. An unused reverse side is not included implicitly merely because the legacy editor had a back canvas. Add Page includes the new side immediately, so its surcharge appears immediately; removing/excluding that side removes the surcharge. Keep the inclusion state visible even while an added page is being composed.

Formula, in cents:

`additionalSideCharge = max(0, includedSideCount - policy.includedPrintedSides) * 10 * validatedPieceCount`

For 1,000 letters, one included side adds $0; two add $100; three add $200. Changing quantity updates that amount. Show a per-piece estimate before quantity is known, and label the total as an estimate until the validated mailing count is available.

The server derives side count from the normalized design and rate/capacity from the product policy. A client-submitted page count, unit rate, or total is not authoritative. Both quote routes, review/payment displays, authorization, submission total calculation, and the existing amount verification must agree. A changed design invalidates its previous quote; keep the existing approval/fulfillment state machine.

## Personalization and checks

Reuse sender/contact-card data from the current order context. Use clearly labeled sample data before a real list is available. Insert personalization fields at the caret, not at the end of the message. Keep actual recipient preview available, including long names/addresses and missing values.

Define `collectDocumentIssues(document, layout, assets, context): DocumentIssue[]`. Every issue identifies its page/region/object and a customer-readable corrective action. Check all included sides for overflow, placeholder content, missing required personalization, font problems, low-resolution assets, and print/postage boundaries. Resolving an issue recalculates the status. A single recipient preview does not certify the entire mailing: validate variable text against the production recipient set before the existing final approval gate, using batched server-side layout checks and reporting affected records. Do not automatically add pages for a long recipient value; require the user to resolve the layout and show the resulting quote.

## Drafts and order handoff

Save operations return an explicit success/failure result. Keep local recovery, but distinguish it from a successful remote save and provide Retry. Prevent stale save responses from replacing newer edits. Scope pending-design state by user/design/order instead of using a single global pending key for every tab.

Before a template replacement discards content, preserve a recoverable snapshot and show the effect; carry compatible message/sender fields where possible. Undo/redo should group normal typing into useful actions and work for existing canvas edits.

Continue to Order must preserve the exact current design and existing order context. If remote persistence or required checks fail, keep the user in the editor with a recovery action. Resume an existing order rather than restarting its completed steps. Reuse the existing checkout approval process; do not add another approval dialog as part of this repair.

## Acceptance and review points

1. Product → intended template works; desktop and phone can edit and reach the next action.
2. A multi-paragraph letter wraps and aligns to the template's rules; its PDF uses the same line positions and formatting.
3. Existing free-positioned objects and saved documents survive normalization and round trips.
4. Overflow is detected on every included page, including after personalization.
5. Add Page and removal immediately update the displayed price; server quotes reproduce the confirmed examples.
6. A failed save, template change, reload, or second browser tab does not silently discard or replace an order's design.
7. The existing order receives the intended design and the final proof contains all included sides.

Review the focused layout first, then one complete ruled-letter example, then the full additional-side price/handoff journey. Those checkpoints review actual working behavior. Public deployment and a wider app launch audit are separate work.
