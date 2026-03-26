-- order_drafts: persists wizard state between sessions (30-day expiry)
create table if not exists order_drafts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  order_state jsonb not null,
  status      text not null default 'active'
                check (status in ('active', 'submitted')),
  expires_at  timestamptz not null default (now() + interval '30 days'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists order_drafts_user_id_idx on order_drafts(user_id, status);

alter table order_drafts enable row level security;
create policy "users manage own drafts"
  on order_drafts for all
  using (auth.uid() = user_id);

-- orders: submitted orders (minimal schema — full lifecycle is a separate spec)
create table if not exists orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  draft_id     uuid references order_drafts(id),
  order_state  jsonb not null,
  status       text not null default 'submitted'
                 check (status in ('submitted', 'processing', 'completed', 'cancelled')),
  submitted_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists orders_user_id_idx on orders(user_id, status);

alter table orders enable row level security;
create policy "users view own orders"
  on orders for all
  using (auth.uid() = user_id);
