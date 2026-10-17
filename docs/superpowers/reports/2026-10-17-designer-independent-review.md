# Independent designer feature review

Reviewed branch `feature/designer-flowing-content` against `8150e521e6b3874bb55a5b408e5e26e0dd232de9`, including uncommitted integration changes observed during review. Read-only application review; only this report was written. No database, payment, browser-server, or external service mutations were performed. Parent integration continued during review; findings below identify the inspected code and were sent immediately to the parent for correction.

## Findings

### 1. P1 — Saving can replace the artwork snapshot of an already submitted/approved order

- **Location:** `lib/designer/save-design-server.ts:33`, `:58-65`.
- **Certainty:** Confirmed by code trace and existing test explicitly accepting submitted-order linkage. No live service reproduction attempted.
- **Reproduction:** Submit an owned order, then POST `/api/design/save` with that submitted order's `orderId` and changed artwork (including a different printed-side count). The fallback `orders` lookup scopes ownership but selects no lifecycle/payment fields. The linkage update replaces both embedded design slots while retaining pricing, quote/payment revisions, proof URLs, approval timestamps and the authorized amount. The same write is accepted for processing/completed orders.
- **Impact:** The final order's supposedly frozen design no longer matches the artwork bound to its payment and stored proof. Existing approval captures the original PI and dispatch uses the stored proof URL without rechecking that snapshot. A save racing official proof creation can also change the input after server quoting. The ordinary non-racing case certainly produces inconsistent order metadata and proof; a changed production PDF depends on proof-generation timing.
- **Minimal fix:** Link designer saves only to owned `order_drafts`, or strictly to a genuinely unpaid editable lifecycle if such an `orders` state exists. Do not update `orders.metadata.order_state` for submitted/paid orders. Offer a separate new draft/copy for revisions. Apply any lifecycle predicate to the UPDATE as well as the read.
- **Shared saved-design nuance:** Updating a `saved_designs` row by `designId` without `orderId` does **not**, by itself, mutate existing submitted artwork in current production readers: proof generation reads the embedded `metadata.order_state` document, and dispatch uses the frozen proof file. Retain that snapshot contract. Copy-on-edit for a design referenced by final orders is useful if immutable reusable revisions are wanted, but blanket locking shared rows would unnecessarily prevent independent draft editing. Future readers must not replace embedded artwork with an unversioned live lookup.

### 2. P2 — Preview recipient callback causes repeated fetches and resets selection

- **Location:** `components/designer/preview-modal.tsx:109` in the observed revision; dependency mechanism at `components/designer/preview/recipient-picker.tsx:50-61`.
- **Certainty:** Confirmed dependency/state trace; browser reproduction was left to parent to avoid touching its running environment.
- **Reproduction:** Open Preview with a saved mailing list containing records. The modal supplies a newly allocated `onSelect` callback each render. RecipientPicker's records effect depends on that callback; each response calls `onSelect(d.records[0])`, which assigns a newly parsed recipient object in the modal and layout context. This rerenders the modal, retriggers the effect, and repeats. Selecting another recipient is then reset to the first response record.
- **Impact:** Repeated recipient/PDF requests and unstable actual-recipient preview; long/missing-value inspection cannot be trusted.
- **Minimal fix:** Stabilize the callback with `useCallback` depending only on the stable context setter (not the whole context object), and cancel/ignore stale picker requests. The parent indicated this is being corrected alongside preview cancellation.

### 3. P2 — Switching a one-sided letter to a postcard creates an unorderable document

- **Location:** `hooks/use-designer-document.ts:227-236`; fixed-side rejection at `lib/orders/quote-inputs.ts:29`; postcard controls in `components/designer/pages-panel.tsx`.
- **Certainty:** Reproduced using the real normalization, remapping and quote-input helpers in a pure Node invocation.
- **Reproduction:** Start White/Yellow Notepad Letter, then choose a postcard in Mail piece size. `setFormat` changes format/coordinates but preserves `back.printIncluded=false`. The normalized document has only `front` included. Final quoting returns `Postcards require exactly two sides`. PagesPanel hides Add Page for postcards and provides no include-back action. A letter with additional retained page IDs also fails the strict pageOrder-length check after switching to a postcard, even if extra sides have been excluded.
- **Impact:** A supported size selector allows a document which cannot complete ordering and provides no direct repair control.
- **Minimal fix:** Use a pure format-conversion policy that includes both base postcard sides and safely handles extra retained letter pages, preserving recoverable content. Reject an unsupported destructive conversion before committing it with a clear repair action. Parent indicated a conversion helper is in progress.

