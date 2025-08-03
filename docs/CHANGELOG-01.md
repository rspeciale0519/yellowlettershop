# Changelog

_Last Updated: April 2025_

This document tracks major feature launches, architecture changes, and system enhancements across the Yellow Letter Shop (YLS) platform. All entries are logged by version, with date and categorized by functional area.

---

## Version 1.0 — Initial Public Release
**Date:** April 2025

### New Features
- Direct mail order wizard with validation, preview, and Stripe checkout
- Mailing list uploader with column mapping, deduplication, and AccuZIP verification
- Dynamic template customization using Fancy Product Designer (FPD)
- Personalization token system with dynamic preview renderer
- Support for custom fields (e.g., {{property_value}}, {{agent_name}})
- Print-ready proof generation for every mail order
- Order tracking dashboard for user + admin

### AI & Automation
- AI personalization engine (prompt-based letter generator)
- AI-generated design previews with live data injection
- Multi-touch direct mail automation workflows
- Step configuration: design per stage + delay engine

### User Management
- Role-based access: admin, manager, user, client
- Supabase Auth with Google OAuth + optional fallback auth
- Team account structure (Enterprise tier)
- Admin impersonation tool with audit trail

### Platform Services
- Stripe billing: Free, Pro, Team, Enterprise
- Order-based pricing logic with per-unit breakdown
- Stripe webhook handler for subscription and payment events
- Built-in affiliate tracking system with referral codes and payouts

### Internal Tools
- Admin panel: user browser, ticket triage, impersonation logs
- Marketplace template approval flow
- Feature flag toggles (AI access, automation, template variants)
- Audit logs for sensitive actions (design changes, deletions, role updates)

### Notifications
- In-app dropdown notification center
- Email alerts for order status, support replies, validation failures
- Admin alerts for impersonation, AI usage spikes, payment errors

### Support System
- Internal ticketing for logged-in users
- Admin assignment and SLA tagging
- User message threads with reply visibility filters

### Infrastructure
- GitHub Actions CI: lint, typecheck, test, build
- Vercel deployment for preview, staging, production
- Supabase-hosted DB, Auth, and Storage
- AWS S3 backend via Supabase for design assets

---

## Pre-Release Milestones

### Beta (March 2025)
- Completed E2E Cypress testing coverage
- Finalized AI personalization schema and prompt templates
- Integrated Supabase RLS enforcement on all core data models
- Built out impersonation logging and changelog archive
- Validated full print-ready data pipeline from upload to approval

### Alpha (January–February 2025)
- Established data schemas and file upload framework
- Integrated FPD with working preview renderer
- Connected Stripe with dynamic pricing logic and per-unit calculation
- Enabled role-based navigation rendering and dashboard control flows

---

## Future Roadmap (Planned for v1.1 and beyond)
- White-label mode and tenant-specific branding
- User-scheduled campaign delivery calendars
- Custom domain setup and DNS routing
- Real-time collaborative design editing (multi-user sessions)
- API keys and webhooks for power users
- Enhanced mobile responsiveness and performance metrics

---

All version changes are coordinated through internal Notion roadmap and reflected here upon release. For engineering inquiries, contact: devteam@yellowlettershop.com