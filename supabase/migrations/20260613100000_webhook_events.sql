-- Idempotency store for Stripe webhook processing (consolidated model). The
-- webhook handler records each Stripe event id and marks it processed, so
-- retried deliveries become no-ops. Written only by the service role (which
-- bypasses RLS). Additive + idempotent.

begin;

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhook_events_stripe_id on public.webhook_events (stripe_event_id);

alter table public.webhook_events enable row level security;
-- No public policies: only the service role (RLS-bypassing) reads/writes this
-- internal log, so RLS-on with no policy = locked to service role.

commit;
