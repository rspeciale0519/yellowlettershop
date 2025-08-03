# Deployment Guide

*Last Updated: April 2025*

This document outlines the deployment procedures, CI/CD configuration, environment setup, rollback strategy, webhook triggers, and pre-launch validation for the Yellow Letter Shop (YLS) platform. It includes critical workflows for proof ingestion, annotation, skip tracing, Stripe fund capture, contextual AI help, short link tracking, and rollback support.

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
- E2E Tests: Cypress (upload → design → proof → skip trace → rollback)
- Build: `npm run build`
- Deploy: via Vercel auto-deployment

---

## 3. Environment Configuration

| File             | Used In            |
|------------------|--------------------|
| `.env.local`     | Local development  |
| `.env.staging`   | Staging            |
| `.env.production`| Production         |

### Managed Secrets via Vercel + GitHub
- Supabase keys (anon/public + service)
- Stripe keys (public + secret)
- AccuZIP API credentials
- Email (SendGrid or Mailgun)
- FPD configuration URLs
- AI provider API keys (OpenAI/Anthropic)

---

## 4. Email Routing (Proofs + Skip Trace)

### Outbound
- Sent via SendGrid or Postmark
- Emails include:
  - Design proof links
  - Mailing list attachments
  - Skip trace request CSVs

### Inbound
- Routed through:
  - Mailgun Routes or SendGrid Inbound Parse
- Webhook triggers parse logic:
  - Identify order via subject
  - Save file to `/order-proofs/` or `/skip-trace/`
  - Update order status and notify customer

---

## 5. Rollback Strategy

### Vercel UI
- Navigate to project → Deployments
- Select commit → Click "Redeploy"

### GitHub Actions
- Tag commit as `rollback/x.y.z`
- Manually trigger deployment from rollback commit

### Manual Rollback (Emergency)
- Temporarily disable `auto_fulfillment_timeout_enabled`
- Re-upload revised proofs or lists via admin UI
- Restore affected records using rollback interface
- Notify impacted users directly

---

## 6. Short Link Redirects

- Tracked via `/api/track/:code`
- Auto-logs redirect event (timestamp, record ID, IP)
- Critical endpoint — must be monitored for 99.99% uptime
- Smart redirect logic resolves URL dynamically

---

## 7. Contextual Help System

- Embedded JS layer loaded conditionally by route
- Calls `/api/help/contextual?step=...`
- Cached on client for performance
- Fallback: static JSON help file (for failover UX)

---

## 8. Pre-Launch Validation Checklist

- [ ] CI checks pass: lint, typecheck, Jest, Cypress
- [ ] Stripe test payments and fund holds succeed
- [ ] Mailing list upload → dedupe → validate flow completes
- [ ] Proof generation, annotation, and approval flow verified
- [ ] Inbound proof/skip trace file parsing succeeds
- [ ] Order dashboard reflects user actions in real time
- [ ] Admin routing UI correctly logs all actions
- [ ] Rollback tool recovers historical record state
- [ ] Short links redirect and track usage accurately
- [ ] AI help displays correct content on all wizard steps
- [ ] Notification emails are received and formatted correctly
- [ ] RLS enforcement confirmed for all user roles

---

## 9. Monitoring & Observability

| Tool             | Purpose                                  |
|------------------|-------------------------------------------|
| Sentry           | Runtime errors (frontend + backend)       |
| Vercel Logs      | Serverless logs and request tracing       |
| Supabase Logs    | DB query logs, storage events, auth       |
| Stripe Dashboard | Payment lifecycle tracking                |
| Mailgun Logs     | Email delivery, parsing, bounce status    |
| Audit Log Table  | Tracks changes, routing, impersonation    |
| Short Link Logs  | Link redirect tracking and status         |

---

## 10. Release Sign-Off

Before any production deployment, approvals must be received from:
- QA Owner (manual validation + automated results)
- DevOps Reviewer (secrets, build, and runtime readiness)
- Product Lead (feature review and compliance)

All releases must pass the Pre-Launch Checklist in Section 8.

---

## Contact

For deployment assistance, pipeline failures, or rollback requests:  
support@yellowlettershop.com