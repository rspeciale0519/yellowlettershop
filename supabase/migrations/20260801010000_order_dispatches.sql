-- Vendor fulfillment hand-off.
--
-- After a customer approves their proof and payment captures, the order needs
-- to reach a print vendor and come back with tracking. Until now orders simply
-- stopped at 'processing'. Each dispatch is one hand-off of one order to one
-- vendor; re-dispatch after a failure inserts a new row (history is kept).
--
-- Service-role only: dispatch is a server/admin concern. Customers see the
-- resulting state through the orders API, which already scopes by created_by.

begin;

do $$ begin if not exists (select 1 from pg_type where typname='dispatch_status') then
  create type public.dispatch_status as enum
    ('sent', 'accepted', 'in_production', 'shipped', 'delivered', 'failed');
end if; end $$;

create table if not exists public.order_dispatches (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id),
  status public.dispatch_status not null default 'sent',
  -- { csvPath, proofPath, recordCount } — storage paths, never signed URLs
  -- (signatures expire; mint them on read instead).
  package jsonb not null default '{}'::jsonb,
  tracking_number text,
  tracking_carrier text,
  error text,
  dispatched_at timestamptz not null default now(),
  accepted_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_by uuid not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_order_dispatches_order
  on public.order_dispatches (order_id, dispatched_at desc);

alter table public.order_dispatches enable row level security;
-- RLS on with no policy = locked to the service role (which bypasses RLS),
-- matching the webhook_events / background_jobs precedent.

commit;
