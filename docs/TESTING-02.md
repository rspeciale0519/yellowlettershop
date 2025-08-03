# Testing & QA Strategy

_Last Updated: April 2025_

This document outlines the full testing and quality assurance strategy for the Yellow Letter Shop (YLS) platform. It includes test layer breakdowns, tools used, coverage expectations, E2E flows, CI/CD integration, and manual QA procedures. All strategies reflect critical system features including proof annotation, third-party printer workflows, campaign configuration (mailing + repeat/split), contact card enforcement, Stripe payment gating, deduplication controls, and customer approval workflows.

---

## 1. Testing Philosophy

- Ensure all business-critical workflows are covered by automated tests
- Maintain confidence in deploys with full CI-based enforcement
- Use manual QA to catch UI/UX inconsistencies and edge cases
- Create repeatable and documented QA steps for all releases

---

## 2. Testing Types & Tools

| Type             | Tool/Framework            | Description                                 |
|------------------|----------------------------|---------------------------------------------|
| Unit Tests       | Jest                      | Pure functions, schema logic, helpers       |
| Component Tests  | React Testing Library     | Component behavior and user interaction     |
| Integration      | Jest + Supertest          | API route logic and DB interaction          |
| End-to-End       | Cypress                   | Full flows: upload → design → order → proof |
| Manual QA        | QA Team                   | Edge cases, campaigns, annotations, UX      |

---

## 3. Code Coverage Goals

| Layer               | Target Coverage |
|---------------------|-----------------|
| Unit tests          | 90%+            |
| Components          | 80%+            |
| Integration routes  | 90%             |
| E2E core workflows  | 100%            |

---

## 4. Critical E2E Workflows (Cypress)

- [ ] Auth: Login, logout, impersonation
- [ ] Upload and map mailing list
- [ ] Toggle deduplication on upload and validate with AccuZIP
- [ ] Store and apply user-level default deduplication setting
- [ ] Customize and preview FPD design with contact card overlay
- [ ] Add, select, and apply a Contact Card during order process
- [ ] Enforce max contact card limits based on subscription plan
- [ ] Place order with Stripe checkout
- [ ] Validate user is required to select a contact card if none exists
- [ ] Display design preview with contact card values
- [ ] Configure mailing options: full service, ship to user, print only
- [ ] Apply proper stamp/indicia/postage rules per mailing option
- [ ] Calculate shipping/handling based on weight for Options B/C
- [ ] Configure campaign options:
  - Split Campaign: num drops + interval
  - Repeat Campaign: repeat count (+ interval if no split)
- [ ] Ensure campaign settings are saved and correctly scheduled
- [ ] Admin selects fulfillment method or allows fallback auto-routing
- [ ] Print proof generated and delivered to vendor via email
- [ ] Inbound proof files received, parsed, and stored
- [ ] Proof approval and change request workflows
- [ ] Annotations and threaded comments display and resolve properly

---

## 5. QA Workflow

### Local Testing
```bash
npm run lint
npm run typecheck
npm run test
npm run cypress:open
```

### CI Testing (GitHub Actions)
- Runs lint, typecheck, Jest, and Cypress tests
- Must pass before merging to `main` or deploying to production

### Manual QA Checklist
- [ ] Validate Contact Card appears correctly on design preview
- [ ] Confirm limits per plan on contact card creation
- [ ] Ensure default deduplication toggle is honored
- [ ] Test all campaign configuration combinations (split vs repeat)
- [ ] Simulate mailing option selections and verify pricing logic
- [ ] Ensure error messages guide users when prerequisites are missing (e.g., no contact card)
- [ ] Validate preview matches personalization tokens and card data
- [ ] Confirm API behavior for mailing options and campaign options via order payloads
- [ ] Verify annotation UI behaves correctly for multi-page proofs
- [ ] Ensure Stripe payment hold and release sequence works end-to-end
- [ ] Check all related notification triggers and links

---

## 6. Bug Tracking & Severity

| Severity   | Description                                     | SLA               |
|------------|-------------------------------------------------|-------------------|
| Critical   | Payment failures, data loss, or order blocking  | Block deployment  |
| High       | Breaks a core feature (e.g. annotation system)  | 24 hours          |
| Medium     | Non-blocking bug, needs UI fix or retry         | 3 business days   |
| Low        | Cosmetic issues, UX enhancements                | Backlog           |

All bugs must be logged in GitHub Issues or the internal Notion QA board with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or screen recordings if applicable

---

## 7. Planned Enhancements

- Visual regression testing for FPD previews with contact card overlays
- Full lifecycle testing of campaign scheduling engine
- Validation of default deduplication logic with toggle override
- Snapshot diffing for proof revisions
- Stripe webhook simulation and rollback test automation
- Campaign calendar view validations for drops and repeats
- Email bounce/error tracking for proof delivery and updates

---

For QA credentials, testing scope approval, or help reproducing bugs:  
Contact: qa@yellowlettershop.com