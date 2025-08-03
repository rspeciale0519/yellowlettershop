# Product Requirements Document (PRD)

*Last Updated: April 2025*

## Project: Yellow Letter Shop (YLS) Web Platform

Yellow Letter Shop (YLS) is a SaaS platform that empowers real estate investors, agencies, and small businesses to launch, manage, and optimize direct mail campaigns using address-verified, fully personalized printed letters and postcards. The platform includes a customizable design engine, mailing list upload and validation, deduplication, skip tracing, payment and fulfillment workflows, team access, automation features, contact card management, recipient tracking, bulk rollback, contextual AI help, analytics and reporting dashboards, and a flexible multi-type vendor management system.

---

## 1. Target Audience

- Real estate investors and agents
- Small to medium-sized business owners
- Marketing agencies
- Sales professionals

---

## 2. Problem Statement

Manually managing, designing, skip tracing, and sending personalized direct mail is time-consuming, error-prone, and lacks scalable automation. Businesses lack an integrated, no-code tool to manage mailing lists, perform skip tracing, customize templates, validate addresses, track engagement, generate reports, manage contact information, reverse bulk changes, and oversee multiple types of external vendors effectively.

---

## 3. Core Objectives

- Upload and validate mailing lists with address deduplication and configurable defaults
- Customize direct mail templates with dynamic personalization
- Visualize designs using a live editor with contact info integration
- Process payments and manage orders with status tracking
- Offer automation tools for recurring and split campaigns
- Enable skip tracing on-demand with order lifecycle support
- Provide full analytics and reporting dashboards for users and admins
- Support admin oversight, impersonation, and team collaboration
- Expose internal and external APIs for CRM integration
- Enable a seamless third-party print and skip tracing fulfillment workflow
- Allow customers to review proofs and mailing list data before production
- Provide proof annotation and threaded commenting functionality during review
- Track and manage multiple third-party vendors by type (e.g., print, skip tracing, data enrichment)
- Allow admin to choose fulfillment route (in-house or vendor) for each order
- Manage contact cards and apply a selected card to each campaign
- Store vendor-specific wholesale pricing, service types, and performance metrics
- Track per-recipient response using short, human-friendly tracking URLs
- Provide rollback capability for updated records and list segments
- Deliver contextual AI help during order wizard and campaign setup workflows
- Lock design at checkout and enforce no-refund disclaimer

---

## 4. Feature Summary

### A. User Management

- Role-based permissions (admin, manager, user, client)
- Supabase Auth integration with JWT tokens
- Support for OAuth (Google)
- Impersonation and team-based sharing

### B. Mailing List System

- Upload support for CSV, XLS, XLSX
- Required fields: first_name, last_name, address, city, state, zip
- Auto-column mapping and manual field matching
- Deduplication toggle shown during upload (before validation)
- Global user-level setting to enable deduplication by default
- Validation via AccuZIP API
- Records stored in Supabase with per-user access control
- Support for short URL generation per record for website tracking
- Change log and rollback option for individual or grouped records

### C. Contact Cards

- Users can create, manage, and delete Contact Cards
- Pro plan: max of 2 contact cards
- Team and Enterprise plans: limit based on number of users in the account
- One contact card required per campaign
- Preview of contact card fields during template design

### D. Skip Tracing

- Record selection for tracing (single, batch, or all)
- Export limited fields to skip trace vendors
- Stripe-enforced pre-payment and pricing logic
- Vendor CSV delivery (email outbound)
- Inbound enriched CSV parsing and auto-import
- Full audit tracking, user notifications, and lifecycle status

### E. Template Management

- Browse, duplicate, and customize pre-built templates
- Dynamic field tokens (e.g., {{first_name}})
- Versioning and autosave
- Support for design previews (front/back)
- Live preview displays selected contact card

### F. Print Order Wizard

- Multi-step flow:
  1. Select template
  2. Upload list
  3. Toggle deduplication
  4. Map fields
  5. Validate list
  6. Customize design
  7. Select contact card
  8. Set mailing options
  9. Configure campaign options
  10. Final review with confirmation and disclaimer
  11. Checkout

- Design Locking & Confirmation:
  - Final screen before payment explicitly states that once payment is made:
    - The design and mailing list are locked
    - No further changes can be made
    - There are no refunds after payment
  - Checkbox required to acknowledge terms before proceeding

### G. Mailing Options

