import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

export const ownerId = '00000000-0000-4000-8000-000000000001'
export const otherId = '00000000-0000-4000-8000-000000000002'
export const migrationSql = () => readFileSync(resolve(__dirname, '../../supabase/migrations/20261017000000_lock_unprotected_tables.sql'), 'utf8')
export async function securityDatabase() {
  const db = new PGlite()
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    insert into auth.users values ('${ownerId}'), ('${otherId}');
  `)
  for (const name of ['20260101000000_baseline_user_profiles.sql', '20260328000001_admin_audit_log.sql', '20260328000002_pricing_tables.sql', '20260328000004_user_management_tables.sql', '20260613030000_restore_assets_versioning_tables.sql']) {
    await db.exec(readFileSync(resolve(__dirname, '../../supabase/migrations', name), 'utf8'))
  }
  await db.exec(`
    alter table user_profiles add column team_id uuid, add column stripe_customer_id text,
      add column job_title text, add column street_address text, add column city text,
      add column state text, add column zip_code text, add column country text,
      add column email_notifications boolean, add column sms_notifications boolean, add column marketing_emails boolean;
    create table teams(id uuid primary key default gen_random_uuid(), owner_id uuid, name text, stripe_customer_id text);
    create table orders(id uuid primary key default gen_random_uuid(), created_by uuid, total_cost numeric, payment_status text);
    create table accuzip_validation_jobs(id uuid primary key default gen_random_uuid(), user_id uuid, deliverable_count int, validated_records jsonb);
    create table vendors(id uuid primary key default gen_random_uuid(), name text);
    create table unprotected_future_table(id uuid);
    create policy unsafe_asset_update on user_assets for update to authenticated using(true) with check(true);
    create schema storage;
    create table storage.objects(bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated, anon, service_role;
    grant all on storage.objects to authenticated, anon, service_role;
    create policy unsafe_storage on storage.objects for all to authenticated using (true) with check (true);
    insert into storage.objects values ('assets','${ownerId}/own.png'), ('assets','${otherId}/other.png');
    grant all on all tables in schema public to public, anon, authenticated, service_role;
    grant update(role, team_id) on user_profiles to authenticated;
    grant update(amount) on user_credits to authenticated;
    alter table orders enable row level security;
    create policy unsafe_all on orders for all to authenticated using (true) with check (true);
    insert into user_profiles(user_id, first_name) values ('${ownerId}', 'Owner'), ('${otherId}', 'Other');
    insert into pricing_config(category, key, display_name, unit_amount) values ('mail_piece', 'public', 'Public', 100);
    insert into pricing_config(category, key, display_name, unit_amount, is_public) values ('mail_piece', 'private', 'Private', 200, false);
    insert into user_credits(user_id,amount,type,description,balance_after,created_by) values ('${ownerId}',10,'credit','fixture',10,'${ownerId}'), ('${otherId}',20,'credit','other fixture',20,'${otherId}');
    insert into orders(created_by,total_cost,payment_status) values ('${ownerId}',100,'pending'), ('${otherId}',200,'pending');
    insert into teams(owner_id,name) values ('${ownerId}','Owner team'), ('${otherId}','Other team');
    insert into user_assets(user_id, uploaded_by,filename,original_filename,file_path) values ('${ownerId}','${ownerId}','sample','sample','${ownerId}/sample.pdf');
    alter table teams enable row level security;
    create policy owner_team_read on teams for select to authenticated using(owner_id=auth.uid());
    insert into accuzip_validation_jobs(user_id,deliverable_count,validated_records) values ('${ownerId}',1,'[]');
  `)
  return db
}
export async function asRole<T>(db: PGlite, role: 'anon' | 'authenticated' | 'service_role', action: () => Promise<T>) {
  await db.exec(`set role ${role}; set request.jwt.claim.sub = '${ownerId}'`)
  try { return await action() } finally { await db.exec('reset role') }
}
