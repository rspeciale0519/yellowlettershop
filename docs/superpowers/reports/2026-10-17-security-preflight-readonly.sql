-- REVIEW ONLY. Not executed against a hosted database by this task.
-- These reads identify rollout prerequisites without returning secrets,
-- signed download tokens, callback URLs, customer addresses or artwork.
begin transaction read only;
set local statement_timeout = '15s';

-- Inspect recorded statements/history before choosing the rollout path.
-- The original version had different proposals in PR #25 and 9928a56;
-- consolidation retains PR #25's original and adds a unique forward version.
select version, name
from supabase_migrations.schema_migrations
where version in ('20261017000000', '20261017010000', '20261017120000',
                  '20261017120100', '20261017120200', '20261017120300');

-- Payment-intent uniqueness must be reconciled before creating the index.
select count(*) as duplicate_payment_intent_groups
from (
  select stripe_payment_intent_id from public.orders
  where stripe_payment_intent_id is not null and btrim(stripe_payment_intent_id) <> ''
  group by stripe_payment_intent_id having count(*) > 1
) duplicates;

-- Inspect the installed token implementation without exposing its body.
-- Final code uses core PostgreSQL CSPRNG, never an MD5/clock fallback.
select p.prosecdef as security_definer,
       position('pg_catalog.gen_random_uuid' in p.prosrc)>0 as uses_core_csprng,
       position('md5' in lower(p.prosrc))>0 as has_md5_fallback,
       position('clock_timestamp' in lower(p.prosrc))>0 as has_clock_fallback
from pg_proc p
where p.oid=to_regprocedure('public.generate_share_token()');

-- Extension layout remains useful schema context; final token generation does
-- not depend on pgcrypto or assume it lives in public.
select e.extname, n.nspname as extension_schema, p.proname,
       d.deptype='e' as function_owned_by_extension
from pg_extension e
join pg_namespace n on n.oid=e.extnamespace
left join pg_proc p on p.pronamespace=n.oid and p.proname='gen_random_bytes'
left join pg_depend d on d.objid=p.oid and d.classid='pg_proc'::regclass
  and d.refclassid='pg_extension'::regclass and d.refobjid=e.oid and d.deptype='e'
where e.extname='pgcrypto';

-- Do not return the bearer token or digest. A raw 64-hex token and a SHA-256
-- digest have the same shape: this count CANNOT establish which format is used.
-- Confirm deployed app history and how rows were created before a backfill.
select count(*) as share_link_rows,
  count(*) filter (where is_active is true) as active_share_links,
  count(*) filter (where expires_at is null) as missing_expiry,
  count(*) filter (where expires_at > created_at+interval '30 days') as exceeds_expiry_limit,
  count(*) filter (where created_at is null or created_at > now()) as invalid_creation_time,
  count(*) filter (where share_token ~ '^[0-9a-f]{64}$') as ambiguous_64hex_rows,
  count(*) filter (where share_token !~ '^[0-9a-f]{64}$') as other_token_shapes
from public.asset_share_links;

select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p')
order by c.relname;

select table_name, grantee, privilege_type
from information_schema.table_privileges
where table_schema='public'
  and grantee in ('PUBLIC','anon','authenticated','service_role')
  and table_name in ('orders','user_credits','pricing_config','pricing_change_log',
    'admin_audit_log','user_profiles','teams','accuzip_validation_jobs','asset_share_links')
order by table_name, grantee, privilege_type;

select table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema='public'
  and grantee in ('PUBLIC','anon','authenticated')
  and table_name in ('orders','user_credits','pricing_config','user_profiles',
    'teams','accuzip_validation_jobs','asset_share_links')
order by table_name, grantee, column_name;

-- Review expressions internally before sharing; no actual row values needed.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname='public' and tablename in ('orders','user_credits',
  'pricing_config','user_profiles','teams','accuzip_validation_jobs','user_assets','asset_share_links'))
  or (schemaname='storage' and tablename='objects')
order by schemaname, tablename, policyname;

-- Function bodies are deliberately omitted: inspect privileged implementations
-- internally, and verify no SECURITY DEFINER entry point bypasses the boundary.
select n.nspname as schema_name, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as argument_types,
       pg_get_userbyid(p.proowner) as owner_name, p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
order by p.proname, argument_types;

select routine_schema, routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema='public'
  and grantee in ('PUBLIC','anon','authenticated','service_role')
order by routine_name, grantee;

select id, public from storage.buckets where id in ('assets','design-previews');

select count(*) as profiles_with_public_asset_urls
from public.user_profiles
where avatar_url like '%/storage/v1/object/public/assets/%';

select is_public,
  count(*) as asset_count,
  count(*) filter (where file_url like '%/storage/v1/object/public/assets/%') as public_url_count,
  count(*) filter (where file_url like '%/storage/v1/object/sign/assets/%') as signed_url_shape_count,
  count(*) filter (where file_path like 'assets/%') as legacy_nested_namespace_count,
  count(*) filter (where not coalesce(
    (split_part(file_path,'/',1)=user_id::text or
      (split_part(file_path,'/',1)='assets' and split_part(file_path,'/',2)=user_id::text))
    and not (string_to_array(file_path,'/') && array['','.','..'])
    and position(chr(92) in file_path)=0 and position('%' in file_path)=0
    and file_path !~ '[[:cntrl:]]', false)) as malformed_namespace_count
from public.user_assets
group by is_public;

-- Stored URL counts only; do not export designs, customer metadata or URLs.
select count(*) as designs_with_public_asset_urls
from public.saved_designs
where design_data::text like '%/storage/v1/object/public/assets/%';

select count(*) as orders_with_public_asset_urls
from public.orders
where metadata::text like '%/storage/v1/object/public/assets/%';

select count(*) as auth_profiles_with_public_asset_urls
from auth.users
where raw_user_meta_data::text like '%/storage/v1/object/public/assets/%';

-- Presence of a secret is safe to return; its value and endpoint URL are not.
select id, user_id, events, is_active,
       (nullif(secret,'') is not null) as uses_signature_secret
from public.webhooks where is_active is true;

-- Check saved_designs.design_data, orders.metadata.order_state and Auth user
-- metadata internally for stored public asset URLs. Return counts only.
-- Review hosting ingress logs for calls to /api/webhooks without exporting
-- bodies, keys, signed headers, token-bearing URL paths or other credentials.
rollback;
