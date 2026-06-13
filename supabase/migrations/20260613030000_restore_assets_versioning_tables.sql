-- Restore feature tables that were built in code but never carried into the
-- consolidated (DB1-model) schema: the designer asset library (user_assets,
-- asset_share_links) and the generic undo/redo change-tracking system
-- (change_history, data_snapshots). Shapes are authoritative from
-- 20260509000000_designer_assets_and_designs.sql (user_assets) and from the
-- consuming code (lib/assets/*, lib/version-history/*).
--
-- All policies are scoped to `authenticated` and to the owning user (no
-- `using (true)`), consistent with the PII-hardening pass (20260613010000).
-- Additive + idempotent: safe to re-run.

begin;

-- ===========================================================================
-- user_assets — designer/media asset library
-- ===========================================================================
create table if not exists public.user_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  original_filename text not null,
  file_type text not null default 'other',
  mime_type text not null default 'application/octet-stream',
  file_size bigint not null default 0,
  file_path text not null,
  file_url text,
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_assets_user_type_created
  on public.user_assets (user_id, file_type, created_at desc);
create index if not exists idx_user_assets_public_type_created
  on public.user_assets (is_public, file_type, created_at desc);
create index if not exists idx_user_assets_uploaded_by
  on public.user_assets (uploaded_by, created_at desc);
create index if not exists idx_user_assets_metadata
  on public.user_assets using gin (metadata);

-- ===========================================================================
-- asset_share_links — secure, tokenized sharing of a single asset
-- ===========================================================================
create table if not exists public.asset_share_links (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.user_assets(id) on delete cascade,
  share_token text not null unique,
  expires_at timestamptz,
  access_count integer not null default 0,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_asset_share_links_asset on public.asset_share_links (asset_id);
create index if not exists idx_asset_share_links_token on public.asset_share_links (share_token);

-- ===========================================================================
-- change_history — generic undo/redo change log
-- ===========================================================================
create table if not exists public.change_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_type text not null,
  resource_id text not null,
  change_type text not null,
  field_name text,
  old_value text,
  new_value text,
  batch_id uuid,
  description text,
  is_undoable boolean not null default true,
  sequence_number bigint generated always as identity,
  undone_at timestamptz,
  undone_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_change_history_user_seq
  on public.change_history (user_id, sequence_number desc);
create index if not exists idx_change_history_user_resource
  on public.change_history (user_id, resource_type, resource_id);
create index if not exists idx_change_history_batch
  on public.change_history (batch_id);

-- ===========================================================================
-- data_snapshots — point-in-time restore snapshots
-- ===========================================================================
create table if not exists public.data_snapshots (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null,
  resource_id text not null,
  snapshot_data jsonb not null default '{}'::jsonb,
  snapshot_type text not null default 'auto',
  description text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_data_snapshots_creator_resource
  on public.data_snapshots (created_by, resource_type, resource_id);

-- ===========================================================================
-- updated_at trigger for user_assets
-- ===========================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_assets_updated_at on public.user_assets;
create trigger set_user_assets_updated_at
  before update on public.user_assets
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- Row-Level Security
-- ===========================================================================
alter table public.user_assets       enable row level security;
alter table public.asset_share_links enable row level security;
alter table public.change_history     enable row level security;
alter table public.data_snapshots     enable row level security;

-- user_assets: owner-managed; public assets are readable by any authenticated user
drop policy if exists "user_assets_select" on public.user_assets;
create policy "user_assets_select" on public.user_assets
  for select to authenticated
  using (auth.uid() = user_id or is_public = true);

drop policy if exists "user_assets_insert" on public.user_assets;
create policy "user_assets_insert" on public.user_assets
  for insert to authenticated
  with check (auth.uid() = user_id and auth.uid() = uploaded_by);

drop policy if exists "user_assets_update" on public.user_assets;
create policy "user_assets_update" on public.user_assets
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_assets_delete" on public.user_assets;
create policy "user_assets_delete" on public.user_assets
  for delete to authenticated
  using (auth.uid() = user_id);

-- asset_share_links: scoped to the owner of the linked asset (public reads run
-- through the service role in the share route, which bypasses RLS)
drop policy if exists "asset_share_links_owner_all" on public.asset_share_links;
create policy "asset_share_links_owner_all" on public.asset_share_links
  for all to authenticated
  using (exists (select 1 from public.user_assets a where a.id = asset_id and a.user_id = auth.uid()))
  with check (
    created_by = auth.uid()
    and exists (select 1 from public.user_assets a where a.id = asset_id and a.user_id = auth.uid())
  );

-- change_history: strictly per-user
drop policy if exists "change_history_owner_all" on public.change_history;
create policy "change_history_owner_all" on public.change_history
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- data_snapshots: strictly per-creator
drop policy if exists "data_snapshots_owner_all" on public.data_snapshots;
create policy "data_snapshots_owner_all" on public.data_snapshots
  for all to authenticated
  using (auth.uid() = created_by) with check (auth.uid() = created_by);

commit;
