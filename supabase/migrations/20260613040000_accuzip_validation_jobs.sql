-- AccuZip address-validation jobs. Referenced by app/api/accuzip/{upload,status,
-- results,report} but never defined in any migration (a gap surfaced by the
-- wizard smoke: "Failed to create validation job"). Owner-scoped RLS.
-- Additive + idempotent.

begin;

create table if not exists public.accuzip_validation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  total_records integer not null default 0,
  records_data jsonb,
  column_mapping jsonb,
  validated_records jsonb,
  deliverable_count integer,
  undeliverable_count integer,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_accuzip_jobs_user_created
  on public.accuzip_validation_jobs (user_id, created_at desc);

alter table public.accuzip_validation_jobs enable row level security;

drop policy if exists "accuzip_jobs_owner_all" on public.accuzip_validation_jobs;
create policy "accuzip_jobs_owner_all" on public.accuzip_validation_jobs
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
