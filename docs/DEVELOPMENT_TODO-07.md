# Development To-Do List

*Last Updated: April 2025*

This document serves as the master task checklist for building the Yellow Letter Shop (YLS) application. It is grouped by system domain and includes detailed, trackable checkboxes for every major technical task. It is informed by the PRD, architecture, API, and data model specifications, including mailing options, campaign scheduling, contact card management, skip tracing system, deduplication toggles, tracking URLs, design-lock workflows, AI help, the generalized multi-type vendor framework, and the analytics and reporting dashboards.

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
- [ ] Add de-duplication toggle during upload step
- [ ] Store per-user deduplication preference in account settings
- [ ] Connect AccuZIP API for address validation
- [ ] Integrate deduplication with AccuZIP validation pipeline
- [ ] Implement deduplication by exact-match rules
- [ ] Provide duplicate download/export capability

---

## Contact Card Management

- [ ] Create `contact_cards` table with plan-based limits
- [ ] Build CRUD interface in user dashboard (add, edit, delete)
- [ ] Enforce contact card limits by plan:
  - Pro: 2 cards max
  - Team/Enterprise: limit = number of users
- [ ] Add contact card selection step in order wizard
- [ ] If no contact card exists, require user to create one
- [ ] Load contact card into live design preview
- [ ] Restrict one contact card per campaign

---

## Template Editor & Print Design

- [ ] Integrate Fancy Product Designer (FPD)
- [ ] Load FPD configs and inject personalization tokens
- [ ] Enable live previews using sample mailing list data
- [ ] Inject selected contact card fields into preview
- [ ] Store user-customized designs
- [ ] Implement template versioning and favorites

---

## Order & Checkout Flow

- [ ] Build multi-step order wizard:
  - Template selection
  - List upload + deduplication toggle
  - Field mapping
  - Validation
  - Design customization
  - Contact card selection or creation
  - Mailing options
  - Campaign options
  - Final review with design lock confirmation + no refund disclaimer
  - Checkout
- [ ] Add final screen modal with checkbox confirmation:
  - "I understand my design and mailing list are final, and no refunds will be issued."
- [ ] Implement Stripe checkout for one-time and subscription billing
- [ ] Display itemized pricing with discount logic
- [ ] Create post-checkout confirmation and order dashboard
- [ ] Link mailing list, design data, and contact card to order record
- [ ] Set initial order status to `awaiting_admin_review`
- [ ] Notify admins when new orders are submitted for review
- [ ] Add admin interface for choosing fulfillment method
- [ ] Add support for time-bound auto-routing fallback (configurable toggle)
- [ ] Store fulfillment decision and selected vendor on the order

---

## Mailing Options

- [ ] Add mailing options step in order wizard:
  - Option A: Full mailing service (choose postage type + stamp/indicia)
  - Option B: Process + ship to user (choose postage or none)
  - Option C: Print only and ship unprocessed
- [ ] Apply postage rules and restrict choices per option
- [ ] Apply shipping & handling cost calculation by weight

---

## Campaign Options

- [ ] Add campaign options step in order wizard:
  - Split Campaign: specify number of drops and frequency (weeks)
  - Repeat Campaign:
    - If split selected: ask only how many times to repeat
    - If not split: ask for frequency + number of repeats
- [ ] Store campaign configuration in order metadata
- [ ] Ensure design + contact card is locked per drop/repeat cycle
- [ ] Schedule and manage campaign lifecycle from backend

---

## Third-Party Fulfillment: Multi-Vendor Support

- [ ] Build generalized vendor management module with admin UI
- [ ] Create tables for vendors and vendor pricing tiers
- [ ] Allow admins to add, edit, and deactivate vendors by type (print, skip tracing, etc.)
- [ ] Record wholesale pricing and performance metrics
- [ ] Log delivery reliability, quality score, error count
- [ ] Display vendor options during fulfillment or skip tracing routing
- [ ] Implement admin vendor selection UI with type filtering
- [ ] Enable outbound proof and data delivery to vendors via email
- [ ] Match inbound vendor responses to correct order or skip trace request
- [ ] Ingest and log proof file or enriched skip traced file automatically

---

## Skip Tracing System

