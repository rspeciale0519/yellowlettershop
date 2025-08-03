# Testing & QA Strategy

_Last Updated: April 2025_

This document outlines the full testing and quality assurance strategy for the Yellow Letter Shop (YLS) platform. It includes test layer breakdowns, tools used, coverage expectations, E2E flows, CI/CD integration, and manual QA procedures. All strategies reflect core system features including proof annotation, third-party printer workflows, Stripe payment gating, and customer approval flows.

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
| Manual QA        | QA Team                   | Design previews, proof lifecycle, annotations|

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
- [ ] Validate list with AccuZIP
- [ ] Customize and preview FPD design
- [ ] Place order and simulate Stripe checkout
- [ ] View order dashboard and status updates
- [ ] Admin selects fulfillment method (in-house vs third-party)
- [ ] Generate and route third-party print orders (MBI)
- [ ] Receive and display revised proofs
- [ ] Annotate proof file and add threaded comments
- [ ] Approve proof or request changes
- [ ] Cancel order and release Stripe funds

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
- [ ] Validate third-party proof lifecycle from file ingestion to customer approval
- [ ] Confirm annotations are placed accurately and stored properly
- [ ] Test all proof action buttons: Approve, Request Changes, Cancel
- [ ] Review email notifications and link handling for MBI and customer emails
- [ ] Ensure design preview renders correctly with dynamic data
- [ ] Admin dashboard displays order and annotation logs accurately
- [ ] Verify mobile responsiveness of annotation viewer and side panel

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

- Annotation visual regression testing with screenshots
- Email delivery confirmation and bounce tracking
- Load testing for Stripe fund hold + approval release
- Test parallelization and CI performance improvement
- Snapshot comparison for revised proof versions
- Test auto-parsing of inbound email via webhook (MBI proofs)

---

For QA credentials, testing scope approval, or help reproducing bugs:
- Contact: qa@yellowlettershop.com