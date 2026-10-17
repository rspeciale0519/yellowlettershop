import { PGlite } from '@electric-sql/pglite'
import { readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'

export function migrationFiles() {
  const dir = resolve(__dirname, '../../supabase/migrations')
  return readdirSync(dir).filter((name) => name.endsWith('.sql')).sort().map((name) => ({
    name,
    sql: readFileSync(resolve(dir, name), 'utf8'),
  }))
}

export async function bootstrapDisposablePostgres() {
  const db = new PGlite()
  await db.exec(`
    do $$ begin
      create extension if not exists pgcrypto with schema public;
    exception when others then
      null;
    end $$;
    do $$ begin
      create extension if not exists "uuid-ossp";
    exception when others then
      create or replace function public.uuid_generate_v4() returns uuid language sql as $f$ select gen_random_uuid() $f$;
    end $$;
    do $$ begin
      create extension if not exists citext;
    exception when others then
      create domain public.citext as text;
    end $$;
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema if not exists auth;
    create schema if not exists storage;
    create table if not exists auth.users(
      id uuid primary key,
      email text,
      raw_user_meta_data jsonb default '{}'::jsonb
    );
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create or replace function auth.role() returns text language sql stable as $$
      select current_setting('request.jwt.claim.role', true)
    $$;
    create table if not exists storage.objects(
      id uuid primary key default gen_random_uuid(),
      bucket_id text,
      name text,
      owner uuid,
      metadata jsonb default '{}'::jsonb
    );
    alter table storage.objects enable row level security;
    grant usage on schema auth, public, storage to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    grant all on all tables in schema public to postgres, service_role;
  `)
  return db
}

export async function applyAllMigrations(db: PGlite) {
  const applied: string[] = []
  for (const file of migrationFiles()) {
    await db.exec(file.sql)
    applied.push(file.name)
  }
  return applied
}
