import { spawnSync } from 'child_process'
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'

const PG_BIN = '/usr/lib/postgresql/16/bin'

export function applyMigrationsOnDisposablePostgres() {
  const dataDir = mkdtempSync(join(tmpdir(), 'yls-pg-'))
  const port = String(55432 + Math.floor(Math.random() * 1000))
  const run = (bin: string, args: string[]) => {
    const result = spawnSync(join(PG_BIN, bin), args, {
      encoding: 'utf8',
      env: { ...process.env, PGHOST: '127.0.0.1', PGPORT: port, PGUSER: process.env.USER || 'postgres' },
    })
    if (result.status !== 0) {
      throw new Error(`${bin} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`)
    }
    return result.stdout
  }

  run('initdb', ['-D', dataDir, '--no-sync', '--auth=trust', '-U', process.env.USER || 'postgres'])
  run('pg_ctl', ['-D', dataDir, '-o', `-p ${port} -k ${dataDir}`, '-l', join(dataDir, 'pg.log'), '-w', 'start'])
  try {
    const bootstrap = `
      create extension if not exists pgcrypto;
      create extension if not exists "uuid-ossp";
      create extension if not exists citext;
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema if not exists auth;
      create schema if not exists storage;
      create table if not exists auth.users(
        id uuid primary key default gen_random_uuid(),
        email text,
        raw_user_meta_data jsonb default '{}'::jsonb
      );
      create or replace function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      create or replace function auth.role() returns text language sql stable as $$
        select coalesce(current_setting('request.jwt.claim.role', true), 'authenticated')
      $$;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
      $$;
      create table if not exists auth.sessions(
        id uuid primary key default gen_random_uuid(),
        user_id uuid references auth.users(id),
        created_at timestamptz default now(),
        updated_at timestamptz default now(),
        user_agent text,
        ip inet,
        aal text
      );
      create table if not exists storage.buckets(
        id text primary key,
        name text,
        public boolean default false,
        file_size_limit bigint,
        allowed_mime_types text[]
      );
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
    `
    run('psql', ['-v', 'ON_ERROR_STOP=1', '-d', 'postgres', '-c', bootstrap])
    const dir = resolve(__dirname, '../../supabase/migrations')
    const files = readdirSync(dir).filter((name) => name.endsWith('.sql')).sort()
    for (const name of files) {
      const sqlPath = join(dataDir, name)
      writeFileSync(sqlPath, readFileSync(join(dir, name), 'utf8'))
      run('psql', ['-v', 'ON_ERROR_STOP=1', '-d', 'postgres', '-f', sqlPath])
    }
    return { dataDir, port, files }
  } finally {
    spawnSync(join(PG_BIN, 'pg_ctl'), ['-D', dataDir, '-m', 'fast', 'stop'], { encoding: 'utf8' })
  }
}
