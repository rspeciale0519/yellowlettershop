# Product Requirements Document (PRD)

_Last Updated: April 2025_

## Project: Yellow Letter Shop (YLS) Web Platform

Yellow Letter Shop (YLS) is a SaaS platform that empowers real estate investors, agencies, and small businesses to launch, manage, and optimize direct mail campaigns using address-verified, fully personalized printed letters and postcards. The platform includes a customizable design engine, mailing list upload and validation, deduplication, skip tracing, payment and fulfillment workflows, team access, automation features, and a flexible multi-type vendor management system.

---

## 1. Target Audience

- Real estate investors and agents  
- Small to medium-sized business owners  
- Marketing agencies  
- Sales professionals

---

## 2. Problem Statement

Manually managing, designing, skip tracing, and sending personalized direct mail is time-consuming, error-prone, and lacks scalable automation. Businesses lack an integrated, no-code tool to manage mailing lists, perform skip tracing, customize templates, validate addresses, place print orders, track campaign performance, and manage multiple types of external vendors effectively.

---

## 3. Core Objectives

- Upload and validate mailing lists with address deduplication
- Customize direct mail templates with dynamic personalization
- Visualize designs using a live editor
- Process payments and manage orders with status tracking
- Offer automation tools for recurring campaigns
- Enable skip tracing on-demand with order lifecycle support
- Support admin oversight, impersonation, and team collaboration
- Expose internal and external APIs for CRM integration
- Enable a seamless third-party print and skip tracing fulfillment workflow
- Allow customers to review proofs and mailing list data before production
- Provide proof annotation and threaded commenting functionality during review
- Track and manage multiple third-party vendors by type (e.g., print, skip tracing, data enrichment)
- Allow admin to choose fulfillment route (in-house or vendor) for each order
- Store vendor-specific wholesale pricing, service types, and performance metrics

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
- Deduplication logic (exact match on configurable fields)
- Validation via AccuZIP API
- Records stored in Supabase with per-user access control

### C. Skip Tracing
- User can select one, multiple, or all records for skip tracing
- Exported records limited to required fields (name/address) for external processing
- Trigger creation of a skip tracing order with associated price
- Payment must be completed before processing begins (via Stripe)
- Upon payment, user is notified of a 24-hour processing window
- Skip tracing request emailed to selected skip tracing vendor with attached CSV
- Service replies via email with enriched CSV containing phone/email data
- Inbound email is parsed and enriched records matched and imported into user's MLM
- User receives in-app and email notification once skip tracing is complete
- System audit logs track each action in skip trace lifecycle

### D. Template Management
- Browse pre-made industry templates
- Favorite, duplicate, and organize templates
- Customize templates using Fancy Product Designer (FPD)
- Insert dynamic fields using tokens (e.g., {{first_name}})
- Template versioning and autosave
- Support for design previews and front/back layout

### E. Print Order Wizard
- Step-based flow: select template → upload list → customize design → deduplicate/validate → confirm → checkout
- Show dynamic pricing based on volume and features
- Stripe checkout integration with funds authorization
- Confirmation, receipt, and status tracking
- Orders enter "awaiting_admin_review" state post-submission
- Admin is notified and must select fulfillment route
- Optional timeout mechanism to auto-route order to fallback method if no action is taken
- Toggle to enable/disable auto-routing available in admin settings
- Admin can manually select vendor from the list if third-party fulfillment is chosen

### F. Vendor Management System (Generalized)
- Support for multiple vendor types: `print`, `skip_tracing`, `data_enrichment`, `other`
- Unified admin-accessible vendor directory with filtering by `vendor_type`
- Store vendor name, contact details, services offered, and pricing tiers
- Track turnaround time, shipping costs, minimum order quantity, quality rating, and error incidents
- Maintain historical pricing records and contract terms
- Define tiered pricing per vendor per product/service (e.g., 4x6_postcard, owner_lookup)
- Monitor delivery performance and assign internal notes and tags
- Use in fulfillment routing for both print and skip tracing orders
- Vendor selection and assignment actions are logged and auditable

### G. Proof Annotation & Commenting System
- Customer can annotate specific areas of proof PDF using overlay markers
- Annotations are location-aware with X/Y coordinates and page tracking
- Each annotation supports threaded replies
- Sidebar displays full list of comments with timestamps
- Admins and support team can reply or resolve threads
- Annotations stored in a dedicated table, tied to order ID and proof file
- All proof comments become part of the communication history

### H. AI Personalization
- Toggle to enable AI-generated message content
- Use OpenAI/Claude to generate variations based on template, tone, and mailing list fields
- Limit usage by subscription tier

### I. Automation Engine
- Multi-touch campaign builder (schedule recurring or step-based sequences)
- Link templates to stages with delays
- Queue generation and processing for each run

### J. Admin Tools
- View and manage users, impersonate sessions, audit logs
- Manage support tickets
- Toggle platform-wide flags (AI access, marketplace, automation)
- Approve and feature templates from external creators
- Select and assign vendor for print or skip tracing orders
- Upload proofs manually when needed
- View order communications, annotations, and skip tracing logs
- Toggle time-based fallback fulfillment system

### K. Support System
- Internal ticketing system
- Users submit help requests and view replies
- Admin/staff assign and reply via dashboard
- All updates logged with visibility filters

### L. Reporting & Analytics
- Export mailing list stats, campaign performance, and revenue
- Schedule reports for recurring delivery
- View analytics per campaign, template, vendor, automation sequence, and skip tracing usage

---

## 5. Technical Requirements

- Stack: Next.js, React, TypeScript, Tailwind CSS
- Backend: Supabase (Auth, DB, Storage), Node API routes
- Payment: Stripe
- File storage: AWS S3 via Supabase
- Print design: Fancy Product Designer (FPD)
- AI provider: OpenAI or Anthropic (optional prompt injection layer)
- PDF annotation: PDF.js or React PDF viewer with annotation overlay support
- Email parsing: Inbound email automation service (e.g., SendGrid Inbound Parse, Mailgun Routes)
- Vendor management: Internal Supabase table with `vendor_type` field and shared service model
- Skip tracing vendor support: email-based request + inbound CSV processing pipeline

---

## 6. Success Metrics

- Proof review and approval rate without manual admin intervention
- Turnaround time from order placement to final proof approval
- Skip tracing turnaround time and enrichment rate
- Drop-off reduction at proof approval and skip tracing stages
- Increased usage of cost-effective vendor routes
- Vendor reliability measured via tracked incidents and SLA performance
- Accuracy of vendor cost tracking and pricing logic alignment

---

## 7. Milestone Phases

### Phase 1: MVP
- Auth, mailing list upload, template editor, order flow

### Phase 2: Core Expansion
- AI personalization, automation, Stripe plans, analytics

### Phase 3: Advanced Fulfillment
- Multi-vendor printer routing with admin-controlled review
- Automated proof cycle with email ingestion
- Annotation and threaded commenting system
- Approve / request changes / cancel workflow
- Unified order communication history for admin + customer
- Vendor management module with pricing and performance tracking

### Phase 4: Skip Tracing & Vendor System Upgrade
- Record selection interface within MLM for skip tracing
- Skip tracing order creation and Stripe payment enforcement
- Email dispatch and CSV tracking to/from skip tracing vendor
- Inbound email webhook parsing and enriched data import
- Notification system and audit log support for all skip trace actions
- Generalized vendor architecture with support for multiple vendor types

---

## 8. Contact

For questions related to this PRD or product strategy:  
product@yellowlettershop.com