- [ ] Enable record selection (single, batch, all) for skip tracing
- [ ] Create `/skip_trace_orders` table for managing skip trace jobs
- [ ] Export selected records (limited fields) to CSV for vendor delivery
- [ ] Generate skip trace order summary and price calculation
- [ ] Trigger Stripe payment and enforce pre-payment
- [ ] Route CSV to selected skip tracing vendor via outbound email
- [ ] Set up Mailgun/SendGrid inbound email parse route
- [ ] Detect file delivery, attach to correct skip trace order
- [ ] Import enriched phone/email fields into original records
- [ ] Notify user once skip tracing is complete
- [ ] Track status: `not_requested`, `pending`, `enriched`, `failed`
- [ ] Display status in UI and include in audit logs

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

## AI-Powered Contextual Help

- [ ] Detect user step in wizard or dashboard
- [ ] Show contextual help prompts based on page and task
- [ ] Link to relevant documentation or tips
- [ ] Embed optional sidebar with help search and tutorials

---

## Short URL Tracking System

- [ ] Generate unique short code per recipient/record
- [ ] Route short links through redirect handler
- [ ] Log access data: timestamp, IP, record ID
- [ ] Display campaign-level and per-record tracking analytics
- [ ] Add smart redirect handling (e.g., custom landing pages)

---

## Record Change Log & Rollback

- [ ] Track all modifications to mailing list records
- [ ] Build UI for visual diff of before/after
- [ ] Add bulk rollback functionality by:
  - Entire list
  - Individual record
  - Tag segment
- [ ] Log all rollback actions to audit table

---

## Analytics & Reporting Module

- [ ] Build user dashboard: login landing page with KPI tiles, charts, short link activity, and recent orders
- [ ] Build admin dashboard: platform-wide KPIs, revenue trends, vendor and user activity charts
- [ ] Build full report builder UI with:
  - Report type selector
  - Timeframe and filter selectors
  - Export formats: CSV, PDF, Excel
  - One-time download or email delivery
  - Scheduling engine: recurring delivery (daily, weekly, monthly)
- [ ] Create report scheduler logic and task queue
- [ ] Implement saved reports system (user + admin)
- [ ] Create recurring reports viewer (pause, resume, edit, cancel)
- [ ] Track report generation activity logs

---

## Support Tools

- [ ] Build ticket submission form for logged-in users
- [ ] Display ticket history and current status
- [ ] Admin view for triaging tickets
- [ ] Internal notes, SLA timers, category tagging

---

## Admin Panel

- [ ] Display user analytics, impersonation access, and audit logs
- [ ] Approve marketplace templates (if enabled)
- [ ] Adjust feature flags including `auto_fulfillment_timeout_enabled`
- [ ] Monitor automation failures, Stripe errors, AI usage spikes
- [ ] View and manage fulfillment and skip tracing order histories
- [ ] Review vendor performance and pricing across vendor types
- [ ] Upload revised proofs or enriched skip trace results manually if needed
- [ ] View unified communication and audit history
- [ ] Access admin analytics dashboard and reporting interface

---

## Notifications & Alerts

- [ ] Build in-app notification system (dropdown + badge)
- [ ] Email alerts for automation, ticket responses, payments, proofs, skip trace events, and scheduled report delivery
- [ ] Allow user config for delivery preferences

---

## Logging & Auditing

- [ ] Track changes to templates, mailing lists, orders, users, vendors, annotations, skip trace results, and reports
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
- [ ] Write Cypress tests for user flows (upload > order > payment > proof review > skip trace > report generation)
- [ ] Validate AI output accuracy and safety
- [ ] Perform manual QA on annotation and skip tracing workflows
- [ ] Test automated third-party vendor routing for skip tracing and print
- [ ] Test mailing options logic and price calculation
- [ ] Validate split and repeat campaign configurations
- [ ] Confirm contact card appears correctly in design preview
- [ ] Create final signoff flow for release to production
- [ ] Test short URL redirect logging and analytics
- [ ] Test rollback tool per record and batch segment
- [ ] Confirm contextual help displays accurately at each step
- [ ] Verify user must accept no-refund disclaimer before payment
- [ ] Test report builder, dashboard visuals, and recurring reports system

---

## Launch Readiness

- [ ] Finalize copy, help docs, and privacy policy
- [ ] Confirm email and notification templates
- [ ] Ensure mobile responsiveness
- [ ] Validate all roles and permissions
- [ ] Ensure data exports and GDPR compliance
- [ ] Prepare rollback and support contingencies

---

## Contact

For development or technical implementation questions:  
support@yellowlettershop.com