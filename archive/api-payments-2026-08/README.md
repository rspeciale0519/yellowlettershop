# Archived: `/api/payments/capture-payment` + `/api/payments/refund-payment`

**Archived 2026-08 (dated 2026-07-31), during the vendor-fulfillment build.**

## Why

Both routes were **bare handlers** — no `withAuth`, no `withAdmin` — exposing
Stripe capture and refund to any caller who knew the path. A repo-wide grep
(`app`, `components`, `lib`, `hooks`, `tests`) found **zero callers**.

The live paths that replaced them:

| Operation | Live route |
|---|---|
| Customer capture on proof approval | `app/api/orders/[orderId]/approve/route.ts` |
| Admin capture / refund | `app/api/admin/orders/[orderId]/payment/route.ts` (`withAdmin`) |

They also wrote to `payment_transactions`, a table no migration ever created —
so their DB persistence was silently failing regardless.

## Restoring

If a standalone payment endpoint is ever needed, do not restore these as-is:
wrap them with `withAdmin` (or `withAuth` + ownership check) and rewrite the
persistence to the inline-on-orders model (`payment_status`, `amount_captured`,
`amount_refunded`, `captured_at`, `refunded_at`) — see
`lib/payments/payment-intent-service.ts`.
