-- Inline-payment model completion.
--
-- Payment state lives ON the orders row (the consolidated DB1 model); there is
-- no payment_transactions table and there never was one — app code referencing
-- it has been failing silently (admin revenue metrics read 0). These columns
-- give capture/refund somewhere real to persist.
--
-- 'cancelled' is added to order_status because lib/admin/order-service.ts
-- already writes it on refund, against an enum that never had it.
--
-- NOTE: no explicit begin/commit here (unlike sibling migrations). ALTER TYPE
-- ... ADD VALUE is transaction-safe on PG12+ only while the new value goes
-- unused in the same transaction; keeping this file out of an explicit
-- transaction block avoids depending on that nuance. Every statement is
-- individually idempotent, so a partial re-run is safe.

alter type public.order_status add value if not exists 'cancelled';

alter table public.orders
  add column if not exists captured_at timestamp with time zone,
  add column if not exists amount_refunded numeric(10,2),
  add column if not exists refunded_at timestamp with time zone;

comment on column public.orders.captured_at is 'When the authorized PaymentIntent was captured.';
comment on column public.orders.amount_refunded is 'Dollars. Cumulative refunded amount (Stripe cents / 100).';
comment on column public.orders.refunded_at is 'When the most recent refund was issued.';
