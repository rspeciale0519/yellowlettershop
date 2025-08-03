# Architecture Documentation

_Last Updated: April 2025_

This document outlines the architectural design of the Yellow Letter Shop (YLS) platform, covering all major application layers, data flow, infrastructure components, deployment practices, and scaling considerations. It is aligned with the PRD, API, tech stack, and development roadmap, including support for generalized vendor management and skip tracing.

---

## 1. System Overview

Yellow Letter Shop is a cloud-based SaaS application that enables users to manage personalized direct mail campaigns. It combines a Next.js frontend, Supabase backend, Stripe billing, S3-based asset storage, email-based third-party integration, and custom modules for template design, skip tracing, vendor management, automation, and proof workflows.

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
                [Admin Tools + Monitoring Layer]
```

---

## 3. Application Layers

### A. Presentation Layer
- Built with Next.js + Tailwind CSS
- Uses App Router, server components, and layouts
- Includes PDF annotation viewer, FPD design editor, skip trace tools, admin dashboards

### B. API Layer (Backend)
- Powered by Next.js API Routes
- Grouped by resource:
  - `/api/orders`, `/api/templates`, `/api/mailing-lists`, `/api/skip-trace`, `/api/vendors`, `/api/admin`
- Validates sessions with Supabase JWTs

### C. Database Layer
- Supabase PostgreSQL with Row-Level Security (RLS)
- Prisma for schema modeling and type-safe access
- Tables include:
  - `orders`, `skip_trace_orders`, `vendors`, `vendor_pricing`, `mailing_lists`, `design_templates`
  - `proof_annotations`, `audit_logs`, `notifications`
  - JSONB fields for personalization, annotation metadata, and record enrichment

### D. File Storage Layer
- Supabase Storage backed by AWS S3
- Buckets:
  - `uploads/` – Uploaded mailing lists
  - `designs/` – Saved templates
  - `order-proofs/` – PDFs used in print workflow
  - `skip-trace/` – CSVs sent/returned for skip tracing

### E. Email Integration Layer
- Outbound:
  - Print proofs and lists → Print vendors
  - Skip trace CSVs → Skip tracing vendors
- Inbound:
  - Mailgun/SendGrid route receives updated proof or skip traced CSV
  - Auto-parses files, maps to order/record via ID in subject
  - Updates DB and notifies user

### F. Third-Party Services
- **Stripe** – Billing for print and skip tracing orders
- **AccuZIP** – Address validation and ZIP+4 correction
- **Fancy Product Designer (FPD)** – Interactive design editor
- **OpenAI/Claude** – Optional AI-based content generator
- **Mailgun/SendGrid** – Webhook-based inbound file automation for skip tracing and print workflows

---

## 4. Authentication & Authorization

### Auth
- NextAuth.js + Supabase Auth
- JWT tokens in secure HttpOnly cookies
- Session propagation across frontend and backend

### Roles
| Role     | Description                             |
|----------|-----------------------------------------|
| Admin    | Full platform access                    |
| Manager  | Team management, orders, templates      |
| User     | Can place orders and customize designs  |
| Client   | Read-only access to designs/orders      |

### RLS
- All core tables scoped by `user_id`
- Admin role may override via `service_role` context

---

## 5. Order Fulfillment & Skip Tracing Workflow

### Print Orders
- Customer uploads list → customizes design → checks out
- Enters `awaiting_admin_review` → admin selects fulfillment vendor or auto-route triggers
- Proofs and mailing lists sent to selected vendor
- Revised proof ingested by inbound email → stored in `order-proofs/` → user reviews and approves

### Skip Tracing Orders
- Customer selects records for tracing → system creates skip trace order → user checks out via Stripe
- CSV of selected records emailed to selected `skip_tracing` vendor
- Inbound email webhook detects returned enriched CSV
- Data matched back to original records and imported
- User notified via email + in-app alert

---

## 6. Vendor Management (Multi-Type)

- Unified `vendors` table with `vendor_type`: `print`, `skip_tracing`, `data_enrichment`, `other`
- Each vendor supports tiered pricing and performance tracking
- Admin UI supports filtering, editing, reviewing:
  - Services offered, turnaround time, error incidents, rating
  - Assigned vendors for each order type are logged and visible

---

## 7. Annotation System Workflow

- Proof files displayed via React PDF viewer
- Users add annotations with X/Y coordinate overlays
- Comments and replies stored and linked to `proof_id`
- Admin/staff can reply, resolve, or export threads

---

## 8. Admin Features

- Fulfillment routing controls (manual + fallback)
- Vendor selection UI with filtering by type
- Skip tracing management (pipeline monitoring, vendor override)
- Impersonation tools, ticket management, annotation visibility
- Feature toggles and internal debug utilities

---

## 9. Deployment & Environments

### Hosting
- Vercel for frontend + API deployment
- GitHub Actions CI/CD pipeline (lint, typecheck, test, deploy)

### Environments
| Environment | Purpose            |
|-------------|--------------------|
| Local       | Developer testing  |
| Preview     | PR deploy previews |
| Staging     | Internal QA        |
| Production  | Live system        |

---

## 10. Observability & Monitoring

- **Sentry** – Frontend and API error logging
- **Supabase Logs** – DB query, auth, and RLS traceability
- **Stripe Dashboard** – Payment lifecycle
- **Vercel Logs** – Runtime build/debug events
- **Mailgun/SendGrid** – Email event tracking (inbound and outbound)
- **Audit Logs** – Tracks skip trace + print routing decisions, admin overrides, proof events

---

## 11. Scalability & Future Considerations

- Add record-level skip tracing enrichment status
- Expand vendor routing to support geo-targeting or smart dispatch
- Dedicated skip trace file versioning with rollback
- Queue-based job handling for batch imports from vendors
- Integrate additional enrichment services (e.g., social media, deed data)
- Vendor tiering and smart suggestion engine based on cost and performance

---

For infrastructure contributions or architectural discussion, contact: devops@yellowlettershop.com