import { spawnSync } from 'child_process'
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { postgresBinaries } from './postgres-binaries'

const INITDB = process.platform === 'win32' ? 'initdb.exe' : 'initdb'
const PG_CTL = process.platform === 'win32' ? 'pg_ctl.exe' : 'pg_ctl'
const PSQL = process.platform === 'win32' ? 'psql.exe' : 'psql'

export type DisposablePgSql = (query: string) => string

export type DisposablePgOptions = {
  pgcryptoSchema?: 'public' | 'extensions'
  afterApply?: (sql: DisposablePgSql) => void
}

export function resolvePgBin(): string | null {
  try { return postgresBinaries() } catch { return null }
}

export function canRunDisposablePostgres(): boolean {
  return resolvePgBin() !== null
}

export function applyMigrationsOnDisposablePostgres(options: DisposablePgOptions = {}) {
  const pgBin = resolvePgBin()
  if (!pgBin) {
    throw new Error(
      `Native PostgreSQL is required. Set PG_BIN to its bin directory (platform=${process.platform}).`
    )
  }
  const dataDir = mkdtempSync(join(tmpdir(), 'yls-pg-'))
  const port = String(55432 + Math.floor(Math.random() * 1000))
  const run = (bin: string, args: string[]) => {
    const result = spawnSync(join(pgBin, bin), args, {
      encoding: 'utf8',
      env: { ...process.env, PGHOST: '127.0.0.1', PGPORT: port, PGUSER: process.env.USER || 'postgres' },
    })
    if (result.status !== 0) {
      throw new Error(`${bin}: ${result.error?.message || result.stderr || result.stdout}`)
    }
    return result.stdout
  }
  const sql: DisposablePgSql = (query) =>
    run(PSQL, ['-v', 'ON_ERROR_STOP=1', '-qAt', '-d', 'postgres', '-c', query])

  run(INITDB, ['-D', dataDir, '--no-sync', '--auth=trust', '--encoding=UTF8', '--locale=C', '-U', process.env.USER || 'postgres'])
  const serverOptions = `-p ${port} -h 127.0.0.1${process.platform === 'win32' ? '' : ` -k \"${dataDir}\"`}`
  run(PG_CTL, ['-D', dataDir, '-o', serverOptions, '-l', join(dataDir, 'pg.log'), '-w', 'start'])
  try {
    sql(bootstrapSql(options.pgcryptoSchema ?? 'public'))
    const dir = resolve(__dirname, '../../supabase/migrations')
    const files = readdirSync(dir).filter((name) => name.endsWith('.sql')).sort()
    for (const name of files) {
      const sqlPath = join(dataDir, name)
      writeFileSync(sqlPath, readFileSync(join(dir, name), 'utf8'))
      run(PSQL, ['-v', 'ON_ERROR_STOP=1', '-d', 'postgres', '-f', sqlPath])
    }
    options.afterApply?.(sql)
    return { dataDir, port, files }
  } finally {
    spawnSync(join(pgBin, PG_CTL), ['-D', dataDir, '-m', 'fast', 'stop'], { encoding: 'utf8' })
  }
}

function bootstrapSql(pgcryptoSchema: 'public' | 'extensions') {
  const pgcrypto = pgcryptoSchema === 'extensions'
    ? `create schema if not exists extensions; create extension if not exists pgcrypto with schema extensions;`
    : `create extension if not exists pgcrypto;`
  return `
    ${pgcrypto}
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
      id text primary key, name text, public boolean default false,
      file_size_limit bigint, allowed_mime_types text[]
    );
    create table if not exists storage.objects(
      id uuid primary key default gen_random_uuid(),
      bucket_id text, name text, owner uuid, metadata jsonb default '{}'::jsonb
    );
    alter table storage.objects enable row level security;
    grant usage on schema auth, public, storage to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `
}
