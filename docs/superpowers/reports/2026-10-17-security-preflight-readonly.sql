-- REVIEW ONLY. Not executed against a hosted database by this task.
-- These reads identify rollout prerequisites without returning secrets,
-- signed download tokens, callback URLs, customer addresses or artwork.

-- Inspect recorded statements/history before choosing the rollout path.
-- The original version had different proposals in PR #25 and 9928a56;
-- consolidation retains PR #25's original and adds a unique forward version.
select version, name
from supabase_migrations.schema_migrations
where version in ('20261017000000', '20261017010000');

select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p')
order by c.relname;

select table_name, grantee, privilege_type
from information_schema.table_privileges
where table_schema='public'
  and grantee in ('PUBLIC','anon','authenticated','service_role')
  and table_name in ('orders','user_credits','pricing_config','pricing_change_log',
    'admin_audit_log','user_profiles','teams','accuzip_validation_jobs')
order by table_name, grantee, privilege_type;

select table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema='public'
  and grantee in ('PUBLIC','anon','authenticated')
  and table_name in ('orders','user_credits','pricing_config','user_profiles',
    'teams','accuzip_validation_jobs')
order by table_name, grantee, column_name;

-- Review expressions internally before sharing; no actual row values needed.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname='public' and tablename in ('orders','user_credits',
  'pricing_config','user_profiles','teams','accuzip_validation_jobs','user_assets'))
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

-- Presence of a secret is safe to return; its value and endpoint URL are not.
select id, user_id, events, is_active,
       (nullif(secret,'') is not null) as uses_signature_secret
from public.webhooks where is_active is true;

-- Check saved_designs.design_data, orders.metadata.order_state and Auth user
-- metadata internally for stored public asset URLs. Return counts only.
-- Review hosting ingress logs for calls to /api/webhooks without exporting
-- bodies, keys, signed headers, token-bearing URL paths or other credentials.
