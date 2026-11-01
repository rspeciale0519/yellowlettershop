-- Forward correction: retain the reviewed built-in CSPRNG and make share-link
-- mutations server-authoritative. The earlier version had different SQL in
-- review; a recorded older120200 must receive the same secure function too.
-- REVIEW ONLY until separately approved for the hosted environment.
begin;

create or replace function public.generate_share_token()
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Two v4 UUIDs ≈ 244 bits from the backend CSPRNG.
  return encode(
    decode(
      replace(pg_catalog.gen_random_uuid()::text, '-', '')
      || replace(pg_catalog.gen_random_uuid()::text, '-', ''),
      'hex'
    ),
    'hex'
  );
end;
$$;

revoke all on function public.generate_share_token() from public, anon, authenticated;
grant execute on function public.generate_share_token() to service_role;

-- Owners use authenticated HTTP handlers for creation/revocation; direct writes
-- would bypass expiry limits. Remove historical table AND column grants.
do $$
declare col record; policy record;
begin
  if to_regclass('public.asset_share_links') is null then return; end if;
  alter table public.asset_share_links enable row level security;
  revoke all privileges on public.asset_share_links from public, anon, authenticated;
  for col in select attname from pg_catalog.pg_attribute
    where attrelid='public.asset_share_links'::regclass and attnum>0 and not attisdropped
  loop
    execute format('revoke all privileges (%I) on public.asset_share_links from public, anon, authenticated', col.attname);
  end loop;
  for policy in select policyname from pg_catalog.pg_policies
    where schemaname='public' and tablename='asset_share_links'
  loop
    execute format('drop policy %I on public.asset_share_links', policy.policyname);
  end loop;
  create policy security_share_owner_read on public.asset_share_links
    for select to authenticated using (created_by=auth.uid());
  grant select on public.asset_share_links to authenticated;
  grant all privileges on public.asset_share_links to service_role;
end $$;

-- Existing token strings are intentionally not guessed/backfilled here.
-- Inventory whether rows contain raw tokens, hashes or a mixture before an
-- independently reviewed data conversion; otherwise existing URLs can break.
commit;
