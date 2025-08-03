# Changelog

_Last Updated: April 2025_

This document tracks major feature launches, architecture changes, and system enhancements across the Yellow Letter Shop (YLS) platform. Entries are listed by version and include updates related to analytics, proofing, AI, skip tracing, webhooks, feedback, team collaboration, rollback tooling, and scheduled reports.

---

## Version 1.6 — Feedback, Webhooks, Rollback Enhancements, Team Collaboration
**Date:** April 2025

### New Features
- **Feedback System**
  - Post-approval NPS prompt with optional comments
  - Feedback table for admin view with export
  - Alert routing for scores ≤ 6

- **Webhook Engine**
  - User-defined webhook endpoints
  - Events: order placed, proof approved, skip trace completed, short link clicked
  - Retry UI, JSON logs, filtering, delivery logs export

- **Rollback System**
  - Snapshot preview before action
  - Rollback by tag group or full list
  - Change logs now include campaign and enrichment metadata

- **Team Collaboration**
  - Invite system, plan enforcement, multi-user access
  - Shared access to lists, designs, proofs, and reports
  - Audit logging of member joins/leaves

### Enhancements
- Added `feedback`, `webhook_logs`, and `team_members` tables
- Global search updated to include team and webhook logs
- Rollback UI supports bulk restoration with confirmation
- Scheduled reports: additional admin-only delivery controls
- New audit log events: feedback submitted, webhook retried, team joined

---

## Version 1.5 — Analytics & Reporting Dashboards + Report Builder
**Date:** April 2025

### New Features
- **User Dashboard (Login Homepage)**
  - Visual KPIs: Orders, Spend, Campaigns, Short Links, AI Use
  - Recent order activity and charted trends

- **Admin Dashboard**
  - Global KPIs: Revenue, MRR, Skip Trace Volume, Vendor Stats
  - Heatmaps for short link clicks, leaderboard for usage

- **Report Builder**
  - User-accessible and admin-only report types
  - Filter by timeframe, vendor, campaign, template
  - CSV, PDF, Excel export
  - Schedule recurring reports with CRON-like flexibility

- **Saved Reports & Scheduler**
  - Saved report templates (user or global)
  - Logs tied to `audit_logs` and delivery status

### Data Model Updates
- `saved_reports`, `scheduled_reports` tables
- Added filter config support (JSONB) to enable advanced reporting
- Extended short link and campaign schema to support analytics queries

### API Updates
- `GET /api/analytics/overview`, `GET /api/analytics/admin-overview`
- `POST /api/reports/generate`, `POST /api/reports/schedule`
- `GET /api/reports/scheduled`, `PATCH`, `DELETE`

### QA & Testing
- Full Cypress test coverage for dashboards and reports
- Load testing on analytics queries
- Visual QA on graphs and exports

---

## Version 1.4 — Contact Cards, Mailing & Campaign Options, Deduplication Toggle
**Date:** April 2025

### New Features
- **Contact Card System**
  - Created per user with plan-based limits
  - Required for every campaign
  - Shown during design preview

- **Mailing Options**
  - Full service, print + ship, or print only
  - Shipping cost calculated by weight

- **Campaign Options**
  - Split campaign drop scheduling
  - Repeat logic (w/ or w/o split mode)

- **Deduplication Toggle**
  - User preference stored for future uploads
  - Option presented before validation

### Data Model Updates
- `contact_cards` table
- Added `contact_card_id`, `mailing_option`, `campaign_options` to `orders`

---

## Version 1.3 — Skip Tracing System & Vendor Framework
**Date:** April 2025

### New Features
- **Skip Tracing**
  - Export record subset to vendor
  - Inbound CSV enrichment with auto-map + import
  - Status lifecycle UI and record-level trace status

- **Vendor Architecture**
  - Multi-type (`print`, `skip_tracing`, `enrichment`)
  - Admin UI for pricing, fallback logic, delivery stats

### Data Model Updates
- `skip_trace_orders`, `vendors`, `vendor_pricing` tables
- Extended `mailing_list_records` with trace flags and enriched data

### API Updates
- Create skip trace job, receive vendor file via webhook
- Audit logging for vendor routing and enrichment

---

## Version 1.2 — Vendor Management & Fulfillment Routing
**Date:** April 2025

### New Features
- Admin-controlled vendor directory
- Fallback routing system if no vendor assigned manually
- Audit log of fulfillment assignment per order

### QA & Testing
- Cypress coverage for routing logic
- Admin UI for vendor CRUD

---

## Version 1.1 — Proof Review and Stripe Capture Logic
**Date:** April 2025

### New Features
- Proof UI for PDF file review
- Threaded annotation system
- Stripe funds held at checkout, captured on approval
- Approval → printing → shipped order lifecycle

---

## Version 1.0 — Initial Public Release
**Date:** April 2025

### Core Platform
- Order wizard with Stripe checkout
- Fancy Product Designer integration
- Mailing list upload, mapping, validation, deduplication
- Admin impersonation and override tools
- Vendor routing and order management
- AI content generation for personalization
- Short URL tracking engine with redirect logging

---

## Roadmap

Planned enhancements:
- AI proof summarization
- Template performance reports
- Custom landing page editor
- Archived list retention policy
- Webhook signing key and replay tool

---

For release coordination or build questions:  
support@yellowlettershop.com

