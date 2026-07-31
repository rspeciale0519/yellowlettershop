-- Two correctness fixes from PR #24 review.
--
-- 1) Double-dispatch race: dispatchOrder's guard was check-then-act with no
--    constraint behind it, so concurrent calls (double-click, auto-dispatch
--    racing a manual admin dispatch) could insert two live dispatches and
--    email the vendor twice for one order. One live (non-failed) dispatch per
--    order, enforced by the database.
--
-- 2) orders_payment_status_check never allowed 'canceled', but the proof-
--    reject path has written payment_status='canceled' since June (flagged in
--    PR #10 review, never fixed) — every rejection failed the constraint and
--    500'd. 'canceled' matches Stripe's PaymentIntent vocabulary for a
--    released authorization; add it rather than conflate with 'failed'.

begin;

create unique index if not exists uq_order_dispatches_live
  on public.order_dispatches (order_id)
  where status <> 'failed';

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status = any (array[
    'pending'::text, 'authorized'::text, 'captured'::text,
    'failed'::text, 'refunded'::text, 'canceled'::text
  ]));

commit;
