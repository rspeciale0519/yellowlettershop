-- Phase 3 production hardening: persistent jobs, distributed rate limiting,
-- webhook dead letters.

-- Background jobs survive serverless instance recycling.
create table if not exists background_jobs (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null,
  status       text not null default 'pending'
                 check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress     integer not null default 0 check (progress between 0 and 100),
  data         jsonb not null default '{}'::jsonb,
  result       jsonb,
  error        text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  completed_at timestamptz
);

create index if not exists background_jobs_user_idx on background_jobs(user_id, status);

alter table background_jobs enable row level security;
create policy "users read own jobs"
  on background_jobs for select
  using (auth.uid() = user_id);
-- writes go through the service role only

-- Distributed rate limiting / counters. One row per (key, window-start).
create table if not exists rate_limit_counters (
  key          text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (key, window_start)
);

-- Atomic check-and-increment: returns the post-increment count for the
-- caller to compare against its limit. Single round trip, race-safe.
create or replace function increment_rate_limit(
  p_key text,
  p_window_seconds integer
) returns integer
language plpgsql
security definer
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  insert into rate_limit_counters as c (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start)
  do update set count = c.count + 1
  returning count into v_count;
  return v_count;
end;
$$;

-- Opportunistic cleanup of stale windows (called from the limiter, cheap).
create or replace function cleanup_rate_limit_counters() returns void
language sql
security definer
as $$
  delete from rate_limit_counters where window_start < now() - interval '1 day';
$$;

-- Dead letters for outbound webhook deliveries that exhausted retries.
create table if not exists webhook_dead_letters (
  id           uuid primary key default gen_random_uuid(),
  webhook_id   uuid,
  user_id      uuid,
  event_type   text not null,
  payload      jsonb not null,
  attempts     integer not null,
  last_error   text,
  created_at   timestamptz not null default now()
);

create index if not exists webhook_dead_letters_user_idx on webhook_dead_letters(user_id, created_at);
alter table webhook_dead_letters enable row level security;
create policy "users read own dead letters"
  on webhook_dead_letters for select
  using (auth.uid() = user_id);
