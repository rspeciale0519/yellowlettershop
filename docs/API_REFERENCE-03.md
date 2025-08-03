# API Reference

_Last Updated: April 2025_

This document provides a reference guide to the internal REST API endpoints and third-party integrations used by the Yellow Letter Shop (YLS) platform. It includes endpoint paths, methods, expected inputs, outputs, authentication requirements, and new functionality for multi-vendor print routing and vendor management.

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
**Accepts:** FormData (`file`)  
**Returns:** Record count, preview rows, column mapping

### `POST /api/mailing-lists/:id/dedupe`
Deduplicates records in a specific list by selected fields.  
**Body:** `{ fields: string[] }`

### `GET /api/mailing-lists/:id/records`
Fetches records from a given list.

### `DELETE /api/mailing-lists/:id`
Soft-deletes a mailing list.

---

## 3. Address Validation

### `POST /api/accuzip/validate`
Validates uploaded addresses using AccuZIP.  
**Body:** `{ records: object[] }`  
**Returns:** Valid, invalid, corrected records

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
**Body:** `{ mailing_list_id, design_template_id, total_price, ... }`  
**Note:** Sets status to `awaiting_admin_review` for admin routing decision.

### `PATCH /api/orders/:id/fulfillment-method`
Admin endpoint to select fulfillment method.  
**Body:** `{ method: 'in_house' | 'third_party', vendor_id?: string }`

### `PATCH /api/orders/:id/finalize-routing`
Internal system action. Applies default fulfillment logic if time-based routing is active and decision deadline expires.

### `GET /api/orders`
Returns all orders for the current user.

### `GET /api/orders/:id`
Returns a specific order with detail and preview URL.

### `POST /api/orders/:id/cancel`
Cancels a pending order and releases Stripe hold.

---

## 6. Payments

### `POST /api/payments/process`
Triggers Stripe checkout session for a one-time order.

### `POST /api/payments/release`
Captures or releases funds based on customer approval or cancellation.  
**Body:** `{ order_id, action: 'capture' | 'release' }`

### `POST /api/payments/webhook`
Stripe webhook handler for:
- `checkout.session.completed`
- `invoice.paid`
- `payment_intent.failed`

---

## 7. Proof Review & Annotation

### `GET /api/orders/:id/proofs`
Fetches proof PDF file(s) for the order.

### `GET /api/orders/:id/annotations`
Returns all annotations and comment threads for the order proof.

### `POST /api/orders/:id/annotations`
Creates a new proof annotation.  
**Body:** `{ page, x, y, text }`

### `POST /api/orders/:id/annotations/:annotation_id/reply`
Adds a reply to an existing annotation.  
**Body:** `{ text: string }`

### `POST /api/orders/:id/annotations/:annotation_id/resolve`
Marks a comment thread as resolved.

### `POST /api/orders/:id/proof-approval`
Customer clicks Approve.  
Triggers Stripe fund capture and marks order as `approved`

### `POST /api/orders/:id/request-changes`
Customer submits requested changes.  
**Body:** `{ message: string }`  
Sends email to selected vendor with details. Sets status to `awaiting_revision`

---

## 8. Automation API

### `POST /api/automations`
Creates a new recurring or multi-touch automation.

### `POST /api/automations/:id/pause`
Pauses a running automation.

### `GET /api/automations/logs`
Returns execution history of automations.

---

## 9. Vendor Management API (Admin Only)

### `GET /api/vendors`
Returns a list of all registered print vendors.

### `POST /api/vendors`
Creates a new vendor record.  
**Body:** `{ name, contact_name, email, phone, services_offered, turnaround, payment_terms, ... }`

### `GET /api/vendors/:id`
Returns detailed information about a vendor.

### `PATCH /api/vendors/:id`
Updates a vendor record.

### `POST /api/vendors/:id/pricing`
Adds a new wholesale pricing entry for a vendor.  
**Body:** `{ product_type, price_per_unit, volume_tier, effective_date }`

### `GET /api/vendors/:id/pricing`
Returns all pricing tiers for a vendor.

---

## 10. Notifications

### `GET /api/notifications`
Returns user’s in-app notification feed.

### `POST /api/notifications/read`
Marks one or more notifications as read.

---

## 11. Support Tickets

### `POST /api/support/tickets`
Creates a new support case.

### `GET /api/support/tickets`
Returns user's open and closed tickets.

### `POST /api/support/tickets/:id/reply`
Posts a reply to a specific support thread.

---

## 12. Admin Routes

### `POST /api/admin/impersonate`
Initiates an impersonation session.

### `GET /api/admin/users`
Returns all users with filtering and search.

### `POST /api/admin/templates/approve`
Approves a submitted marketplace template.

### `POST /api/admin/flags`
Toggles platform-level feature flags.  
Includes: `auto_fulfillment_timeout_enabled`

### `GET /api/admin/orders/:id/history`
Returns full communication and action log for an order.

---

## 13. Third-Party Integrations

### AccuZIP (proxy)
- Address validation via `/api/accuzip/validate`

### Stripe
- Checkout session: `/api/payments/process`
- Webhooks: `/api/payments/webhook`

### Fancy Product Designer
- Loaded via `/api/templates/:id/product-config`
- Design preview rendering via server route

### OpenAI / Claude
- AI generation via `/api/ai/generate` (subscription-based)

### Email (Vendor Routing)
- Outbound: Email with proof and mailing list file to selected vendor
- Inbound: Parse revised proofs via SendGrid or Mailgun webhook

---

## 14. Webhooks (Incoming)

### `/api/webhooks/zapier`
Generic webhook listener (future use)  
**Body:** `{ event_type, payload }`

---

## Authentication Notes

- All endpoints require JWT-based session
- Admin routes require user `role = admin`
- POST routes expect JSON unless otherwise noted

---

For schema details, query examples, or SDK bindings, contact: devteam@yellowlettershop.com