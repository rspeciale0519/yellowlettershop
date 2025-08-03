# Technology Stack Documentation

_Last Updated: April 2025_

This document outlines the full technology stack used to build, scale, and maintain the Yellow Letter Shop (YLS) platform. It includes frameworks, services, tools, patterns, and architectural choices that govern both the frontend and backend.

---

## 1. Overview

The Yellow Letter Shop platform is a full-stack SaaS web application built with modern technologies and best practices. It is deployed on Vercel, uses Supabase for backend services, AWS S3 for asset storage, Stripe for billing, and Fancy Product Designer for real-time print design.

---

## 2. Frontend

### Core Framework
- **Next.js (v14+)**
  - App Router for file-based routing
  - SSR + SSG support
  - API Routes for backend logic
  - Incremental static regeneration

### UI Framework
- **React (v18+)**
  - Functional components with Hooks
  - Server components used for SSR optimization

### Type Safety
- **TypeScript (v5+)**
  - Strict typing enabled
  - Custom type definitions and interfaces used platform-wide

### Styling
- **Tailwind CSS (v3+)**
  - Mobile-first utility classes
  - Custom theme config (brand colors, spacing)
- **CSS Modules** (when scoped styles are needed)

### UI Libraries
- **Lucide React**: Icon set (scalable SVG icons)
- **ShadCN/UI** *(selective use)*: Inputs, modals, and primitives

---

## 3. Backend

### API Layer
- **Next.js API Routes**
  - RESTful route structure
  - Organized by feature/module
  - Includes Stripe, AccuZIP, FPD proxies, and automation handlers

### Authentication
- **NextAuth.js** with **Supabase Auth**
  - JWT-based auth
  - OAuth via Google
  - Session stored in cookies and injected via middleware

### Authorization
- **Supabase Row-Level Security (RLS)**
  - Enforced at the database layer
  - Separate admin key used for elevated access (backend only)

---

## 4. Database

- **Supabase PostgreSQL**
  - All business data, including users, lists, templates, orders, and tickets
  - JSONB used for mailing list records and AI snapshots
  - RLS + policies per table

### ORM
- **Prisma**
  - Used for typed query access and schema migration

---

## 5. File Storage

- **AWS S3 via Supabase Storage**
  - Buckets:
    - `uploads`: User files
    - `template-previews`: Design renders
    - `designs`: Saved templates
  - IAM policy control scoped per user folder

---

## 6. Design & Print Engine

- **Fancy Product Designer (FPD)**
  - Used for template editing and design previews
  - Config stored in JSON, rendered using canvas (fabric.js)
  - Personalized preview generation via backend route

---

## 7. Payments

- **Stripe**
  - Supports one-time orders and subscriptions (Free, Pro, Team, Enterprise)
  - Webhooks:
    - `checkout.session.completed`
    - `invoice.paid`
    - `payment_intent.failed`

---

## 8. AI Personalization

- **OpenAI / Anthropic Claude (future phases)**
  - Prompt injection system
  - Preview generated personalized messages
  - Controlled via usage limits and stored in `ai_personalization_outputs`

---

## 9. Address Validation

- **AccuZIP CASS-Certified API**
  - Validates USPS deliverability
  - Returns error codes, DPV confirmation, ZIP+4 corrections
  - Used during list validation and automation runs

---

## 10. Deployment & DevOps

- **Vercel**
  - Primary hosting for frontend and API routes
  - Edge functions for SSR and performance

- **GitHub Actions**
  - Lint, type check, test
  - E2E with Cypress
  - Preview deployments on pull requests

---

## 11. Testing Stack

- **Jest** for unit tests
- **React Testing Library** for component tests
- **Cypress** for E2E user flows
- **Vercel Previews** for manual QA

---

## 12. Monitoring & Logs

- **Sentry** for error monitoring
- **Vercel logs** for serverless functions
- **Stripe dashboard** for payment errors
- **Supabase Logs** for RLS failures and storage events

---

## 13. Analytics

- **Google Analytics** for behavior tracking
- **Stripe + platform metrics** for revenue dashboards
- **Scheduled reports** for admins and users (CSV, PDF, XLSX)

---

## 14. Developer Tools

- **ESLint** and **Prettier** for formatting
- **Zod** for runtime validation of all API inputs
- **Dotenv** for local environment config
- **Conventional Commits** recommended for PR messages

---

## Contact

For questions about infrastructure, architecture, or environment setup:
- devops@yellowlettershop.com
