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
- Stripe checkout integration
- Confirmation, receipt, and status tracking

### E. AI Personalization
- Toggle to enable AI-generated message content
- Use OpenAI/Claude to generate variations based on template, tone, and mailing list fields
- Limit usage by subscription tier

### F. Automation Engine
- Multi-touch campaign builder (schedule recurring or step-based sequences)
- Link templates to stages with delays
- Queue generation and processing for each run

### G. Admin Tools
- View and manage users, impersonate sessions, audit logs
- Manage support tickets
- Toggle platform-wide flags (AI access, marketplace, automation)
- Approve and feature templates from external creators

### H. Support System
- Internal ticketing system
- Users submit help requests and view replies
- Admin/staff assign and reply via dashboard
- All updates logged with visibility filters

### I. Affiliate System
- Users can generate referral links
- Commissions earned on referred signups or purchases
- Payouts managed manually or through Stripe Connect

### J. Reporting & Analytics
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

---

## 6. Success Metrics

- High conversion rates on upload → order completion
- High engagement with AI and automation features
- Stable delivery success from AccuZIP validation
- Growth in monthly recurring revenue from subscription tiers
- Positive feedback from user support tickets and feedback entries

---

## 7. Milestone Phases

### Phase 1: MVP
- Auth, mailing list upload, template editor, order flow

### Phase 2: Core Expansion
- AI personalization, automation, Stripe plans, analytics

### Phase 3: Advanced
- Marketplace, white-label, public API, enterprise workflows

---

## 8. Contact

For questions related to this PRD or product strategy:
- product@yellowlettershop.com