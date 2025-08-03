# Yellow Letter Shop (YLS)

**Version:** v1.0  
**Maintainer:** devteam@yellowlettershop.com

Yellow Letter Shop is a full-stack SaaS platform designed for real estate investors, marketers, and agencies to run end-to-end personalized direct mail campaigns with address validation, template customization, payment processing, analytics, and automation support.

---

## Overview

YLS offers a complete direct mail automation pipeline with built-in validation, personalization, template design, order management, and performance reporting. It includes an admin panel, API access, affiliate system, and support for team collaboration.

The application is built using **Next.js**, **React**, **TypeScript**, **Supabase**, **Stripe**, **AWS S3**, and **Tailwind CSS** with full CI/CD pipelines and RLS-secured data models.

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
|---------------------------------|---------------------------------------------------------|
| [`PRODUCT_REQUIREMENTS.md`](./PRODUCT_REQUIREMENTS.md) | Product goals, user personas, feature overview       |
| [`TECH_STACK.md`](./TECH_STACK.md)                    | Frameworks, infrastructure, and tools                |
| [`DEVELOPMENT_TODO.md`](./DEVELOPMENT_TODO.md)        | Complete feature-level engineering task checklist    |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)                | System layers, flows, deployment structure           |
| [`DATA_MODELS.md`](./DATA_MODELS.md)                  | Schema definitions, relationships, RLS policies      |
| [`API_REFERENCE.md`](./API_REFERENCE.md)              | Internal and third-party endpoint documentation      |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md)                    | CI/CD, environment setup, rollback steps             |
| [`TESTING.md`](./TESTING.md)                          | QA process, E2E coverage, bug handling               |
| [`SECURITY.md`](./SECURITY.md)                        | Auth model, impersonation, audit logs, consent       |
| [`CHANGELOG.md`](./CHANGELOG.md)                      | Release history, version notes, roadmap              |

---

## Core Technologies

- **Frontend:** Next.js, React, Tailwind CSS, TypeScript
- **Backend:** Supabase (PostgreSQL, RLS, Auth)
- **APIs:** REST API (Next.js routes), AccuZIP, Stripe, FPD
- **Storage:** AWS S3 via Supabase Storage
- **CI/CD:** GitHub Actions + Vercel
- **Monitoring:** Sentry, Vercel Logs, Stripe Webhooks

---

## Developer Contacts

- DevOps / CI/CD: devops@yellowlettershop.com
- AI Engine & Prompt Design: ai@yellowlettershop.com
- Support Systems: qa@yellowlettershop.com
- Admin Tools or Escalation: admin@yellowlettershop.com

---

For all contributors, see [`CONTRIBUTING.md`](./CONTRIBUTING.md) for code formatting and PR guidelines.
