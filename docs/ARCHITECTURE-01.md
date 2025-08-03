# Architecture Documentation

_Last Updated: April 2025_

This document outlines the architectural design of the Yellow Letter Shop (YLS) platform, covering all major application layers, data flow, infrastructure components, deployment practices, and scaling considerations. It is tightly aligned with the PRD, Tech Stack, and API specifications.

---

## 1. System Overview

Yellow Letter Shop is a cloud-based SaaS application that enables users to manage personalized direct mail campaigns. It combines a Next.js frontend, Supabase backend, Stripe billing, S3-based asset storage, and custom logic for design editing and automation.

---

## 2. Architectural Diagram

```
[Client Browser] ---> [Next.js SSR / API Routes]
                         |       |
                         |       v
                [Supabase DB]  [FPD Canvas + Assets]
                         |
             [Stripe API]   [AccuZIP API]
                         |
                      [S3 Buckets (via Supabase)]
                         |
                 [Admin Tools + Monitoring Layer]
```

---

## 3. Application Layers

### A. Presentation Layer
- Built with Next.js + Tailwind CSS
- Uses App Router, server components, and layouts
- Includes in-app modals, dropdowns, FPD design editor

### B. API Layer (Backend)
- Powered by Next.js API Routes
- Grouped by resource:
  - `/api/templates`
  - `/api/mailing-lists`
  - `/api/accuzip/validate`
  - `/api/orders`
  - `/api/stripe`, `/api/payments`
  - `/api/notifications`

### C. Database Layer
- Supabase PostgreSQL with Row-Level Security (RLS)
- Prisma used for schema modeling and typed access
- JSONB fields for flexible content (e.g., list records, template data)

### D. File Storage Layer
- Supabase Storage backed by AWS S3
- Bucket structure:
  - `uploads/`
  - `designs/`
  - `template-previews/`

### E. Third-Party Integrations
- **Stripe**: Billing and subscriptions
- **AccuZIP**: USPS address validation
- **Fancy Product Designer (FPD)**: Template editor and design previews
- **OpenAI/Claude (optional)**: AI personalization engine

---

## 4. Auth & Permissions Architecture

### Auth
- NextAuth.js + Supabase Auth
- JWT session, cookie stored, passed to API and SSR

### Role Enforcement
| Role     | Description                             |
|----------|-----------------------------------------|
| Admin    | Full platform access                    |
| Manager  | Team management, orders, templates      |
| User     | Can place orders and customize designs  |
| Client   | Read-only access to designs/orders      |

### RLS (Row-Level Security)
- All major tables scoped by `user_id`
- Admin can override via service role key

---

## 5. Deployment & DevOps

- **Vercel** used for all hosting and deployments
  - Auto-deploy from `main` and pull request previews
- **GitHub Actions**
  - Test → Lint → Build → Deploy
  - CI required for all merges into `main`
- **Environment Configuration**
  - Secrets managed in Vercel dashboard
  - `.env.local`, `.env.staging`, `.env.production`

---

## 6. Automation Engine

- Executes scheduled or rule-based campaigns
- Stored as:
  - `mail_automations`
  - `mail_automation_steps`
- Queues execution every 6 hours (configurable)
- Validates addresses and re-renders templates per run

---

## 7. Audit & Observability

- **Sentry** for error monitoring
- **Vercel Logs** for runtime debugging
- **Stripe Dashboard** for financial tracking
- **Supabase Logs** for auth/storage events
- Internal `audit_logs` table for all impersonation + admin actions

---

## 8. Scalability Considerations

- RLS allows multi-tenant scaling by user or team ID
- JSONB allows flexibility in list formatting
- Static + SSR rendering split for performance
- Supabase storage offloads asset load from DB
- Future: offload mail rendering and print queue to worker layer

---

## 9. Future Modularization Plans

- Extract API layer into standalone Next.js server or tRPC monorepo
- Migrate mail automation and FPD preview generation into queue-backed workers
- Add GraphQL gateway for enterprise API consumption
- PWA shell for mobile-first mail automation on the go

---

For architectural questions or infrastructure contributions, contact: devops@yellowlettershop.com
