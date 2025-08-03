# Product Requirements Document (PRD)

*Last Updated: April 2025*

## Project: Yellow Letter Shop (YLS) Web Platform

Yellow Letter Shop (YLS) is a SaaS platform designed to help real estate investors, agencies, and small businesses manage direct mail campaigns. The platform includes mailing list upload and validation, deduplication, proof-based order approvals, AI personalization, payment authorization, vendor routing, analytics dashboards, team collaboration, per-field record history, short link engagement tracking, webhook logs, scheduled reports, and saved payment method management.

---

## 1. Target Audience

- Real estate investors
- Real estate agents
- Direct mail agencies
- Small to medium businesses targeting prospects by mail

---

## 2. Problem Statement

Sending personalized direct mail at scale is complicated, often involving multiple systems for validation, design, printing, payment, approval, and tracking. Teams need a way to collaboratively manage these processes, track engagement, handle feedback, and route data intelligently without vendor lock-in.

---

## 3. Core Objectives

- Upload mailing lists and validate via AccuZIP
- Deduplicate records with per-user preference
- Store per-field record history for rollback and auditing
- Customize print templates with tokenized variables
- Approve proofs and annotations before payment is finalized
- Authorize (but do not capture) payment until proof approval
- Cancel orders before approval to release payment holds
- Store and manage payment methods per user account
- Assign and route orders to vendors manually or by fallback logic
- Track user engagement via per-recipient short links
- Generate reports and schedule recurring exports
- Capture user feedback post-order (NPS + comments)
- Provide full role-based team collaboration with shared asset access
- Enforce rollback, auditing, webhook tracking, and system-wide logging

---

## 4. Major Features

### 4.1 Mailing List Upload & Management
- Upload via CSV/XLSX
- Auto-map fields and allow manual mapping
- AccuZIP API for address validation
- User preference for deduplication toggle
- Per-field change tracking (e.g., owner_name updated from John → Jonathan)
- Ability to rollback changes by record, list, or tag

### 4.2 Contact Cards
- Create and manage contact cards
- Limit based on plan tier (e.g., Pro: 2 cards, Team: 1 per user)
- Required for every campaign
- Injected into live template previews

### 4.3 Design & Template Editor
- Fancy Product Designer integration for drag-and-drop layouts
- Token insertion from mailing list and contact card fields
- AI-generated personalization options (OpenAI or Claude)
- Render preview per recipient or as placeholder sample

### 4.4 Proof Review & Approval
- User reviews generated proofs
- Annotate with thread-based comments
- Admin/vendor uploads new revision
- User clicks "Approve" to finalize
- Approval triggers final payment capture
- User may cancel before approval to void authorization

### 4.5 Payment Authorization & Capture
- Stripe `payment_intent` created with `manual` capture method
- Funds are authorized at checkout but not captured
- Approval screen triggers payment capture
- Canceling the order voids the payment hold
- Checkout includes message: "Funds will not be charged until you approve all design proofs"

### 4.6 Stored Payment Methods
- User may store one or more payment methods in Account Settings
- Stripe-managed (PCI-compliant)
- Options to add, remove, or set a default card
- Checkout pre-fills default card for faster ordering

### 4.7 Order Wizard
1. Select template
2. Upload mailing list
3. Map fields & deduplicate
4. Validate addresses
5. Choose contact card
6. Customize template
7. Select mailing options
8. Configure campaign schedule
9. Final screen: disclaimer acknowledgment
10. Submit order (authorize payment)

### 4.8 Campaign Options
- Full service, print + ship, or print only
- Split drop (e.g., 1,000 records over 4 weeks)
- Repeat campaign logic
- Visual campaign calendar UI

### 4.9 Skip Tracing
- Select records to trace
- Send batch to vendor
- Enriched file returned by email
- Auto-import enrichment into records
- Store audit trail of all status transitions

### 4.10 Vendor Management
- Vendor profiles (print, skip trace, enrichment)
- Manual assignment or fallback routing
- SLA enforcement, quality scoring, turnaround metrics
- Audit logs for each routing event

### 4.11 Team Collaboration
- Invite users to a shared workspace
- Set roles (admin, manager, user, client)
- Share access to lists, templates, reports, contact cards
- Enforce role-based UI and action permissions

### 4.12 Short Link Tracking
- Each record has a short link (e.g., `yls.to/abc123`)
- Tracks timestamp, IP, user agent
- Aggregates click data per campaign
- Heatmap and chart support in analytics module

### 4.13 Webhook Management
- Register webhook endpoints
- Subscribe to events (proof approved, order created, etc.)
- View delivery status, retry failed events
- Export logs

### 4.14 Reporting & Analytics
- Dashboards for users and admins
- Scheduled reports (CSV, PDF, Excel)
- Saved report templates
- Admin feedback summary reports
- Audit trail export support

### 4.15 Feedback Collection
- NPS prompt after proof approval or report delivery
- Comments optional
- Scores < 6 trigger alert to support
- Stored in `feedback` table with timestamps

### 4.16 Rollback & Change Logs
- Track all updates with before/after snapshots
- Support per-field rollback
- Record type: created, updated, deleted
- Visible in audit log and change viewer

---

## 5. Role Definitions

| Role   | Description                          |
|--------|--------------------------------------|
| Admin  | Full access to app + impersonation   |
| Manager| Team-level edit + routing controls   |
| User   | Core order, upload, proof features   |

---

## 6. Plan Tiers

| Plan       | Monthly Price | Users | Notes                          |
|------------|---------------|--------|--------------------------------|
| Free       | $0            | 1      | Limited features               |
| Pro        | $49           | 1      | All standard features          |
| Team       | $99           | 3      | Shared access, invite support |
| Enterprise | $499          | 10     | Webhook control, reporting     |

Add-ons:
- $29/user for additional seats (Team or Enterprise)

---

## 7. KPIs and Success Metrics

- Proof approval time (average)
- Short link engagement rate
- Feedback NPS trends
- Scheduled report delivery success
- Webhook delivery success/retry rate
- Skip trace enrichment rate
- Vendor SLA compliance
- Average rollback usage per month

---

## Contact

For product questions or feature clarifications:  
support@yellowlettershop.com