- Option A: Full mailing service (with postage type + stamp/indicia)
- Option B: Print + process + ship (with or without First Class live stamps)
- Option C: Print only, shipped unprocessed
- Automatic calculation of shipping/handling fees

### H. Campaign Options

- Split Campaign: Define drops and intervals (e.g., 4 drops, 1 per week)
- Repeat Campaign:
  - With Split: repeat count only
  - Without Split: repeat count and interval required
- Locked templates and contact cards for consistent sequencing

### I. Vendor Management System

- Multi-type vendor framework (print, skip tracing, enrichment, other)
- Admin-only directory with vendor CRUD
- Performance metrics and pricing tier tracking
- Historical pricing logs and contract notes
- Assignment tracking and audit visibility

### J. Proof Annotation & Commenting

- Inline annotations with page and coordinate tracking
- Threaded replies and resolution states
- Sidebar comment view
- Admin access and audit log visibility

### K. AI Personalization

- Toggle for AI-generated content
- Prompt templates with token injection
- Usage limits based on subscription tier

### L. Automation Engine

- Multi-step campaign builder with automation flows
- Scheduled queue for each drop
- Logging and error handling for each execution

### M. Support System

- Internal ticket submission and tracking
- SLA-based priority tagging and admin triage tools

### N. AI-Powered Contextual Help

- Help prompts shown based on UI context (e.g., during template editing or mailing option selection)
- Tooltip and sidebar integration for FAQ access
- Indexed links to documentation and best practices

### O. Reporting & Analytics Module

- Dashboard displays visual KPIs for users and admins
- Includes graphs, charts, and activity feeds (e.g., order volume, spend trends, engagement rate)
- Full-featured report builder with:
  - Report type selection
  - Timeframe filters and presets
  - Export formats (CSV, PDF, Excel)
  - Delivery options (download, email, scheduled recurring)
- Short link engagement metrics with geographic/time insights
- Skip trace success rates and vendor usage metrics
- Campaign results and scheduled drop calendar
- Saved report templates and recurring report delivery engine
- Admin dashboard includes platform-wide stats, user activity, vendor performance, and fulfillment logs

### P. Tracking Short URLs (Recipient-Level Engagement)

- Generate short tracking links tied to each recipient
- Links displayed on physical mail for manual entry
- Short link redirects log timestamp, IP, and record ID
- Optional smart redirects (e.g., campaign landing page)
- Per-campaign performance metrics available

### Q. Rollback System

- Track all edits/overwrites on mailing list records
- UI for user to rollback entire list, individual record, or tagged segment
- Audit log and record version comparison

---

## 5. Technical Requirements

- Stack: Next.js, React, TypeScript, Tailwind CSS
- Backend: Supabase (Auth, DB, Storage), Node API routes
- Payment: Stripe
- File storage: AWS S3 via Supabase
- Print design: Fancy Product Designer (FPD)
- AI provider: OpenAI or Anthropic
- Email parsing: SendGrid Inbound Parse or Mailgun Routes
- Vendor Management: Unified Supabase schema with `vendor_type` field
- Tracking: Short URL redirect handler with analytics logging
- Charting Library: Recharts or ApexCharts for KPI visualizations
- Reporting Output: CSV, PDF, Excel via scheduled delivery and download

---

## 6. Success Metrics

- Proof approval rate with no admin involvement
- Campaign completion rate and skip trace turnaround
- Percentage of users enabling AI help and short links
- Rollback usage frequency and support ticket reduction
- Attribution visibility via short URL engagement tracking
- Decline in order cancellations or support complaints post design-lock
- Increase in repeat/split campaign usage
- Template design error rate drop from contextual help
- User dashboard usage and report generation frequency
- Admin dashboard coverage and vendor performance insights

---

## 7. Milestone Phases

### Phase 1: MVP
- Auth, mailing list upload, template editor, order flow

### Phase 2: Core Expansion
- AI personalization, automation, Stripe plans, analytics dashboard (user-facing)

### Phase 3: Advanced Fulfillment
- Multi-vendor routing, proof review, annotations, order approval

### Phase 4: Skip Tracing & Campaign System Upgrade
- Skip trace integration, contact card preview, campaign logic

### Phase 5: Enhanced Tracking, Rollback, AI Help, Admin Dashboard
- Short link system with tracking analytics
- Rollback UI and change log audit trail
- Design lock modal with refund disclaimer
- Contextual AI assistant help layer
- Admin dashboard and report builder with global scope

---

## 8. Contact

For product or spec questions:
support@yellowlettershop.com