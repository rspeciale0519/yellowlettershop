# Testing & QA Strategy

*Last Updated: April 2025*

This document outlines the full testing and quality assurance strategy for the Yellow Letter Shop (YLS) platform. It includes test types, tools, coverage targets, E2E flows, CI/CD enforcement, edge case validation, and manual QA processes. The strategy includes testing for all critical platform systems such as annotation, skip tracing, mailing logic, AI personalization, design locking, rollback, contextual help, short link tracking, webhook management, feedback collection, scheduled reporting, global search, team collaboration, and analytics dashboards.

---

## 1. Testing Philosophy

- Ensure full test coverage of mission-critical workflows
- Block regressions via automated CI validation
- Catch inconsistencies and UX edge cases through manual QA
- Maintain documentation for all functional, visual, and behavioral validations

---

## 2. Testing Types & Tools

| Type             | Tool/Framework        | Description                                           |
|------------------|------------------------|-------------------------------------------------------|
| Unit Tests       | Jest                  | Pure logic, pricing, utility functions                |
| Component Tests  | React Testing Library | UI components and state transitions                   |
| Integration      | Jest + Supertest      | API input/output and database interactions            |
| End-to-End       | Cypress               | Full app flows (wizard, dashboards, webhook logs)     |
| Manual QA        | QA Team               | UI polish, edge scenarios, rollback, archival, export |

---

## 3. Code Coverage Goals

| Layer               | Target Coverage |
|---------------------|-----------------|
| Unit tests          | 90%+            |
| Component coverage  | 85%+            |
| API integrations    | 90%+            |
| E2E user flows      | 100%            |

---

## 4. Critical E2E Workflows (Cypress)

- [ ] Auth: Login, logout, impersonation
- [ ] Upload and validate mailing list
- [ ] Deduplication toggle and user-level default
- [ ] Customize template and preview with contact card fields
- [ ] Contact card creation with plan enforcement
- [ ] Order wizard: all steps to Stripe payment
- [ ] Final screen design lock and refund checkbox confirmation
- [ ] Mailing options selection and cost calculation
- [ ] Campaign config: split/repeat logic and calendar schedule
- [ ] Vendor routing by admin and fallback routing on timeout
- [ ] PDF proof ingestion via email and annotation workflow
- [ ] Threaded annotation replies, resolution, approval
- [ ] Skip tracing lifecycle: record selection to data enrichment
- [ ] Short URL creation, redirect logs, and dashboard metrics
- [ ] Rollback UI for single record, list, or tag-based segment
- [ ] AI prompt generation and personalization injection
- [ ] Contextual AI help display across key workflows
- [ ] Webhook endpoint registration, event delivery, retry logging
- [ ] Feedback system prompt post-approval and NPS submission
- [ ] Admin dashboard: charts, KPIs, failed jobs, vendor scores
- [ ] Report builder with filters, export types, scheduling
- [ ] Recurring reports: CRON timing, email delivery, log confirmation
- [ ] Team invitation, role enforcement, multi-user collaboration flows
- [ ] Global search indexing and fuzzy lookup verification
- [ ] File export (proofs, mailing lists, annotations, reports)
- [ ] Record and order archival toggle + backend flag enforcement

---

## 5. QA Workflow

### Local Developer Checklist
```bash
npm run lint
npm run typecheck
npm run test
npm run cypress:open
```

### CI Testing (GitHub Actions)
- Triggered on pull requests and main branch commits
- Required workflow:
  - Lint
  - Type check
  - Jest (unit/integration)
  - Cypress (E2E)

### Manual QA Checklist
- [ ] Visual and functional validation of all order wizard steps
- [ ] AI content accuracy with token injection previews
- [ ] Annotation resolution flow and sidebar comments
- [ ] Scheduled recurring reports trigger by time and filter
- [ ] Feedback prompt display and NPS data submission
- [ ] Webhook endpoint test and retry logic under load
- [ ] Admin impersonation action with audit log verification
- [ ] Fallback routing of skip trace and proof orders
- [ ] Search bar matches across records, orders, users
- [ ] Bulk export of reports, records, and annotation PDFs
- [ ] Record archival flag disables related actions in UI
- [ ] Team invite flow with pending acceptance logic and plan limit enforcement

---

## 6. Bug Tracking & Severity

| Severity   | Description                                      | SLA             |
|------------|--------------------------------------------------|-----------------|
| Critical   | Blocks checkout, skip tracing, or data loss      | Immediate fix   |
| High       | Broken order flow, annotations, or proof review  | Within 24 hours |
| Medium     | Admin-only tools, UI glitches, webhook logs      | 72 hours        |
| Low        | Cosmetic styling or non-blocking performance     | Backlog         |

All bugs must be documented in GitHub Issues with:
- Title and severity
- Steps to reproduce
- Screenshots or screencasts
- Component or route involved

---

## 7. Planned Enhancements

- Visual regression diffing for PDF proofs and template previews
- API mocking for webhook event testing and failure simulation
- Browser matrix testing for team features and drag/drop
- Stress testing of export systems and scheduled report queues
- Graph rendering validation on high volume datasets
- Device responsiveness verification for mobile dashboards
- Fuzz testing of short link redirect handler with invalid data
- Heatmap UI testing for short link and AI usage

---

## Contact

For QA credentials, Cypress debugging, test data setup, or test automation coverage suggestions:  
support@yellowlettershop.com

