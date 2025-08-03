# Product Requirements Document (PRD)

_Last Updated: April 2025_

## Project: Yellow Letter Shop (YLS) Web Platform

Yellow Letter Shop (YLS) is a SaaS platform that empowers real estate investors, agencies, and small businesses to launch, manage, and optimize direct mail campaigns using address-verified, fully personalized printed letters and postcards. The platform includes a customizable design engine, mailing list upload and validation, deduplication, payment and fulfillment workflows, team access, automation features, and a vendor management system.

---

## 1. Target Audience

- Real estate investors and agents  
- Small to medium-sized business owners  
- Marketing agencies  
- Sales professionals

---

## 2. Problem Statement

Manually managing, designing, and sending personalized direct mail is time-consuming, error-prone, and lacks scalable automation. Businesses lack an integrated, no-code tool to manage mailing lists, customize templates, validate addresses, place print orders, track campaign performance, and manage external print vendors effectively.

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
- Track and manage multiple third-party print vendors
- Allow admin to choose fulfillment route (in-house or vendor) for each order
- Store vendor-specific wholesale pricing and operational metrics

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
- Orders enter "awaiting_admin_review" state post-submission
- Admin is notified and must select fulfillment route
- Optional timeout mechanism to auto-route order to fallback method if no action is taken
- Toggle to enable/disable auto-routing available in admin settings
- Admin can manually select vendor from the list if third-party fulfillment is chosen

### E. Third-Party Fulfillment (Multi-Vendor System)
- Admin manually chooses from registered vendors when routing to third-party
- Vendors are managed via the vendor management module
- Orders sent to vendor via email (PDF proof + mailing list file)
- Inbound proof revisions are parsed and stored via email webhook
- Customer receives proof to review with annotation and approval options
- All vendor routing decisions are logged
- If auto-routing is enabled, system follows default method after timeout

### F. Vendor Management System
- Admin-accessible vendor directory
- Store vendor name, contact details, services offered
- Record wholesale pricing per service or product (e.g., postcard printing, envelope stuffing)
- Track minimum order quantity, turnaround time, shipping costs, and other operational constraints
- Maintain historical pricing records
- Log vendor performance metrics: on-time delivery rates, quality score, error incidents
- Store contractual terms and payment conditions (Net 30, discounts)
- Assign internal notes and add custom tags
- Used in admin fulfillment routing decision interface
- Enables comparison of cost-effectiveness and operational reliability between vendors

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
- Select and assign print fulfillment vendor
- Upload proofs manually when needed
- View order communications and annotations
- Toggle time-based fallback fulfillment system

### K. Support System
- Internal ticketing system
- Users submit help requests and view replies
- Admin/staff assign and reply via dashboard
- All updates logged with visibility filters

### L. Reporting & Analytics
- Export mailing list stats, campaign performance, and revenue
- Schedule reports for recurring delivery
- View analytics per campaign, template, vendor, and automation sequence

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
- Vendor management: Internal Supabase table + admin interface with CRUD capability

---

## 6. Success Metrics

- Proof review and approval rate without manual admin intervention
- Turnaround time from order placement to final proof approval
- Drop-off reduction at the proof approval stage
- Reduced back-and-forth between customer and printer (tracked by revision count)
- Increased usage of cost-effective vendor routes
- Positive feedback on proof and vendor selection interface usability
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

---

## 8. Contact

For questions related to this PRD or product strategy:  
product@yellowlettershop.com