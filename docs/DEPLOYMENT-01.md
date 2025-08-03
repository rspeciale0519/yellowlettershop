# Deployment Guide

_Last Updated: April 2025_

This document outlines the deployment procedures, environment configurations, CI/CD setup, email integration triggers, and rollback strategies for the Yellow Letter Shop (YLS) platform. It includes requirements for proof ingestion, annotation workflows, third-party fulfillment, and Stripe fund capture.

---

## 1. Deployment Environments

| Environment | Description                          | Hosting      |
|-------------|--------------------------------------|--------------|
| Local Dev   | Developer workstations               | N/A          |
| Preview     | Per-pull request auto deploys        | Vercel       |
| Staging     | Internal QA & testing                | Vercel       |
| Production  | Live site (yellowlettershop.com)     | Vercel       |

---

## 2. CI/CD Pipeline

### Provider: GitHub Actions

#### Triggers:
- `push` to `main`: deploy to production
- `pull_request` to `main`: deploy to preview

#### Workflow Steps:
- Lint: `npm run lint`
- Type Check: `npm run typecheck`
- Unit Tests: `npm run test`
- E2E Tests (Cypress): full run in headless mode
- Build: `npm run build`
- Deploy: via Vercel (auto-connected)

---

## 3. Environment Configuration

| File             | Used In            |
|------------------|--------------------|
| `.env.local`     | Local development  |
| `.env.staging`   | Staging            |
| `.env.production`| Production         |

### Environment Secrets
- Managed via Vercel and GitHub repository settings
- Includes:
  - Supabase project URL + anon key
  - Stripe public/secret keys
  - AccuZIP API credentials
  - FPD config URLs
  - Email credentials (SendGrid or Mailgun for outbound/inbound)

---

## 4. Email Inbound & Outbound Routing

### Outbound Email (Proofs, Approvals, Status Updates)
- Sent through SendGrid or Postmark
- Includes dynamic links to proofs, review pages, and annotation summaries
- All emails are signed and tracked for delivery

### Inbound Email (MBI Proof Revisions)
- Routed through SendGrid Inbound Parse or Mailgun Routes
- Handled via webhook:
  - Attachments are parsed
  - Files saved to `/order-proofs/`
  - Order ID extracted via subject line convention
  - Order record updated to `awaiting_approval`
  - Notification triggered to customer

---

## 5. Rollback Strategy

### Vercel
- Navigate to project dashboard
- Deployments tab → re-deploy previous commit

### GitHub Actions
- Tag known stable commit with `rollback/x.y.z`
- Trigger manual deployment via CI

### Manual Fix Path (Emergency)
- Disable MBI routing feature flag
- Manually re-upload revised proof in admin dashboard
- Notify customer manually with override email

---

## 6. Monitoring & Observability

| Tool           | Purpose                              |
|----------------|---------------------------------------|
| Sentry         | Frontend and backend error tracking   |
| Vercel Logs    | Runtime function logs                 |
| Supabase Logs  | Auth, RLS, and storage events         |
| Stripe Logs    | Billing, hold, release, and failures  |
| Email Provider | Bounce logs, delivery verification    |

---

## 7. Pre-Launch Validation Checklist

- [ ] CI checks pass: lint, typecheck, Jest, Cypress
- [ ] Stripe test payments and fund holds behave correctly
- [ ] Proof upload, annotation, and approval flow operates without error
- [ ] Inbound email parsing succeeds and triggers order update
- [ ] Order dashboard updates properly on all customer actions
- [ ] Admin dashboard tools function as expected (manual override, impersonation)
- [ ] Notifications sent and tracked from proof ingestion to order approval
- [ ] RLS policies and data isolation verified for all roles

---

## 8. Release Sign-Off

Each production deployment must be reviewed and approved by:
- QA Team Lead (qa@yellowlettershop.com)
- DevOps Owner (devops@yellowlettershop.com)
- Product Lead (product@yellowlettershop.com)