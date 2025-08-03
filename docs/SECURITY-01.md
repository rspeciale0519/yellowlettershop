# Security, Authentication & Privacy Policy

_Last Updated: April 2025_

This document outlines the security architecture, authentication and authorization mechanisms, impersonation protocols, privacy controls, and audit logging strategy for the Yellow Letter Shop (YLS) platform.

---

## 1. Authentication

### Provider
- **Supabase Auth** (PostgreSQL + JWT)
- **NextAuth.js** for session middleware and cookie-based management

### Supported Methods
- OAuth via Google (primary)
- Optional password fallback (email/password)

### Token Strategy
- JWT tokens issued by Supabase
- Stored in `HttpOnly` cookies
- Injected into SSR + API contexts via middleware

---

## 2. User Roles

| Role     | Description                                 |
|----------|---------------------------------------------|
| admin    | Full control, system-wide access            |
| manager  | Can manage team users, orders, templates    |
| user     | Standard functionality: upload, order, design |
| client   | View-only access to assigned assets         |

Roles are assigned via `user_profiles.role` and injected into session tokens.

---

## 3. Authorization & Access Control

### Row-Level Security (RLS)
- All core tables implement RLS policies in Supabase
- Example:
```sql
CREATE POLICY "Users can access their own data"
ON orders FOR SELECT USING (auth.uid() = user_id);
```

### Server-Side Enforcement
- Admin-only routes gated by `role === admin`
- Sensitive operations (e.g., delete, impersonate) require elevated privileges
- No frontend can override access; enforced by database + server logic

---

## 4. Impersonation System

### Purpose
Allows admins to act as another user for support and debugging purposes.

### Flow
- Admin selects user → Starts impersonation
- UI banner shows active session override
- All actions logged to `impersonation_sessions`

### Log Table: `impersonation_sessions`
| Field           | Type     |
|------------------|----------|
| id               | UUID     |
| admin_id         | UUID     |
| target_user_id   | UUID     |
| started_at       | timestamp|
| ended_at         | timestamp|

---

## 5. Privacy & Consent UX

### Consent Banner
- Displayed on first load
- Allows accept all / customize tracking preferences
- Stored in cookie: `__yls_consent`

### User Controls
- Settings to:
  - Export personal data
  - Delete account / Right to be forgotten (GDPR)
  - Opt out of marketing emails

### Data Collection Summary
| Type             | Used For                             |
|------------------|---------------------------------------|
| Mailing List Data| Print production only                 |
| User Contact     | Receipts, support replies             |
| Design Metadata  | Personalization and template recall   |
| IP / Browser     | Session security, analytics           |

---

## 6. Audit Logging

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
- Login / logout
- Role changes
- Design saves
- Order placement and status updates
- Admin impersonation
- AI personalization runs

---

## 7. Security Best Practices

- Passwords (if enabled) are salted and hashed via bcrypt (Supabase default)
- Session cookies are HttpOnly + SameSite strict
- All environment secrets are managed via Vercel or GitHub Actions
- No sensitive keys exposed to frontend (e.g., Supabase service role, Stripe secret)
- All API routes validate authenticated sessions
- All POST routes enforce Zod schema validation

---

## 8. Monitoring & Alerts

| Trigger                        | Notification Route               |
|-------------------------------|----------------------------------|
| Admin impersonation started   | admin@yellowlettershop.com       |
| Role escalated (non-admin)    | security@yellowlettershop.com    |
| API misuse or auth errors     | devops@yellowlettershop.com      |

---

## 9. Future Enhancements

- Device-level session history with revocation support
- Optional MFA for admin accounts
- SAML or enterprise SSO support
- User activity graphs (login frequency, order history heatmap)

---

For security incidents, data privacy requests, or vulnerability reports, contact: `security@yellowlettershop.com