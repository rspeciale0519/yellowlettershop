# Product Requirements Document (PRD)

*Last Updated: April 2025*

## Project: Yellow Letter Shop (YLS) Web Platform

Yellow Letter Shop (YLS) is a SaaS platform that empowers real estate investors, agencies, and small businesses to launch, manage, and optimize direct mail campaigns using address-verified, fully personalized printed letters and postcards. The platform includes a customizable design engine, mailing list upload and validation, deduplication, skip tracing, payment and fulfillment workflows, team access, automation features, contact card management, recipient tracking, feedback collection, rollback, contextual AI help, analytics and reporting dashboards, webhook management, file export, archival tools, and a flexible multi-type vendor management system.

---

## 1. Target Audience

- Real estate investors and agents
- Small to medium-sized business owners
- Marketing agencies
- Sales professionals

---

## 2. Problem Statement

Manually managing, designing, skip tracing, and sending personalized direct mail is time-consuming, error-prone, and lacks scalable automation. Businesses lack an integrated, no-code tool to manage mailing lists, perform skip tracing, customize templates, validate addresses, track engagement, collect user feedback, generate reports, manage contact information, reverse bulk changes, share resources with teams, and oversee multiple types of external vendors effectively.

---

## 3. Core Objectives

- Upload and validate mailing lists with address deduplication and configurable defaults
- Customize direct mail templates with dynamic personalization
- Visualize designs using a live editor with contact info integration
- Process payments and manage orders with status tracking
- Offer automation tools for recurring and split campaigns
- Enable skip tracing on-demand with order lifecycle support
- Provide full analytics and reporting dashboards for users and admins
- Support admin oversight, impersonation, team collaboration, and role-based access
- Expose internal and external APIs with webhook support for CRM integration
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
- Allow users to submit feedback and NPS scores
- Manage recurring data archival and retention
- Support bulk export across core modules
- Provide universal search across records for admin roles
- Allow team collaboration including invite flows and shared access
- Provide users with webhook log dashboards and retry capability
- Support multi-language (i18n) readiness

---

## 4. Feature Summary

### A. User Management

- Role-based permissions (admin, manager, user, client)
- Supabase Auth integration with JWT tokens
- OAuth (Google) support
- Impersonation and team-based sharing
- Invite-based collaboration with team usage tracking
- Team billing enforcement and user role assignment
- Subscription plan downgrade enforcement and grace periods

### B. Mailing List System

- Upload support for CSV, XLS, XLSX
- Required fields: first_name, last_name, address, city, state, zip
- Auto-column mapping and manual field matching
- Deduplication toggle during upload with user default setting
- Validation via AccuZIP API
- Per-record short URL generation for tracking
- Change log and rollback support per record, list, or tag
- Export option for raw or validated records
- Archival tagging for inactive lists after 12 months

### C. Contact Cards

- CRUD support with plan-based limits
- Contact card required per campaign
- Contact card fields shown in live preview
- Limits enforced per plan and number of team members

### D. Skip Tracing

- Batch or selective record tracing
- Vendor CSV delivery with outbound email
- Inbound enriched file parsing and mapping
- Full lifecycle audit logging and pricing logic
- Enrichment stats surfaced in analytics

### E. Template Management

- Dynamic token insertion from mailing list and contact card fields
- User-customized versions stored with version history
- Previews available before checkout

### F. Print Order Wizard

- Step-by-step order flow:
  1. Select template
  2. Upload mailing list
  3. Toggle deduplication
  4. Map fields
  5. Validate
  6. Customize design
  7. Select contact card
  8. Set mailing options
  9. Configure campaign options
  10. Final review + no-refund confirmation
  11. Checkout via Stripe

- Enforcement of design lock and refund disclaimer

### G. Mailing Options

- Option A: Full mailing service
- Option B: Print + ship to user
- Option C: Print only
- Postage, stamp, and handling cost logic

### H. Campaign Options

- Split campaign (drops + intervals)
- Repeat campaign (based on split logic or standalone)
- Campaign calendar preview UI

### I. Vendor Management

- Multi-type vendor registry with admin CRUD
- Pricing tiers, performance metrics, service logs
- Vendor assignment manual or fallback logic
- Performance data fed to analytics dashboards

### J. Proof Review & Annotation

- Embedded PDF viewer with clickable annotations
- Threaded discussions and resolution tracking
- Admin and user view with audit logging

### K. AI Personalization

- Prompt template system with token support
- Generation limits enforced per plan
- History of generated outputs

### L. Automation Engine

- Automated campaign drop scheduling
- Vendor fallback, proof reminders, webhook triggers

### M. Contextual AI Help

- Step-based tips and documentation links
- Overlay and sidebar modes
- Usage logging for UX refinement

### N. Analytics & Reporting Module

- User dashboard with KPIs, charts, and recent orders
- Admin dashboard with global stats, user behavior, vendor trends
- Saved report templates
- Filterable report builder
- Export formats: CSV, PDF, Excel
- Scheduled delivery via CRON
- Feedback analytics and short link activity heatmaps

### O. Feedback Collection

- NPS prompts post-order or post-proof
- Feedback table with user linkage and submission type
- Reporting interface for admin analysis

### P. Short URLs

- Per-recipient short links
- Smart redirects and engagement metrics
- Heatmaps for click activity over time and geography

### Q. Rollback Engine

- Full record change history with before/after diff
- Rollback UI with confirmation prompts
- Audit logging for all actions

### R. Webhooks

- User-defined webhook URLs per event type
- Log viewer with retry option and status feedback
- Admin override for webhook access control

### S. Global Search

- Admin universal search bar with fuzzy matching
- Query across users, vendors, orders, lists, and annotations

### T. Localization (i18n)

- Framework prepared for multi-language translation
- Translatable strings stored in key-value format
- Future language toggle in user settings

### U. Data Retention & Archiving

- Automatic archival of inactive mailing lists, orders, proofs
- Flags and CRON job-based tagging
- Soft delete enforcement

---

## 5. Success Metrics

- Campaign and proof completion rates
- Skip trace enrichment success rates
- Dashboard usage frequency and report generation rates
- Feedback submission rates (NPS and comments)
- Rollback and audit log interactions
- Scheduled report delivery and short URL engagement
- Vendor performance ratings and order fulfillment time
- Team usage growth and collaboration invites
- Webhook reliability and retry success rates
- Feature access patterns by plan (upgrade motivators)

---

## 6. Milestone Phases

### Phase 1: MVP
- Auth, upload, order flow, print fulfillment

### Phase 2: Core Expansion
- AI personalization, Stripe plans, analytics (user-facing)

### Phase 3: Proofing & Multi-Vendor Fulfillment
- Annotation, approvals, vendor routing, team features

### Phase 4: Campaign System, Skip Tracing
- Campaign config, calendar, skip trace pipeline

### Phase 5: Tracking, AI Help, Admin
- Short links, rollback, help assistant, admin dashboard

### Phase 6: Feedback, Webhooks, Export, Archival
- NPS feedback, webhook dashboard, bulk exports, archive logic

---

## Contact

For product or spec questions:  
support@yellowlettershop.com

