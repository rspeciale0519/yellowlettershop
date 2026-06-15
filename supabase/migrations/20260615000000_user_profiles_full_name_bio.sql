-- The Profile page (components/profile/*-tab.tsx) reads + writes several
-- user_profiles columns that the baseline table (reconstructed from
-- types/supabase.ts) never had, so each tab's Save 400'd on the PATCH. Add them.
-- Personal Info:
alter table public.user_profiles add column if not exists full_name text;
alter table public.user_profiles add column if not exists bio text;
-- Business Info:
alter table public.user_profiles add column if not exists job_title text;
alter table public.user_profiles add column if not exists street_address text;
alter table public.user_profiles add column if not exists city text;
alter table public.user_profiles add column if not exists state text;
alter table public.user_profiles add column if not exists zip_code text;
alter table public.user_profiles add column if not exists country text;
-- Preferences:
alter table public.user_profiles add column if not exists email_notifications boolean not null default true;
alter table public.user_profiles add column if not exists sms_notifications boolean not null default false;
alter table public.user_profiles add column if not exists marketing_emails boolean not null default false;
