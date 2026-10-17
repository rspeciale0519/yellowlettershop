import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { asRole, ownerId, otherId } from './security-database'

export { asRole, ownerId, otherId }

export async function teamRpcDatabase() {
  const db = new PGlite()
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    insert into auth.users values
      ('${ownerId}', 'owner@example.test'),
      ('${otherId}', 'other@example.test');
    create table public.pricing_config(
      id uuid primary key default gen_random_uuid(),
      category text,
      key text,
      display_name text,
      is_public boolean default true,
      is_active boolean default true
    );
    alter table public.pricing_config enable row level security;
    create table public.user_profiles(
      user_id uuid primary key,
      role text default 'user',
      team_id uuid,
      first_name text
    );
    create table public.teams(
      id uuid primary key default gen_random_uuid(),
      name text not null,
      plan text not null default 'team',
      max_seats integer not null default 25,
      owner_id uuid not null
    );
    create table public.team_members(
      id uuid primary key default gen_random_uuid(),
      team_id uuid not null references public.teams(id) on delete cascade,
      user_id uuid not null,
      role text not null,
      status text not null default 'active',
      invited_by uuid
    );
    create table public.team_invitations(
      id uuid primary key default gen_random_uuid(),
      team_id uuid not null references public.teams(id) on delete cascade,
      email text not null,
      role text not null,
      invited_by uuid not null,
      token text not null,
      status text not null default 'pending',
      expires_at timestamptz not null default now() + interval '7 days'
    );
    create table public.team_activity_log(
      id uuid primary key default gen_random_uuid(),
      team_id uuid,
      actor_id uuid not null,
      action_type text not null,
      target_user_id uuid,
      metadata jsonb not null default '{}'::jsonb
    );
    insert into public.user_profiles(user_id, first_name) values ('${ownerId}', 'Owner'), ('${otherId}', 'Other');
    grant usage on schema public to anon, authenticated, service_role;
    grant select on all tables in schema public to authenticated, service_role;
    grant all on all tables in schema public to service_role;
    grant execute on all functions in schema public to authenticated, service_role;
  `)
  await db.exec(readFileSync(resolve(__dirname, '../../supabase/migrations/20261017010000_harden_financial_and_asset_access.sql'), 'utf8'))
  await db.exec(readFileSync(resolve(__dirname, '../../supabase/migrations/20261017120100_team_write_rpcs.sql'), 'utf8'))
  return db
}
