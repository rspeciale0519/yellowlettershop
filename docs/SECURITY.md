# Security, Authentication & Privacy Policy

*Last Updated: April 2025*

This document defines the security framework, access controls, audit logging, data protections, payment authorization safeguards, and privacy practices governing the Yellow Letter Shop (YLS) platform. It includes security provisions across modules such as saved payment methods, proof approval gating, per-field change logs, team collaboration, webhook handling, and scheduled reporting.

---

## 1. Authentication

### Provider
- **Supabase Auth** (PostgreSQL-based, JWT)
- **NextAuth.js** session manager (browser context)

### Supported Methods
- Google OAuth (primary method)
- Email/password fallback (admin-only or CLI users)

### Session Storage
- JWT stored in HTTP-only secure cookies
- SameSite strict policy for all user sessions

---

## 2. Role-Based Access Control

| Role     | Scope                                           |
|----------|--------------------------------------------------|
| Admin    | Global access, impersonation, audit export       |
| Manager  | Team-level record access, uploads, routing       |
| User     | Order processing, list upload, proof approvals   |

All permissions are enforced both client-side and at the database level via Supabase RLS policies.

---

## 3. Row-Level Security (RLS)

Supabase Postgres tables use strict RLS:
- All user records filtered by `auth.uid()`
- Team data scoped by `team_id`
- Admin override granted via secure `service_role` token (server-only)

Example:
```sql
CREATE POLICY "Only owner or team" ON mailing_lists
FOR SELECT USING (auth.uid() = user_id OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
```

---

## 4. Stripe Payment Authorization Security

### Hold + Approval Flow
- Payments are **authorized** using `capture_method: manual`
- Only captured after explicit user action ("Approve Proof")
- If user cancels the order before approval, the hold is voided
- Order remains unpaid unless Stripe confirms capture

### Cancellation
- Stripe `payment_intent` is canceled programmatically via secure server call
- No sensitive card data is stored by YLS — all PM data is abstracted by Stripe

### Saved Payment Methods
- Stored in Stripe and referenced via `stripe_pm_id`
- Managed in `user_payment_methods` (metadata only)
- All modifications (add, remove, default) validated via active session and JWT ownership

---

## 5. Per-Field Change Logging

- All record modifications logged per field via `record_field_changes`
- Each change captures:
  - Field name
  - Old value
  - New value
  - Changed by
  - Timestamp

- Rollback permitted only for users with ownership of original list
- Admins may override via impersonation and log activity
- Rollbacks are non-destructive and versioned

---

## 6. Proof Approval Controls

- All orders must pass through a mandatory proof review process
- UI requires checkbox acknowledgment before capture:
  > "I have reviewed and approve this proof. I understand that approving this design will result in my payment being finalized."

- Only then is the payment captured
- Annotation and comment threads are visible only to team members or assigned admins
- All annotation actions are logged to `audit_logs`

---

## 7. Webhook Endpoint Management

- Users may register webhook URLs for event types
- Each endpoint is scoped to its creating user
- Delivery attempts logged in `webhook_logs`
- Retry allowed only by owner of webhook
- Admin view includes visibility into failed, paused, or requeued events

---

## 8. Team Access Control

- Users may belong to zero or more teams
- Team assets are only visible if the user is part of the team
- Owners/admins may revoke or transfer access
- All invites and revocations are logged

---

## 9. Privacy & Data Rights

- Users can request to delete all stored data (Right to be Forgotten)
- Export tool provides full mailing list, card, and audit history
- Cookie consent enforced on first load
- Stripe and Supabase manage all PCI- and PII-sensitive information

---

## 10. Audit Logging System

| Action Type         | Logged In            |
|---------------------|----------------------|
| Proof approvals     | `audit_logs`         |
| Annotation threads  | `proof_annotations`  |
| Rollback requests   | `audit_logs`         |
| Payment capture     | Stripe logs + `orders` |
| Impersonation       | `audit_logs`         |
| Webhook retry       | `webhook_logs`       |
| Payment method edits| `audit_logs`         |
| Team invitations    | `audit_logs`         |

---

## 11. Monitoring & Alerts

| Trigger                       | Alert Target               |
|-------------------------------|----------------------------|
| Payment capture failure       | support@yellowlettershop.com |
| Stripe webhook timeout        | support@yellowlettershop.com |
| Rollback action by admin      | admin@yellowlettershop.com   |
| Score < 6 feedback submitted  | support@yellowlettershop.com |
| Proof approval time exceeded  | support@yellowlettershop.com |

---

## Contact

For access concerns, impersonation logs, rollback abuse, or security disclosures:  
support@yellowlettershop.com