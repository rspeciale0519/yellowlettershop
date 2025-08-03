# Security, Authentication & Privacy Policy

*Last Updated: April 2025*

This document outlines the security architecture, authentication and authorization systems, impersonation protocols, audit logging strategy, privacy enforcement, and infrastructure safeguards used by the Yellow Letter Shop (YLS) platform. It includes protections for user data, campaign content, design proofs, contact records, and all new enhancements including rollback, AI help access, design-lock, and short link tracking.

---

## 1. Authentication

### Provider
- **Supabase Auth** (PostgreSQL + JWT)
- **NextAuth.js** for session middleware and cookie handling

### Supported Methods
- OAuth via Google (primary)
- Optional email/password fallback

### Token Strategy
- JWT tokens issued by Supabase
- Stored in `HttpOnly` cookies with SameSite `Strict`
- Propagated to frontend and backend contexts securely

---

## 2. User Roles

| Role     | Description                               |
|----------|-------------------------------------------|
| admin    | Full access to all system resources       |
| manager  | Team-level control over data and orders   |
| user     | Core functionality (upload, order, review) |
| client   | View-only restricted access               |

Roles are set in `user_profiles.role` and encoded into session tokens.

---

## 3. Authorization & Access Control

### Row-Level Security (RLS)
- All major tables (mailing_lists, orders, contact_cards, etc.) use RLS
- Enforced via Supabase `auth.uid()`

**Example:**
```sql
CREATE POLICY "Users can access their own records"
ON orders FOR SELECT USING (auth.uid() = user_id);
```

### Server Enforcement
- All admin-only routes require `role = admin`
- POST/PUT/DELETE routes require Zod schema validation
- All business logic guarded by session validation middleware

---

## 4. Impersonation System

### Purpose
Allows admins to act as another user for troubleshooting and support.

### Flow
1. Admin selects a user to impersonate
2. System switches session context
3. UI banner indicates active impersonation
4. All actions logged in audit trail

### Table: `impersonation_sessions`
| Field           | Type     |
|------------------|----------|
| id               | UUID     |
| admin_id         | UUID     |
| target_user_id   | UUID     |
| started_at       | timestamp|
| ended_at         | timestamp|

---

## 5. Design Lock & Disclaimer Acceptance

### Enforcement
- All orders must pass a final design confirmation screen
- Confirmation requires checkbox acceptance:
  - “I acknowledge that my design and mailing list are final and non-refundable.”

### Data Capture
- Stored on orders table: `design_locked = true`, `accepted_disclaimer = true`
- Checked before allowing checkout or proof approval

---

## 6. Short Link Tracking

### Redirect Logging
- All tracked links are routed via `/api/track/:code`
- Metadata stored:
  - Visitor IP
  - Timestamp
  - Record ID
  - Associated campaign

### Abuse Prevention
- All redirects rate-limited
- Invalid or expired codes return a controlled error
- Logs written to `short_links` and `audit_logs`

---

## 7. Rollback System

### Access Control
- Only the original user (or admin) may trigger a rollback
- Actions require confirmation and are permanently logged

### Logging
- All pre/post record states saved in `record_change_logs`
- Admin visibility via audit trail

---

## 8. Privacy & Consent

### Consent Banner
- Displayed on first load
- Options: Accept All or Customize
- Stored in cookie `__yls_consent`

### User Controls
- Export personal data
- Delete account (Right to be Forgotten)
- Opt out of marketing messages

### Data Collection Summary
| Type             | Purpose                                 |
|------------------|------------------------------------------|
| Mailing Data     | Print fulfillment and delivery           |
| Contact Cards    | Campaign-level personalization           |
| Design Metadata  | Template rendering and AI generation     |
| IP/Browser       | Session security and redirect analytics  |

---

## 9. Audit Logging

### Table: `audit_logs`
| Field           | Type     |
|------------------|----------|
| id               | UUID     |
| actor_user_id    | UUID     |
| target_type      | text     |
| target_id        | UUID     |
| action           | text     |
| context          | JSONB    |
| created_at       | timestamp|

### Logged Events
- Login/logout, impersonation sessions
- Mailing list updates and rollbacks
- Proof annotations and approvals
- Skip trace submissions and completions
- Design lock confirmations
- Short link visits
- AI help usage context (non-personalized)

---

## 10. Security Practices

- Passwords are salted and hashed using bcrypt
- Session cookies are `HttpOnly`, `Secure`, and `SameSite=Strict`
- API secrets are stored in Vercel or GitHub Action secrets
- Frontend never receives service role keys
- All endpoints validate sessions
- Zod schema validation enforced on all write routes

---

## 11. Monitoring & Alerts

| Event Type                  | Notification Target         |
|-----------------------------|------------------------------|
| Impersonation started       | support@yellowlettershop.com |
| Role escalation             | support@yellowlettershop.com |
| API abuse / token misuse    | support@yellowlettershop.com |
| Redirect anomaly            | support@yellowlettershop.com |
| Rollback triggered          | support@yellowlettershop.com |
| Failed Stripe callbacks     | support@yellowlettershop.com |

---

## 12. Planned Enhancements

- Device history tracking + session revocation
- Optional MFA for admin accounts
- Enterprise SSO (SAML/OAuth2)
- Activity heatmaps for short link and AI usage
- Change log diff previews

---

## Contact

For security audits, role escalation requests, or incident reports:  
support@yellowlettershop.com