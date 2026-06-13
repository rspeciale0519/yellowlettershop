-- Security: rate_limit_counters had no RLS, letting clients touch counters
-- directly (limiter bypass). Enable RLS with NO client policies — all access
-- flows through the security-definer increment_rate_limit()/cleanup functions;
-- the service role bypasses RLS automatically.
alter table public.rate_limit_counters enable row level security;
