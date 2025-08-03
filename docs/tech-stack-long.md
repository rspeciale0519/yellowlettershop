# **Tech Stack Documentation – Yellow Letter Shop (YLS)**

## **Overview**

This document outlines the complete technical architecture, frameworks, services, and tooling used in the Yellow Letter Shop (YLS) application. The stack has been selected to support a robust, scalable, secure, and responsive direct mail SaaS platform optimized for marketing professionals and business users.

---

## **1\. Frontend**

### **Frameworks & Languages**

* **Next.js**: React framework for hybrid static & server-side rendering, routing, and optimized performance.

* **React**: Component-based UI framework.

* **TypeScript**: Strongly typed superset of JavaScript to reduce runtime errors and improve maintainability.

### **Styling**

* **Tailwind CSS**: Utility-first CSS framework for building consistent, responsive UIs.

* **shadcn/ui**: Headless Tailwind component library for structured, accessible UI primitives (modals, popovers, tabs, etc.).

### **Component Libraries**

* **TanStack Table**: Highly customizable headless table component for the Mailing List Manager.

* **Recharts**: Declarative charting library built on React for analytics and campaign reporting.

* **Fancy Product Designer (FPD)**: Embedded WYSIWYG canvas editor for mail piece customization with variable tag support.

### **Other**

* **React Hook Form \+ Zod**: For performant, schema-validated forms.

* **Framer Motion**: For interactive, animated transitions.

---

## **2\. Backend & Database**

### **Supabase**

* **Database**: PostgreSQL (hosted)

* **Authentication**: Supabase Auth with JWTs (integrated with NextAuth.js)

* **Row-Level Security (RLS)**: Enforced at the database level to ensure tenant-level data protection.

* **Storage**: Supabase Storage for list uploads, template previews, and other static files.

### **Server Functions**

* **Next.js API Routes**: Lightweight backend logic, form submission endpoints, file validation, and Stripe webhooks.

### **Scheduled/Background Jobs (planned)**

* **Supabase Edge Functions**: For future background processing (e.g., address validation, campaign status updates).

---

## **3\. Third-Party Integrations**

### **Payment & Billing**

* **Stripe**

  * Payment authorization and delayed capture.

  * Support for pricing tiers, discounts, and metered add-ons.

  * Webhooks for order lifecycle events.

### **Email Delivery**

* **Mailgun**

  * Transactional emails: design approval, status updates, campaign shipped.

  * Suppression handling and deliverability monitoring.

  * Inbound email parsing (future feature).

### **Mail Piece Designer**

* **Fancy Product Designer (FPD)**

  * JavaScript integration loaded via CDN or local bundle

  * Real-time canvas rendering for letters, postcards, envelopes

  * Dynamic placeholder support for variables (e.g., {{FirstName}}, {{PropertyAddress}})

  * Load/save product designs using JSON structure

  * API methods for adding text, images, switching views, and triggering export

  * Layer and object locking for controlling editability

### **Address Validation & Direct Mail Processing**

* **AccuZIP REST API**

  * CASS-certified address validation

  * Deduplication, vacant filtering

  * Presort and barcode generation

  * AccuTrace integration for mail tracking

  * CASS-certified address validation

  * Deduplication, vacant filtering

  * Presort and barcode generation

  * AccuTrace integration for mail tracking

---

## **4\. File & Asset Storage**

* **AWS S3**

  * Secure asset storage (mailing lists, images, proof previews)

  * Signed URLs and role-based access enforced via Supabase

---

## **5\. CI/CD & DevOps**

### **Code Management**

* **GitHub**: Source control, pull request workflows

* **GitHub Actions**: CI/CD pipeline for test, build, and deploy stages

### **Testing**

* **Jest**: Unit and integration testing

* **Cypress**: End-to-end UI testing

### **Deployment**

* **Vercel**: Hosting for frontend and serverless backend (Next.js)

---

## **6\. Security & Compliance**

* **Supabase RLS**: Enforces strict access control at query level

* **HTTPS Everywhere**: All frontend/backend communication over TLS

* **GDPR**: Structured opt-in, data deletion, and email consent flows

* **Audit Logging**: For future compliance tracking

---

## **7\. Environment & Tooling**

* **V0 by Vercel**: For initial UI prototyping and generation

* **Windsurf / Cursor**: AI development tools used for full-stack coding assistance

* **Prettier \+ ESLint**: Code formatting and linting standards

* **Visual Studio Code**: Recommended editor with full TypeScript support

---

## **8\. Future Infrastructure Enhancements**

* Background job queue using **Upstash Redis** or **Supabase Queue**

* Full-text search integration with **pgvector** or **Typesense**

* Mobile app build using **Expo \+ React Native**

* AI service layer for copy generation via **OpenAI API**

---

This document serves as the definitive technical reference for YLS engineering, product, and devops teams.

