# Architecture Documentation

*Last Updated: April 2025*

This document outlines the architectural design of the Yellow Letter Shop (YLS) platform, covering all major application layers, data flow, infrastructure components, deployment practices, and scalability considerations. It is aligned with the PRD, API, tech stack, and development roadmap, and includes support for generalized vendor management, skip tracing, AI contextual help, design-lock enforcement, tracking URLs, and rollback.

---

## 1. System Overview

Yellow Letter Shop is a cloud-based SaaS application that enables users to manage personalized direct mail campaigns. It combines a Next.js frontend, Supabase backend, Stripe billing, S3-based asset storage, email-based third-party integration, and custom modules for template design, skip tracing, annotation, vendor management, automation, and tracking analytics.

---

## 2. Architectural Diagram

```
[Client Browser] ---> [Next.js SSR / API Routes]
                         |       |         
                         |       v
                [Supabase DB]  [FPD Canvas + Assets]
                         |       |
         [Stripe API]  [AccuZIP API]  [Vendor Email Router]
                         |           \__________
                       [S3 Buckets (via Supabase)]
                         |
        [Admin Tools + Monitoring + Short Link Engine + AI Help Layer]
```

---

## 3. Application Layers

### A. Presentation Layer
- Built with Next.js + Tailwind CSS
- App Router with SSR and layouts
- Uses server and client components
- Includes:
  - PDF annotation viewer
  - FPD design editor
  - Skip trace selection tool
  - Campaign wizard
  - AI contextual help overlay
  - Final design approval confirmation with no-refund notice
  - Embedded short link generation and analytics UI

### B. API Layer (Backend)
- Built on Next.js API Routes
- RESTful structure grouped by feature: `/api/orders`, `/api/templates`, `/api/skip-trace`, etc.
- Authenticated via Supabase JWT session tokens
- Internal middleware handles:
  - Session propagation
  - Rate limiting
  - Validation with Zod
  - Feature flag evaluation

### C. Database Layer
- Supabase PostgreSQL with full Row-Level Security (RLS)
- Managed by Prisma ORM
- Key Tables:
  - `orders`, `mailing_lists`, `contact_cards`, `design_templates`, `vendors`, `vendor_pricing`
  - `proof_annotations`, `proof_annotation_replies`
  - `record_change_logs`, `audit_logs`, `support_tickets`, `notifications`
  - `short_links`, `ai_personalization_outputs`
  - JSONB fields used for `mailing_option`, `campaign_options`, `record_data`, and enriched metadata

### D. File Storage Layer
- Supabase Storage backed by AWS S3
- Buckets:
  - `uploads/` – Mailing list files
  - `designs/` – User-created templates
  - `order-proofs/` – PDF proofs and revisions
  - `skip-trace/` – Skip trace request and result CSVs

### E. Email Integration Layer
- **Outbound**:
  - Proofs and lists to print vendors
  - Skip trace CSVs to tracing vendors
- **Inbound**:
  - Ingested via SendGrid or Mailgun webhook
  - Files parsed and matched to corresponding orders
  - Trigger updates to proof or skip trace status

### F. AI Contextual Help Layer
- Lightweight module embedded in wizard and dashboard flows
- Loads context-specific help cards, FAQ links, and best practices
- Indexed content matched to route and user task
- Optional sidebar or popup tips engine powered by prompt tagging

---

## 4. Authentication & Authorization

### Auth
- Supabase Auth + NextAuth.js
- JWT stored in HttpOnly secure cookies
- Sessions injected into API + SSR contexts

### Roles
| Role     | Permissions Scope                    |
|----------|--------------------------------------|
| Admin    | Full access to all users and data    |
| Manager  | Team orders, contact cards, lists    |
| User     | Can place orders, upload, annotate   |
| Client   | Read-only view of assets             |

### RLS Enforcement
- Core tables (orders, mailing lists, contact cards) enforce `auth.uid()`
- Admin override via `service_role`
- All writes validated server-side with scoped logic

