# Published Yellow Letter Shop pricing import

Source: https://yellowlettershop.com/ (the requested www address redirects here),
retrieved 2026-10-17. Both homepage tables say their rates already reflect the
July 12, 2026 USPS increase. No extra USPS adjustment was added.

The shared integer-cent catalog is `lib/orders/published-pricing.ts`. Its 40 letter
and 64 postcard prices were independently compared with the captured homepage.
The raw public HTML/text capture is in `/workspace/scratch`, outside Git.

## Imported source tables

Letter prices are per piece. SC = Standard Class; FC = First Class;
NP = No Postage; PO = Print Only.

| Quantity | Mailed SC | Mailed FC | Shipped FC | Shipped NP | Shipped PO |
| --- | --- | --- | --- | --- | --- |
| 1–249 | $1.15 | $1.70 | $1.70 | $0.65 | $0.55 |
| 250–499 | $1.10 | $1.65 | $1.65 | $0.65 | $0.55 |
| 500–749 | $1.07 | $1.43 | $1.60 | $0.65 | $0.55 |
| 750–999 | $1.02 | $1.36 | $1.53 | $0.65 | $0.55 |
| 1,000–2,499 | $0.92 | $1.23 | $1.37 | $0.65 | $0.55 |
| 2,500–4,999 | $0.91 | $1.21 | $1.35 | $0.65 | $0.55 |
| 5,000–9,999 | $0.88 | $1.17 | $1.31 | $0.65 | $0.55 |
| 10,000+ | $0.85 | $1.14 | $1.28 | $0.65 | $0.55 |

Postcard prices include mailing/postage. An asterisk on SC below 250 means First
Class is used, per the live page's explicit footnote.

| Size/class | 1–249 | 250–499 | 500–749 | 750–999 | 1,000–2,499 | 2,500–4,999 | 5,000–9,999 | 10,000+ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4×6 FC | $1.25 | $0.91 | $0.88 | $0.84 | $0.76 | $0.75 | $0.72 | $0.70 |
| 4×6 SC | $1.25* | $0.92 | $0.89 | $0.85 | $0.77 | $0.76 | $0.73 | $0.71 |
| 5×7 FC | $1.27 | $0.98 | $0.95 | $0.91 | $0.82 | $0.81 | $0.78 | $0.76 |
| 5×7 SC | $1.27* | $0.94 | $0.91 | $0.87 | $0.78 | $0.77 | $0.74 | $0.72 |
| 6×9 FC | $1.28 | $0.99 | $0.96 | $0.92 | $0.83 | $0.82 | $0.79 | $0.77 |
| 6×9 SC | $1.28* | $0.95 | $0.92 | $0.88 | $0.79 | $0.78 | $0.75 | $0.74 |
| 6×11 FC | $1.31 | $1.01 | $0.99 | $0.94 | $0.85 | $0.84 | $0.81 | $0.79 |
| 6×11 SC | $1.31* | $0.97 | $0.94 | $0.90 | $0.81 | $0.80 | $0.77 | $0.75 |

## Checkout behavior

- Full-service quotes use the shared mailed-letter/postcard tiers. Both existing
  First Class stamp/permit selections use the FC column while retaining their
  distinct fulfillment values. Letter colors use the same published letter
  table; the source does not distinguish them. Folded letters use that table too.
- Full service always includes postage, even if a client submits false/missing
  includePostage. Postcard Standard selections below 250 become First Class
  stamps in both authoritative snapshot locations. The source's letter SC
  1–249 rate is retained without inventing a separate minimum.
- Published tiers already include quantity pricing. Separate postage and generic
  volume discounts are not added. Existing optional paper/finish upcharges remain.
  Additional letter sides still cost an undiscounted $0.10 per side per piece.
- The quote identifies the base as “Printing and mailing (postage included).”
  Saved recipient counts, ownership, proof/payment revision binding and manual
  Stripe capture behavior remain authoritative.
- Existing flat printing rows do not override bundled mailing totals. Explicit
  `mail_piece` keys such as `published_postcard_6x9_fc` may use a complete tiered
  integer-cent table. Gaps, overlaps, fractions and wrong models fail closed.
  No hosted pricing rows were changed. Public tables show the captured catalog;
  explicit admin overrides apply to checkout quotes.

## Decisions still pending

All three shipped-letter columns are copied into the public rate table. Their
checkout mapping is deferred until the owner answers whether freight is included
or additional, and whether physical PO should replace or sit alongside the
existing $25 digital-file service. Existing ship_processed and digital print_only
calculations are unchanged; the $0.55 physical rate was not assigned to PDF files.
Non-mailing large-postcard printing remains separately configured because the
website only supplies mailed-postcard prices. This is a feature preview, not a
production pricing release.

## Evidence

- Full Mocha suite: 490 passing. Initial 24 advertised-price assertions failed
  against the prior calculator. A later stamp/permit regression also failed
  before its correction. Updated legacy tests reflect the new mailing contract.
- Full TypeScript and production build pass; delta ESLint has zero errors and
  one unchanged legacy any warning. Local build uses nonfunctional payment keys.
- Production Chromium: 33 passing. Covers the full designer suite plus mobile/desktop public
  tables and actual engine-backed mailing choices at 249/250 postcards. Browser
  auth/storage/commercial routes remain intercepted; no real payment is tested.
- Four new real local PostgreSQL/PostgREST checks exercise the actual config
  loader, a boundary-changing admin tier row, malformed stored cents failing
  closed and fixture cleanup. Only localhost is allowed; the row is removed and
  protected credentials stay unchanged. Earlier designer DB evidence is separate.
- Independent GPT-6.1 review matched all 104 source cells and checked 54 focused
  pricing/checkout tests. Follow-up verified stamp/permit preservation through
  snapshot, order insert, vendor mapping and quote invalidation (39 focused tests).

Local evidence: `/workspace/scratch/published-pricing-{unit-final.log,typecheck-final.log,production-build-final.log,browser-verified.log,db-evidence.json}`.
