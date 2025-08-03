# **One-Page Tech Stack Summary – Yellow Letter Shop (YLS)**

## **Overview**

This one-page document provides a high-level summary of the complete tech stack used to build and run the Yellow Letter Shop (YLS) direct mail automation platform.

---

## **Frontend**

* **Next.js \+ React \+ TypeScript**: Core framework for server-rendered UI and routing.

* **Tailwind CSS \+ shadcn/ui**: Styling and component primitives.

* **TanStack Table**: Custom mailing list tables.

* **Recharts**: Dashboard charting and analytics.

* **Fancy Product Designer (FPD)**: Drag-and-drop editor for mail pieces.

* **React Hook Form \+ Zod**: Form handling and validation.

* **Framer Motion**: UI animations.

## **Backend & Storage**

* **Supabase**: PostgreSQL, Auth, Storage (with RLS enabled).

* **Next.js API Routes**: For business logic and webhooks.

* **AWS S3**: Secure file storage with signed access control.

## **Third-Party Integrations**

* **Stripe**: Payment authorization, delayed capture, metered billing.

* **Mailgun**: Transactional emails and deliverability management.

* **AccuZIP REST API**: CASS validation, deduplication, mail tracking.

* **Fancy Product Designer API**: Dynamic design editor and JSON state control.

## **CI/CD, Deployment & Tooling**

* **GitHub \+ GitHub Actions**: Source control and continuous deployment.

* **Vercel**: Hosting for frontend and backend.

* **Jest \+ Cypress**: Unit and end-to-end testing.

* **Prettier \+ ESLint**: Code formatting and linting.

* **V0, Windsurf, Cursor**: AI-assisted development tooling.

## **Security & Compliance**

* Supabase RLS for tenant isolation

* TLS/HTTPS enforcement

* GDPR-compliant workflows

---

This tech stack ensures reliability, scalability, and extensibility for YLS's direct mail SaaS application.

