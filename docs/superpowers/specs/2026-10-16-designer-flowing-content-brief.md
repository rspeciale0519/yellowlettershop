# Flowing content in the mail piece designer — discussion brief

Status: agreed scope captured. Proposed design and implementation plan are recorded in `2026-10-16-designer-usability-design.md` and `../plans/2026-10-16-designer-usability-plan.md`; product implementation has not started.

## Goal and agreed behavior

Continue the existing full Yellow Letter Shop application. The current focus is a simpler way for customers to compose their mail pieces inside its existing designer.

- Support continuous formatted text entry across all mail piece formats, including letters, postcards, and flyers.
- Keep free-positioned text boxes available alongside the continuous editor; both modes can be used in one design.
- Update the mail piece preview while the customer types and formats content.
- Define each template's writing region, safe margins, starting position, and line spacing. Wrap text within that region and align text baselines to ruled paper where applicable.
- Flag text that does not fit. Additional pages are available only where the product supports them.
- Clicking Add Page adds the page immediately and updates pricing immediately, without a separate surcharge confirmation step.
- Each additional **printed side** after the first costs **10 cents per mail piece**, including printing on the back of the first physical sheet. One additional printed side across 1,000 pieces adds $100. The owner explicitly confirmed both the per-piece rate and the printed-side interpretation.
- Surface both the per-piece price and the order total as they change.
- The approved production file must preserve the same text layout the customer previews.

The owner believes the existing proof approval and checkout gate is already built and asked to focus on the designer. This brief does not request a checkout redesign. External CRM/API ordering remains an overall launch goal, separate from this designer change.

## Current code entry points

- `app/design/customize/page.tsx`: designer page and save/order handoff.
- `types/designer.ts`: plain text element content with element-level styling; document pages currently keyed by front/back.
- `hooks/use-designer-document.ts`: document state and editing operations.
- `components/designer/canvas/render-element.tsx`: browser text rendering and direct text editing.
- `components/designer/inspector/panels/text-inspector.tsx`: existing text controls.
- `components/designer/designer-templates.ts`: initial template documents.
- `components/designer/mail-spec.ts`: print geometry and safe regions.
- `app/api/design/preview/_render/pdf-renderer.ts`: separate PDF text rendering and fixed front/back page iteration.
- `lib/orders/pricing.ts`, `lib/orders/pricing-breakdown.ts`: pricing calculation and customer-facing breakdown; no additional-page price input was observed in these entry points.

The browser layout, saved document model, PDF output, preflight checks, and pricing need a coordinated design. Updating a textarea alone would not cover the requested behavior.

## Questions for the implementation design

- Define reusable content regions and ruled-line geometry for each template.
- Define how inline formatting and paragraphs are represented and rendered consistently in the browser and production PDF.
- Define additional pages relative to the existing front/back model and which products permit them.
- Define page removal, text flow across available pages/regions, and handling of recipient merge values that change text length.
- Carry the additional-page count and surcharge through authoritative server-side pricing and order persistence, with the fixed 10-cent surcharge clearly represented.

## Setup evidence

- Working clone: `/workspace/yellowlettershop`.
- Base: GitHub `develop`, `8150e521e6b3874bb55a5b408e5e26e0dd232de9` (2026-08-11).
- Branch: `feature/designer-flowing-content`.
- Dependencies: `npm ci --ignore-scripts --no-audit --no-fund` completed.
- Baseline: `npm test` — 290 passing; `npm run typecheck:full` — exit 0.
- Runtime integrations and the full authenticated customer journey have not been verified in this working clone.

The latest project journal also records an AccuZip production validation blocker and subsequent vendor clarifications (`ylsbrain/journal/2026-08-03.md`, `2026-08-11.md`). Unit/typecheck success does not establish that the customer can complete a live order. Treat that as separate launch-readiness work.