### 4. P2 — Two offered checkout formats cannot be represented by a designer document

- **Location:** `lib/designer/document/schema.ts:28`, `components/orders/steps/mailing/mailing-format-options.tsx:8`; enforced mismatch at `lib/orders/quote-inputs.ts:26`.
- **Certainty:** Reproduced: `MAIL_FORMATS.postcard_5x7` and `.letter_folded` are absent, and normalization rejects either formatId.
- **Reproduction:** Choose 5 × 7 Postcard or Folded Letter in Mailing Options. Both are offered and have default pricing, but the designer only supports letter_8_5x11, postcard_4x6, postcard_6x9 and postcard_6x11. No valid saved document can match the selected checkout format, so final quoting always rejects the order.
- **Impact:** Violates the explicit all-offered-formats requirement and strands these advertised choices under the new authoritative format-match check.
- **Minimal fix:** Add approved geometry, types, schema and product policy for both offered formats and exercise save/layout/PDF/quote round trips. Hiding choices would be a scope reduction requiring owner agreement, not completion of the current requirement. Parent indicated registry/schema support is being added.

### 5. P2 — Guided conversion can write directly into a protected postage area

- **Location:** `lib/designer/document/actions.ts:5-10`, `lib/designer/text/paper.ts:9-18`; missing shared check in `lib/designer/document-issues.ts:15-25`.
- **Certainty:** Reproduced using real conversion/layout/preflight helpers and deterministic metrics.
- **Reproduction:** On a plain letter place a free text box at x=100,y=35,w=100,h=100, fontSize=20 with `A ` repeated 60 times; place a stamp at x=730,y=35,w=96,h=108. Enable Guided writing. The text box expands toward the template right edge, crossing the stamp. `violatesKeepClear()` returns true and positioned text runs cross the stamp footprint, but `collectDocumentIssues()` reports no errors.
- **Impact:** The new toggle bypasses the existing drag/resize keep-clear rule, and both Continue and order proof preflight accept text in the postage region.
- **Minimal fix:** Check keep-clear constraints when enabling/reflowing guided boxes, and add an all-page postage-overlap error to shared document preflight so imported or other transformed documents cannot bypass it. Parent notified with reproduction.

## Requirement fit and verification

The architecture substantially fits the approved direction: one text-element model and formatted editor, per-box Guided writing, explicit printed sides, shared canvas/PDF positions and printable fonts, fixed 10-cent additional letter-side charge per actual validated recipient, owned saved-artwork/validation lookup, and quote fingerprint checks at intent/authorization/submission. Manual capture and the existing separate official proof-approval lifecycle remain intact. The issues above prevent claiming the entire requirement set complete at the inspected snapshot.

I ran the existing Mocha command with focused file arguments; the repository configuration also loaded its configured suite, yielding **408 passing, zero failing** in approximately one second of test execution. The pure format-switch/unsupported-format and postage-overlap reproductions above still failed their intended invariants despite that green suite. `git diff --check` passed at the time of review. No browser/PDF visual equivalence certification, live checkout certification, or external AccuZip verification is claimed by this review.

Known integration issues assigned by the parent—cross-design/order bootstrap recovery, query-specific hydration guards, template URL replacement, current draft persistence before opening the designer, stale preview cancellation, and compact spread numbering after middle-side removal—were not duplicated as separate findings. The unrelated AccuZip launch blocker remains outside this review.

## Current-tree re-review after integration

All five original findings are **closed in the inspected current tree**:

1. Save linkage checks `order_drafts.status === active` and `orders.status === draft` before persistence, and repeats those predicates on the linkage UPDATE. Submitted/final order metadata cannot be replaced through this path. The existing embedded snapshot contract continues to isolate submitted production artwork from standalone saved-design edits.
2. Preview uses a stable callback depending on the React recipient setter, aborts obsolete proof requests and checks request generations. RecipientPicker aborts stale list/record requests. The original response-to-new-callback loop is removed.
3. `convertDesignerFormat` is wired into the document hook. It includes both postcard base sides, trims only empty excluded extras, refuses content-bearing destructive transitions, and preserves a detached recovery snapshot plus undo history.
4. All six checkout formats now appear in shared geometry, validation, renderer dimensions and 3D stock handling. Folded letters use flat full-sheet artwork; 5x7 postcards retain two-sided product policy.
5. Guided conversion avoids visible postage, and shared preflight reports a blocking all-page postage-overlap issue for imported or otherwise transformed documents.

