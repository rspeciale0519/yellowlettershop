-- Consolidation gap: the trigger public.create_audit_log_entry() (defined in
-- 20260613000000) writes to mailing_list_audit_log on every insert/update/delete
-- of mailing_list_records, but that table was never created — so ANY insert into
-- mailing_list_records fails with 42P01. This creates the missing audit table.
-- Additive + idempotent.

begin;

create table if not exists public.mailing_list_audit_log (
  id uuid primary key default gen_random_uuid(),
  mailing_list_id uuid,
  record_id uuid,
  action_type text not null,
  before_data jsonb,
  after_data jsonb,
  user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_mlal_list on public.mailing_list_audit_log (mailing_list_id, created_at desc);
create index if not exists idx_mlal_record on public.mailing_list_audit_log (record_id);

alter table public.mailing_list_audit_log enable row level security;

-- Rows are written only by the trigger (which runs in the inserting statement's
-- context). Allow the trigger insert from any authenticated/service context;
-- restrict reads to owners of the parent mailing list (audit rows hold PII).
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='mailing_list_audit_log' and policyname='mlal_insert_trigger'
  ) then
    create policy mlal_insert_trigger on public.mailing_list_audit_log
      for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='mailing_list_audit_log' and policyname='mlal_select_own'
  ) then
    create policy mlal_select_own on public.mailing_list_audit_log
      for select using (
        exists (
          select 1 from public.mailing_lists ml
          where ml.id = mailing_list_audit_log.mailing_list_id
            and ml.created_by = auth.uid()
        )
      );
  end if;
end $$;

commit;
