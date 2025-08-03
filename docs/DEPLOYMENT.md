# Deployment Guide

*Last Updated: April 2025*

This document outlines the deployment process for the Yellow Letter Shop (YLS) platform. It includes CI/CD pipelines, environment setup, Stripe manual capture support, payment hold release logic, rollback flow, stored payment method initialization, webhook retry infrastructure, and launch readiness.

---

## 1. Deployment Environments

| Environment | Description                      | Hosting  |
|-------------|----------------------------------|----------|
| Local Dev   | Developer workstations           | N/A      |
| Preview     | Auto-deploy for PR branches      | Vercel   |
| Staging     | Internal QA and regression suite | Vercel   |
| Production  | Live version                     | Vercel   |

---

## 2. CI/CD Pipeline

### Provider: GitHub Actions

#### Triggered Workflows:
- On `main` → Deploys to production
- On PR → Creates preview deployment

#### Steps:
```bash
npm run lint
npm run typecheck
npm run test
npm run cypress:run
npm run build
```

CI must pass before merge. Cypress screenshots are stored per-branch and compared with baseline.

---

## 3. Environment Variables

| Key                      | Context             |
|--------------------------|---------------------|
| STRIPE_SECRET_KEY        | Stripe payments     |
| STRIPE_WEBHOOK_SECRET    | Stripe webhook auth |
| SUPABASE_SERVICE_ROLE    | Admin-only actions  |
| SUPABASE_ANON_KEY        | Client API access   |
| OPENAI_API_KEY           | AI personalization  |
| ACCUZIP_API_KEY          | Address validation  |
| MAILGUN_API_KEY          | Transactional email |

Managed through Vercel environment dashboard and encrypted for deployment.

---

## 4. Stripe Payment Hold + Capture Workflow

- `payment_intent` is created on checkout with `capture_method: manual`
- Order enters `awaiting_proof` state
- Funds are **authorized**, not charged
- User clicks “Approve Proof” → API captures funds
- If user clicks “Cancel Order” → API cancels the `payment_intent`

### Stripe Deployment Considerations:
- All `payment_intent_id` must be stored
- On deployment rollback, in-flight intents remain valid (no schema conflict)
- Webhook event `payment_intent.canceled` must not trigger fulfillment

---

## 5. Stored Payment Methods

- Managed via Stripe Customers + PaymentMethods
- Synced to local table `user_payment_methods`
- Saved card added at time of first payment, or via Settings
- Secure UI form exposed via Stripe Elements

### Deployment Notes:
- Initial card save works on test keys
- Must test in staging with saved method → autofill in next order
- Sensitive card data never stored on our servers

---

## 6. Rollback System

- Rollback options: record-level, tag-based, or full-list
- Each rollback event logs to `audit_logs`
- Rollbacks are **non-destructive** and diff-based
- Admin rollback events visible in impersonation view

### Deployment Steps:
- Ensure `record_change_logs` and `record_field_changes` tables are migrated
- Validate rollback UI diff renders on all browser breakpoints
- Ensure migration is idempotent across re-deploys

---

## 7. Webhook Retry Infrastructure

- All webhooks write log entry to `webhook_logs`
- Retry queue handled via Supabase CRON or Vercel Edge Function
- Failed deliveries can be retried from admin or user interface
- Delivery attempts are timestamped with payload and HTTP status code

---

## 8. Scheduled Report Engine

- Supabase CRON jobs trigger scheduled reports
- Output formats supported: PDF, CSV, Excel
- Email delivery uses Mailgun API (templated)
- Failed jobs marked as `paused` in `scheduled_reports`

### Deployment Checklist:
- Confirm CRON frequency syncs with timezone config
- Ensure historical report data is stored with user_id and filters used
- Validate generated file download link expires securely

---

## 9. Launch Readiness Checklist

- [ ] Supabase database fully seeded with default roles, plans, webhooks
- [ ] Stripe test card flow: authorize → approve → capture
- [ ] Stripe cancel flow: authorize → cancel → release hold
- [ ] Stored card functionality working on test and staging
- [ ] Proof workflow tested end-to-end with Stripe hold logic
- [ ] Manual rollback confirmed through UI and audit logs
- [ ] Scheduled reports emailed and downloaded successfully
- [ ] Webhook delivery triggered + retry function logs correctly
- [ ] Team invite flow QA’d with RLS access enforcement
- [ ] QA signoff for each core document module

---

## 10. Logs & Observability

| System             | Logging Destination      |
|--------------------|---------------------------|
| Errors             | Sentry                    |
| Build logs         | Vercel                    |
| Stripe Webhooks    | Stripe dashboard + DB     |
| Audit Actions      | Supabase `audit_logs`     |
| Rollbacks          | Supabase `record_change_logs` |
| Feedback Alerts    | Supabase `feedback`       |
| Webhook Delivery   | Supabase `webhook_logs`   |

---

## Contact

For deployment assistance or environment troubleshooting:  
support@yellowlettershop.com

