# Changelog

_Last Updated: April 2025_

This document tracks major feature launches, architecture changes, and system enhancements across the Yellow Letter Shop (YLS) platform. All entries are logged by version, with date and categorized by functional area.

---

## Version 1.3 — Skip Tracing System & Generalized Vendor Architecture
**Date:** April 2025

### New Features
- Skip tracing pipeline allowing users to select one, multiple, or all records for enrichment
- Skip trace order creation and pricing with pre-payment required via Stripe
- Outbound email integration for skip trace CSV delivery to vendor
- Inbound email parsing system to auto-import enriched records
- Record-level tracking of skip trace status: `not_requested`, `pending`, `enriched`, `failed`
- Skip trace results linked to original mailing list records
- Full skip tracing lifecycle with audit logs, user notifications, and admin override options

### Vendor Management Upgrade
- Unified vendor management framework supporting multiple vendor types:
  - `print`, `skip_tracing`, `data_enrichment`, `other`
- Admin interface supports vendor CRUD, pricing tiers, and performance metrics
- Fulfillment and skip tracing orders both routed via vendor selection interface
- Vendors can now be filtered by type and managed from a single control panel

### Data Model Updates
- New table: `skip_trace_orders`
- `mailing_list_records` updated with `skip_trace_status` and `enriched_data` JSONB field
- `vendors` table extended with `vendor_type` enum
- `vendor_pricing` supports new product types (e.g., `owner_lookup`)

### Admin Tools
- Skip tracing status dashboard for tracking order progress
- Manual import option for enriched files and error resolution
- Vendor-level insights showing usage, performance, and reliability per type

### QA & Testing
- Cypress coverage for skip tracing flows and vendor filtering
- End-to-end tests for CSV delivery → vendor reply → import
- Manual QA for edge case handling: invalid files, missed order IDs, failed enrichments

---

## Version 1.2 — Vendor Management & Fulfillment Routing Upgrade
**Date:** April 2025

### New Features
- Full vendor management module with admin UI
- Ability to track wholesale prices by vendor and service/product
- Admin-controlled fulfillment routing with vendor selection interface
- Time-based fallback fulfillment system with admin-configurable toggle
- Automatic order pause at `awaiting_admin_review` status
- Order routing history now stored and visible in admin panel
- Admin notification system for new order review events
- Enhanced reporting tools to filter by vendor, cost, and fulfillment metrics
- New API endpoints for vendor CRUD, vendor pricing, and fulfillment method updates
- All third-party fulfillment logic refactored to support multi-vendor routing

### Data Model Updates
- New tables: `vendors`, `vendor_pricing`
- `orders` table updated with `vendor_id`, `fulfillment_method`, `status = awaiting_admin_review`
- Audit trail expanded to include fulfillment routing decisions and vendor selections

### Admin Tools
- Admin UI to enable/disable auto-routing fallback feature
- Vendor list view with performance stats, cost data, and status toggles
- Vendor pricing editor with tiered pricing breakdowns per product type

### Notifications
- Admins receive real-time email and in-app notifications for orders requiring review
- Optional fallback alert notifications before routing timeout triggers

### QA & Testing
- New Cypress tests for vendor assignment, routing logic, and timeout handling
- Manual QA procedures for multi-vendor workflows
- Test coverage added for admin toggle and vendor API endpoints

---

## Version 1.1 — Fulfillment & Proof Review Upgrade
**Date:** April 2025

### New Features
- Third-party printer support for MBI Print Services
- Fulfillment method toggle (admin-controlled) on all orders
- Automated email dispatch of proofs and mailing list to MBI
- Inbound email parser integration for receiving revised proofs
- Proof review interface for customers with embedded PDF viewer
- Inline annotation system with coordinate-based comments
- Threaded replies on all proof annotations
- Approve / Request Changes / Cancel Order buttons with workflow gating
- Stripe fund hold and capture/release flow integrated with approval actions
- Order communication history log (customer + admin views)
- Admin manual override tools for proofs and status updates

### API Enhancements
- New endpoints for annotations, threaded replies, and proof approval actions
- Fulfillment method routing endpoint for admin
- Email event listeners for automated file ingestion
- Expanded order status values to cover full MBI review lifecycle

### Data Model Updates
- New tables: `order_proofs`, `proof_annotations`, `proof_annotation_replies`
- New fields: `fulfillment_method`, `status` on orders
- Annotation coordinates stored as relative X/Y with page references
- Enhanced audit logging on proof interaction events

---

## Version 1.0 — Initial Public Release
**Date:** April 2025

### Core Features
- Direct mail order wizard: validation, preview, Stripe checkout
- Mailing list uploader with column mapping, deduplication, AccuZIP verification
- Dynamic template customization via Fancy Product Designer
- Personalization token system (e.g., {{first_name}})
- Design preview rendering with live mailing list data
- Order tracking dashboard (customer + admin views)
- Role-based permissions (admin, manager, user, client)
- Team collaboration (Enterprise tier)
- AI personalization engine and prompt configuration
- Multi-touch direct mail automation workflows
- Affiliate tracking system with referral links
- Stripe billing with plan-based access tiers
- Internal support ticketing system with SLA tagging

### Platform Services
- Supabase DB, Auth, and Storage
- Vercel hosting with GitHub Actions CI pipeline
- Stripe webhook lifecycle (checkout, invoice, failed)
- Audit logs for sensitive actions and impersonation sessions

---

## Future Roadmap (v1.4 and beyond)
- White-label mode and custom branding per tenant
- Campaign scheduling calendars
- Real-time annotation collaboration
- AI proof analysis and summarization
- Public API for order submission and webhook-based integration
- Smart vendor assignment engine with geographic targeting
- Dedicated enrichment pipeline for deed and contact intelligence
- GraphQL gateway for enterprise plans

---

For engineering release coordination or CI versioning policies, contact: devteam@yellowlettershop.com