-- Order lifecycle: extend status vocabulary for the proof → approval →
-- capture → fulfillment journey and add the columns the status page and
-- approval workflow read/write.

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in (
    'submitted',      -- payment authorized, order received
    'proof_ready',    -- proof generated, awaiting customer review
    'approved',       -- customer approved proof
    'processing',     -- payment captured, queued for production
    'in_production',  -- printing
    'mailed',         -- handed to USPS
    'completed',
    'cancelled',
    'rejected'        -- customer rejected proof
  ));

alter table orders add column if not exists proof_url          text;
alter table orders add column if not exists payment_intent_id  text;
alter table orders add column if not exists approved_at        timestamptz;
alter table orders add column if not exists captured_at        timestamptz;
alter table orders add column if not exists status_history     jsonb not null default '[]'::jsonb;
alter table orders add column if not exists updated_at         timestamptz not null default now();

create index if not exists orders_payment_intent_idx on orders(payment_intent_id);
