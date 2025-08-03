# Yellow Letter Shop (YLS)

**Version:** v1.5  
**Maintainer:** support@yellowlettershop.com

Yellow Letter Shop (YLS) is a full-stack SaaS platform designed to help real estate investors, marketers, and agencies launch, automate, and optimize direct mail campaigns. The system includes mailing list validation, print template customization, vendor routing, AI personalization, annotation workflows, webhook integrations, campaign scheduling, short link tracking, analytics dashboards, feedback collection, team collaboration, rollback tooling, and recurring report generation.

---

## Overview

YLS enables users to:
- Upload and validate mailing lists (AccuZIP integration)
- Customize print templates using Fancy Product Designer (FPD)
- Personalize mail using dynamic tokens and contact cards
- Configure split and repeat campaigns
- Track mail engagement via short links
- Annotate and approve proofs
- Automate skip tracing
- Route orders to third-party vendors
- Manage user roles, teams, and permissions
- Trigger and view webhook events
- Submit and analyze feedback (NPS)
- View dashboards with exportable KPIs and analytics
- Schedule recurring reports and monitor delivery logs
- Roll back record changes with version history and audit logs

---

## Core Technologies

| Area        | Technology                         |
|-------------|-------------------------------------|
| Frontend    | Next.js, React, Tailwind CSS       |
| Backend     | Supabase (PostgreSQL, Auth, Storage), Prisma |
| Design Tool | Fancy Product Designer (FPD)       |
| AI Services | OpenAI or Claude                   |
| Validation  | AccuZIP (address verification)     |
| Payments    | Stripe                             |
| File Storage| AWS S3 (via Supabase)              |
| CI/CD       | GitHub Actions + Vercel            |
| Monitoring  | Sentry, Vercel Logs, Supabase Logs |
| Reports     | CRON-based schedule, export engine |

---

## Getting Started

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

Requires Node.js v18+ and npm v8+.

---

## Project Modules

- **Order Wizard** — Upload, deduplicate, map, validate, customize, confirm, checkout
- **Contact Cards** — Required per campaign, previewed in design
- **Vendor Management** — Add/edit vendors, pricing tiers, service tracking
- **Proof Review** — PDF annotation system with threaded comments
- **Campaign Scheduler** — Split drops or repeat intervals with CRON management
- **Short Link Tracking** — Per-recipient redirect logs and analytics
- **Rollback System** — Restore overwritten records per list, record, or tag
- **Contextual Help** — Embedded AI-based tips by page/task
- **Feedback Engine** — NPS + comment prompt after proofs or reports
- **Webhook Logs** — Custom event routing with retry queue
- **Scheduled Reports** — Recurring exports (CSV, PDF, Excel) with delivery tracking
- **Team Collaboration** — Multi-user plans, invite flow, permission enforcement

---

## Documentation Index

| File                             | Description                                      |
|----------------------------------|--------------------------------------------------|
| [`PRD.md`](./PRD.md)             | Product Requirements                            |
| [`TECH_STACK.md`](./TECH_STACK.md) | Frameworks and Tools Overview               |
| [`DEVELOPMENT_TODO.md`](./DEVELOPMENT_TODO.md) | Build Tasks Checklist         |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | App Structure and Flow                 |
| [`DATA_MODELS.md`](./DATA_MODELS.md) | Database Tables and Relationships          |
| [`API_REFERENCE.md`](./API_REFERENCE.md) | Internal & External API Docs           |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | CI/CD, Rollbacks, Secrets, Monitoring      |
| [`TESTING.md`](./TESTING.md)     | QA Strategy and E2E Coverage                    |
| [`SECURITY.md`](./SECURITY.md)   | Auth, RLS, Audit Logs, Privacy Controls         |
| [`CHANGELOG.md`](./CHANGELOG.md) | Version History and Feature Updates             |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Development Process Guidelines          |
| [`ANALYTICS_AND_REPORTING.md`](./ANALYTICS_AND_REPORTING.md) | Dashboards, Reports, Scheduling |

---

## Developer Contacts

| Area                        | Email                          |
|-----------------------------|---------------------------------|
| DevOps & CI/CD              | support@yellowlettershop.com   |
| API or Webhooks             | support@yellowlettershop.com   |
| AI Features & Help Layer    | support@yellowlettershop.com   |
| QA & Testing Coverage       | support@yellowlettershop.com   |
| Vendor Routing, Admin Tools| admin@yellowlettershop.com     |
| Feedback & NPS Responses    | support@yellowlettershop.com   |

