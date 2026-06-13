-- Payment-customer persistence: user_profiles needs stripe_customer_id (the
-- consolidated schema dropped it). Without it /api/payments/{intent,methods}
-- can't save or list the user's Stripe customer, so no saved card is ever
-- available and authorize→capture can't run. Additive + idempotent.

begin;

alter table public.user_profiles
  add column if not exists stripe_customer_id text;

commit;
