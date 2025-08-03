# Changelog

_Last Updated: April 2025_

This document tracks major feature launches, architecture changes, and system enhancements across the Yellow Letter Shop (YLS) platform. All entries are logged by version, with date and categorized by functional area.

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

## Future Roadmap (v1.3 and beyond)
- White-label mode and custom branding per tenant
- Campaign scheduling calendars
- Real-time annotation collaboration (deferred from v1.2)
- AI proof analysis and summarization
- Public API for order submission and webhook-based integration
- GraphQL gateway for enterprise plans

---

All version changes are coordinated through the internal Notion roadmap and reflected here upon release.

For engineering release coordination or CI versioning policies, contact: devteam@yellowlettershop.com