The adjacent review also traced exact-query bootstrap loading, explicit saved-design scope, order-only linked artwork, current-context save invalidation, sender reuse, official proof snapshot consumption, and additional-side policy. No further payment/snapshot or layout regression was found in these inspected paths. The font repair embeds Caveat in full, embeds only used fonts and aligns the base OpenType feature settings across metrics/SVG/PDF; the new real-PDF glyph-integrity tests inspect outlines for all 14 font variants.

Fresh independent verification used `mocha --no-config` against save linkage, format conversion/compatibility, all-page document issues, page actions, bootstrap recovery, save results, and PDF font integrity: **69 passing, zero failing**. `git diff --check` also passed. No application files, live servers, DBs, artifacts or external services were changed during this re-review.

### Remaining narrow requirement gap at this inspection

**P2 — Compatible template changes still reset the message.** At `hooks/use-designer-document.ts:219-225`, template replacement always calls `createDesignerDocument(templateId)`. Enter a formatted message in White Notepad, then select Yellow Notepad: the visible message becomes the new template's default despite both templates sharing the same `notepad-message` element and identical writing geometry. A recovery snapshot is preserved, so this is not unrecoverable data loss, but the approved requirement explicitly calls for carrying compatible message/sender fields where possible. Preserve the source text/rich-text fields for the White↔Yellow pair while changing paper/template identity; add a regression retaining paragraph formatting. This was sent to the parent before closing the review.

Apart from that compatible-template carry gap, the inspected implementation now fits the user's requested functional direction and closes the previously identified correctness issues. This is a source/pure-test assessment, not independent browser or production-service certification. Parent-run browser/DB evidence is separate. No production deployment or push is authorized by this report.

## Final closure: compatible notepad template switch

The remaining compatible-template P2 is **closed** in the current tree. `lib/designer/template-switch.ts` carries the complete normalized composition across White↔Yellow Notepad changes, preserving rich text, free objects, additional sides and inclusion settings. It changes the matching paper colors and template identity while clearing the previous saved design ID so a new template scope cannot overwrite the previous template's saved artwork. Other deliberately selected page-paper types remain intact.

The customize page preserves the old draft first and durably writes the carried composition under the new user/template/order scope before changing the URL; it refuses the change when that recovery cannot be established. The document hook uses the same helper, and scoped bootstrap can recover the new composition after URL hydration/reload. I found no additional defect in this small repair.

Fresh independent template-switch, bootstrap and recovery tests: **17 passing, zero failing**. `git diff --check` passed. The parent separately reported the actual browser reload regression passing; I did not rerun or interact with its live browser/server.

**Final review outcome:** All five original findings and the later compatible-template P2 are closed. No remaining must-fix was found in the reviewed current feature and adjacent repair paths. The implementation now fits the requested functional scope at the source and pure-test level, including all offered formats, shared ruled-paper/text geometry, one text-box system, explicit billable sides, authoritative quote/payment binding and recoverable scoped handoff. Final browser/build results and local-service evidence remain the parent's separately collected verification. This review does not authorize a production deployment or push.

## Final 3D capture font repair review

Reviewed `hooks/use-print-fonts.ts`, `components/design-preview-3d/capture-page.ts`, the capture-stage callers, and `tests/browser/designer/three-dimensional.spec.ts`. No material issue found in this scoped repair. Browser font binaries are retained after successful loading; `browserPrintFontCSS` generates cached, deduplicated data-URL font faces only for the loaded variants requested by the selected page's actual positioned SVG text. Capture derives the matching family/weight/style from those SVG runs and passes the explicit CSS to html-to-image. The installed html-to-image implementation consumes `fontEmbedCSS` directly and inserts it into the cloned SVG tree, resolving the FontFace API inheritance gap. Existing capture sizing, retry and stale-capture guards remain intact. Independent read-only `git diff --check` passed.

The added browser test observes the generated SVG data URL and checks embedded Caveat font CSS, selected additional-sheet behavior and flip controls. It proves actual font embedding reaches the capture payload; it is not a pixel-by-pixel proof of canvas/PDF identity.

The parent reported the final **production build passing**, a **production-mode browser run of 29/29 passing** including this 3D test, **453 unit tests passing**, full typecheck passing, and full feature-delta lint with zero errors and one pre-existing warning. These browser/build/type/unit results were collected by the parent, not rerun by this independent reviewer. I did not touch its server, browser artifacts, database or external services.

Review remains closed with no outstanding must-fix in the inspected implementation. Actual manufacturing stock/artwork calibration still needs the owner's input before live fulfillment; current proofs draw vector paper stock. No production deployment or push is authorized or claimed.
