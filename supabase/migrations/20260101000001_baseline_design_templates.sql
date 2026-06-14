-- Baseline: public.design_templates (+ template_type enum)
--
-- Like user_profiles, design_templates is a "keeper" table that pre-existed on the
-- hosted project (created out-of-band) and was never captured as a migration. Later
-- migrations only reference it (e.g. 20260613010000_fix_rls_pii drops/creates a SELECT
-- policy on it), which makes a fresh local database fail. Reconstructed from
-- types/supabase.ts so the local stack can replay the full chain.
do $$ begin
  if not exists (select 1 from pg_type where typname = 'template_type') then
    create type public.template_type as enum ('letter', 'postcard', 'envelope');
  end if;
end $$;

create table if not exists public.design_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  type public.template_type not null,
  template_data jsonb not null default '{}'::jsonb,
  preview_image_url text,
  tags text[] not null default '{}'::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.design_templates enable row level security;
-- The active-template SELECT policy is added by 20260613010000_fix_rls_pii.
