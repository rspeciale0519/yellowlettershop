# Testing & QA Strategy

*Last Updated: April 2025*

This document defines the QA protocols and test coverage strategy for the Yellow Letter Shop (YLS) platform. It ensures reliability and validation for features including payment holds, proof approval triggers, rollback tooling, stored payment methods, annotation workflows, scheduled reports, team collaboration, and webhook event flows.

---

## 1. Testing Objectives

- Validate every core user workflow end-to-end
- Prevent regressions via automated CI/CD checks
- Ensure Stripe authorization + approval flow behaves correctly
- Enforce test coverage across backend APIs, frontend UI, and critical state transitions
- Include rollback, field-level audits, and impersonation security

---

## 2. Testing Types & Tools

| Type             | Tool                  | Scope                                                   |
|------------------|------------------------|----------------------------------------------------------|
| Unit             | Jest                   | Pricing, validation, campaign logic                      |
| Component        | React Testing Library  | All interactive UI components                           |
| Integration      | Supertest + Jest       | API endpoint + DB validation                           |
| End-to-End       | Cypress                | Order → Proof → Approval → Payment → Reporting          |
| Manual QA        | Internal QA Checklist  | Visual polish, mobile layout, interaction consistency   |

---

## 3. Coverage Targets

| Module                    | Target     |
|---------------------------|------------|
| Payment Authorization     | 100%       |
| Rollback Flow             | 100%       |
| Annotation Threads        | 100%       |
| Proof Approval Path       | 100%       |
| Stripe Capture / Cancel   | 100%       |
| Feedback Prompt + Logging | 100%       |
| Webhook Retry             | 100%       |
| Scheduled Reports         | 100%       |

---

## 4. E2E Scenarios (Cypress)

- [ ] Upload file → map fields → deduplicate
- [ ] Validate via AccuZIP → enrich with skip trace
- [ ] Configure campaign + mailing options
- [ ] Launch checkout and trigger Stripe payment intent with `manual` capture
- [ ] Save card → check default fill next time
- [ ] Cancel order → confirm Stripe hold is voided
- [ ] Approve proof → payment is captured
- [ ] Submit proof annotations + threaded replies
- [ ] Perform per-field rollback from audit view
- [ ] Submit feedback and confirm alert trigger if NPS < 6
- [ ] Register and retry webhook events (simulate 500 response)
- [ ] Invite teammate, confirm permission scope and RLS enforcement
- [ ] Schedule report and confirm it emails results
- [ ] Run short link engagement test with redirect logging

---

## 5. Manual QA Checklist

- [ ] Stripe `payment_intent` not captured until user clicks “Approve”
- [ ] Canceling order voids the hold and changes order status
- [ ] Saved cards show only last4, expiration, and brand
- [ ] Feedback form shows after proof approval or report delivery
- [ ] Audit log entries created for rollback, proof events, card saves
- [ ] Only proof approver triggers capture — test RLS access controls
- [ ] Notifications match proof status changes and skipped enrichment
- [ ] Rollback UI diff viewer shows field-level before/after

---

## 6. CI/CD Integration

### GitHub Actions:
Runs on push or PR to `main`:
```bash
npm run lint
npm run typecheck
npm run test
npm run cypress:run
```

Required:
- Lint success
- Zero TypeScript errors
- Jest pass (90%+ line coverage on logic-heavy modules)
- All Cypress flows must complete with success and screenshots

---

## 7. Bug Severity & SLA

| Severity | Description                                      | SLA          |
|----------|--------------------------------------------------|---------------|
| Critical | Data loss, payment misfire, proof loss           | < 12 hours    |
| High     | Stripe capture fails, rollback or proof blocked  | < 24 hours    |
| Medium   | Scheduled report fails, webhook retry missing    | < 72 hours    |
| Low      | Cosmetic UI bugs, copy or layout drift           | Next backlog  |

---

## 8. QA Enhancements in Progress

- Screenshot regression tracking for proof annotations
- Field change snapshot diffs via visual viewer
- Stripe hold timeout simulation for ghosted orders
- Campaign delivery simulation: staged drop logic
- Webhook spam/throttle protection testing
- Report recurrence tracking + edge case scheduler tests

---

## Contact

For QA coverage questions, test data access, or reporting a regression:  
support@yellowlettershop.com