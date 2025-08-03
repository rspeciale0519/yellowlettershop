# Technology Stack Documentation

_Last Updated: April 2025_

This document outlines the full technology stack used to build, scale, and maintain the Yellow Letter Shop (YLS) platform. It includes frameworks, services, tools, patterns, and architectural choices supporting all core modules including print fulfillment, skip tracing, proof annotation, AI personalization, campaign automation, contextual help, analytics dashboards, feedback collection, short link tracking, webhook delivery, rollback tooling, team collaboration, and recurring reporting.

---

## 1. Overview

YLS is a modular, cloud-hosted SaaS platform built with a full-stack TypeScript foundation and serverless-first deployment strategy. It is deployed on Vercel with GitHub-integrated CI/CD and real-time data flows backed by Supabase. Key features include multi-vendor routing, short URL tracking, AI assistance, webhook logs, scheduled analytics, and rollback support.

---

## 2. Frontend

### Framework
- **Next.js (v14+)**
  - App Router (server-first design)
  - Server Components for SSR
  - Incremental static regeneration for marketing/public pages

### UI Layer
- **React 18+** with functional components and hooks

### Styling
- **Tailwind CSS (v3+)**
  - Utility-first classes
  - Responsive, mobile-first layout
  - Custom themes, shadcn/ui variants

### UI Libraries
- **ShadCN/UI** — Standard UI elements (modals, dropdowns, form inputs)
- **Lucide React** — Icon set
- **React-PDF / PDF.js** — Proof annotation viewer
- **Recharts / ApexCharts** — All KPI charts, dashboards, and analytics

---

## 3. Backend

### API Layer
- **Next.js API Routes** (organized per module)
  - `/api/orders`, `/api/templates`, `/api/reports`, `/api/feedback`, `/api/webhooks`
  - JSON-based RESTful design
  - Zod input validation for all POST/PUT routes

### Authorization
- **NextAuth.js + Supabase Auth**
  - OAuth (Google)
  - Session cookies (`HttpOnly`, `Secure`, `SameSite`)
  - Supabase JWT stored on login

### Role-based Access
- Scoped using Supabase RLS on all core tables
- Admin role override with server role on backend logic only

### ORM
- **Prisma** — Schema definition, migrations, typed DB access

---

## 4. Database

- **Supabase PostgreSQL**
  - Used for users, lists, orders, proofs, annotations, feedback, vendors, logs
  - JSONB columns used for flexible fields (metadata, campaign config, filters)

### Core Tables
- `orders`, `order_proofs`, `proof_annotations`, `contact_cards`, `scheduled_reports`
- `record_change_logs`, `audit_logs`, `mailing_list_records`, `vendors`, `skip_trace_orders`
- `short_links`, `feedback`, `webhook_logs`, `team_members`, `notifications`

### RLS
- All write/read access scoped via `auth.uid()` and team ID where applicable
- Admin access scoped via session + `role = admin`

---

## 5. File Storage

- **Supabase Storage (backed by AWS S3)**
  - Buckets:
    - `uploads/` — Mailing list files
    - `designs/` — User templates
    - `template-previews/` — Design renders
    - `order-proofs/` — Proof uploads and revisions
    - `skip-trace/` — Enriched CSVs

---

## 6. Email Infrastructure

### Outbound
- **SendGrid** or **Postmark**
  - Transactional emails: order status, report delivery, proof approval, feedback prompts
  - System alerts: webhook failures, failed retries, low NPS

### Inbound
- **SendGrid Inbound Parse** or **Mailgun Routes**
  - Process enriched CSV or proof file attachments
  - Trigger webhook-style file ingestion logic

---

## 7. Third-Party Services

### Payments
- **Stripe**
  - One-time payments
  - Subscription plans (Pro, Team, Enterprise)
  - Fund holds and capture after proof approval
  - Webhooks used to handle payment events

### Address Validation
- **AccuZIP API** — USPS-certified CASS + deduplication

### AI Personalization
- **OpenAI / Claude** — Prompt-based generation of message content
  - Integrated with token injection and design previews
  - Subject to usage quotas per subscription tier

### Template Editor
- **Fancy Product Designer (FPD)** — Canvas-based live design editing with JSON configs

### Webhooks & Automation
- **Custom Zapier-compatible webhook listener** at `/api/webhooks/zapier`
- Retry queue and logs built into admin interface

---

## 8. Annotation System

- **React-PDF + Custom Overlay Engine**
  - Drag-to-annotate with thread support
  - X/Y percentage positioning
  - Stored in annotation tables with comment history

---

## 9. Analytics & Reporting

- **Recharts / ApexCharts** — Visualizations across user and admin dashboards
- **Supabase SQL Views + API joins** — Aggregation for:
  - Orders, Campaigns, Feedback, Vendors, Webhooks
- **Export Formats** — CSV, PDF (via headless browser), Excel
- **Scheduled Delivery** — Supabase CRON or Vercel edge function for recurring reports

---

## 10. Feedback & Help

### Feedback Engine
- Built-in prompt for NPS + comments after proof approval or report delivery
- Logged to `feedback` table and sent via alert email to support if low score

### Contextual Help
- AI-based step-specific content fetched from `/api/help/contextual?step=...`
- Uses embedded help card, static fallback JSON file, and cached overlay

---

## 11. CI/CD

### GitHub Actions
- Workflow:
  - Lint → Typecheck → Unit Test (Jest) → E2E (Cypress) → Build

### Deployment
- **Vercel** auto-deploy for:
  - Preview branches (PR)
  - Production (`main` branch)

---

## 12. Monitoring & Logs

| Tool             | Purpose                                 |
|------------------|------------------------------------------|
| Sentry           | Frontend/API error tracking               |
| Vercel Logs      | Build + request lifecycle logs            |
| Supabase Logs    | Query, auth, and storage activity         |
| Stripe Dashboard | Payment events and reconciliation         |
| Mailgun Logs     | Email bounce, failure tracking            |
| Audit Logs       | All impersonation, routing, rollback, feedback |
| Webhook Logs     | Delivery events, retry queue              |
| Report Logs      | Recurring export status and failures      |

---

## 13. Developer Tools

- **ESLint** + **Prettier** — Consistent formatting and linting
- **Zod** — API schema validation
- **Dotenv** — Environment-specific config
- **Conventional Commits** — Git commit format and PR enforcement
- **Cypress Studio** — Visual E2E flow tester for QA

---

## Contact

For technical stack decisions, integration support, or runtime configuration help:  
support@yellowlettershop.com

