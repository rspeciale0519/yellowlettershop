# API Reference

*Last Updated: April 2025*

This document provides a reference guide to the internal REST API endpoints and third-party integrations used by the Yellow Letter Shop (YLS) platform. It includes endpoint paths, methods, expected inputs, outputs, authentication requirements, and functionality for mailing list management, deduplication, skip tracing, proof workflows, campaign scheduling, short URL tracking, rollback operations, AI help, and multi-vendor routing.

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
**Accepts:** FormData (`file`, `dedupe: boolean`)  
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
Validates uploaded addresses using AccuZIP, with deduplication if toggled.  
**Body:** `{ records: object[], dedupe: boolean }`  
**Returns:** Valid, invalid, corrected records

---

## 4. Contact Cards API

### `GET /api/contact-cards`
Returns all contact cards for the current user.

### `POST /api/contact-cards`
Creates a new contact card.  
**Body:** `{ first_name, last_name, address, unit, city, state, zip, email, company_name, phone }`

### `PATCH /api/contact-cards/:id`
Updates an existing contact card.

### `DELETE /api/contact-cards/:id`
Deletes an existing contact card.

### `GET /api/contact-cards/limits`
Returns the maximum allowed cards based on the user’s plan and team size.

---

## 5. Skip Tracing API

### `POST /api/skip-trace/initiate`
Creates a skip tracing order with selected records.  
**Body:** `{ record_ids: UUID[], mailing_list_id: UUID }`

### `POST /api/skip-trace/pay`
Triggers Stripe checkout session for the skip trace order.  
**Body:** `{ order_id: UUID }`

### `POST /api/skip-trace/webhook`
Inbound webhook for receiving skip traced CSV files. Parses, imports, and marks the order as complete.

### `GET /api/skip-trace/orders`
Returns a list of skip tracing orders for the current user.

### `GET /api/skip-trace/orders/:id`
Returns details of a specific skip tracing order.

---

## 6. Template & Design API

### `GET /api/templates`
Returns available public and private templates.

### `GET /api/templates/:id`
Returns a single template and its config.

### `GET /api/templates/:id/product-config`
Returns FPD configuration JSON for design loading.

### `POST /api/designs/save`
Saves a user's customized template design.

### `GET /api/designs/:id/preview`
Generates a preview with mapped personalization and contact card.

---

## 7. Orders

### `POST /api/orders/create`
Creates a new print order.  
**Body:** `{ mailing_list_id, design_template_id, contact_card_id, mailing_option, campaign_option_config, total_price, ... }`

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

## 8. Mailing Options API

Used during order creation.

**Mailing Config Format:**
```json
{
  "type": "full_service",
  "postage_type": "first_class",
  "stamp_type": "live_stamp"
}
```

---

## 9. Campaign Options API

Included in order payload.

**Split Campaign:**
```json
"split_campaign": {
  "enabled": true,
  "num_drops": 4,
  "interval_weeks": 1
}
```

**Repeat Campaign (if split is false):**
```json
"repeat_campaign": {
  "enabled": true,
  "repeat_count": 3,
  "interval_weeks": 2
}
```

---

## 10. Payments

### `POST /api/payments/process`
Triggers Stripe checkout session for a print or skip trace order.

### `POST /api/payments/webhook`
Stripe webhook handler for:
- `checkout.session.completed`
- `invoice.paid`
- `payment_intent.failed`

---

## 11. Proof Review & Annotation

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
Customer clicks Approve. Triggers Stripe fund capture and marks order as `approved`

### `POST /api/orders/:id/request-changes`
Customer submits requested changes.  
**Body:** `{ message: string }`

---

## 12. Vendor Management API

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

## 13. Notifications

### `GET /api/notifications`
Returns user’s in-app notification feed.

### `POST /api/notifications/read`
Marks one or more notifications as read.

---

## 14. Support Tickets

### `POST /api/support/tickets`
Creates a new support case.

### `GET /api/support/tickets`
Returns user's open and closed tickets.

### `POST /api/support/tickets/:id/reply`
Posts a reply to a specific support thread.

---

## 15. Rollback & Change Logs

### `GET /api/records/:id/changes`
Returns full change history for a record.

### `POST /api/records/:id/rollback`
Performs rollback to previous version of a record.  
**Body:** `{ version_id: UUID }`

### `POST /api/records/rollback`
Batch rollback by tag or list.  
**Body:** `{ mailing_list_id: UUID, tag?: string }`

---

## 16. Short Link Tracking

### `GET /api/track/:code`
Redirects to target destination and logs tracking metadata (timestamp, IP, record ID).

### `GET /api/track/campaign/:campaign_id`
Returns campaign-level stats for all short links.

---

## 17. Contextual Help API

### `GET /api/help/contextual?step=string`
Returns AI-enhanced help content for specific step or page context.

---

## 18. Webhooks

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

## Contact

For endpoint access, SDK support, or webhook integration help:  
support@yellowlettershop.com