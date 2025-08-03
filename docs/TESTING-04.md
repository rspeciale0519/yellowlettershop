# Testing & QA Strategy

*Last Updated: April 2025*

This document outlines the full testing and quality assurance strategy for the Yellow Letter Shop (YLS) platform. It includes test types, tools, coverage targets, E2E flows, CI/CD enforcement, edge case validation, and manual QA processes. All strategies account for platform-critical systems such as annotation, skip tracing, mailing logic, AI personalization, design locking, rollback, contextual help, short link tracking, and analytics/reporting dashboards.

---

## 1. Testing Philosophy

- Ensure all mission-critical workflows are fully test-covered
- Prevent regressions through automated CI enforcement
- Catch inconsistencies and UX edge cases via manual QA
- Maintain traceable, repeatable test documentation for all flows

---

## 2. Testing Types & Tools

| Type             | Tool/Framework            | Description                                  |
|------------------|----------------------------|----------------------------------------------|
| Unit Tests       | Jest                      | Pure functions, schema logic, pricing logic  |
| Component Tests  | React Testing Library     | UI behavior, interactions, state changes     |
| Integration      | Jest + Supertest          | API input/output and DB behavior             |
| End-to-End       | Cypress                   | Full flows across wizard and admin panels    |
| Manual QA        | QA Team                   | UI polish, unexpected states, data accuracy  |

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
- [ ] Toggle deduplication and validate with AccuZIP
- [ ] Save and apply deduplication user default setting
- [ ] Customize and preview FPD design with contact card overlay
- [ ] Create, select, and enforce contact card limits per plan
- [ ] Complete order wizard with Stripe checkout
- [ ] Validate design-lock confirmation + no refund checkbox
- [ ] Configure mailing options (full service, ship to user, print only)
- [ ] Apply postage, stamp, and shipping cost rules
- [ ] Configure campaign options (split and repeat logic)
- [ ] Schedule and store campaign configuration
- [ ] Admin fulfillment method selection and fallback auto-routing
- [ ] Proof email ingestion and PDF review
- [ ] Annotate, resolve, and approve proofs
- [ ] Request proof changes and verify comment threads
- [ ] Skip tracing record selection, payment, vendor email, and response parsing
- [ ] Enrichment data import and skip trace status validation
- [ ] Short link creation per record and redirect tracking
- [ ] View engagement analytics from tracked links
- [ ] Trigger rollback on records individually and in batch
- [ ] Restore original state and verify audit logging
- [ ] Display contextual AI help prompts per page/task
- [ ] Load user dashboard with KPIs and chart data
- [ ] Load admin dashboard with global KPIs, charts, and recent activity
- [ ] Generate downloadable reports (CSV, PDF, Excel)
- [ ] Schedule recurring reports and validate delivery

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
- Runs on all PRs and pushes to `main`
- Enforced steps: lint → typecheck → unit → integration → E2E
- Must pass before deploy or merge

### Manual QA Checklist
- [ ] Confirm design previews reflect personalization + contact card
- [ ] Verify contact card max limit per plan
- [ ] Test toggling and saving deduplication setting
- [ ] Ensure campaign intervals and repetitions are saved properly
- [ ] Verify refund disclaimer and design-lock enforcement
- [ ] Validate proof annotation overlay and thread resolution logic
- [ ] Test skip tracing pipeline from request to enriched import
- [ ] Track short link clicks and verify metrics shown in dashboard
- [ ] Execute rollback and confirm version recovery
- [ ] Review contextual help overlay accuracy across all wizard steps
- [ ] Validate user dashboard KPI tiles and chart data
- [ ] Validate admin dashboard metrics, charts, and vendor stats
- [ ] Generate all report types across supported formats
- [ ] Schedule reports and confirm recurring delivery by CRON
- [ ] Ensure access rules between user vs. admin reports are enforced

---

## 6. Bug Tracking & Severity

| Severity   | Description                                     | SLA               |
|------------|-------------------------------------------------|-------------------|
| Critical   | Data loss, failed payment, or order blockage    | Block deployment  |
| High       | Broken core feature (proofs, orders, etc.)      | 24 hours          |
| Medium     | UI/UI bug, minor feature issue                  | 3 business days   |
| Low        | Cosmetic issue or enhancement                   | Added to backlog  |

All bugs are logged in GitHub Issues or internal Notion with:
- Steps to reproduce
- Actual vs expected behavior
- Screenshots or videos if needed

---

## 7. Planned Enhancements

- Snapshot diffing for mailing list rollback preview
- Visual regression testing for template design and proofs
- Context-driven AI help prompt test coverage
- Stripe webhook mock testing for refunds and capture
- Calendar view validation for campaign schedules
- Expanded E2E for multi-user role permission handling
- Automated short link tracking regression suite
- Test coverage for scheduled reporting workflows
- Historical data verification for analytics dashboards
- Stress/load testing on reporting queries

---

## Contact

For test coverage gaps, QA credentials, or bug reproduction help:  
support@yellowlettershop.com

