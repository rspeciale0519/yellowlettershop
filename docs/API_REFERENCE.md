# API Reference

*Last Updated: April 2025*

This document describes internal and public REST API endpoints and third-party integrations used by the Yellow Letter Shop (YLS) platform. It includes parameters, authentication rules, and request/response formats for all modules, including mailing lists, proofs, short links, payments, rollback, webhooks, feedback, team collaboration, analytics, and saved payment methods.

---

## 1. Authentication

### `GET /api/auth/session`
Returns current session metadata.

### `POST /api/auth/signout`
Clears session token.

---

## 2. Mailing Lists

### `POST /api/mailing-lists/import`
Uploads file (CSV/XLSX) with deduplication toggle.  
**Body:** `FormData(file, dedupe: boolean)`

### `POST /api/mailing-lists/:id/dedupe`
Deduplicates by matching selected fields.

### `GET /api/mailing-lists/:id/records`
Returns mailing list records.

### `DELETE /api/mailing-lists/:id`
Soft delete list.

---

## 3. Record Change Logs

### `GET /api/records/:id/changes`
Returns record-level before/after change logs.

### `GET /api/records/:id/field-changes`
Returns field-by-field diff logs.

### `POST /api/records/:id/rollback`
Rolls back specific record to prior state.

### `POST /api/records/rollback`
Batch rollback via mailing list ID or tag.

---

## 4. Contact Cards

### `GET /api/contact-cards`
Returns user's contact cards.

### `POST /api/contact-cards`
Create new contact card.

### `PATCH /api/contact-cards/:id`
Edit contact card.

### `DELETE /api/contact-cards/:id`
Delete card.

### `GET /api/contact-cards/limits`
Returns allowed limit by plan.

---

## 5. Orders

### `POST /api/orders/create`
Creates a new order.
**Body:** `{ mailing_list_id, contact_card_id, template_id, mailing_option, campaign_option_config, total_price }`

### `PATCH /api/orders/:id/fulfillment-method`
Set vendor manually.

### `POST /api/orders/:id/cancel`
Cancels unapproved order, voids hold.

### `GET /api/orders/:id`
Returns full order metadata.

### `GET /api/orders`
Returns user's recent orders.

---

## 6. Payments

### `POST /api/payments/process`
Initializes payment intent with Stripe.
**Body:** `{ amount, save_card?: boolean, use_saved_method_id?: string }`

### `POST /api/payments/capture`
Capture payment intent after approval.  
**Body:** `{ payment_intent_id }`

### `POST /api/payments/cancel`
Cancel/void uncaptured payment.  
**Body:** `{ payment_intent_id }`

### `POST /api/payments/webhook`
Handles Stripe events: `payment_intent.created`, `payment_intent.canceled`, `payment_intent.succeeded`

---

## 7. Stored Payment Methods

### `GET /api/payment-methods`
Returns stored methods for account.

### `POST /api/payment-methods/save`
Attach new payment method to user.

### `POST /api/payment-methods/set-default`
Set default card.  
**Body:** `{ payment_method_id }`

### `DELETE /api/payment-methods/:id`
Delete stored payment method.

---

## 8. Proof Review

### `GET /api/orders/:id/proofs`
Returns all revisions of proof.

### `POST /api/orders/:id/proof-approval`
Approves proof and triggers capture.

### `POST /api/orders/:id/request-changes`
Submits proof revision request.  
**Body:** `{ message }`

### `POST /api/orders/:id/annotations`
Creates annotation on proof.

### `POST /api/orders/:id/annotations/:annotation_id/reply`
Add reply.

### `POST /api/orders/:id/annotations/:annotation_id/resolve`
Marks as resolved.

---

## 9. Skip Tracing

### `POST /api/skip-trace/initiate`
Creates skip trace order.  
**Body:** `{ record_ids[], mailing_list_id }`

### `POST /api/skip-trace/pay`
Stripe payment intent for skip trace.

### `POST /api/skip-trace/webhook`
Inbound enrichment upload handler.

### `GET /api/skip-trace/orders`
Returns all skip trace jobs.

---

## 10. Webhooks

### `POST /api/webhooks`
Register endpoint for event type.

### `GET /api/webhooks`
Returns all webhooks registered to user.

### `DELETE /api/webhooks/:id`
Removes webhook endpoint.

### `GET /api/webhooks/logs`
Returns event log delivery attempts.

### `POST /api/webhooks/logs/:id/retry`
Retries failed webhook.

---

## 11. Feedback

### `POST /api/feedback/submit`
Submit NPS rating.  
**Body:** `{ score, comment, source }`

### `GET /api/feedback/stats`
Returns aggregate NPS data (admin only).

---

## 12. Reports & Analytics

### `GET /api/analytics/overview`
Returns KPI dashboard for user.

### `GET /api/analytics/admin-overview`
Admin dashboard: revenue, vendors, feedback, link heatmaps.

### `POST /api/reports/generate`
Generate ad hoc report.

### `POST /api/reports/schedule`
Schedule recurring report.

### `GET /api/reports/scheduled`
List user’s recurring exports.

### `PATCH /api/reports/scheduled/:id`
Edit recurrence.

### `DELETE /api/reports/scheduled/:id`
Cancel future export.

---

## 13. Short Link Tracking

### `GET /api/track/:code`
Redirect + log event.

### `GET /api/track/campaign/:id`
Aggregate metrics by campaign.

---

## 14. Notifications

### `GET /api/notifications`
Get unread messages.

### `POST /api/notifications/read`
Mark as read.

---

## 15. Support Tickets

### `POST /api/support/tickets`
Submit ticket.

### `POST /api/support/tickets/:id/reply`
Reply to ticket.

### `GET /api/support/tickets`
View ticket history.

---

## Authentication Notes

- All endpoints require active Supabase JWT session
- Admin-only routes check `role`
- Zod validation on all mutation inputs

---

## Contact

For API onboarding or troubleshooting:  
support@yellowlettershop.com

