# Architecture Documentation

_Last Updated: April 2025_

This document outlines the architectural design of the Yellow Letter Shop (YLS) platform, covering all major application layers, data flow, infrastructure components, deployment practices, and scaling considerations. It is tightly aligned with the PRD, API, tech stack, data models, and development plans.

---

## 1. System Overview

Yellow Letter Shop is a cloud-based SaaS application that enables users to manage personalized direct mail campaigns. It combines a Next.js frontend, Supabase backend, Stripe billing, S3-based asset storage, email-based third-party print integration, and custom modules for template design, automation, vendor management, and proof workflows.

---

## 2. Architectural Diagram

```
[Client Browser] ---> [Next.js SSR / API Routes]
                         |       |         
                         |       v
                [Supabase DB]  [FPD Canvas + Assets]
                         |       |
             [Stripe API]   [AccuZIP API]     [Vendor Email Router]
                         |           \_________>
                      [S3 Buckets (via Supabase)]
                         |
                 [Admin Tools + Monitoring Layer]
```

---

## 3. Application Layers

### A. Presentation Layer
- Built with Next.js + Tailwind CSS
- Uses App Router, server components, and layouts
- Includes modals, dropdowns, PDF viewer with annotations, FPD design editor, admin dashboards

### B. API Layer (Backend)
- Powered by Next.js API Routes
- Grouped by resource:
  - `/api/orders`, `/api/annotations`, `/api/templates`, `/api/mailing-lists`
  - `/api/vendors`, `/api/pricing`, `/api/admin`, `/api/support`, `/api/proof-approval`
- All endpoints validate sessions via JWT (Supabase Auth)

### C. Database Layer
- Supabase PostgreSQL with Row-Level Security (RLS)
- Prisma for schema modeling and type-safe access
- JSONB fields for flexible content (lists, designs, annotations, pricing)
- Tables for vendors, vendor pricing, orders, fulfillment method selection, audit logs

### D. File Storage Layer
- Supabase Storage backed by AWS S3
- Bucket structure:
  - `uploads/` – Mailing lists and input files
  - `designs/` – Customized design data
  - `template-previews/` – Preview renders
  - `order-proofs/` – PDF proofs and revision history

### E. Email Integration Layer
- Outbound via transactional email provider (e.g., SendGrid, Postmark)
- Inbound email handling via webhook (e.g., Mailgun, SendGrid Inbound Parse)
- Routes proof files into the system automatically
- Associates revisions with orders and notifies customers accordingly
- Handles multi-vendor routing and proof file matching based on order ID

### F. Third-Party Services
- **Stripe** – Payment and fund authorization workflows
- **AccuZIP** – Address validation (CASS-certified)
- **Fancy Product Designer (FPD)** – Real-time design editor
- **OpenAI / Claude** – Personalization engine (optional by tier)

---

## 4. Authentication & Authorization

### Auth
- NextAuth.js + Supabase Auth
- JWT tokens stored in secure cookies
- Sessions injected into API and SSR contexts

### Roles
| Role     | Description                             |
|----------|-----------------------------------------|
| Admin    | Full platform access                    |
| Manager  | Team management, orders, templates      |
| User     | Can place orders and customize designs  |
| Client   | Read-only access to designs/orders      |

### RLS
- All major tables scoped by `user_id`
- Admin service role permits global data access via secure server-side operations

---

## 5. Order Fulfillment Workflow

- Orders placed → Mailing list uploaded → Design saved → Proofs routed
- Orders enter `awaiting_admin_review` status
- Admin reviews order in dashboard and chooses fulfillment method:
  - `in_house`: routed to internal print queue
  - `third_party`: admin selects vendor → order is emailed to that vendor
- Optional auto-routing system:
  - Configurable toggle enables/disables fallback
  - If enabled, order defaults to pre-set method after timeout expires
- All fulfillment actions are logged and displayed in audit trail

---

## 6. Vendor Management & Pricing

- Admin interface allows creation and editing of vendor records
- Vendor data includes contact info, services, min order quantity, turnaround time, and custom notes
- Wholesale pricing stored in tiered structure per product/service
- Data used in admin routing UI to compare vendor options
- Audit logs capture all vendor selection activity
- Vendor performance tracked via metrics (on-time delivery, error count, rating)
- All vendor data stored in `vendors` and `vendor_pricing` tables

---

## 7. Annotation System Workflow

- Proof files displayed via embedded PDF viewer (PDF.js or React-PDF)
- Customers click on proof to add annotations
- Annotation coordinates (percent X/Y) + page stored in DB
- Threaded replies stored in related table and linked to parent annotation
- Admins and users view same history thread
- Annotation data accessible from both frontend and backend APIs
- Logs include timestamps, actor ID, and resolution metadata

---

## 8. Admin Features

- Fulfillment override tools
- Vendor selector with performance metrics and cost preview
- Toggle for auto-routing system with default method selection
- Order audit trail and status tracker
- Manual proof uploader for revised vendor proofs
- Annotation history and reply management
- Feature flags, impersonation, and ticket system

---

## 9. Deployment & Environments

### Vercel Hosting
- Auto-deployments from GitHub `main`
- Preview deploys from pull requests

### GitHub Actions
- Lint → Typecheck → Unit Test → E2E Test → Build → Deploy
- Secrets managed via GitHub and Vercel dashboards

### Environments
| Environment | Description           |
|-------------|-----------------------|
| Local       | Dev testing           |
| Preview     | Per-feature preview   |
| Staging     | QA & regression test  |
| Production  | Live system           |

---

## 10. Observability & Monitoring

- Sentry – JS and API error tracking
- Supabase Logs – Auth/storage/query audit trails
- Stripe Dashboard – Payment errors and statuses
- Email bounce monitoring – SendGrid or Mailgun
- Admin alerts for impersonation, annotation issues, order failures, or unclaimed orders

---

## 11. Scalability & Future Considerations

- Queue-based job processing for print batching
- Side-by-side vendor comparison with cost/quality scores
- Expanded support for vendor portals or PDF dropzones
- Regional printer assignment based on delivery address
- AI-generated printer suggestions based on price and past performance
- Vendor tier assignment for approval gating

---

For architecture or infrastructure contributions, contact: devops@yellowlettershop.com