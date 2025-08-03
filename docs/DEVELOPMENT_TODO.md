# Development To-Do List (Expanded)

*Last Updated: April 2025*

This document tracks all detailed tasks and subtasks required to fully implement the Yellow Letter Shop (YLS) platform. All tasks include checkboxes for completion tracking. 

---

## 1. Authentication & User Roles

- [x] 1.1 Secure cookies with `SameSite`, `HttpOnly`
- [x] 1.2 Role enforcement
  - [x] 1.2.1 Admin, Manager, User logic
- [x] 1.3 Impersonation control
  - [x] 1.3.1 Admin-only impersonation with audit logs
- [ ] 1.4 Team system
  - [ ] 1.4.1 Team invite UI
  - [ ] 1.4.2 Accept/revoke invitations
  - [ ] 1.4.3 Plan tier user limit enforcement
  - [ ] 1.4.4 Grace period downgrade logic

## 2. Mailing List Management

- [x] 2.1 Upload interface
  - [x] 2.1.1 Drag/drop CSV/XLSX
  - [x] 2.1.2 Auto-map + manual field mapper
- [x] 2.2 Deduplication logic
  - [ ] 2.2.1 Deduplication toggle per upload
  - [ ] 2.2.2 Save user default preference
- [ ] 2.3 Address validation via AccuZIP
- [ ] 2.4 Per-field change tracking
  - [ ] 2.4.1 Store diffs in `record_field_changes`
  - [ ] 2.4.2 Visual diff viewer in UI
- [ ] 2.5 Rollback logic
  - [ ] 2.5.1 By field, record, tag group, or full list
  - [ ] 2.5.2 Non-destructive rollback with audit logs
- [x] 2.6 Archival support
  - [ ] 2.6.1 Auto-archive lists older than 12 months
  - [ ] 2.6.2 Manual archive toggle
- [x] 2.7 List export
  - [ ] 2.7.1 Export clean or enriched list CSV

## 3. Contact Cards

- [ ] 3.1 CRUD interface
  - [ ] 3.1.1 Create, edit, delete contact cards
- [ ] 3.2 Plan-based limits
  - [ ] 3.2.1 Enforce contact card limits by plan tier

## 4. Proof Management

- [ ] 4.1 Proof upload, annotation, approval, audit
- [ ] 4.2 Refund/cancel logic
  - [ ] 4.2.1 Audit log on refund/cancel

## 5. Campaign Tracking

- [ ] 5.1 Campaign dashboard UI
- [ ] 5.2 Short URL generation (e.g. `yls.to/xyz123`)
- [ ] 5.3 Log clicks: timestamp, IP, user agent
- [ ] 5.4 Aggregate analytics per campaign
  - [ ] 5.4.1 Heatmap view
  - [ ] 5.4.2 Time series view

## 6. Feedback Engine

- [ ] 6.1 Trigger NPS prompt after proof/report
- [ ] 6.2 Store score + optional comment
- [ ] 6.3 Alert on NPS < 6
- [ ] 6.4 Aggregate stats in admin view

## 7. Analytics & Reporting

- [x] 7.1 KPI dashboards for users/admins
- [ ] 7.2 Report builder
  - [ ] 7.2.1 Select report type
  - [ ] 7.2.2 Filters: time, campaign, vendor, user
  - [ ] 7.2.3 Format selector: CSV, PDF, Excel
- [ ] 7.3 Saved report templates
- [ ] 7.4 Schedule recurring reports
  - [ ] 7.4.1 Daily, weekly, monthly
  - [ ] 7.4.2 Supabase CRON trigger
- [ ] 7.5 Report delivery logs

## 8. Webhooks

- [ ] 8.1 Register endpoints
- [ ] 8.2 Supported events: order placed, proof approved, etc.
- [ ] 8.3 Delivery log viewer with retries
- [ ] 8.4 Export logs to CSV/JSON

## 9. Audit Logging

- [ ] 9.1 Track all actions
  - [ ] 9.1.1 Uploads, proofs, payments, rollback, webhooks, team
- [ ] 9.2 UI log viewer (admin & user-scope)
- [ ] 9.3 Store full payload context

## 10. Notifications & Email

- [ ] 10.1 Email notifications for:
  - [ ] 10.1.1 Proof uploaded
  - [ ] 10.1.2 Skip trace complete
  - [ ] 10.1.3 Team invite
  - [ ] 10.1.4 Failed webhook
  - [ ] 10.1.5 Low NPS
- [ ] 10.2 Honor account-level preferences

## 11. CI/CD, QA, Launch

- [x] 11.1 GitHub Actions Pipeline
  - [x] 11.1.1 `npm run lint`
  - [x] 11.1.2 `npm run typecheck`
  - [x] 11.1.3 `npm run test`
  - [ ] 11.1.4 `npm run cypress:run`
  - [ ] 11.1.5 `npm run build`
- [x] 11.2 Cypress E2E flows
  - [ ] 11.2.1 Upload → Proof → Payment → Rollback
  - [ ] 11.2.2 Annotation thread → Approval → Report Export
  - [ ] 11.2.3 Webhook retry → Short link tracking
- [x] 11.3 Manual QA checklist
  - [x] 11.3.1 Stripe approval logic
  - [x] 11.3.2 Impersonation controls
  - [x] 11.3.3 Rollback visual diffs
  - [x] 11.3.4 RLS permission tests
- [ ] 11.4 Export compliance validation
  - [ ] 11.4.1 Right-to-be-forgotten
  - [ ] 11.4.2 PII audit trace

---

## Contact

For engineering or implementation questions:  
support@yellowlettershop.com
