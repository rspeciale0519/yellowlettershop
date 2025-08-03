# Technology Stack Documentation

_Last Updated: April 2025_

This document outlines the full technology stack used to build, scale, and maintain the Yellow Letter Shop (YLS) platform. It includes frameworks, services, tools, patterns, and architectural choices that support all current features including third-party print integration, proof annotation, AI personalization, automation, contextual help, analytics dashboards, and scheduled report generation.

---

## 1. Overview

YLS is a full-stack SaaS platform deployed on Vercel with a modular architecture. It leverages Supabase for backend services, AWS S3 for asset storage, Stripe for billing, FPD for design editing, and email routing for third-party print management. The stack is optimized for modern developer workflows, extensibility, and rapid iteration.

---

## 2. Frontend

### Core Framework
- **Next.js (v14+)**
  - App Router with server-side rendering (SSR)
  - API Routes for internal backend logic
  - Incremental static regeneration for marketing pages

### UI Layer
- **React (v18+)**
  - Functional components and hooks
  - Server components used for optimal SSR

### Styling
- **Tailwind CSS (v3+)**
  - Mobile-first utility-first classes
  - Custom theming and responsive design

### UI Components
- **Lucide React** – Icon set
- **ShadCN/UI** – Dropdowns, modals, form elements
- **React-PDF / PDF.js** – Embedded PDF proof viewer with annotation overlays
- **Recharts or ApexCharts** – Analytics dashboard charting library

---

## 3. Backend

### API Layer
- **Next.js API Routes**
  - Organized by module (orders, templates, mailing lists, admin, analytics)
  - Secured with session tokens and Supabase Auth
  - JSON APIs and file-based routing for RESTful structure

### Authentication
- **NextAuth.js** + **Supabase Auth**
  - OAuth (Google)
  - JWT-based session management
  - Session propagation to frontend and backend contexts

### Authorization
- **Supabase Row-Level Security (RLS)**
  - Enforced on all major tables
  - Fine-grained access control
  - Admin server role overrides scoped in backend logic

### ORM
- **Prisma**
  - Type-safe database access
  - Schema migration and validation

---

## 4. Database

- **Supabase PostgreSQL**
  - Core business entities (users, orders, designs, lists, proofs, reports)
  - JSONB for flexible storage (records, annotations, filters, AI results)
  - RLS + audit log enforcement

### Additional Tables
- `orders`, `order_proofs`, `proof_annotations`, `proof_annotation_replies`
- `record_change_logs`, `audit_logs`, `validated_mailing_lists`
- `short_links`, `scheduled_reports`, `saved_reports`, `analytics_snapshots`

---

## 5. File Storage

- **Supabase Storage via AWS S3**
  - Buckets:
    - `uploads` – User-imported files
    - `designs` – Saved user templates
    - `template-previews` – Rendered previews
    - `order-proofs` – Received and revised PDF proofs
    - `skip-trace` – Uploaded/enriched vendor files

---

## 6. Email Infrastructure

### Outbound Email
- **SendGrid or Postmark (configurable)**
  - Transactional emails (order status, proof readiness, approval prompts, report delivery)
  - Emails to MBI with proofs or secure file links

### Inbound Email
- **SendGrid Inbound Parse or Mailgun Routes**
  - Email-to-webhook parser
  - Routes revised proofs and enriched files from vendors to backend for processing

---

## 7. Third-Party Services

### Stripe
- One-time billing, fund holds, and capture/release flow
- Webhooks for payment status and error recovery

### AccuZIP
- USPS CASS-certified address validation
- Batch and automation-friendly

### Fancy Product Designer (FPD)
- Template editing and personalization token injection
- JSON config rendered with canvas engine

### OpenAI / Claude
- AI content generation based on prompt templates
- Usage tied to subscription tier limits

---

## 8. Annotation System

- **React-PDF + Custom Overlay Tools**
  - Users annotate directly on PDF proofs
  - Coordinates stored relative to page dimensions
  - Sidebar threaded comment UI for annotation conversations
  - Stored in Supabase tables and surfaced via API

---

## 9. Analytics & Reporting

- **Recharts or ApexCharts** – Render charts on user/admin dashboards
- **Custom Analytics API Routes** – Scoped by user session or admin privileges
- **Recurring Reports** – Scheduled via Supabase CRON or Vercel edge functions
- **Export Formats** – Reports generated in CSV, PDF, or Excel
- **Short Link Metrics** – Campaign and recipient level engagement tracking

---

## 10. Testing & CI/CD

### Testing Stack
- **Jest** – Unit tests
- **React Testing Library** – Component testing
- **Cypress** – Full user workflows (upload → order → proof review → skip trace → reports)

### Deployment
- **Vercel** – Frontend and API hosting
- **GitHub Actions** – CI pipeline: lint → typecheck → test → deploy

---

## 11. Monitoring & Logging

- **Sentry** – Frontend + API error tracking
- **Vercel Logs** – Runtime logs
- **Supabase Logs** – Query audits, auth errors
- **Stripe Dashboard** – Billing and payment lifecycle
- **Mailgun/SendGrid Logs** – Email delivery and inbound parsing
- **Audit Logs** – Admin overrides, user changes, proof activity
- **Analytics Logs** – Short link tracking, report runs, dashboard loads

---

## 12. Development Tools

- **ESLint** and **Prettier** – Linting and formatting
- **Zod** – Runtime input validation for API routes
- **Dotenv** – Environment config
- **Conventional Commits** – Commit message standard

---

For questions about stack choices or setup:  
support@yellowlettershop.com

