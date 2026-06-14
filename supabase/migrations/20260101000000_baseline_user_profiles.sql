-- Baseline: public.user_profiles
--
-- This table pre-existed on the hosted project (the "DB2" profile table) and was
-- created out-of-band (Supabase dashboard), so it was never captured as a migration.
-- The rest of the migration chain only ALTERs / references it, which makes a fresh
-- local database fail ("relation user_profiles does not exist"). This baseline
-- reconstructs the original shape from types/supabase.ts so the local stack can
-- replay the full chain. Columns added by later migrations (team_id, account_status,
-- stripe_customer_id) are intentionally omitted here — those migrations add them.
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'user',
  first_name text,
  last_name text,
  company_name text,
  phone text,
  avatar_url text,
  timezone text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_profiles_user_id_key on public.user_profiles (user_id);

alter table public.user_profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Users can view own profile') then
    create policy "Users can view own profile" on public.user_profiles
      for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Users can insert own profile') then
    create policy "Users can insert own profile" on public.user_profiles
      for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Users can update own profile') then
    create policy "Users can update own profile" on public.user_profiles
      for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
