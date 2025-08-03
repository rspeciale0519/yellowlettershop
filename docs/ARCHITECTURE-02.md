# Architecture Documentation

_Last Updated: April 2025_

This document outlines the architectural design of the Yellow Letter Shop (YLS) platform, covering all major application layers, data flow, infrastructure components, deployment practices, and scaling considerations. It is tightly aligned with the PRD, API, tech stack, data models, and development plans.

---

## 1. System Overview

Yellow Letter Shop is a cloud-based SaaS application that enables users to manage personalized direct mail campaigns. It combines a Next.js frontend, Supabase backend, Stripe billing, S3-based asset storage, email-based third-party print integration, and custom modules for template design, automation, and proof workflows.

---

## 2. Architectural Diagram

```
[Client Browser] ---> [Next.js SSR / API Routes]
                         |       |         
                         |       v
                [Supabase DB]  [FPD Canvas + Assets]
                         |       |
             [Stripe API]   [AccuZIP API]     [MBI Email Router]
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
- Includes modals, dropdowns, PDF viewer with annotations, FPD design editor

### B. API Layer (Backend)
- Powered by Next.js API Routes
- Grouped by resource:
  - `/api/orders`, `/api/annotations`, `/api/templates`, `/api/mailing-lists`
  - `/api/payments`, `/api/notifications`, `/api/automations`
  - `/api/admin`, `/api/support`, `/api/proof-approval`

### C. Database Layer
- Supabase PostgreSQL with Row-Level Security (RLS)
- Prisma for schema modeling and type-safe access
- JSONB fields for flexible content (lists, designs, proof metadata)
- Tables for proofs, annotations, replies, and communication history

### D. File Storage Layer
- Supabase Storage backed by AWS S3
- Bucket structure:
  - `uploads/` – Mailing lists and input files
  - `designs/` – Customized design data
  - `template-previews/` – Preview renders
  - `order-proofs/` – PDF proofs and revision history

### E. Email Integration Layer
- Outbound via transactional email provider (e.g., SendGrid)
- Inbound email handling via webhook (e.g., Mailgun, SendGrid Inbound Parse)
- Routes proof files into the system automatically
- Associates revisions with orders and notifies customers accordingly

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
- If `fulfillment_method = third_party`:
  - Email with files or download links sent to MBI
  - Proof revisions received by email and parsed into system
  - Customer reviews proof + list, adds annotations if needed
  - Customer approves, requests changes, or cancels
  - System updates status, captures funds, notifies stakeholders
- If `fulfillment_method = in_house`, order goes to internal print queue

---

## 6. Annotation System Workflow

- Proof files displayed via embedded PDF viewer (PDF.js or React-PDF)
- Customers can click on PDF to add annotations
- Annotation coordinates (percent X/Y) + page stored in DB
- Threaded replies stored in related table and linked to parent annotation
- Admins and users view same history thread
- Annotation data accessible from both frontend and backend APIs
- Logs include timestamps, actor ID, and optional resolution status

---

## 7. Admin Features

- Fulfillment override tools
- Order audit trail viewer
- Annotation thread history
- Manual proof uploader for edge cases
- Proof lifecycle tracking
- Support ticket triage + impersonation tools
- Feature flags (AI, automation, marketplace control)

---

## 8. Deployment & Environments

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

## 9. Observability & Monitoring

- Sentry – JS and API error tracking
- Supabase Logs – Auth/storage/query audit trails
- Stripe Dashboard – Payment errors and statuses
- Email bounce monitoring – SendGrid or Mailgun
- Admin alerts for impersonation, annotation issues, or order failures

---

## 10. Scalability & Future Considerations

- Queue-based job processing for print batching
- Modular migration of annotation engine into shared worker
- Scoped annotation permissions for team-based review
- Proof version comparison view (side-by-side PDF diffing)
- Expansion of email parser to support multi-vendor workflows

---

For architecture or infrastructure contributions, contact: devops@yellowlettershop.com