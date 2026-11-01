-- Lock down tables that shipped without RLS. No client policies: only the
-- service role (admin/pricing loaders) can read or write. Do not apply this
-- by hand against a live database from this PR; it is included for review.

alter table if exists public.proof_annotations enable row level security;
alter table if exists public.admin_audit_log enable row level security;
alter table if exists public.pricing_config enable row level security;
alter table if exists public.pricing_change_log enable row level security;
alter table if exists public.user_notes enable row level security;
alter table if exists public.user_credits enable row level security;

revoke all on table public.proof_annotations from anon, authenticated;
revoke all on table public.admin_audit_log from anon, authenticated;
revoke all on table public.pricing_config from anon, authenticated;
revoke all on table public.pricing_change_log from anon, authenticated;
revoke all on table public.user_notes from anon, authenticated;
revoke all on table public.user_credits from anon, authenticated;
