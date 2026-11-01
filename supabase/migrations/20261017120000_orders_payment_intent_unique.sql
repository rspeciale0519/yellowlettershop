-- One authorized PaymentIntent may create at most one order.
-- Fail loudly if duplicates already exist; never delete rows to make this pass.
begin;

alter table public.orders
  add column if not exists stripe_payment_intent_id text;

do $$
declare
  duplicate_ids text;
  duplicate_count integer;
begin
  select string_agg(stripe_payment_intent_id, ', ' order by stripe_payment_intent_id), count(*)
    into duplicate_ids, duplicate_count
  from (
    select stripe_payment_intent_id
    from public.orders
    where stripe_payment_intent_id is not null
      and btrim(stripe_payment_intent_id) <> ''
    group by stripe_payment_intent_id
    having count(*) > 1
  ) duplicates;

  if coalesce(duplicate_count, 0) > 0 then
    raise exception
      'Cannot add unique constraint on orders.stripe_payment_intent_id: % duplicate payment intent(s) exist (%). Resolve them before applying this migration. No rows were deleted.',
      duplicate_count, duplicate_ids;
  end if;
end $$;

create unique index if not exists orders_stripe_payment_intent_id_uidx
  on public.orders (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null
    and btrim(stripe_payment_intent_id) <> '';

commit;
