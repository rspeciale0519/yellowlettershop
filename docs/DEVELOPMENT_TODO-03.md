# Development To-Do List

_Last Updated: April 2025_

This document serves as the master task checklist for building the Yellow Letter Shop (YLS) application. It is grouped by system domain and includes detailed, trackable checkboxes for every major technical task. It is informed by the PRD, architecture, API, and data model specifications.

---

## Core Infrastructure

- [ ] Provision Supabase project: Auth, Database, Storage
- [ ] Create Postgres schema and enable Row-Level Security
- [ ] Set up S3 buckets through Supabase storage
- [ ] Configure .env files for all environments
- [ ] Deploy initial Next.js + TypeScript + Tailwind scaffold

---

## Authentication & User Management

- [ ] Set up NextAuth.js with Supabase JWT integration
- [ ] Enable Google OAuth
- [ ] Define and enforce roles: admin, manager, user, client
- [ ] Create impersonation tool and log tracking
- [ ] Build user session context provider

---

## Mailing List Upload, Validation & Deduplication

- [ ] Build CSV/XLSX uploader with drag-and-drop UI
- [ ] Auto-map and validate required fields (first_name, address, etc.)
- [ ] Enable manual mapping for custom fields
- [ ] Connect AccuZIP API for address validation
- [ ] Implement deduplication by exact-match rules
- [ ] Provide duplicate download/export capability

---

## Template Editor & Print Design

- [ ] Integrate Fancy Product Designer (FPD)
- [ ] Load FPD configs and inject personalization tokens
- [ ] Enable live previews using sample mailing list data
- [ ] Store user-customized designs
- [ ] Implement template versioning and favorites

---

## Order & Checkout Flow

- [ ] Build multi-step order wizard (template > list > design > validate > checkout)
- [ ] Implement Stripe checkout for one-time and subscription billing
- [ ] Display itemized pricing with discount logic
- [ ] Create post-checkout confirmation and order dashboard
- [ ] Link mailing list and design data to order record
- [ ] Set initial order status to `awaiting_admin_review`
- [ ] Notify admins when new orders are submitted for review
- [ ] Add admin interface for choosing fulfillment method
- [ ] Add support for time-bound auto-routing fallback (configurable toggle)
- [ ] Store fulfillment decision and selected vendor on the order

---

## Third-Party Fulfillment: Multi-Vendor Support

- [ ] Build vendor management module with admin UI
- [ ] Create tables for vendors and vendor pricing tiers
- [ ] Allow admins to add, edit, and deactivate vendors
- [ ] Record wholesale pricing for each product/service
- [ ] Log delivery reliability, quality score, and incident counts
- [ ] Display vendor options during admin fulfillment routing
- [ ] Trigger vendor-specific outbound emails (proof + mailing list)
- [ ] Support inbound email parsing of revised proofs via webhook
- [ ] Match incoming proofs to order and update status to `awaiting_approval`
- [ ] Log all routing decisions and send customer proof notifications

---

## Proof Annotation System

- [ ] Integrate PDF viewer with clickable annotations (PDF.js or equivalent)
- [ ] Enable users to click and add annotations with location metadata
- [ ] Store annotations in `proof_annotations` table
- [ ] Implement sidebar comment thread UI for each annotation
- [ ] Add threaded replies using `proof_annotation_replies` table
- [ ] Allow users and staff to resolve annotation threads
- [ ] Sync annotations to specific order and proof file revision
- [ ] Display annotations in both customer and admin views
- [ ] Restrict annotation editing to open status only

---

## AI Personalization Engine

- [ ] Allow toggle to enable/disable AI content generation
- [ ] Build prompt injection system using personalization variables
- [ ] Connect to OpenAI/Claude endpoint
- [ ] Show sample outputs and allow regeneration
- [ ] Store usage metadata and enforce plan-based limits

---

## Direct Mail Automation

- [ ] Build automation setup UI (multi-touch, recurring, conditional)
- [ ] Store automation configs and step logic in database
- [ ] Schedule automation runner with batching and failover
- [ ] Validate templates + recipients on every run
- [ ] Log automation executions and failures

---

## Analytics & Reporting

- [ ] Track mailing volume, spend, engagement, validation rates
- [ ] Allow filtering by template, campaign, vendor, and timeframe
- [ ] Enable report exports: CSV, PDF, Excel
- [ ] Build recurring scheduled report engine

---

## Support Tools

- [ ] Build ticket submission form for logged-in users
- [ ] Display ticket history and current status
- [ ] Admin view for triaging tickets
- [ ] Internal notes, SLA timers, category tagging

---

## Admin Panel

- [ ] Display user analytics, impersonation access, and audit logs
- [ ] Approve marketplace templates
- [ ] Adjust feature flags including `auto_fulfillment_timeout_enabled`
- [ ] Monitor automation failures, Stripe errors, AI usage spikes
- [ ] View and manage order fulfillment method and routing history
- [ ] Review vendor performance data and pricing metrics
- [ ] Upload revised proofs manually if needed
- [ ] View unified order communication and change history

---

## Affiliate Program

- [ ] Create referral link system with code-based tracking
- [ ] Record signup attribution and order revenue
- [ ] Calculate commissions and payout eligibility
- [ ] Admin panel for affiliate activity and payouts

---

## API & Webhooks

- [ ] Document all REST routes with input/output schemas
- [ ] Implement internal REST API endpoints for templates, lists, orders, vendors, pricing, fulfillment updates, annotation workflows, and email triggers
- [ ] Connect Stripe webhooks for payment lifecycle
- [ ] Parse inbound vendor proofs via SendGrid/Mailgun webhook
- [ ] Create webhook listener endpoint structure

---

## Notifications & Alerts

- [ ] Build in-app notification system (dropdown + badge)
- [ ] Email alerts for automation, ticket responses, payments, proof events, admin review required
- [ ] Allow user config for delivery preferences

---

## Logging & Auditing

- [ ] Track changes to templates, mailing lists, orders, users, proofs, vendors, and annotations
- [ ] Store before/after snapshots for rollback
- [ ] Link impersonation and admin actions to audit table
- [ ] Build viewer with filters and export tools

---

## CI/CD & Deployment

- [ ] Set up GitHub Actions with lint, test, build steps
- [ ] Configure preview environments via Vercel
- [ ] Allow hotfix deploys and rollbacks
- [ ] Implement production monitoring via Sentry

---

## Testing & QA

- [ ] Write Jest tests for core modules
- [ ] Write Cypress tests for user flows (upload > order > payment > proof review)
- [ ] Validate AI output accuracy and safety
- [ ] Perform manual QA on annotation and proof workflows
- [ ] Test automated third-party print order routing and proof response cycle
- [ ] Create final signoff flow for release to production

---

## Launch Readiness

- [ ] Finalize copy, help docs, and privacy policy
- [ ] Confirm email and notification templates
- [ ] Ensure mobile responsiveness
- [ ] Validate all roles and permissions
- [ ] Ensure data exports and GDPR compliance
- [ ] Prepare rollback and support contingencies