-- Inbound vendor status callbacks (Redstone §4.4).
--
-- Redstone posts job-status changes to a URL we give them. That traffic moves
-- customer-facing order state and triggers the "your order shipped" email, so
-- every call is recorded here whether or not it was accepted.
--
-- This table is deliberately NOT admin_audit_log: that table's actor_id is
-- `NOT NULL REFERENCES auth.users(id)`, and a vendor callback has no user
-- behind it. Writing there would fail the FK and be swallowed by
-- logAdminAction's try/catch, silently losing the trail for the one path where
-- we most need it.
--
-- It doubles as the idempotency key. Redstone may retry; `dedupe_key` is
-- unique so a replay is recognised instead of re-running the transition and
-- re-emailing the customer.

begin;

create table if not exists public.vendor_status_callbacks (
  id uuid primary key default gen_random_uuid(),
  -- 'redstone' today; the column exists so a second vendor does not need a
  -- second table.
  source text not null,
  -- Vendor's identifier for the job. For Redstone this is our own order id,
  -- because that is what we send as `id` on createOrder.
  external_order_id text,
  order_id uuid references public.orders(id) on delete set null,
  -- The vendor's own status string, stored verbatim before any mapping, so a
  -- mapping bug is diagnosable after the fact.
  raw_status text,
  mapped_status text,
  tracking_number text,
  tracking_carrier text,
  -- Whole request body. Redstone's callback shape is not yet confirmed
  -- in the field, so keeping it means the first real call tells us the truth
  -- without needing them to re-send.
  payload jsonb not null default '{}'::jsonb,
  -- accepted | duplicate | rejected | unmatched | error
  outcome text not null,
  detail text,
  source_ip text,
  dedupe_key text,
  received_at timestamptz not null default now()
);

create unique index if not exists uq_vendor_status_callbacks_dedupe
  on public.vendor_status_callbacks (source, dedupe_key)
  where dedupe_key is not null;

create index if not exists idx_vendor_status_callbacks_order
  on public.vendor_status_callbacks (order_id, received_at desc);

create index if not exists idx_vendor_status_callbacks_received
  on public.vendor_status_callbacks (received_at desc);

alter table public.vendor_status_callbacks enable row level security;
-- RLS on with no policy = service-role only, matching webhook_events /
-- background_jobs / order_dispatches.

comment on table public.vendor_status_callbacks is
  'Inbound vendor job-status callbacks (Redstone 4.4). Audit + idempotency for a path that has no authenticated user.';

commit;
