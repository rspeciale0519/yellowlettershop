# Changelog

_Last Updated: April 2025_

This document tracks major feature launches, architecture changes, and system enhancements across the Yellow Letter Shop (YLS) platform. All entries are logged by version, with date and categorized by functional area.

---

## Version 1.5 — Analytics & Reporting Dashboards + Report Builder
**Date:** April 2025

### New Features
- **User Dashboard (Login Homepage)**
  - Visual KPIs: Total Orders, Spend, Campaigns, AI Use, Short Link Engagement
  - Bar and line charts for order volume, campaign activity, and short link clicks
  - Recent order summaries and click activity feed

- **Admin Dashboard**
  - Platform-wide KPIs: Total Revenue, MRR, Vendor Stats, User Activity
  - Charts for usage trends, vendor reliability, short link heatmaps
  - Leaderboards and failed job summaries

- **Report Builder**
  - User report types: Orders, Skip Tracing, Campaign Performance, Short Links, Spending, AI Usage
  - Admin-only reports: Revenue, Fulfillment Logs, Vendor Stats, User Activity
  - Filter by timeframes, campaigns, templates, vendors, and more
  - Export as CSV, PDF, Excel
  - Schedule recurring delivery: daily, weekly, monthly

- **Saved Reports & Recurring Scheduler**
  - Create and reuse saved report templates
  - View/edit scheduled reports with next run and status
  - Logs added to audit history and delivery monitoring

### Data Model Updates
- New tables: `saved_reports`, `scheduled_reports`
- Extended short link, campaign, and order schema to support analytical queries
- Added JSONB filters field to enable flexible report configurations

### API Updates
- New endpoints:
  - `GET /api/analytics/overview`, `GET /api/analytics/admin-overview`
  - `POST /api/reports/generate`, `POST /api/reports/schedule`
  - `GET /api/reports/scheduled`, `PATCH /api/reports/scheduled/:id`, `DELETE /api/reports/scheduled/:id`

### Admin & UI Enhancements
- New `/dashboard` view for users
- New `/admin/dashboard` view for admins
- Reports menu added to sidebar
- Download, filter, schedule interface for power users
- Email and in-app delivery confirmations for scheduled reports

### QA & Testing
- Full Cypress test coverage for:
  - User and admin dashboards
  - All report types and filters
  - Recurring schedule creation, editing, and cancellation
- Visual testing for chart integrity and filter behavior
- Load testing for historical query stress

---

## Version 1.4 — Contact Cards, Mailing & Campaign Options, Deduplication Toggle
**Date:** April 2025

### New Features
- **Contact Card System**
  - Users can create, edit, and delete contact cards in their dashboard
  - Contact card required for every new order
  - Display of contact card data in live design preview
  - Plan-based limits: Pro = 2 cards, Team/Enterprise = limit matches number of users

- **Mailing Options**
  - Full support for three fulfillment paths
  - Shipping and handling calculated by weight for non-mailed options

- **Campaign Options**
  - Split and repeat campaign logic with UI controls and validation

- **Deduplication Toggle**
  - Enabled during list upload with default setting stored per user

### Data Model Updates
- New table: `contact_cards`
- Orders table: `contact_card_id`, `mailing_option`, `campaign_options`

### API Updates
- Contact cards CRUD
- Mailing list import and validation support deduplication flag

### UI Enhancements
- Template design previews show live contact card injection
- Final review modal updated with disclaimer

### QA & Testing
- Cypress coverage for contact cards, deduplication, campaign logic, mailing configuration

---

## Version 1.3 — Skip Tracing System & Generalized Vendor Architecture
**Date:** April 2025

### New Features
- Skip tracing with vendor delivery and CSV enrichment auto-import
- Status lifecycle: `not_requested`, `pending`, `enriched`, `failed`
- Unified multi-type vendor model (print, skip tracing, enrichment, other)
- Admin UI for pricing tiers, vendor stats, and service toggles

### Data Model Updates
- New table: `skip_trace_orders`
- `mailing_list_records`: skip trace status + enriched data
- `vendors`, `vendor_pricing` schema

### API Enhancements
- New endpoints for skip trace order creation, webhook response, and audit logging

### Admin Tools
- Manual override of enriched records and vendor assignments
- Skip tracing dashboard for active and past jobs

### QA & Testing
- Cypress flow: selection → payment → CSV routing → enrichment → UI integration

---

## Version 1.2 — Vendor Management & Fulfillment Routing Upgrade
**Date:** April 2025

### New Features
- Admin-controlled vendor routing with fallback auto-routing toggle
- Vendor directory with CRUD interface and performance logs
- Vendor-specific fulfillment logic and pricing controls
- Route assignment tracking in audit logs

### QA & Testing
- Cypress test coverage for vendor creation, routing fallback, and audit verification

---

## Version 1.1 — Fulfillment & Proof Review Upgrade
**Date:** April 2025

### New Features
- PDF proof review interface with threaded annotations and status actions
- Stripe fund hold and capture logic tied to proof approval
- Order status gating through approval → printing → shipment lifecycle

---

## Version 1.0 — Initial Public Release
**Date:** April 2025

### Core Features
- Order wizard, Stripe checkout, AccuZIP validation
- Live FPD design editor with personalization tokens
- Mailing list upload, deduplication, contact card preview
- Multi-step campaign configuration with automation options
- Admin override, impersonation, vendor routing, support tickets
- AI personalization toggle with usage limits and prompt templates

---

## Future Roadmap
- Campaign calendar view
- AI-based proof summarization
- Template optimization analytics
- Custom landing page editor for short links
- Expanded admin audit filters and export

---

For engineering release coordination or CI versioning policies, contact:  
support@yellowlettershop.com

