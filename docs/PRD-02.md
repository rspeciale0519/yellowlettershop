# Product Requirements Document (PRD)

_Last Updated: April 2025_

## Project: Yellow Letter Shop (YLS) Web Platform

Yellow Letter Shop (YLS) is a SaaS platform that empowers real estate investors, agencies, and small businesses to launch, manage, and optimize direct mail campaigns using address-verified, fully personalized printed letters and postcards. The platform includes a customizable design engine, mailing list upload and validation, deduplication, payment and fulfillment workflows, team access, and automation features.

---

## 1. Target Audience

- Real estate investors and agents
- Small to medium-sized business owners
- Marketing agencies
- Sales professionals

---

## 2. Problem Statement

Manually managing, designing, and sending personalized direct mail is time-consuming, error-prone, and lacks scalable automation. Businesses lack an integrated, no-code tool to manage mailing lists, customize templates, validate addresses, place print orders, and track campaign performance.

---

## 3. Core Objectives

- Upload and validate mailing lists with address deduplication
- Customize direct mail templates with dynamic personalization
- Visualize designs using a live editor
- Process payments and manage orders with status tracking
- Offer automation tools for recurring campaigns
- Support admin oversight, impersonation, and team collaboration
- Expose internal and external APIs for CRM integration
- Enable a seamless third-party print fulfillment workflow (e.g., MBI Printing)
- Allow customers to review proofs and mailing list data before production
- Provide proof annotation and threaded commenting functionality during review

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

### C. Template Management
- Browse pre-made industry templates
- Favorite, duplicate, and organize templates
- Customize templates using Fancy Product Designer (FPD)
- Insert dynamic fields using tokens (e.g., {{first_name}})
- Template versioning and autosave
- Support for design previews and front/back layout

### D. Print Order Wizard
- Step-based flow: select template → upload list → customize design → deduplicate/validate → confirm → checkout
- Show dynamic pricing based on volume and features
- Stripe checkout integration with funds authorization
- Confirmation, receipt, and status tracking
- Support for toggling fulfillment method (in-house vs. third-party)
- Admin-controlled fulfillment override

### E. Third-Party Fulfillment (MBI Printing)
- If admin routes order to MBI, system sends email with proof + mailing list attachments or secure file links
- Email is sent from the platform, masked to appear internal
- System watches a designated inbox to auto-ingest proof revisions from MBI
- System stores revised proofs in the order folder and triggers customer review
- Customer receives notification email to review proofs and data
- Customer can:
  - Click **Approve** to finalize and trigger fund capture
  - Click **Request Changes** to submit revision instructions via form
  - Click **Cancel Order** to release held funds and terminate order
- Change requests are sent to MBI via email from the system
- Revisions restart the proof cycle until customer approves or cancels
- All actions are logged in the order communication history

### F. Proof Annotation & Commenting System
- Customer can annotate specific areas of proof PDF using overlay markers
- Annotations are location-aware with X/Y coordinates and page tracking
- Each annotation supports threaded replies
- Sidebar displays full list of comments with timestamps
- Admins and support team can reply or resolve threads
- Annotations stored in a dedicated table, tied to order ID and proof file
- All proof comments become part of the communication history for transparency

### G. AI Personalization
- Toggle to enable AI-generated message content
- Use OpenAI/Claude to generate variations based on template, tone, and mailing list fields
- Limit usage by subscription tier

### H. Automation Engine
- Multi-touch campaign builder (schedule recurring or step-based sequences)
- Link templates to stages with delays
- Queue generation and processing for each run

### I. Admin Tools
- View and manage users, impersonate sessions, audit logs
- Manage support tickets
- Toggle platform-wide flags (AI access, marketplace, automation)
- Approve and feature templates from external creators
- Manually override order fulfillment method and upload revised proofs

### J. Support System
- Internal ticketing system
- Users submit help requests and view replies
- Admin/staff assign and reply via dashboard
- All updates logged with visibility filters

### K. Reporting & Analytics
- Export mailing list stats, campaign performance, and revenue
- Schedule reports for recurring delivery
- View analytics per campaign, template, and automation sequence

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

---

## 6. Success Metrics

- Proof review and approval rate without manual admin intervention
- Turnaround time from order placement to final proof approval
- Drop-off reduction at the proof approval stage
- Reduced back-and-forth between customer and printer (tracked by revision count)
- Positive feedback on proof interface usability
- Zero customer visibility into whether fulfillment is in-house or third-party

---

## 7. Milestone Phases

### Phase 1: MVP
- Auth, mailing list upload, template editor, order flow

### Phase 2: Core Expansion
- AI personalization, automation, Stripe plans, analytics

### Phase 3: Advanced Fulfillment
- Third-party printer routing (MBI)
- Automated proof cycle with email ingestion
- Annotation and threaded commenting system
- Approve / request changes / cancel workflow
- Unified order communication history for admin + customer

---

## 8. Contact

For questions related to this PRD or product strategy:
- product@yellowlettershop.com

