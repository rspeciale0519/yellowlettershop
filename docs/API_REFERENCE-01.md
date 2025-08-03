# API Reference

_Last Updated: April 2025_

This document provides a reference guide to the internal REST API endpoints and third-party integrations used by the Yellow Letter Shop (YLS) platform. It includes endpoint paths, methods, expected inputs, outputs, and authentication requirements.

---

## 1. Authentication

### `GET /api/auth/session`
Returns the current session details.

### `POST /api/auth/signout`
Clears the active session cookie and logs out the user.

---

## 2. Mailing List API

### `POST /api/mailing-lists/import`
Uploads a new mailing list file.
- Accepts: FormData (`file`)
- Response: Record count, preview rows, column mapping

### `POST /api/mailing-lists/:id/dedupe`
Deduplicates records in a specific list by selected fields.
- Body: `{ fields: string[] }`

### `GET /api/mailing-lists/:id/records`
Fetches records from a given list.

### `DELETE /api/mailing-lists/:id`
Soft-deletes a mailing list.

---

## 3. Address Validation

### `POST /api/accuzip/validate`
Validates uploaded addresses using AccuZIP.
- Body: `{ records: object[] }`
- Returns: Valid, invalid, corrected records

---

## 4. Template API

### `GET /api/templates`
Returns available public and private templates.

### `GET /api/templates/:id`
Returns a single template and its config.

### `GET /api/templates/:id/product-config`
Returns FPD configuration JSON for design loading.

### `POST /api/designs/save`
Saves a user's customized template design.

### `GET /api/designs/:id/preview`
Generates a preview with mapped personalization.

---

## 5. Orders

### `POST /api/orders/create`
Creates a new print order.
- Body: `{ mailing_list_id, design_template_id, total_price, ... }`

### `GET /api/orders`
Returns all orders for the current user.

### `GET /api/orders/:id`
Returns a specific order with detail and preview URL.

---

## 6. Payments

### `POST /api/payments/process`
Triggers Stripe checkout session for a one-time order.

### `POST /api/payments/webhook`
Stripe webhook handler for:
- `checkout.session.completed`
- `invoice.paid`
- `payment_intent.failed`

---

## 7. Automation API

### `POST /api/automations`
Creates a new recurring or multi-touch automation.

### `POST /api/automations/:id/pause`
Pauses a running automation.

### `GET /api/automations/logs`
Returns execution history of automations.

---

## 8. AI Personalization

### `POST /api/ai/generate`
Generates personalized copy from an AI prompt template.
- Input: `{ prompt_template, sample_record }`
- Returns: Generated text

---

## 9. Notifications

### `GET /api/notifications`
Returns user’s in-app notification feed.

### `POST /api/notifications/read`
Marks one or more notifications as read.

---

## 10. Support Tickets

### `POST /api/support/tickets`
Creates a new support case.

### `GET /api/support/tickets`
Returns user's open and closed tickets.

### `POST /api/support/tickets/:id/reply`
Posts a reply to a specific support thread.

---

## 11. Admin Routes

### `POST /api/admin/impersonate`
Initiates an impersonation session.

### `GET /api/admin/users`
Returns all users with filtering and search.

### `POST /api/admin/templates/approve`
Approves a submitted marketplace template.

### `POST /api/admin/flags`
Toggles platform-level feature flags.

---

## 12. Third-Party Integration Endpoints

### AccuZIP (proxy)
- Used for address validation via `/api/accuzip/validate`

### Stripe
- Managed checkout session via `process`
- Webhooks to `/api/payments/webhook`

### Fancy Product Designer
- FPD config JSON loaded on-demand by product ID
- Design preview generated server-side with template + record

### OpenAI / Claude (optional)
- Used for prompt execution in AI module
- Abstracted behind `/api/ai/generate`

---

## 13. Webhooks (Incoming)

### `/api/webhooks/zapier`
Generic webhook listener (future use)
- Body: `{ event_type, payload }`

---

## Authentication Notes
- All endpoints require JWT-based session
- Admin routes require user `role = admin`
- POST routes expect JSON unless noted

---

For schema details, query examples, or SDK bindings, contact: `devteam@yellowlettershop.com