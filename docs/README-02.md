# Yellow Letter Shop (YLS)

**Version:** v1.4  
**Maintainer:** devteam@yellowlettershop.com

Yellow Letter Shop (YLS) is a modern, full-stack SaaS platform designed to help real estate investors, marketers, and agencies launch, automate, and optimize direct mail campaigns at scale. The system supports validated data import, template personalization, multi-vendor fulfillment, proof review, AI assistance, annotation workflows, campaign scheduling, skip tracing, tracking URLs, and rollback functionality.

---

## Overview

YLS enables users to create personalized print marketing materials, validate and deduplicate mailing lists, select fulfillment options, and automate campaign delivery. The system includes built-in AI features, user role-based access, recipient tracking, short link redirection, design locking, rollback tools, support ticketing, team collaboration, internal and external API access, vendor management, and analytics reporting.

YLS is built using **Next.js**, **React**, **TypeScript**, **Tailwind CSS**, **Supabase**, **Stripe**, and **AWS S3**. It is deployed via **Vercel** with full CI/CD and observability pipelines.

---

## Quick Start

```bash
# Clone the repository
$ git clone https://github.com/your-org/yellow-letter-shop.git
$ cd yellow-letter-shop

# Copy environment template and install dependencies
$ cp .env.example .env.local
$ npm install

# Run the dev server
$ npm run dev
```

---

## Documentation Index

| Document                        | Description                                             |
|--------------------------------|---------------------------------------------------------|
| [`PRD.md`](./PRD.md)                       | Product requirements, personas, and features          |
| [`TECH_STACK.md`](./TECH_STACK.md)         | Frameworks, services, and infrastructure              |
| [`DEVELOPMENT_TODO.md`](./DEVELOPMENT_TODO.md) | Task checklist covering all app features           |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)     | System layers, data flow, and module interaction      |
| [`DATA_MODELS.md`](./DATA_MODELS.md)       | Database schema, constraints, and RLS policies        |
| [`API_REFERENCE.md`](./API_REFERENCE.md)   | Internal REST endpoints and third-party integrations  |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md)         | CI/CD, rollback, secrets, and environment setup       |
| [`TESTING.md`](./TESTING.md)               | QA strategy, coverage goals, and validation flows     |
| [`SECURITY.md`](./SECURITY.md)             | Auth architecture, impersonation, audit logs          |
| [`CHANGELOG.md`](./CHANGELOG.md)           | Version history, recent updates, and roadmap          |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md)     | Internal contribution process and PR requirements     |

---

## Core Technologies

- **Frontend:** Next.js (App Router), React 18+, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage), Next.js API Routes
- **Authentication:** Supabase Auth + NextAuth.js with JWT and OAuth
- **APIs & Services:** Stripe, AccuZIP, Fancy Product Designer, OpenAI/Claude, SendGrid/Mailgun
- **File Storage:** AWS S3 via Supabase Buckets
- **CI/CD:** GitHub Actions + Vercel (PR previews, staging, production)
- **Monitoring:** Sentry, Supabase Logs, Vercel Logs, Stripe Dashboard

---

## Key Features

- Mailing list upload with deduplication toggle and AccuZIP address validation
- Template editor powered by Fancy Product Designer with token injection
- Contact card system with plan-based enforcement
- Role-based user permissions: admin, manager, user, client
- Full support for multi-step print order wizard and campaign configuration
- AI-powered message personalization and contextual help
- Vendor management with pricing tiers and performance tracking
- Proof annotation with PDF viewer and threaded comments
- Skip tracing with record-level lifecycle tracking and CSV ingestion
- Short link generation and recipient-level tracking analytics
- Rollback engine with visual diff and audit logging
- Admin tools for impersonation, approvals, override workflows, and routing
- Subscription billing with plan-based limits via Stripe

---

## Developer Contacts

- DevOps / CI/CD: support@yellowlettershop.com  
- AI Personalization & Prompting: support@yellowlettershop.com  
- QA & Testing: support@yellowlettershop.com  
- Admin Tools, Routing, or Escalations: admin@yellowlettershop.com

---

For contribution and PR standards, see [`CONTRIBUTING.md`](./CONTRIBUTING.md).

