-- Share tokens: CSPRNG from pg_catalog.gen_random_uuid only (no extension,
-- no schema guess). Store only a sha256 hash. Require expiry.
-- Also lock user_assets.id and grant anon only pricing display columns.
begin;

create or replace function public.generate_share_token()
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Two v4 UUIDs ≈ 244 bits from the backend CSPRNG.
  return encode(
    decode(
      replace(pg_catalog.gen_random_uuid()::text, '-', '')
      || replace(pg_catalog.gen_random_uuid()::text, '-', ''),
      'hex'
    ),
    'hex'
  );
end;
$$;

revoke all on function public.generate_share_token() from public, anon, authenticated;
grant execute on function public.generate_share_token() to service_role;

create or replace function public.security_asset_identity_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'Asset identity and ownership cannot be reassigned directly';
  end if;
  if current_user in ('anon', 'authenticated') and (
    new.user_id is distinct from old.user_id
    or new.uploaded_by is distinct from old.uploaded_by
    or new.team_id is distinct from old.team_id
  ) then
    raise exception 'Asset identity and ownership cannot be reassigned directly';
  end if;
  return new;
end;
$$;

revoke all on function public.security_asset_identity_immutable() from public, anon, authenticated;

do $$
begin
  if to_regclass('public.user_assets') is not null then
    drop trigger if exists security_asset_identity_guard on public.user_assets;
    create trigger security_asset_identity_guard
      before update on public.user_assets
      for each row execute function public.security_asset_identity_immutable();
  end if;
end $$;

-- Anon may read public catalog display columns only — never metadata or actors.
do $$
begin
  if to_regclass('public.pricing_config') is null then
    return;
  end if;
  revoke all privileges on table public.pricing_config from anon;
  execute $sql$
    revoke all privileges (metadata, created_by, updated_by) on public.pricing_config from anon, public
  $sql$;
  execute $sql$
    grant select (
      id, category, key, display_name, description, pricing_model,
      unit_amount, unit_label, tier_config, is_active, is_public, sort_order
    ) on public.pricing_config to anon
  $sql$;
end $$;

commit;
