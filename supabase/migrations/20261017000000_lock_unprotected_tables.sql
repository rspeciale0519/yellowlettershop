-- Security boundary for browser/JWT access. Apply via the normal reviewed
-- migration process; onboarding/tests must never run this against hosted DBs.
begin;

-- Deny by default on any public application table missed by older migrations.
do $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('r','p')
      and not exists (select 1 from pg_depend d where d.objid=c.oid and d.deptype='e')
  loop
    execute format('alter table public.%I enable row level security', t.relname);
  end loop;
end $$;

-- Money, verified recipient counts, administrative state and audit trails are
-- server-authoritative. REVOKE table privileges alone does not revoke legacy
-- column grants, and permissive policies combine with OR, so remove both.
do $$
declare
  table_name text;
  p record;
  col record;
begin
  foreach table_name in array array[
    'user_credits','user_notes','pricing_config','pricing_change_log','admin_audit_log',
    'orders','skip_trace_orders','accuzip_validation_jobs','record_usage','mailing_list_usage',
    'order_dispatches','vendor_status_callbacks','webhook_events','webhook_dead_letters',
    'background_jobs','rate_limit_counters','vendors','system_templates','teams',
    'team_members','team_invitations','team_activity_log','resource_permissions','user_profiles'
  ] loop
    if to_regclass(format('public.%I', table_name)) is null then continue; end if;
    execute format('revoke all privileges on table public.%I from public, anon, authenticated', table_name);
    for col in select a.attname from pg_attribute a
      where a.attrelid=to_regclass(format('public.%I', table_name)) and a.attnum>0 and not a.attisdropped
    loop
      execute format('revoke all privileges (%I) on public.%I from public, anon, authenticated', col.attname, table_name);
    end loop;
    -- Keep already-scoped read policies, except for tables whose reads are
    -- explicitly rebuilt below. Drop FOR ALL as it also grants mutations.
    for p in select policyname from pg_policies where schemaname='public' and tablename=table_name
      and (cmd <> 'SELECT' or table_name in ('user_profiles','pricing_config','user_credits','orders','skip_trace_orders','accuzip_validation_jobs'))
    loop
      execute format('drop policy %I on public.%I', p.policyname, table_name);
    end loop;
    execute format('grant all privileges on table public.%I to service_role', table_name);
    execute format('grant select on table public.%I to authenticated', table_name);
  end loop;
end $$;

-- Public catalog reads expose only active public prices; never write access.
drop policy if exists security_public_prices on public.pricing_config;
create policy security_public_prices on public.pricing_config for select to anon, authenticated
  using (is_public is true and is_active is true);
grant select on public.pricing_config to anon;

-- Explicit owner reads for financial/validation records; clients cannot forge
-- a completed validation snapshot to defeat the payment route's server count.
do $$
declare t text; owner_column text;
begin
  foreach t in array array['user_credits','orders','skip_trace_orders','accuzip_validation_jobs'] loop
    if to_regclass(format('public.%I', t)) is null then continue; end if;
    owner_column := case when t='orders' then 'created_by' else 'user_id' end;
    execute format('create policy security_owner_read on public.%I for select to authenticated using (%I=auth.uid())', t, owner_column);
  end loop;
end $$;

-- Profiles are also the authorization oracle. Never let a normal user write
-- role, team membership, account/credit status or Stripe identifiers directly.
drop policy if exists security_profile_read on public.user_profiles;
create policy security_profile_read on public.user_profiles for select to authenticated using (user_id=auth.uid());
drop policy if exists security_profile_update on public.user_profiles;
create policy security_profile_update on public.user_profiles for update to authenticated
  using (user_id=auth.uid()) with check (user_id=auth.uid());
do $$
declare col record;
begin
  for col in select column_name from information_schema.columns
    where table_schema='public' and table_name='user_profiles' and column_name in (
      'first_name','last_name','full_name','bio','company_name','phone','avatar_url','timezone','settings','updated_at'
    )
  loop
    execute format('grant update (%I) on public.user_profiles to authenticated', col.column_name);
  end loop;
end $$;

-- Prevent forged user-asset metadata from changing its owning namespace.
-- Storage-only image IDs are scoped to the same namespace in the HTTP route.
do $$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists "assets authenticated insert" on storage.objects;
    drop policy if exists security_assets_namespace on storage.objects;
    create policy security_assets_namespace on storage.objects as restrictive for all to authenticated
      using (bucket_id <> 'assets' or split_part(name,'/',1)=auth.uid()::text
        or (split_part(name,'/',1)='assets' and split_part(name,'/',2)=auth.uid()::text))
      with check (bucket_id <> 'assets' or split_part(name,'/',1)=auth.uid()::text
        or (split_part(name,'/',1)='assets' and split_part(name,'/',2)=auth.uid()::text));
    create policy "assets authenticated insert" on storage.objects for insert to authenticated
      with check (bucket_id='assets' and (split_part(name,'/',1)=auth.uid()::text
        or (split_part(name,'/',1)='assets' and split_part(name,'/',2)=auth.uid()::text)));
  end if;
end $$;

commit;