---

## 5. Fulfillment & Skip Tracing Workflows

### Print Order Flow
1. Upload mailing list
2. Map fields and deduplicate
3. Validate addresses
4. Customize template
5. Select contact card
6. Set mailing + campaign options
7. Final confirmation with no-refund checkbox
8. Checkout via Stripe
9. Admin selects vendor or fallback routing triggers
10. Proof sent to vendor, revised proof returned and parsed
11. User reviews, annotates, or approves

### Skip Trace Flow
1. Select records to trace
2. CSV generated and sent to vendor
3. Inbound enriched file parsed and mapped to original records
4. Status updated in DB and user notified
5. Record enrichment stored in JSONB

---

## 6. Vendor Management (Generalized)

- Unified table with `vendor_type`: `print`, `skip_tracing`, `data_enrichment`, `other`
- Each vendor profile includes:
  - Services offered, turnaround SLA, shipping costs
  - Tiered pricing per service
  - Performance tracking: delivery rate, error count
  - Contract notes and quality score
- Vendors are assigned per order or fallback triggered
- All fulfillment events logged to audit table

---

## 7. Proof Annotation System

- Proofs displayed using React PDF viewer
- Overlay layer supports:
  - Position-aware comment placement
  - Threaded discussions
  - Resolution status toggle
- Admins and staff can respond to or resolve threads
- All annotation events stored in dedicated tables and mirrored in order logs

---

## 8. AI Features

### Personalization Engine
- Optional use of OpenAI/Claude to generate custom message blocks
- Token injection from mailing list and contact cards
- Usage enforced via subscription limits
- Prompt versioning and status logging per generation attempt

### Contextual Help
- Lightweight, embedded overlay
- Activated by wizard context or user actions
- Displays:
  - Help text
  - Best practice callouts
  - Link to full support documentation
- Help interactions logged for support analysis

---

## 9. Tracking Short Links

- Each recipient record is assigned a human-friendly short code
- Short links follow pattern: `yls.to/{code}`
- Redirect handled by API route that logs:
  - Timestamp
  - IP address
  - Record ID and campaign ID
- Optional smart redirects supported (e.g., to branded landing pages)
- Metrics surfaced in reporting module

---

## 10. Record Change Logs & Rollback

- All mailing list changes tracked to `record_change_logs`
- UI exposes rollback per:
  - Single record
  - Entire list
  - Tagged group
- Snapshots compare before/after JSON payloads
- Rollback actions require user confirmation and are logged to `audit_logs`

---

## 11. Deployment & Environments

### Hosting
- Vercel (frontend + API)
- GitHub Actions: CI pipeline (lint, typecheck, test, deploy)

### Environments
| Environment | Purpose            |
|-------------|--------------------|
| Local       | Developer testing  |
| Preview     | Per-PR deployment  |
| Staging     | Internal QA        |
| Production  | Live system        |

---

## 12. Observability & Monitoring

| Tool             | Purpose                                   |
|------------------|--------------------------------------------|
| Sentry           | Error monitoring (frontend + backend)      |
| Supabase Logs    | Auth, RLS, storage, and API event logs     |
| Vercel Logs      | Build and runtime logs                     |
| Stripe Logs      | Billing lifecycle, disputes, failures      |
| Mailgun/SendGrid | Email delivery and inbound triggers        |
| Audit Logs       | All admin/user changes and proof events    |
| Short Link Logs  | Redirect tracking and analytics            |

---

## 13. Scalability & Future Considerations

- AI help usage heatmap for UI refinement
- Predictive vendor selection based on fulfillment trends
- Queue-based short URL tracking and redirect resilience
- Expand support for enterprise SSO
- Incremental database snapshots for rollback optimization
- UI-based sandbox builder for automation previews

---

## Contact

For architectural questions or infrastructure support:  
support@yellowlettershop.com

