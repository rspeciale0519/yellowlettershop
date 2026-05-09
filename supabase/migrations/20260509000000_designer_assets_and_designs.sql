-- Designer asset library and saved design records

create table if not exists user_assets (
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

create table if not exists user_designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid,
  template_id uuid,
  name text not null,
  description text,
  design_state jsonb not null,
  variables_used text[] not null default '{}',
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_assets_user_type_created
  on user_assets(user_id, file_type, created_at desc);

create index if not exists idx_user_assets_public_type_created
  on user_assets(is_public, file_type, created_at desc);

create index if not exists idx_user_assets_uploaded_by
  on user_assets(uploaded_by, created_at desc);

create index if not exists idx_user_assets_metadata
  on user_assets using gin(metadata);

create index if not exists idx_user_designs_user_created
  on user_designs(user_id, created_at desc);

create index if not exists idx_user_designs_order
  on user_designs(order_id);

create index if not exists idx_user_designs_variables
  on user_designs using gin(variables_used);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_assets_updated_at on user_assets;
create trigger set_user_assets_updated_at
  before update on user_assets
  for each row
  execute function set_updated_at();

drop trigger if exists set_user_designs_updated_at on user_designs;
create trigger set_user_designs_updated_at
  before update on user_designs
  for each row
  execute function set_updated_at();

alter table user_assets enable row level security;
alter table user_designs enable row level security;

drop policy if exists "Users can view own and public assets" on user_assets;
create policy "Users can view own and public assets"
  on user_assets for select
  using (auth.uid() = user_id or is_public = true);

drop policy if exists "Users can insert own assets" on user_assets;
create policy "Users can insert own assets"
  on user_assets for insert
  with check (auth.uid() = user_id and auth.uid() = uploaded_by);

drop policy if exists "Users can update own assets" on user_assets;
create policy "Users can update own assets"
  on user_assets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own assets" on user_assets;
create policy "Users can delete own assets"
  on user_assets for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own designs" on user_designs;
create policy "Users can view own designs"
  on user_designs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own designs" on user_designs;
create policy "Users can insert own designs"
  on user_designs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own designs" on user_designs;
create policy "Users can update own designs"
  on user_designs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own designs" on user_designs;
create policy "Users can delete own designs"
  on user_designs for delete
  using (auth.uid() = user_id);
