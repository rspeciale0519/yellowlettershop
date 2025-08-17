# **Yellow Letter Shop (YLS) Software Development Document**

**Version:** v1.5  
**Maintainer:** support@yellowlettershop.com

Yellow Letter Shop (YLS) is a **modern, full-stack SaaS platform** designed for real estate investors, marketers, and agencies. It facilitates the launch, automation, and optimization of **end-to-end personalized direct mail campaigns at scale**.

## **Overview**

YLS offers a complete direct mail automation pipeline. It enables users to:

* **Upload and validate mailing lists** with deduplication and **AccuZIP address validation**
* **Create and customize personalized print marketing materials** using the **Fancy Product Designer (FPD)** with dynamic token injection
* **Personalize mail** using dynamic tokens and contact cards, which are required per campaign and previewed in the design
* Select **multi-vendor fulfillment options** and manage vendors with pricing tiers and performance tracking
* **Automate campaign delivery** and configure split or repeat campaigns with **CRON management**
* Review proofs with a **PDF viewer and threaded comments** for annotation workflows
* Utilize **built-in AI features** for message personalization and contextual help, providing embedded AI-based tips by page/task
* **Track mail engagement** via **short link generation** with recipient-level tracking analytics and redirection logs
* Automate **skip tracing** with record-level lifecycle tracking and CSV ingestion
* Manage **user roles, teams, and permissions** (admin, manager, user, client) with user role-based access
* Integrate with **internal and external API access** and trigger/view **webhook events** with a retry queue
* Submit and analyze **feedback** via NPS prompts after proofs or reports
* Access **analytics reporting**, including visual KPI dashboards, scheduled and on-demand report generation with export options (CSV, PDF, Excel), filters, saved templates, and a recurring report delivery engine
* Utilize a **rollback engine** with visual diff, version history, and audit logging to restore overwritten records per list, record, or tag
* Access **admin tools** for impersonation, approvals, override workflows, and routing
* Manage **subscription billing** with plan-based limits via **Stripe**

The system supports team collaboration.

## **Core Technologies**

YLS is built using a modern technology stack with full CI/CD and observability pipelines.

| Area | Technology |
|------|------------|
| **Frontend** | **Next.js** (App Router), **React** 18+, **Tailwind CSS**, **TypeScript** |
| **Backend** | **Supabase** (PostgreSQL, RLS-secured data models, Auth, Storage), **Next.js API Routes**, **Prisma** |
| **Authentication** | **Supabase Auth**, **NextAuth.js** with JWT and OAuth |
| **APIs & Services** | **REST API** (Next.js routes), **AccuZIP** (address validation), **Stripe** (payment processing), **Fancy Product Designer (FPD)**, **OpenAI/Claude** (AI Services), **SendGrid/Mailgun** |
| **File Storage** | **AWS S3** via Supabase Storage/Buckets |
| **CI/CD** | **GitHub Actions** + **Vercel** (PR previews, staging, production) |
| **Monitoring** | **Sentry**, **Vercel Logs**, **Supabase Logs**, **Stripe Webhooks/Dashboard** |
| **Reporting Engine** | **CRON-based schedule**, export engine |

## **Key Features / Project Modules**

The YLS platform is structured around several key modules and features:

* **Order Wizard**: Manages the complete process from upload to checkout, including deduplication, mapping, validation, customization, and confirmation
* **Mailing List Management**: Supports upload with a deduplication toggle and **AccuZIP address validation**
* **Template Editor**: Powered by **Fancy Product Designer (FPD)** with token injection capabilities
* **Contact Card System**: Required per campaign and previewed in design, with plan-based enforcement
* **Campaign Configuration**: Full support for a multi-step print order wizard and campaign configuration
* **AI-powered Personalization**: Message personalization and contextual help
* **Vendor Management**: Add/edit vendors, define pricing tiers, and track service performance
* **Proof Review**: PDF annotation system with threaded comments
* **Skip Tracing**: Includes record-level lifecycle tracking and CSV ingestion
* **Short Link Tracking**: Generates short links and provides recipient-level tracking analytics and redirect logs
* **Rollback System**: Engine with visual diff and audit logging to restore overwritten records per list, record, or tag
* **Admin Tools**: Functionality for impersonation, approvals, override workflows, and routing
* **Subscription Billing**: Manages plan-based limits via **Stripe**
* **Analytics & Reporting Module**:
  * **Visual KPI dashboards** for users and admins
  * **Scheduled and on-demand report generation** with export options (CSV, PDF, Excel)
  * Filters for timeframes, campaign performance, vendor stats, and fulfillment logs
  * Saved report templates and a recurring report delivery engine
* **Contextual Help**: Embedded AI-based tips by page/task
* **Feedback Engine**: NPS + comment prompt after proofs or reports
* **Webhook Logs**: Custom event routing with retry queue
* **Team Collaboration**: Supports multi-user plans, invite flows, and permission enforcement
* **Role-based User Permissions**: Admin, manager, user, client roles supported

## **Getting Started**

To get started with development, **Node.js v18+ and npm v8+ are required**.

## **Documentation Index**

The following documents provide detailed information for developers:

| Document | Description |
|----------|-------------|
| **PRD.md** | Product goals, user personas, and comprehensive feature overview |
| **TECHNICAL_ARCHITECTURE.md** | System architecture, technology stack, infrastructure, and security |
| **API_AND_DATA.md** | Internal and third-party API documentation, database schema, and integrations |
| **FEATURES_AND_ADMIN.md** | Complete feature specifications, admin tools, pricing, roles, and analytics |
| **DEVELOPMENT_GUIDE.md** | Development workflow, testing strategy, deployment, and contribution guidelines |
| **UI_PATTERNS_AND_ROADMAP.md** | UI/UX patterns, interface specifications, and detailed product roadmap |

## **Developer Contact**

For all development questions, technical support, API documentation, feature clarification, DevOps assistance, QA support, or any other development-related inquiries:

**Email:** support@yellowlettershop.com

For all contributors, refer to the DEVELOPMENT_GUIDE.md for contribution and PR standards documentation.