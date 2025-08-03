# API Reference

_Last Updated: April 2025_

This document provides a reference guide to the internal REST API endpoints and third-party integrations used by the Yellow Letter Shop (YLS) platform. It includes endpoint paths, methods, expected inputs, outputs, authentication requirements, and functionality for print and skip tracing fulfillment with multi-type vendor support.

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

## 4. Skip Tracing API

### `POST /api/skip-trace/initiate`
Creates a skip tracing order with selected records.  
**Body:** `{ record_ids: UUID[], mailing_list_id: UUID }`  
**Returns:** `{ order_id, estimated_price }`

### `POST /api/skip-trace/pay`
Triggers Stripe checkout session for the skip trace order.  
**Body:** `{ order_id: UUID }`

### `POST /api/skip-trace/webhook`
Inbound webhook for receiving skip traced CSV files.  
**Process:**
- Matches incoming email based on order ID in subject
- Parses attached .csv file
- Imports enriched data into original record set
- Marks order as `completed`

### `GET /api/skip-trace/orders`
Returns a list of skip tracing orders for the current user.

### `GET /api/skip-trace/orders/:id`
Returns details of a specific skip tracing order.

---

## 5. Template API

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

## 6. Orders

### `POST /api/orders/create`
Creates a new print order.  
**Body:** `{ mailing_list_id, design_template_id, total_price, ... }`

### `PATCH /api/orders/:id/fulfillment-method`
Admin endpoint to select fulfillment method.  
**Body:** `{ method: 'in_house' | 'third_party', vendor_id?: string }`

### `PATCH /api/orders/:id/finalize-routing`
Internal system action. Applies default fulfillment logic if timeout triggers.

### `GET /api/orders`
Returns all orders for the current user.

### `GET /api/orders/:id`
Returns a specific order with detail and preview URL.

### `POST /api/orders/:id/cancel`
Cancels a pending order and releases Stripe hold.

---

## 7. Payments

### `POST /api/payments/process`
Triggers Stripe checkout session for a print or skip trace order.

### `POST /api/payments/webhook`
Stripe webhook handler for:
- `checkout.session.completed`
- `invoice.paid`
- `payment_intent.failed`

---

## 8. Proof Review & Annotation

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

---

## 9. Vendor Management API (Multi-Type)

### `GET /api/vendors`
Returns a list of all registered vendors. Supports filtering by `vendor_type`.

### `POST /api/vendors`
Creates a new vendor record.  
**Body:** `{ name, contact_name, email, vendor_type, services_offered, turnaround, payment_terms, ... }`

### `GET /api/vendors/:id`
Returns detailed information about a vendor.

### `PATCH /api/vendors/:id`
Updates a vendor record.

### `POST /api/vendors/:id/pricing`
Adds a new pricing entry.  
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

### `GET /api/admin/orders/:id/history`
Returns full communication and action log for an order.

---

## 13. Third-Party Integrations

### AccuZIP
- `/api/accuzip/validate`

### Stripe
- `/api/payments/process`
- `/api/payments/webhook`

### Skip Tracing Vendor (Email Integration)
- Outbound: Email with skip trace CSV file to selected vendor
- Inbound: Mailgun or SendGrid webhook auto-parses CSV and matches order

### Fancy Product Designer
- `/api/templates/:id/product-config`
- `/api/designs/:id/preview`

### OpenAI / Claude
- `/api/ai/generate`

---

## 14. Webhooks

### `/api/skip-trace/webhook`
Processes incoming skip traced files from email vendor route

### `/api/webhooks/zapier`
Generic webhook listener for automation integration

---

## Authentication Notes

- All endpoints require JWT-based session
- Admin routes require user `role = admin`
- POST routes expect JSON unless otherwise noted

---

For schema details, query examples, or SDK bindings, contact: devteam@yellowlettershop.com